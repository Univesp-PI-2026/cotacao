# cotacao_v02

Base inicial da reescrita do sistema `cotacao_v01` em `Node.js + APIs + MySQL`.

## O que esta base sobe

- API Node com `Express`
- Frontend Angular para testar a API
- MySQL 8.4
- Flyway para migrations versionadas
- phpMyAdmin para inspecao do banco

## Ambientes

- `dev`: desenvolvimento local com seeds tecnicos
- `homo`: homologacao
- `prod`: producao

Cada ambiente tem:

- arquivo `.env` proprio
- database propria
- volume Docker proprio
- trilha de migrations comum + pasta especifica do ambiente

## Como usar

### Desenvolvimento

```bash
docker compose --env-file .env.dev up --build
```

### Homologacao

```bash
docker compose --env-file .env.homo up --build
```

### Producao

```bash
docker compose --env-file .env.prod up --build
```

## Endpoints iniciais

- `GET /health`
- `GET /health/db`

## Estrutura de migrations

- `database/migrations/common`: schema compartilhado
- `database/migrations/dev`: scripts especificos de dev
- `database/migrations/homo`: scripts especificos de homologacao
- `database/migrations/prod`: scripts especificos de producao

O historico fica na tabela `flyway_schema_history`.
