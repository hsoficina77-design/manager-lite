-- Estoque: o que está na prateleira, e a ligação com a peça lançada na OS.
--
-- Duas tabelas porque são duas coisas diferentes:
--
--   Produto          — o cadastro: custo, venda, quantidade atual.
--   MovimentoEstoque — o livro-caixa: cada entrada, baixa e acerto, com o saldo
--                      que deixou. É o que responde "por que tenho 3 e não 10?".
--
-- O item da OS ganha só um ponteiro (`produtoId`). Descrição, preço e custo
-- continuam copiados na OS: reajustar a tabela do estoque não pode reescrever o
-- que um cliente já pagou.

CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    -- Nome, código e fornecedor sem acento e em minúsculo: o ILIKE do Postgres
    -- ignora caixa, mas não acento, e "agua" precisa achar "Água desmineralizada".
    "busca" TEXT NOT NULL DEFAULT '',
    "unidade" TEXT NOT NULL DEFAULT 'UN',
    "custoUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorVenda" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estoqueMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fornecedor" TEXT,
    "obs" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Produto_codigo_key" ON "Produto"("codigo");
CREATE INDEX "Produto_ativo_nome_idx" ON "Produto"("ativo", "nome");

CREATE TABLE "MovimentoEstoque" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "saldoDepois" DOUBLE PRECISION NOT NULL,
    "custoUnit" DOUBLE PRECISION,
    "motivo" TEXT,
    "ordemId" TEXT,
    "ordemNumero" INTEGER,
    "usuarioNome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentoEstoque_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MovimentoEstoque_produtoId_createdAt_idx" ON "MovimentoEstoque"("produtoId", "createdAt");
CREATE INDEX "MovimentoEstoque_ordemId_idx" ON "MovimentoEstoque"("ordemId");

ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_produtoId_fkey"
    FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A OS excluída leva junto os itens, mas não o histórico do estoque: o movimento
-- fica órfão de propósito, e `ordemNumero` mantém o rastro legível.
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_ordemId_fkey"
    FOREIGN KEY ("ordemId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Vínculo com os itens ────────────────────────────────────────────────────

ALTER TABLE "ItemOrdem" ADD COLUMN "produtoId" TEXT;
ALTER TABLE "ItemOrcamento" ADD COLUMN "produtoId" TEXT;

CREATE INDEX "ItemOrdem_produtoId_idx" ON "ItemOrdem"("produtoId");
CREATE INDEX "ItemOrcamento_produtoId_idx" ON "ItemOrcamento"("produtoId");

-- Excluir um produto não pode apagar a peça de uma OS já faturada: o item perde o
-- vínculo e continua com a descrição e o preço que foram cobrados.
ALTER TABLE "ItemOrdem" ADD CONSTRAINT "ItemOrdem_produtoId_fkey"
    FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_produtoId_fkey"
    FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
--
-- Tabela nova é tabela exposta pela API pública (PostgREST) do Supabase. Sem
-- policy nenhuma, RLS nega tudo para anon/authenticated e não afeta o Prisma, que
-- acessa como dono.
--
-- ATENÇÃO: não usar FORCE ROW LEVEL SECURITY — derrubaria o acesso do Prisma também.

ALTER TABLE "Produto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimentoEstoque" ENABLE ROW LEVEL SECURITY;
