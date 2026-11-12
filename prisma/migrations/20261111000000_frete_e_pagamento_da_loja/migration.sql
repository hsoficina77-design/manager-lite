-- Entrega e pagamento da autopeça (tela "Loja" do painel da loja).
-- Só colunas novas em "Loja", que é tabela do sistema: a RLS dela não muda.
ALTER TABLE "Loja" ADD COLUMN "freteTipo" TEXT NOT NULL DEFAULT 'GRATIS';
ALTER TABLE "Loja" ADD COLUMN "freteValor" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Loja" ADD COLUMN "fretePorCidade" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "Loja" ADD COLUMN "freteGratisAcima" DOUBLE PRECISION;
ALTER TABLE "Loja" ADD COLUMN "acrescimoCredito" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Loja" ADD COLUMN "debitoAVista" BOOLEAN NOT NULL DEFAULT true;
