-- Gasto parcelado: uma compra dividida em N parcelas (semanais ou mensais) vira N
-- lançamentos avulsos ligados pelo mesmo parcelamentoId. Só colunas novas numa
-- tabela que já tem RLS — nada a habilitar aqui.
ALTER TABLE "Despesa" ADD COLUMN "parcelamentoId" TEXT;
ALTER TABLE "Despesa" ADD COLUMN "parcela" INTEGER;
ALTER TABLE "Despesa" ADD COLUMN "parcelas" INTEGER;

CREATE INDEX "Despesa_parcelamentoId_idx" ON "Despesa"("parcelamentoId");
