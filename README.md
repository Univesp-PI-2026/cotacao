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

O ambiente da OCI usa `docker-compose.prod.yml`, imagens prontas e o procedimento
em [deploy na OCI](docs/deploy-oci.md). Publicações na `master` são implantadas
automaticamente após o CI passar. O Compose padrão continua sendo o ambiente local.

## Hooks Git Compartilhados

Para sincronizar automaticamente `.env.dev` para `.env` ao trocar para a branch `dev`
ou ao fazer `git pull`, ative os hooks versionados do repositorio:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/post-merge .githooks/post-checkout scripts/sync-dev-env.sh
```

## Endpoints iniciais

- `GET /health`
- `GET /health/db`

## Estrutura de migrations

As migrations `V9004` e `V9005` definem os produtos de cotação. A `V9005`
descarta as cotações anteriores e cria a estrutura com detalhes por produto.
Os cadastros de segurados e usuários são mantidos.

- `database/migrations/common`: schema compartilhado
- `database/migrations/dev`: scripts especificos de dev
- `database/migrations/homo`: scripts especificos de homologacao
- `database/migrations/prod`: scripts especificos de producao

O historico fica na tabela `flyway_schema_history`.

## Segurados e cotações por produto

| Recurso | API | Tabela |
| --- | --- | --- |
| Segurado | `/v1/insureds` | `customers` |
| Cotação (dados comuns) | `/v1/quotations` | `quotations` |
| Automóvel | `/v1/quotations/auto` | `quotation_auto` |
| Residencial | `/v1/quotations/home` | `quotation_home` |
| Cartão de crédito | `/v1/quotations/credit-card` | `quotation_credit_card` |

Todos os endpoints exigem autenticação. As APIs de segurados e produtos oferecem
`GET /`, `GET /count`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` e
`PATCH /:id/activate`. A exclusão pela API desativa o cadastro.

Cada cotação referencia um segurado e tem um registro de detalhes do produto,
ligado por `quotation_id` (chave primária e estrangeira). A tabela principal
contém apenas `id`, `customer_id`, `product`, `request_date`, `active` e os timestamps.
Inclusões e alterações da cotação e seus detalhes usam uma única transação.
A remoção física da cotação também remove seus detalhes por `ON DELETE CASCADE`.

Os endpoints de produto filtram as consultas e alterações pelo produto da rota.
Por exemplo, a API residencial não permite editar ou excluir uma cotação de automóvel.
O endpoint geral reúne todos os produtos e permite a troca de produto por
`PUT /v1/quotations/:id`, substituindo os detalhes na mesma transação.
O endereço residencial é uma cópia editável do endereço do segurado.

`/v1/customers` continua disponível como alias da API de segurados.
