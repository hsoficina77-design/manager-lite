-- Foto passa a poder pertencer ao orçamento, e não só à OS.
--
-- `ordemId` vira opcional porque a foto do orçamento nasce antes de existir OS.
-- Na conversão o `ordemId` é preenchido e o `orcamentoId` permanece, então a foto
-- aparece nos dois documentos. A tabela já existe (RLS herdada da migração
-- 20260803010000), então aqui não há ENABLE ROW LEVEL SECURITY a fazer.

ALTER TABLE "FotoOS" ALTER COLUMN "ordemId" DROP NOT NULL;
ALTER TABLE "FotoOS" ADD COLUMN "orcamentoId" TEXT;

-- Toda foto precisa de ao menos um dono, senão vira arquivo órfão no bucket.
ALTER TABLE "FotoOS" ADD CONSTRAINT "FotoOS_dono_check"
  CHECK ("ordemId" IS NOT NULL OR "orcamentoId" IS NOT NULL);

CREATE INDEX "FotoOS_orcamentoId_idx" ON "FotoOS"("orcamentoId");

ALTER TABLE "FotoOS" ADD CONSTRAINT "FotoOS_orcamentoId_fkey"
  FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
