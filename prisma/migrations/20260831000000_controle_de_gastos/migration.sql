-- Controle de gastos: separa a REGRA da despesa fixa do LANÇAMENTO de cada mês, e
-- tira as categorias do código para a oficina poder criar as suas.
--
-- Nada é perdido: as categorias que existiam viram linhas, cada despesa aponta para a
-- sua, e toda despesa que estava marcada como recorrente vira uma regra com os
-- lançamentos já ligados nela.

-- ─── Categorias ──────────────────────────────────────────────────────────────

CREATE TABLE "CategoriaDespesa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#71717a',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaDespesa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoriaDespesa_nome_key" ON "CategoriaDespesa"("nome");
CREATE INDEX "CategoriaDespesa_ativa_ordem_idx" ON "CategoriaDespesa"("ativa", "ordem");

-- As nove que existiam no enum, com os mesmos nomes que apareciam na tela. Ids
-- legíveis de propósito: é o que deixa o UPDATE de backfill abaixo direto.
INSERT INTO "CategoriaDespesa" ("id", "nome", "cor", "ordem", "updatedAt") VALUES
    ('catdesp_aluguel',    'Aluguel',    '#6366f1', 10, CURRENT_TIMESTAMP),
    ('catdesp_salario',    'Salário',    '#0ea5e9', 20, CURRENT_TIMESTAMP),
    ('catdesp_fornecedor', 'Fornecedor', '#14b8a6', 30, CURRENT_TIMESTAMP),
    ('catdesp_energia',    'Energia',    '#f59e0b', 40, CURRENT_TIMESTAMP),
    ('catdesp_agua',       'Água',       '#38bdf8', 50, CURRENT_TIMESTAMP),
    ('catdesp_internet',   'Internet',   '#8b5cf6', 60, CURRENT_TIMESTAMP),
    ('catdesp_imposto',    'Imposto',    '#ef4444', 70, CURRENT_TIMESTAMP),
    ('catdesp_manutencao', 'Manutenção', '#84cc16', 80, CURRENT_TIMESTAMP),
    ('catdesp_outros',     'Outros',     '#71717a', 90, CURRENT_TIMESTAMP);

-- Rede de segurança: se alguma despesa em produção tiver uma categoria fora do enum
-- (import antigo, escrita direta no banco), ela ganha a própria linha em vez de
-- travar o NOT NULL lá embaixo.
INSERT INTO "CategoriaDespesa" ("id", "nome", "ordem", "updatedAt")
SELECT gen_random_uuid()::text, d."categoria", 100, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "categoria" FROM "Despesa") d
WHERE NOT EXISTS (
    SELECT 1 FROM "CategoriaDespesa" c
    WHERE lower(c."id") = 'catdesp_' || lower(d."categoria") OR c."nome" = d."categoria"
);

-- ─── Regras de despesa fixa ──────────────────────────────────────────────────

CREATE TABLE "DespesaRecorrente" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "fornecedor" TEXT,
    "diaVencimento" INTEGER NOT NULL,
    "periodicidade" TEXT NOT NULL DEFAULT 'MENSAL',
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DespesaRecorrente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DespesaRecorrente_ativa_idx" ON "DespesaRecorrente"("ativa");
CREATE INDEX "DespesaRecorrente_categoriaId_idx" ON "DespesaRecorrente"("categoriaId");

-- ─── Lançamentos ─────────────────────────────────────────────────────────────

ALTER TABLE "Despesa" ADD COLUMN "categoriaId" TEXT;
ALTER TABLE "Despesa" ADD COLUMN "recorrenteId" TEXT;
ALTER TABLE "Despesa" ADD COLUMN "competencia" TIMESTAMP(3);
ALTER TABLE "Despesa" ADD COLUMN "valorPago" DOUBLE PRECISION;
ALTER TABLE "Despesa" ADD COLUMN "fornecedor" TEXT;
ALTER TABLE "Despesa" ADD COLUMN "formaPagamento" TEXT;
ALTER TABLE "Despesa" ADD COLUMN "observacao" TEXT;
-- Lápide do lançamento de regra que "não teve este mês": apagar a linha faria a regra
-- recriá-la na próxima abertura do mês.
ALTER TABLE "Despesa" ADD COLUMN "cancelado" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Despesa" d
SET "categoriaId" = c."id"
FROM "CategoriaDespesa" c
WHERE c."id" = 'catdesp_' || lower(d."categoria") OR c."nome" = d."categoria";

-- O mês do gasto é o do vencimento. Os cortes de mês do app são no fuso de Brasília
-- (UTC-3) e as colunas são gravadas em UTC, por isso o deslocamento antes de truncar.
UPDATE "Despesa"
SET "competencia" = date_trunc('month', "vencimento" - INTERVAL '3 hours') + INTERVAL '3 hours'
WHERE "competencia" IS NULL;

-- Quem já estava pago passa a ter o realizado preenchido, igual ao previsto: é o que
-- mantém "pago no mês" com o mesmo total de antes.
UPDATE "Despesa" SET "valorPago" = "valor" WHERE "pago" = true;

-- Cada despesa marcada como recorrente vira uma regra. Uma por categoria+descrição:
-- o valor e o dia de vencimento vêm da ocorrência mais recente (é o preço de hoje) e
-- o início, da mais antiga (é desde quando a conta existe).
INSERT INTO "DespesaRecorrente"
    ("id", "categoriaId", "descricao", "valor", "diaVencimento", "periodicidade", "inicio", "ativa", "updatedAt")
SELECT DISTINCT ON (d."categoriaId", d."descricao")
    gen_random_uuid()::text,
    d."categoriaId",
    d."descricao",
    d."valor",
    EXTRACT(DAY FROM d."vencimento" - INTERVAL '3 hours')::int,
    'MENSAL',
    (SELECT min(d2."competencia") FROM "Despesa" d2
      WHERE d2."recorrente" = true
        AND d2."categoriaId" = d."categoriaId"
        AND d2."descricao" = d."descricao"),
    true,
    CURRENT_TIMESTAMP
FROM "Despesa" d
WHERE d."recorrente" = true
ORDER BY d."categoriaId", d."descricao", d."vencimento" DESC;

-- Liga os lançamentos à regra. Um por mês — se houver duas despesas recorrentes com a
-- mesma descrição no mesmo mês, a primeira fica ligada e a outra segue como avulsa,
-- porque a chave única (regra, competência) é o que garante a geração idempotente.
UPDATE "Despesa" d
SET "recorrenteId" = escolhido."recorrenteId"
FROM (
    SELECT DISTINCT ON (r."id", x."competencia") x."id", r."id" AS "recorrenteId"
    FROM "Despesa" x
    JOIN "DespesaRecorrente" r
      ON r."categoriaId" = x."categoriaId" AND r."descricao" = x."descricao"
    WHERE x."recorrente" = true
    ORDER BY r."id", x."competencia", x."vencimento" ASC
) AS escolhido
WHERE d."id" = escolhido."id";

ALTER TABLE "Despesa" ALTER COLUMN "categoriaId" SET NOT NULL;
ALTER TABLE "Despesa" ALTER COLUMN "competencia" SET NOT NULL;
ALTER TABLE "Despesa" DROP COLUMN "categoria";
ALTER TABLE "Despesa" DROP COLUMN "recorrente";

CREATE UNIQUE INDEX "Despesa_recorrenteId_competencia_key"
    ON "Despesa"("recorrenteId", "competencia");
CREATE INDEX "Despesa_competencia_idx" ON "Despesa"("competencia");
CREATE INDEX "Despesa_categoriaId_idx" ON "Despesa"("categoriaId");

ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "CategoriaDespesa"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_recorrenteId_fkey"
    FOREIGN KEY ("recorrenteId") REFERENCES "DespesaRecorrente"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DespesaRecorrente" ADD CONSTRAINT "DespesaRecorrente_categoriaId_fkey"
    FOREIGN KEY ("categoriaId") REFERENCES "CategoriaDespesa"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma acessa como dono das tabelas e o dono ignora RLS; habilitar sem policy fecha
-- a API REST pública do Supabase. Nunca usar FORCE aqui.
ALTER TABLE "CategoriaDespesa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DespesaRecorrente" ENABLE ROW LEVEL SECURITY;
-- Despesa nasceu antes dessa regra existir e ficou de fora; aproveita a passagem.
ALTER TABLE "Despesa" ENABLE ROW LEVEL SECURITY;
