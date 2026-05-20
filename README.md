# Lance Certo API

Backend do **Lance Certo**, uma plataforma para análise, controle e gestão financeira de veículos de leilão.

O sistema ajuda o usuário a cadastrar veículos, avaliar oportunidades, calcular lance recomendado, controlar custos, marcar veículos como arrematados/vendidos e acompanhar lucro ou prejuízo real.

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Principais funcionalidades](#principais-funcionalidades)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Padrões do projeto](#padrões-do-projeto)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Regras de plano](#regras-de-plano)
- [Regras de negócio](#regras-de-negócio)
- [Segurança](#segurança)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Docker](#docker)
- [Banco de dados e Prisma](#banco-de-dados-e-prisma)
- [Seed do banco](#seed-do-banco)
- [Instalação e execução](#instalação-e-execução)
- [Swagger](#swagger)
- [Rotas principais](#rotas-principais)
- [Fluxo principal](#fluxo-principal)
- [Testes e qualidade](#testes-e-qualidade)
- [Problemas comuns](#problemas-comuns)
- [Melhorias futuras](#melhorias-futuras)
- [Autor](#autor)

---

## Sobre o projeto

O **Lance Certo** foi criado para auxiliar compradores de veículos de leilão a tomarem decisões mais seguras.

A proposta é ajudar a responder perguntas como:

- Este veículo vale a pena?
- Até quanto posso dar lance?
- Quanto vou gastar com reparos, taxas, documentação e transporte?
- Se eu arrematar, quanto realmente investi?
- Depois da venda, tive lucro ou prejuízo?
- Qual foi minha margem real?

O sistema não substitui a análise humana ou vistoria presencial. Ele fornece estimativas e organização dos dados para reduzir risco e melhorar a tomada de decisão.

---

## Principais funcionalidades

### Autenticação

- Cadastro de usuário
- Login com JWT
- Recuperação de senha
- Redefinição de senha
- Consulta do usuário autenticado
- Controle de usuário ativo/inativo

### Usuários

- Atualização do próprio perfil
- Alteração de senha
- Controle de permissões por papel
- Perfis:
  - `user`
  - `admin`

### Assinaturas

O sistema possui controle de plano:

- `free`
- `premium`

Cada usuário possui:

- `plan`
- `planStatus`
- `planExpiresAt`

Status possíveis:

- `active`
- `inactive`
- `canceled`
- `past_due`

### Veículos

- Cadastro de veículos
- Listagem paginada
- Filtros por busca, status, tipo, cidade, estado etc.
- Atualização de dados
- Remoção
- Upload de imagens
- Limite de imagens por veículo
- Marcar veículo como arrematado
- Marcar veículo como vendido
- Resumo financeiro individual

### Avaliação de veículos

- Criação de avaliação
- Checklist baseado em template
- Cálculo de lance máximo recomendado
- Margem de lucro desejada
- Margem de segurança
- Despesas da avaliação
- Classificação de risco
- Recomendação:
  - recomendado
  - cautela
  - não recomendado

### Checklist

- Templates por tipo de veículo
- Itens de checklist
- Custos estimados
- Severidade
- Itens obrigatórios
- Itens exclusivos para plano Premium, quando aplicável

### Dashboard

- Resumo geral dos veículos
- Total de veículos cadastrados
- Veículos em análise
- Veículos rejeitados
- Veículos arrematados
- Veículos vendidos
- Limite do plano atual
- Dashboard financeiro para usuários Premium

### Relatórios

- Relatório JSON de veículo
- Dados do veículo
- Imagens
- Avaliação
- Checklist
- Despesas
- Resumo financeiro

---

## Tecnologias utilizadas

- **Node.js**
- **NestJS**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT**
- **Swagger / OpenAPI**
- **class-validator**
- **class-transformer**
- **bcrypt**
- **Docker**
- **Docker Compose**

---

## Padrões do projeto

O projeto segue o seguinte padrão:

| Item | Padrão |
|---|---|
| Código | Inglês |
| Arquivos/classes/métodos/variáveis | Inglês |
| Comentários técnicos | Inglês |
| Mensagens para usuário final | Português |
| Swagger | Português |

Exemplo:

```ts
throw new ForbiddenException(
  'Plano premium necessário para acessar este recurso.',
);
```

---

## Estrutura do projeto

```txt
src/
├── common/
│   ├── access/
│   │   └── owner-scope.util.ts
│   ├── decorators/
│   │   ├── require-plan.decorator.ts
│   │   └── roles.decorator.ts
│   ├── enums/
│   │   └── user-role.enum.ts
│   ├── errors/
│   │   └── prisma-error.util.ts
│   ├── finance/
│   │   └── vehicle-finance.util.ts
│   ├── guards/
│   │   ├── admin.guard.ts
│   │   ├── plan.guard.ts
│   │   ├── roles.guard.ts
│   │   └── user-throttler.guard.ts
│   ├── hash/
│   │   ├── hash.module.ts
│   │   └── hash.service.ts
│   └── plans/
│       └── plan-limits.ts
│
├── config/
│   └── env.validation.ts
│
├── database/
│   ├── database.module.ts
│   ├── prisma.service.ts
│   └── seed.ts
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── subscription/
│   ├── vehicles/
│   ├── evaluations/
│   ├── checklist/
│   ├── dashboard/
│   └── reports/
│
├── app.module.ts
└── main.ts
```

---

## Regras de plano

### Plano Free

O usuário gratuito pode:

- Cadastrar até **3 veículos**
- Enviar até **10 imagens por veículo**
- Criar avaliação básica
- Visualizar checklist básico
- Ver cálculo básico de recomendação

O usuário gratuito não pode:

- Acessar financeiro completo
- Gerenciar despesas manuais
- Marcar veículo como arrematado
- Marcar veículo como vendido
- Acessar dashboard financeiro
- Gerar relatórios Premium

### Plano Premium

O usuário Premium pode:

- Cadastrar veículos ilimitados
- Enviar até **10 imagens por veículo**
- Criar avaliação completa
- Personalizar margens
- Gerenciar despesas
- Marcar veículo como arrematado
- Marcar veículo como vendido
- Calcular lucro real
- Acessar dashboard financeiro
- Gerar relatórios

---

## Regras de negócio

### Veículos

- Todo veículo pertence a um usuário.
- Usuário comum só pode acessar seus próprios veículos.
- Administrador pode acessar veículos de qualquer usuário.
- Usuário Free tem limite de 3 veículos.
- Usuário Premium possui veículos ilimitados.
- Cada veículo pode ter no máximo 10 imagens.
- Um veículo só pode ser vendido depois de ser arrematado.

### Arremate

Ao marcar um veículo como arrematado:

- `purchasePrice` deve ser informado.
- `purchasedAt` pode ser informado ou assumir a data atual.
- O status do veículo deve mudar para `PURCHASED`.

### Venda

Ao marcar um veículo como vendido:

- O veículo precisa estar arrematado.
- `soldPrice` deve ser informado.
- `soldAt` pode ser informado ou assumir a data atual.
- O status do veículo deve mudar para `SOLD`.

### Financeiro

O resumo financeiro considera:

```txt
totalExpenses = soma das despesas da avaliação

totalInvestment = purchasePrice + totalExpenses

grossProfit = soldPrice - totalInvestment

profitMarginPercent = (grossProfit / totalInvestment) * 100
```

O sistema deve evitar:

- divisão por zero
- `NaN`
- `Infinity`
- valores monetários negativos

---

## Segurança

O backend possui múltiplas camadas de segurança.

### Autenticação

Rotas privadas exigem JWT válido via `AuthGuard`.

### Autorização por papel

Rotas administrativas usam:

- `AdminGuard`
- `RolesGuard`
- `@Roles(...)`

### Autorização por plano

Rotas Premium usam:

- `PlanGuard`
- `@RequirePlan('premium')`

### Autorização por propriedade

Rotas relacionadas a veículos usam `VehicleOwnerGuard`.

Esse guard garante:

- usuário comum acessa apenas os próprios veículos
- administrador pode acessar qualquer veículo

### Escopo de proprietário

O projeto possui utilitário para aplicar escopo por usuário/admin:

```txt
src/common/access/owner-scope.util.ts
```

### Tratamento de erros Prisma

O projeto possui utilitário para mapear erros comuns do Prisma:

```txt
src/common/errors/prisma-error.util.ts
```

Erros tratados:

- `P2002` — conflito de campo único
- `P2025` — registro não encontrado
- `P2034` — conflito de transação serializável

### Cálculos financeiros

O projeto centraliza cálculos financeiros em:

```txt
src/common/finance/vehicle-finance.util.ts
```

Isso evita duplicação de cálculo entre:

- veículos
- relatórios
- dashboard

### Validação global

A aplicação deve usar `ValidationPipe` no `main.ts`:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Recomendações de produção

Em produção, recomenda-se:

- Helmet habilitado
- CORS restrito por ambiente
- Rate limit habilitado
- Swagger desabilitado ou protegido
- Variáveis de ambiente validadas
- Logs estruturados
- Webhook validado com assinatura real do gateway de pagamento

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto.

Exemplo:

```env
NODE_ENV=development

DATABASE_URL="postgresql://lance_certo:lance_certo@localhost:5432/lance_certo_db?schema=public"

JWT_SECRET="sua_chave_jwt_com_no_minimo_32_caracteres"
JWT_EXPIRES_IN="1d"

JWT_REFRESH_EXPIRES_DAYS="7"
REFRESH_TOKEN_COOKIE_NAME="refresh_token"
REFRESH_TOKEN_COOKIE_SECURE="false"

EMAIL_FROM="Lance Certo <no-reply@example.com>"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="usuario_smtp"
SMTP_PASSWORD="senha_smtp"

APP_FRONTEND_URL="http://localhost:4200"
CORS_ORIGIN="http://localhost:4200"

# Use "true" apenas em desenvolvimento. Em producao, mantenha "false".
SWAGGER_ENABLED="true"

# Opcional em desenvolvimento. Recomendado em producao para rate limit
# distribuido quando houver mais de uma instancia da API.
# REDIS_URL="redis://localhost:6379"

MERCADO_PAGO_ACCESS_TOKEN="TEST-seu-access-token"
MERCADO_PAGO_PREMIUM_PLAN_ID="seu-preapproval-plan-id"
MERCADO_PAGO_WEBHOOK_SECRET="segredo-assinatura-webhook-mercado-pago"
MERCADO_PAGO_WEBHOOK_URL="https://sua-url-publica.com/subscription/webhook/mercado-pago"

PORT=3000
```

Use o arquivo `.env.example` como base para criar o `.env` local. Ele deve
conter apenas nomes de variáveis e exemplos sem segredos reais.

> Nunca commite arquivos `.env` com dados reais.

### Envio do projeto

Ao enviar o projeto por zip ou repositório, não inclua arquivos gerados,
dependências instaladas, uploads de usuários ou segredos locais.

Não envie:

- `node_modules/`
- `dist/`
- `coverage/`
- `.env` ou qualquer `.env.*`
- `uploads/`
- `generated/prisma/`

Envie o `.env.example`, pois ele documenta as variáveis necessárias sem expor
credenciais.

---

## Docker

O Docker é usado principalmente para subir o banco PostgreSQL localmente.

### Criar `docker-compose.yml`

Na raiz do projeto, crie o arquivo:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: lance_certo_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: lance_certo
      POSTGRES_PASSWORD: lance_certo
      POSTGRES_DB: lance_certo_db
    ports:
      - "5432:5432"
    volumes:
      - lance_certo_postgres_data:/var/lib/postgresql/data

volumes:
  lance_certo_postgres_data:
```

### Subir o banco

```bash
docker compose up -d
```

### Verificar containers

```bash
docker ps
```

### Ver logs do banco

```bash
docker logs lance_certo_postgres
```

### Parar o banco

```bash
docker compose down
```

### Apagar banco e volume

```bash
docker compose down -v
```

> O comando `down -v` remove todos os dados salvos no volume do PostgreSQL. Use apenas quando quiser resetar tudo.

---

## Banco de dados e Prisma

O projeto usa **Prisma ORM** com **PostgreSQL**.

### Gerar Prisma Client

```bash
npx prisma generate
```

### Rodar migrations

```bash
npx prisma migrate dev
```

### Criar migration com nome

```bash
npx prisma migrate dev --name nome_da_migration
```

### Abrir Prisma Studio

```bash
npx prisma studio
```

### Resetar banco com Prisma

```bash
npx prisma migrate reset
```

Esse comando normalmente:

1. apaga o banco
2. recria as tabelas
3. executa as migrations
4. executa o seed, caso esteja configurado

---

## Seed do banco

O projeto possui seed em:

```txt
src/database/seed.ts
```

O seed serve para popular o banco local com dados iniciais, como:

- usuários de teste
- usuário administrador
- veículos de exemplo
- templates de checklist
- itens de checklist

### Configurar script de seed

No `package.json`, adicione:

```json
{
  "scripts": {
    "db:seed": "tsx src/database/seed.ts",
    "db:reset": "prisma migrate reset"
  },
  "prisma": {
    "seed": "tsx src/database/seed.ts"
  }
}
```

Caso o projeto ainda não tenha `tsx`, instale:

```bash
npm install -D tsx
```

### Rodar seed

Depois de rodar as migrations:

```bash
npm run db:seed
```

Ou usando Prisma:

```bash
npx prisma db seed
```

### Usuários criados pelo seed

Exemplo de usuários locais:

```txt
Admin:
email: admin@email.com
senha: 123456

Usuário comum:
email: erickprado@email.com
senha: 123456
```

> Esses dados são apenas para desenvolvimento local. Não use essas credenciais em produção.

### Cuidados com seed em produção

O seed não deve rodar em produção.

Recomendado bloquear seed quando:

```env
NODE_ENV=production
```

Exemplo:

```ts
if (process.env.NODE_ENV === 'production') {
  throw new Error('Seed cannot run in production.');
}
```

---

## Instalação e execução

### Instalação rápida com Docker

```bash
git clone <url-do-repositorio>

cd lance-certo-api

npm install

docker compose up -d

cp .env.example .env

npx prisma generate

npx prisma migrate dev

npm run db:seed

npm run start:dev
```

A API ficará disponível em:

```txt
http://localhost:3000
```

Swagger, se habilitado:

```txt
http://localhost:3000/api
```

Em producao, o Swagger deve ficar desabilitado:

```env
NODE_ENV=production
SWAGGER_ENABLED=false
```

A aplicacao falha no boot se `NODE_ENV=production` e
`SWAGGER_ENABLED=true` forem usados juntos.

### Rate Limit Distribuido

O projeto usa `@nestjs/throttler` para limitar excesso de requisicoes. Em
desenvolvimento, se `REDIS_URL` nao estiver definida, o storage fica em memoria.

Em producao, configure Redis para que o rate limit seja compartilhado entre
instancias da API:

```env
REDIS_URL=redis://usuario:senha@host:6379
```

Sem Redis, cada instancia controla limites apenas em memoria propria.

### Rodar em desenvolvimento

```bash
npm run start:dev
```

### Gerar build

```bash
npm run build
```

### Rodar em produção

```bash
npm run start:prod
```

---

## Fluxo completo para preparar ambiente local

Use este fluxo quando configurar o projeto pela primeira vez:

```bash
docker compose up -d

npm install

npx prisma generate

npx prisma migrate dev

npm run db:seed

npm run start:dev
```

---

## Reset completo do banco local

Se quiser apagar tudo e recriar com seed:

```bash
npx prisma migrate reset
```

Ou manualmente:

```bash
docker compose down -v
docker compose up -d
npx prisma migrate dev
npm run db:seed
```

---

## Swagger

A documentação da API é gerada com Swagger/OpenAPI.

Ambiente local:

```txt
http://localhost:3000/api
```

O Swagger deve conter:

- descrição das rotas
- tipos de request
- tipos de response
- autenticação Bearer Token
- códigos de erro
- exemplos realistas
- mensagens em português

---

## Rotas principais

### Auth

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastra usuário |
| POST | `/auth/login` | Realiza login |
| POST | `/auth/forgot-password` | Solicita recuperação de senha |
| POST | `/auth/reset-password` | Redefine senha |
| GET | `/auth/me` | Retorna usuário autenticado |
| POST | `/auth/logout` | Realiza logout |

---

### Users

| Método | Rota | Descrição |
|---|---|---|
| PATCH | `/users/me` | Atualiza perfil do usuário autenticado |
| PATCH | `/users/me/password` | Altera senha do usuário autenticado |
| GET | `/users` | Lista usuários, caso rota administrativa exista |
| PATCH | `/users/:id/status` | Ativa/inativa usuário, caso rota administrativa exista |

---

### Subscription

| Método | Rota | Descrição |
|---|---|---|
| GET | `/subscription` | Retorna plano atual |
| GET | `/subscription/usage` | Retorna uso e limites do plano |
| POST | `/subscription/checkout` | Inicia checkout |
| POST | `/subscription/cancel` | Cancela assinatura |
| POST | `/subscription/webhook/mercado-pago` | Recebe webhook oficial assinado do Mercado Pago |

---

### Vehicles

| Método | Rota | Descrição |
|---|---|---|
| GET | `/vehicles` | Lista veículos |
| POST | `/vehicles` | Cadastra veículo |
| GET | `/vehicles/:vehicleId` | Busca veículo |
| PATCH | `/vehicles/:vehicleId` | Atualiza veículo |
| DELETE | `/vehicles/:vehicleId` | Remove veículo |
| PATCH | `/vehicles/:vehicleId/purchase` | Marca veículo como arrematado |
| PATCH | `/vehicles/:vehicleId/sale` | Marca veículo como vendido |
| GET | `/vehicles/:vehicleId/financial-summary` | Retorna resumo financeiro |

---

### Vehicle Images

| Método | Rota | Descrição |
|---|---|---|
| GET | `/vehicles/:vehicleId/images` | Lista imagens do veículo |
| POST | `/vehicles/:vehicleId/images` | Envia imagens do veículo |
| DELETE | `/vehicles/:vehicleId/images/:imageId` | Remove imagem |

---

### Vehicle Evaluation

| Método | Rota | Descrição |
|---|---|---|
| POST | `/vehicles/:vehicleId/evaluation` | Cria avaliação |
| GET | `/vehicles/:vehicleId/evaluation` | Busca avaliação |
| PATCH | `/vehicles/:vehicleId/evaluation` | Atualiza margens da avaliação |
| DELETE | `/vehicles/:vehicleId/evaluation` | Remove avaliação |
| GET | `/vehicles/:vehicleId/evaluation/checklist` | Lista checklist da avaliação |
| PATCH | `/vehicles/:vehicleId/evaluation/checklist-items/:checklistItemId` | Atualiza item do checklist |
| GET | `/vehicles/:vehicleId/evaluation/expenses` | Lista despesas |
| POST | `/vehicles/:vehicleId/evaluation/expenses` | Cria despesa manual |
| PATCH | `/vehicles/:vehicleId/evaluation/expenses/:expenseId` | Atualiza despesa |
| DELETE | `/vehicles/:vehicleId/evaluation/expenses/:expenseId` | Remove despesa |

---

### Checklist Templates

| Método | Rota | Descrição |
|---|---|---|
| GET | `/checklist-templates` | Lista templates |
| POST | `/checklist-templates` | Cria template |
| GET | `/checklist-templates/:templateId` | Busca template |
| PATCH | `/checklist-templates/:templateId` | Atualiza template |
| DELETE | `/checklist-templates/:templateId` | Remove template |
| POST | `/checklist-templates/:templateId/items` | Adiciona item ao template |
| PATCH | `/checklist-template-items/:itemId` | Atualiza item |
| DELETE | `/checklist-template-items/:itemId` | Remove item |

---

### Dashboard

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/summary` | Retorna resumo geral |
| GET | `/dashboard/financial` | Retorna dashboard financeiro Premium |

---

### Reports

| Método | Rota | Descrição |
|---|---|---|
| GET | `/reports/vehicles/:vehicleId` | Gera relatório JSON do veículo |

---

## Permissões por rota

### Rotas públicas

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /subscription/webhook/mercado-pago`

### Rotas autenticadas

Exigem Bearer Token:

- veículos
- imagens
- avaliações
- dashboard
- relatórios
- assinatura
- dados do usuário

### Rotas Premium

Exigem plano Premium ativo:

- despesas manuais da avaliação
- financeiro do veículo
- marcar veículo como arrematado
- marcar veículo como vendido
- dashboard financeiro
- relatórios

---

## Fluxo principal

### 1. Cadastro e login

```txt
Usuário cria conta
Usuário faz login
API retorna access token
Frontend usa Bearer Token nas próximas requisições
```

### 2. Cadastro de veículo

```txt
Usuário cadastra veículo
Sistema valida limite do plano
Sistema salva veículo
Usuário pode adicionar imagens
```

### 3. Avaliação

```txt
Usuário cria avaliação
Sistema copia template de checklist ativo
Usuário preenche checklist
Sistema calcula despesas e recomendação
```

### 4. Arremate

```txt
Usuário Premium marca veículo como arrematado
Sistema salva valor de arremate
Sistema altera status para PURCHASED
```

### 5. Venda

```txt
Usuário Premium marca veículo como vendido
Sistema salva valor de venda
Sistema altera status para SOLD
Sistema calcula lucro real
```

### 6. Relatório

```txt
Usuário Premium gera relatório do veículo
Sistema retorna JSON com dados completos
```

---

## Exemplo de cálculo financeiro

```txt
Valor do arremate: R$ 18.500,00
Despesas:          R$ 4.200,00
Total investido:   R$ 22.700,00
Valor de venda:    R$ 29.000,00

Lucro bruto:       R$ 6.300,00
Margem de lucro:   27,75%
```

---

## Convenções de resposta

### Sucesso

```json
{
  "id": "uuid",
  "name": "Exemplo"
}
```

### Erro

```json
{
  "statusCode": 403,
  "message": "Plano premium necessário para acessar este recurso.",
  "error": "Forbidden"
}
```

---

## Testes e qualidade

Antes de subir alterações, rode:

```bash
npx prisma generate
npm run build
npm run lint
npm run test
```

Se houver testes e2e:

```bash
npm run test:e2e
```

Checklist mínimo antes de abrir PR:

- build passando
- lint passando
- migrations aplicadas
- Prisma Client gerado
- Swagger abrindo
- rotas protegidas com JWT
- rotas Premium bloqueando usuário Free
- usuário comum sem acesso a dados de outro usuário
- seed funcionando em ambiente local

---

## Problemas comuns

### Erro de conexão com o banco

Verifique se o container está rodando:

```bash
docker ps
```

Verifique se a `DATABASE_URL` está correta:

```env
DATABASE_URL="postgresql://lance_certo:lance_certo@localhost:5432/lance_certo_db?schema=public"
```

---

### Porta 5432 já está em uso

Algum PostgreSQL local pode estar rodando.

Altere o `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"
```

E ajuste o `.env`:

```env
DATABASE_URL="postgresql://lance_certo:lance_certo@localhost:5433/lance_certo_db?schema=public"
```

---

### Prisma Client desatualizado

Rode:

```bash
npx prisma generate
```

---

### Banco sem tabelas

Rode:

```bash
npx prisma migrate dev
```

---

### Banco vazio

Rode:

```bash
npm run db:seed
```

---

### Resetar tudo

```bash
docker compose down -v
docker compose up -d
npx prisma migrate dev
npm run db:seed
```

---

## Cuidados de segurança

### Nunca expor

- senha
- hash de senha
- refresh token
- token de recuperação de senha
- secrets
- variáveis internas
- stack trace em produção

### Sempre validar

- UUIDs
- permissões
- plano do usuário
- propriedade do recurso
- valores monetários
- status do veículo
- limite de imagens
- limite de veículos do plano Free

---

## Boas práticas adotadas

- Controllers finos
- Services com regras de negócio
- DTOs para entrada e saída
- Guards para segurança
- Utilitários compartilhados para regras comuns
- Validação global
- Prisma para acesso ao banco
- Swagger para documentação
- Mensagens de erro em português
- Código e estrutura em inglês

---

## Melhorias futuras

- Integração real com gateway de pagamento
- Validação de webhook com assinatura do provedor
- Exportação de relatório em PDF
- Upload de imagens em storage externo, como S3
- Logs estruturados
- Observabilidade com métricas
- Testes e2e completos
- Refresh token com rotação
- Controle de assinatura recorrente real
- Módulo financeiro separado, caso o domínio cresça
- Auditoria de alterações importantes
- Multiusuário por equipe
- Permissões por organização

---

## Status do projeto

Backend em desenvolvimento ativo.

Objetivo atual:

- consolidar segurança
- finalizar regras Free/Premium
- estabilizar fluxo de veículo
- melhorar documentação Swagger
- preparar a API para integração com frontend

---

## Autor

**Erick Jean**  
Desenvolvedor Full Stack

---

## Licença

Este projeto é privado/proprietário.

Todos os direitos reservados.
