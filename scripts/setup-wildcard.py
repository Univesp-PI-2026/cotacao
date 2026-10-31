#!/usr/bin/env python3
"""Prepara o acme-dns na VM; não ativa certificados antes de publicar o DNS."""
import argparse
import fcntl
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import urllib.request


def hostname(value):
    value = value.lower().rstrip('.')
    if not re.fullmatch(r'[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', value) or '.' not in value:
        raise argparse.ArgumentTypeError('Informe um nome DNS completo, sem asterisco.')
    return value


def save(path, text):
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(text, encoding='utf-8')
    temporary.chmod(0o600)
    temporary.replace(path)


def dns_config(auth_domain, public_ip, registration):
    return f'''[general]
listen = "0.0.0.0:53"
protocol = "both4"
domain = "{auth_domain}"
nsname = "{auth_domain}"
nsadmin = "hostmaster.{auth_domain}"
records = ["{auth_domain}. A {public_ip}", "{auth_domain}. NS {auth_domain}."]
debug = false
[database]
engine = "sqlite"
connection = "/var/lib/acme-dns/acme-dns.db"
[api]
ip = "0.0.0.0"
port = "8080"
tls = "none"
disable_registration = {str(not registration).lower()}
corsorigins = []
use_header = false
[logconfig]
loglevel = "error"
logtype = "stdout"
logformat = "json"
'''


def application_routes():
    return '''encode zstd gzip
handle_path /api/* {
    reverse_proxy backend:3000
}
handle {
    reverse_proxy frontend:80
}'''


def pending_sites(domains, application_host):
    blocks = []
    for domain in domains:
        routes = 'respond "Not found" 404'
        if application_host.endswith('.' + domain) and application_host.count('.') == domain.count('.') + 1:
            routes = f'''@application host {application_host}
handle @application {{
{application_routes()}
}}
handle {{
    respond "Not found" 404
}}'''
        blocks.append(f'''*.{domain} {{
tls {{
    ca https://acme-v02.api.letsencrypt.org/directory
    dns acmedns /etc/caddy/acmedns.json
    resolvers 1.1.1.1:53 8.8.8.8:53
}}
{routes}
}}
''')
    return '\n'.join(blocks)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, required=True)
    parser.add_argument('--bind-ip', type=ipaddress.IPv4Address, required=True)
    parser.add_argument('--public-ip', type=ipaddress.IPv4Address, required=True)
    parser.add_argument('--auth-domain', type=hostname, required=True)
    parser.add_argument('--domain', type=hostname, action='append', required=True)
    parser.add_argument('--application-host', type=hostname, required=True)
    args = parser.parse_args()
    domains = sorted(set(args.domain))
    if not any(args.application_host.endswith('.' + domain) and
               args.application_host.count('.') == domain.count('.') + 1 for domain in domains):
        parser.error('O host da aplicação precisa ser coberto por um dos wildcards.')
    os.umask(0o077)
    root = args.root.expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    root.chmod(0o700)
    with (root / 'setup.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        source = Path(__file__).resolve().parents[1] / 'deploy/certificates/compose.yml'
        shutil.copyfile(source, root / 'compose.yml')
        save(root / '.env', f'ACME_DNS_BIND_IP={args.bind_ip}\n')
        credentials_file = root / 'acmedns.json'
        credentials = json.loads(credentials_file.read_text()) if credentials_file.exists() else {}
        missing = [domain for domain in domains if domain not in credentials]
        config = root / 'config.cfg'
        command = ['docker', 'compose', '--project-name', 'cotacao-certificates',
                   '--env-file', str(root / '.env'), '-f', str(root / 'compose.yml')]
        try:
            save(config, dns_config(args.auth_domain, args.public_ip, bool(missing)))
            subprocess.run(command + ['up', '-d', '--force-recreate', '--wait', '--wait-timeout', '120'], check=True)
            for domain in missing:
                request = urllib.request.Request('http://127.0.0.1:8053/register', data=b'{}',
                                                 headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(request, timeout=15) as response:
                    registration = json.load(response)
                credentials[domain] = {key: registration[key] for key in
                                       ['username', 'password', 'subdomain', 'fulldomain']}
                credentials[domain]['server_url'] = 'http://acme-dns:8080'
                save(credentials_file, json.dumps(credentials, indent=2) + '\n')
                # Valor público de teste para conferir DNS UDP/TCP antes da emissão.
                probe = urllib.request.Request('http://127.0.0.1:8053/update',
                    data=json.dumps({'subdomain': registration['subdomain'],
                                     'txt': secrets.token_urlsafe(32)}).encode(),
                    headers={'Content-Type': 'application/json',
                             'X-Api-User': registration['username'],
                             'X-Api-Key': registration['password']})
                with urllib.request.urlopen(probe, timeout=15) as response:
                    response.read()
        finally:
            # O cadastro de contas fica fechado após o bootstrap, inclusive em falhas.
            save(config, dns_config(args.auth_domain, args.public_ip, False))
            subprocess.run(command + ['up', '-d', '--force-recreate', '--wait', '--wait-timeout', '120'], check=True)
        # Preserve os sites já ativos quando adicionar um domínio posteriormente.
        active = root / 'sites.caddy'
        if not active.exists():
            save(active, f'''{args.application_host} {{
tls {{
    ca https://acme-v02.api.letsencrypt.org/directory
}}
{application_routes()}
}}
''')
        save(root / 'sites.wildcard.caddy', pending_sites(domains, args.application_host))
        records = [
            {'name': args.auth_domain, 'type': 'A', 'value': str(args.public_ip)},
            {'name': args.auth_domain, 'type': 'NS', 'value': args.auth_domain + '.'},
        ]
        records.extend({'name': '_acme-challenge.' + domain, 'type': 'CNAME',
                        'value': credentials[domain]['fulldomain'] + '.'} for domain in domains)
        save(root / 'dns-records.json', json.dumps(records, indent=2) + '\n')
        print(json.dumps({'dns_records': records, 'wildcards_pending_dns': domains}, indent=2))


if __name__ == '__main__':
    main()
