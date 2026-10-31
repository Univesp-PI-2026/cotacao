#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Executado na VM após o envio das imagens e dos arquivos desta release.
release_dir=$(cd "${1:?Informe o diretório da release}" && pwd)
deploy_root=${DEPLOY_ROOT:-$HOME/projects/cotacao/prod}
mkdir -p "$deploy_root/backups"
exec 9>"$deploy_root/deploy.lock"
flock -n 9 || { echo 'Já existe um deploy em execução.' >&2; exit 1; }
command -v curl >/dev/null || { echo 'Instale curl na VM antes do deploy.' >&2; exit 1; }

env_file="$deploy_root/.env.prod"
if [[ ! -f "$env_file" ]]; then
  echo "Crie $env_file a partir de .env.prod.example com senhas exclusivas." >&2
  exit 1
fi
if grep -Eq 'CHANGE_ME|=trocar$|=quotation_secret$' "$env_file"; then
  echo 'Substitua os valores de exemplo no ambiente de produção.' >&2
  exit 1
fi
chmod 600 "$env_file"
compose=(docker compose --project-name cotacao-prod --env-file "$env_file"
  --env-file "$release_dir/images.env" -f "$release_dir/docker-compose.prod.yml")
if grep -q '^HTTPS_WILDCARD_ENABLED=true$' "$env_file"; then
  compose+=(-f "$release_dir/docker-compose.wildcard.yml")
  docker network inspect cotacao-acme-validation >/dev/null
fi
"${compose[@]}" config --quiet
"${compose[@]}" run --rm --no-deps proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
"${compose[@]}" up -d --wait --wait-timeout 300 db

# O dump inclui usuários, segurados, cotações e o histórico do Flyway.
backup="$deploy_root/backups/$(date -u +%Y%m%dT%H%M%SZ)-$(basename "$release_dir").sql.gz"
backup_tmp="$backup.partial"
trap 'rm -f "$backup_tmp"' EXIT
"${compose[@]}" exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --single-transaction --no-tablespaces -u"$MYSQL_USER" "$MYSQL_DATABASE"' | gzip > "$backup_tmp"
gzip -t "$backup_tmp"
mv "$backup_tmp" "$backup"
trap - EXIT

"${compose[@]}" run --rm --no-deps migrate
"${compose[@]}" up -d --wait --wait-timeout 180 backend
# O Nginx precisa resolver novamente o endereço do backend após sua recriação.
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 180 frontend
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 180 proxy
https_domain=$("${compose[@]}" exec -T proxy printenv HTTPS_DOMAIN)
# A saúde do container não garante que a emissão do certificado já terminou.
# --resolve testa localmente o certificado público com o nome correto (SNI).
for endpoint in / /api/health/db; do
  curl --noproxy '*' --fail --silent --show-error --retry 20 --retry-delay 5 \
    --retry-all-errors --connect-timeout 5 --max-time 15 \
    --resolve "$https_domain:443:127.0.0.1" \
    "https://$https_domain$endpoint" -o /dev/null
done
ln -sfn "$release_dir" "$deploy_root/current"
"${compose[@]}" ps
echo "Deploy concluído: $(basename "$release_dir"). Backup: $backup"
