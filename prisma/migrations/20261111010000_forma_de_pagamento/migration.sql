-- Forma de pagamento na cotação, preço no crédito na oferta, e a taxa de entrega e o
-- pagamento gravados no envio. Só colunas novas em tabelas que já têm RLS (Cotacao,
-- CotacaoLoja, Oferta): as políticas e os gatilhos delas valem para as colunas novas.
ALTER TABLE "Cotacao" ADD COLUMN "formaPagamento" TEXT NOT NULL DEFAULT 'PIX';

ALTER TABLE "Oferta" ADD COLUMN "precoCredito" DOUBLE PRECISION;

ALTER TABLE "CotacaoLoja" ADD COLUMN "taxaEntrega" DOUBLE PRECISION;
ALTER TABLE "CotacaoLoja" ADD COLUMN "freteGratisAcima" DOUBLE PRECISION;
ALTER TABLE "CotacaoLoja" ADD COLUMN "debitoAVista" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CotacaoLoja" ADD COLUMN "formaPagamento" TEXT;

-- Pedido que já saiu: foi pago como a cotação dizia (Pix, o padrão).
UPDATE "CotacaoLoja" SET "formaPagamento" = 'PIX' WHERE "entrega" IS NOT NULL;
