-- Peça Peça: menos peça errada.
--
-- O que no balcão sai de olhar a peça velha, aqui vem por escrito: o código (ou a
-- medida) e o recado de cada peça, até duas fotos por peça, o chassi do carro e o
-- código da peça que a loja oferece. Nada disso é obrigatório — o chassi só passa a
-- ser quando a oficina manda para uma loja que exige.

ALTER TABLE "Cotacao" ADD COLUMN "chassi" TEXT;
ALTER TABLE "CotacaoPeca" ADD COLUMN "codigo" TEXT, ADD COLUMN "observacao" TEXT;
ALTER TABLE "Oferta" ADD COLUMN "codigo" TEXT;
ALTER TABLE "Loja" ADD COLUMN "exigeChassi" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FotoPecaPeca" (
    "id" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL DEFAULT current_setting('app.oficina_id'::text, true),
    "cotacaoId" TEXT NOT NULL,
    "pecaId" TEXT,
    "devolucaoId" TEXT,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL DEFAULT 0,
    "apagadaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoPecaPeca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FotoPecaPeca_oficinaId_idx" ON "FotoPecaPeca"("oficinaId");

-- CreateIndex
CREATE INDEX "FotoPecaPeca_cotacaoId_idx" ON "FotoPecaPeca"("cotacaoId");

-- CreateIndex
CREATE INDEX "FotoPecaPeca_pecaId_idx" ON "FotoPecaPeca"("pecaId");

-- CreateIndex
CREATE INDEX "FotoPecaPeca_devolucaoId_idx" ON "FotoPecaPeca"("devolucaoId");

-- AddForeignKey
ALTER TABLE "FotoPecaPeca" ADD CONSTRAINT "FotoPecaPeca_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoPecaPeca" ADD CONSTRAINT "FotoPecaPeca_cotacaoId_fkey" FOREIGN KEY ("cotacaoId") REFERENCES "Cotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoPecaPeca" ADD CONSTRAINT "FotoPecaPeca_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "CotacaoPeca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoPecaPeca" ADD CONSTRAINT "FotoPecaPeca_devolucaoId_fkey" FOREIGN KEY ("devolucaoId") REFERENCES "Devolucao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Trava 3: RLS ────────────────────────────────────────────────────────────

ALTER TABLE "FotoPecaPeca" ENABLE ROW LEVEL SECURITY;

-- Tolerante como a 20261027000000: sem o papel app_oficina, segue sem a policy e o
-- sistema roda com as travas 1 e 2.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_oficina') THEN
    RAISE WARNING 'Peça Peça: papel app_oficina ausente, FotoPecaPeca sem a policy oficina_isolada';
    RETURN;
  END IF;

  GRANT SELECT, INSERT, UPDATE, DELETE ON "FotoPecaPeca" TO app_oficina;
  EXECUTE format(
    'CREATE POLICY oficina_isolada ON %I TO app_oficina '
    'USING ("oficinaId" = current_setting(%L, true)) '
    'WITH CHECK ("oficinaId" = current_setting(%L, true))',
    'FotoPecaPeca', 'app.oficina_id', 'app.oficina_id'
  );
END $$;

-- ─── Trava 2: vínculo só dentro da mesma oficina ─────────────────────────────

CREATE TRIGGER "FotoPecaPeca_cotacaoId_mesma_oficina"
  BEFORE INSERT OR UPDATE OF "cotacaoId" ON "FotoPecaPeca"
  FOR EACH ROW EXECUTE FUNCTION mesma_oficina('cotacaoId', 'Cotacao', 'text');

CREATE TRIGGER "FotoPecaPeca_pecaId_mesma_oficina"
  BEFORE INSERT OR UPDATE OF "pecaId" ON "FotoPecaPeca"
  FOR EACH ROW EXECUTE FUNCTION mesma_oficina('pecaId', 'CotacaoPeca', 'text');

CREATE TRIGGER "FotoPecaPeca_devolucaoId_mesma_oficina"
  BEFORE INSERT OR UPDATE OF "devolucaoId" ON "FotoPecaPeca"
  FOR EACH ROW EXECUTE FUNCTION mesma_oficina('devolucaoId', 'Devolucao', 'text');

CREATE TRIGGER "FotoPecaPeca_oficina_imutavel"
  BEFORE UPDATE OF "oficinaId" ON "FotoPecaPeca"
  FOR EACH ROW EXECUTE FUNCTION oficina_imutavel();
