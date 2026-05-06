#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
branch="$(git -C "$repo_root" branch --show-current)"

if [ "$branch" != "dev" ]; then
  exit 0
fi

if [ ! -f "$repo_root/.env.dev" ]; then
  echo "sync-dev-env: arquivo .env.dev nao encontrado"
  exit 0
fi

cp "$repo_root/.env.dev" "$repo_root/.env"
echo "sync-dev-env: copiado .env.dev para .env na branch dev"
