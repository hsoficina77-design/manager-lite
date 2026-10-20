-- Peça Peça: região de cada loja.
--
-- "atende" é a lista de cidades que a loja atende; a oficina vê a loja quando a cidade
-- da configuração dela está na lista. As lojas que já existem passam a atender a
-- própria cidade, que é o que valia até aqui.

ALTER TABLE "Loja" ADD COLUMN "atende" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Loja" ADD COLUMN "telefone" TEXT;

UPDATE "Loja" SET "atende" = ARRAY["cidade"] WHERE "cidade" IS NOT NULL;
