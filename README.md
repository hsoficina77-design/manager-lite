# Manager Lite

Sistema enxuto de gestão para oficinas mecânicas: **clientes**, **ordens de serviço** e **orçamentos**.

Versão genérica e escalável, destilada a partir do [Mitsu Manager](https://github.com/Hideki77777/oficina-manager) (sob medida para uma oficina específica).

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Prisma 5 + SQLite (dev) — migrável para Postgres em produção
- Tailwind CSS 3
- Zod para validação

## Como rodar

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Acesse http://localhost:3000.

## Estrutura

```
src/
  app/        # rotas (App Router)
  lib/        # prisma client, utils
prisma/
  schema.prisma
```

## Escopo do MVP

- [ ] Cadastro de clientes
- [ ] Cadastro de veículos
- [ ] Orçamentos
- [ ] Ordens de serviço
- [ ] Impressão / PDF
