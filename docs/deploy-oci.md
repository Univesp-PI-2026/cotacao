# Deploy na OCI

O sistema é servido em `https://cotacao.grupo05.com.br`. O Caddy atende HTTPS,
encaminha `/api` ao backend e as demais rotas ao Angular servido pelo Nginx.
HTTP na porta 80 redireciona para HTTPS. MySQL e backend ficam na rede interna
do Compose. A porta 4200 do Nginx aceita conexões apenas em `127.0.0.1` na VM.
O ambiente local continua usando `docker-compose.yml` e `.env.dev`.

## Arquivos na VM

Usuário: `ubuntu`. Diretório: `/home/ubuntu/projects/cotacao/prod`.

- `.env.prod`: configuração persistente, com permissão `600`; nunca entra no Git.
- `releases/<commit>-<execução>-<tentativa>`: Compose, migrations e referências das imagens.
- `current`: link para a última release que passou nas verificações de saúde.
- `backups/*.sql.gz`: backup do banco feito antes das migrations de cada deploy.
- Volume Docker `cotacao-prod-mysql`: dados persistentes, independentes das releases.
- Volumes `cotacao-prod-caddy-data` e `cotacao-prod-caddy-config`: certificados,
  chaves, conta ACME e configuração persistentes entre deploys e reinicializações.
- Quando habilitado, `/home/ubuntu/projects/cotacao/certificates` contém a configuração
  do acme-dns e suas credenciais (diretório `700`, arquivos `600`, fora do Git).
  O volume `cotacao-acme-dns-data` guarda as contas DNS e deve entrar no backup.

O primeiro deploy pode usar uma release `initial-*`, com o conteúdo do workspace
anterior à publicação no Git. As próximas releases correspondem ao commit do CI.

## Atualização automática

1. Publique ou faça merge na `master`.
2. O workflow `CI` executa testes do backend e frontend e compila o Angular.
3. `Deploy Production` só continua se esse CI passou em um push na `master`.
4. As imagens de produção são construídas no runner Linux x86_64 do GitHub e
   enviadas por SSH. A VM não precisa de credenciais do GitHub nem compilar Angular.
5. A VM inicia o banco, salva um dump, executa Flyway e atualiza a API, o Nginx e o Caddy.
6. O deploy só conclui após a página inicial e `/api/health/db` responderem por HTTPS
   com um certificado válido para o domínio configurado.

Uma execução cujo commit já foi substituído na `master` é ignorada antes do envio.
Os deploys são serializados pelo Actions e por um lock na VM. Há uma breve
interrupção durante a recriação dos containers; não há promessa de zero downtime.
Se as migrations ou o healthcheck falharem, o workflow falha. O rollback do banco
não é automático: revise o erro e o backup antes de restaurar dados.

Secrets do repositório usados pelo workflow:

| Secret | Conteúdo |
| --- | --- |
| `PROD_HOST` | IP público da VM |
| `PROD_USER` | `ubuntu` |
| `PROD_SSH_PORT` | `22` |
| `PROD_SSH_KEY` | Chave privada exclusiva do deploy, autorizada na VM |
| `PROD_KNOWN_HOSTS` | Chave pública do host SSH verificada na configuração inicial |

A chave pessoal da OCI não precisa ser armazenada no Actions. Se a VM for
recriada, atualize a autorização e a chave do host nos secrets.

O lockfile do backend inclui correções de segurança de `body-parser`, `proxy-addr`
e `mysql2`. O override de `qs` mantém a versão corrigida também no parser do
Express; revise esse override ao atualizar o Express.

## Preparação de outra VM

Instale Docker Engine e Compose v2. Em uma VM de 1 GB, configure swap e envie
imagens prontas; o Compose de produção limita o consumo dos serviços.
No diretório de produção, crie `.env.prod` a partir de `.env.prod.example`, gere
valores diferentes para `DB_ROOT_PASSWORD`, `DB_PASSWORD` e `JWT_SECRET` com
`openssl rand -hex 32` e aplique `chmod 600 .env.prod`.

Configure `HTTPS_DOMAIN=cotacao.grupo05.com.br` no `.env.prod`. No servidor que
gerencia o DNS de `grupo05.com.br`, crie ou mantenha o registro A de `cotacao`
apontando para `150.136.152.105`. O DNS pode permanecer no provedor atual.
Um redirecionamento HTTP para o IP não substitui esse registro. Se houver AAAA,
ele também deve alcançar esta VM; caso contrário, remova o registro incorreto.

Libere TCP `80` e `443` na Security List ou NSG da VNIC, com origem `0.0.0.0/0`
para acesso público. O firewall da VM também precisa permitir o tráfego publicado
pelo Docker. O HTTPS usa HTTP/1.1 e HTTP/2, sem exigir abertura de portas UDP.
As portas `3000` e `3306` não são publicadas; a `4200` fica restrita à própria VM.

O Caddy obtém e renova o certificado com Let's Encrypt automaticamente. Mantenha
o DNS correto, os volumes do Caddy e as portas 80/443 acessíveis para validação
e renovação. A renovação recarrega os certificados sem precisar de cron ou
de reconstruir a imagem. Se a emissão falhar, consulte `dc logs proxy`.

## Certificados wildcard

Os certificados `*.grupo05.com.br` e `*.group05.com` usam DNS-01, com um acme-dns
dedicado na própria VM. O DNS principal dos dois domínios continua na Locaweb.
Somente a zona `acme.grupo05.com.br` e as respostas de `_acme-challenge` são
delegadas ao serviço. A aplicação continua acessível no host configurado;
outros subdomínios não recebem automaticamente uma aplicação ou um registro A.
O wildcard cobre um nível de subdomínio; não cobre o domínio raiz.

O acme-dns roda no projeto Compose `cotacao-certificates`, independente das
releases da aplicação. Apenas o Caddy entra em sua rede Docker. A API de
administração fica na rede Docker e em `127.0.0.1:8053` da VM, sem publicação
externa. Cada domínio tem uma conta própria, limitada ao respectivo TXT.
O cadastro de novas contas permanece desabilitado após a preparação.

Para preparar uma VM, execute a partir de uma release com estes arquivos:

```bash
python3 scripts/setup-wildcard.py \
  --root "$HOME/projects/cotacao/certificates" \
  --bind-ip 10.0.0.38 --public-ip 150.136.152.105 \
  --auth-domain acme.grupo05.com.br \
  --domain grupo05.com.br --domain group05.com \
  --application-host cotacao.grupo05.com.br
```

Em outra VM, substitua os IPs e o host. O script preserva as contas existentes,
cria somente as que faltam e imprime os registros DNS públicos. As senhas ficam
em `acmedns.json` e não são impressas. O resultado fica também em `dns-records.json`.
Crie na Locaweb exatamente os registros A, NS e CNAME apresentados. Não crie um
registro A `*` nem altere os registros do site principal ou do e-mail.

Após a publicação e a liberação da porta 53, confira a partir de uma máquina
externa à VM, usando uma cópia de `dns-records.json` (contém somente dados públicos):

```bash
python3 scripts/check-wildcard-dns.py --records dns-records.json
```

Libere a porta de destino `53` em **duas regras**, TCP e UDP, origem `0.0.0.0/0`
e porta de origem All, na Security List/NSG da VNIC. O serviço responde consultas
autoritativas da validação; ele não oferece resolução DNS recursiva. O vínculo
das portas usa o IP privado da VNIC para preservar o resolvedor local do Ubuntu.

No `.env.prod` da aplicação, configure:

```dotenv
HTTPS_WILDCARD_ENABLED=true
CERTIFICATE_ROOT=/home/ubuntu/projects/cotacao/certificates
```

O workflow gera `cotacao-proxy:<commit>` com o módulo acmedns e informa
`PROXY_IMAGE` em `images.env`. O deploy aplica `docker-compose.wildcard.yml` ao
Compose principal. Os arquivos persistentes são montados somente para leitura.
Antes de recriar os serviços, o deploy valida a configuração do Caddy.

Inicialmente `sites.caddy` preserva o HTTPS do host da aplicação. O arquivo
`sites.wildcard.caddy` contém a configuração dos wildcards, ainda inativa.
Somente após conferir A, NS, CNAME e consultas TXT públicas via UDP e TCP, copie
o conteúdo de `sites.wildcard.caddy` para `sites.caddy` **sem substituir o inode do
arquivo montado**, valide e recarregue o Caddy:

```bash
certificate_root="$HOME/projects/cotacao/certificates"
cp "$certificate_root/sites.caddy" "$certificate_root/sites.previous.caddy"
cat "$certificate_root/sites.wildcard.caddy" > "$certificate_root/sites.caddy"
dc exec -T proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
dc exec -T proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Confira nos logs a emissão dos dois certificados e verifique seus SANs e a cadeia
de confiança. Os volumes do Caddy e o acme-dns cuidam das renovações automáticas.
Em caso de falha na configuração, restaure `sites.previous.caddy` no mesmo arquivo
e recarregue o Caddy. Se a emissão falhar, corrija o DNS antes de tentar novamente.

As migrations criam o usuário inicial `admin`, senha `admin`, como no ambiente
local. Altere a senha do usuário no sistema para o uso público.

## Operação

Na VM, entre na release atual e defina o atalho na sessão:

```bash
cd ~/projects/cotacao/prod/current
dc() {
  local extra=()
  if grep -q '^HTTPS_WILDCARD_ENABLED=true$' "$HOME/projects/cotacao/prod/.env.prod"; then
    extra=(-f docker-compose.wildcard.yml)
  fi
  docker compose --project-name cotacao-prod \
    --env-file "$HOME/projects/cotacao/prod/.env.prod" \
    --env-file images.env -f docker-compose.prod.yml "${extra[@]}" "$@"
}
dc ps
dc logs --tail=100 backend
dc logs --tail=100 proxy
curl --fail https://cotacao.grupo05.com.br/api/health/db
curl --fail http://127.0.0.1:4200/api/health/db
```

Os containers reiniciam com a VM. Para reaplicar a release atual:

```bash
bash scripts/deploy-prod.sh "$(pwd -P)"
```

Para uma atualização manual, construa as imagens com tags exclusivas em Linux
x86_64 e envie-as com `docker save`, `gzip`, `scp` e `docker load`. Envie também
`docker-compose.prod.yml`, `docker-compose.wildcard.yml`, `deploy/`, `database/migrations`,
`scripts/deploy-prod.sh`, `scripts/setup-wildcard.py`, `scripts/check-wildcard-dns.py` e um `images.env` contendo
`BACKEND_IMAGE`, `FRONTEND_IMAGE` e `PROXY_IMAGE`. Execute o script dentro
da nova release. O workflow versionado contém os comandos completos.

Não execute `docker compose down -v`: isso remove os dados do banco. Os backups
locais não substituem uma cópia externa; monitore espaço e retenção de releases,
imagens e dumps. Para voltar apenas o código, use as imagens e os arquivos de uma
release anterior, verificando antes sua compatibilidade com o schema atual.

Referências: [produção com Compose](https://docs.docker.com/compose/how-tos/production/)
e [evento workflow_run](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run),
[HTTPS automático do Caddy](https://caddyserver.com/docs/automatic-https).
Validação wildcard: [DNS-01 do Let's Encrypt](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge),
[acme-dns](https://github.com/acme-dns/acme-dns) e
[módulo acmedns do Caddy](https://github.com/caddy-dns/acmedns).
