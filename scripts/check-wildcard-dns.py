#!/usr/bin/env python3
"""Confere os registros públicos e a autoridade DNS via UDP e TCP (sem credenciais)."""
import argparse
import json
from pathlib import Path
import secrets
import socket
import struct
import urllib.parse
import urllib.request


def receive_exact(connection, size):
    data = b''
    while len(data) < size:
        part = connection.recv(size - len(data))
        if not part:
            raise ValueError('Resposta DNS TCP incompleta')
        data += part
    return data


def skip_name(data, position):
    while data[position]:
        length = data[position]
        if length & 0xC0 == 0xC0:
            return position + 2
        position += length + 1
    return position + 1


def authoritative_txt(server, domain, transport):
    identifier = secrets.randbelow(65536)
    labels = domain.rstrip('.').split('.')
    name = b''.join(bytes([len(label)]) + label.encode('ascii') for label in labels) + b'\0'
    # RD=0: a resposta deve vir da autoridade, sem recursão.
    query = struct.pack('!6H', identifier, 0, 1, 0, 0, 0) + name + struct.pack('!2H', 16, 1)
    kind = socket.SOCK_STREAM if transport == 'TCP' else socket.SOCK_DGRAM
    with socket.socket(socket.AF_INET, kind) as connection:
        connection.settimeout(5)
        connection.connect((server, 53))
        if transport == 'TCP':
            connection.sendall(struct.pack('!H', len(query)) + query)
            size = struct.unpack('!H', receive_exact(connection, 2))[0]
            response = receive_exact(connection, size)
        else:
            connection.send(query)
            response = connection.recv(65535)
    ident, flags, questions, answers, _, _ = struct.unpack('!6H', response[:12])
    if ident != identifier or flags & 15 or not flags & 0x0400 or flags & 0x0080:
        raise ValueError('Resposta sem autoridade válida ou com recursão habilitada')
    position = 12
    for _ in range(questions):
        position = skip_name(response, position) + 4
    for _ in range(answers):
        position = skip_name(response, position)
        record_type, _, _, length = struct.unpack('!2HIH', response[position:position + 10])
        position += 10
        if record_type == 16 and length > 1:
            return
        position += length
    raise ValueError('Nenhum TXT encontrado na autoridade')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--records', type=Path, required=True)
    parser.add_argument('--server', help='IP da VM; por padrão usa o registro A gerado')
    parser.add_argument('--skip-recursive', action='store_true', help='Somente diagnóstico direto/local')
    args = parser.parse_args()
    records = json.loads(args.records.read_text())
    server = args.server or next(record['value'] for record in records if record['type'] == 'A')
    failures = []
    if not args.skip_recursive:
        for record in records:
            label = f"{record['type']} {record['name']}"
            try:
                query = urllib.parse.urlencode({'name': record['name'], 'type': record['type']})
                with urllib.request.urlopen('https://dns.google/resolve?' + query, timeout=15) as response:
                    result = json.load(response)
                types = {'A': 1, 'NS': 2, 'CNAME': 5}
                expected = record['value'].rstrip('.').lower()
                if result.get('Status') != 0 or not any(
                    answer.get('type') == types[record['type']] and
                    answer.get('data', '').rstrip('.').lower() == expected
                    for answer in result.get('Answer', [])
                ):
                    raise ValueError('Registro ainda não publicado ou não propagado')
                print('OK', label)
            except (OSError, ValueError) as error:
                failures.append(label)
                print('PENDENTE', label, str(error))
    for record in records:
        if record['type'] != 'CNAME':
            continue
        for transport in ['UDP', 'TCP']:
            label = f"{transport}/53 TXT {record['value']}"
            try:
                authoritative_txt(server, record['value'], transport)
                print('OK', label)
            except (OSError, ValueError, IndexError, struct.error) as error:
                failures.append(label)
                print('PENDENTE', label, str(error))
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
