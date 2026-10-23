-- Entrega confirmada pela oficina.
--
-- A loja marcar "entregue" passa a só avisar: a entrega fecha quando a oficina confirma
-- que as peças chegaram (ou quando ela mesma marca, antes da loja).
ALTER TABLE "CotacaoLoja" ADD COLUMN "oficinaRecebeuEm" TIMESTAMP(3);

-- O que já estava entregue antes da regra conta como conferido: senão toda entrega
-- antiga voltaria pedindo confirmação.
UPDATE "CotacaoLoja" SET "oficinaRecebeuEm" = now() WHERE "entrega" = 'ENTREGUE';
