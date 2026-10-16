# Atlas Store — Import & Profit

Sistema de gestão financeira e operacional da Atlas Store, pensado para importação e venda de roupas, tênis e acessórios. Interface em português, com foco em uso mobile.

> **Aviso de segurança:** a autenticação ainda é provisória. O código atual usa um usuário padrão (`admin@atlasstore.local`) e não protege o acesso à aplicação. Não publique uma instância com dados reais na internet até implementar autenticação e autorização adequadas. `noindex` não é controle de acesso. Nunca envie `.env`, credenciais ou dados de clientes para o GitHub.

## Funcionalidades

- Dashboard com indicadores, metas e histórico de vendas.
- Importações USCloser, CSSBuy e outros métodos: produtos, câmbio congelado, custos em moedas diferentes, rateio, timeline e entrada protegida no estoque.
- Cadastro de produtos e fornecedores, vendas, metas, financeiro e histórico.
- Calculadoras USCloser, CSSBuy, comparação de frete, preço de venda e simulação.
- Configurações de câmbio, impostos, taxas e divisão do lucro.

## Stack

- Next.js App Router, React e TypeScript
- Tailwind CSS 4
- PostgreSQL com Drizzle ORM
- Server Actions para operações de negócio

## Requisitos

- Node.js 22 (recomendado) e npm
- Docker com Docker Compose para subir um PostgreSQL local, ou uma instância PostgreSQL acessível

## Começar localmente

```bash
npm ci
cp .env.example .env
docker compose up -d db
npm run db:migrate
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A rota `/api/health` verifica a conexão com o banco.

Se você já tiver PostgreSQL, configure `DATABASE_URL` no `.env` e pule o comando `docker compose`. Exemplo local (somente desenvolvimento):

```env
DATABASE_URL=postgresql://atlas_store:atlas_store_dev@localhost:5432/atlas_store
```

As credenciais do `compose.yaml` são apenas para desenvolvimento local; substitua-as por credenciais seguras em qualquer ambiente compartilhado. Não versione seu arquivo `.env`.

## Banco de dados

O schema está em `src/db/schema.ts` e as migrações versionadas ficam em `drizzle/`.

```bash
npm run db:generate  # gera uma migração a partir das mudanças no schema
npm run db:migrate   # aplica as migrações pendentes
npm run db:push      # sincronização direta, útil apenas em desenvolvimento
npm run db:studio    # abre o Drizzle Studio
```

Antes de aplicar migrações em um banco com dados existentes, faça backup e valide as alterações. Prefira migrações versionadas em produção; `db:push` não substitui uma estratégia de migração.

## Verificações

```bash
npm run lint
npm run typecheck
npm run build
```

## Estrutura do projeto

```text
src/
├── app/           # Rotas, layout, estilos, API de health e Server Actions
├── components/    # Componentes compartilhados de layout e interface
├── db/            # Schema e conexão Drizzle
├── features/      # Módulos de dashboard, importação, vendas, financeiro etc.
├── hooks/         # Hooks React
└── lib/           # Autenticação provisória, formatação e tipos de domínio
drizzle/           # Migrações do PostgreSQL
```

## Regras financeiras

- Vendas consideram receita, custo, taxa de pagamento e outros custos.
- A divisão padrão do lucro é 50% disponível e 50% reinvestimento, configurável no app.
- Metas usam o lucro disponível das vendas vinculadas.
- Alíquotas e cálculos das importações são estimativas configuráveis.
