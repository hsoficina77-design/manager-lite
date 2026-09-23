-- Índice da busca de peça por trecho.
--
-- O campo de peça da OS filtra com `contains`, que o Prisma traduz para
-- `LIKE '%termo%'`. Índice btree não serve para isso — resolve só o que COMEÇA com o
-- termo —, então o `@@index([ativo, nome])` que já existia não era usado aqui e cada
-- letra digitada custava uma varredura completa de "Produto".
--
-- Com algumas centenas de peças ninguém sente. O problema aparece quando o catálogo
-- cresce, que é exatamente quando a busca deixa de ser conveniência e vira necessidade.
--
-- pg_trgm quebra o texto em trechos de três letras e indexa cada um — é isso que torna
-- o `%termo%` pesquisável. A extensão acompanha o Postgres padrão e o Supabase, e criar
-- é idempotente. Índice GIN de trigrama só entra em ação a partir de 3 letras, que é o
-- mínimo que o campo exige antes de consultar.
--
-- Sem CONCURRENTLY de propósito: o Prisma roda a migração dentro de uma transação, e
-- CONCURRENTLY não pode. A tabela é pequena e o bloqueio é de um instante.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Produto_busca_idx" ON "Produto" USING GIN ("busca" gin_trgm_ops);
