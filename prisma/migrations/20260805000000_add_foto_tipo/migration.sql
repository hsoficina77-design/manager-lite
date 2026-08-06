-- Momento em que a foto foi tirada: ENTRADA | SERVICO | SAIDA.
-- As fotos já existentes viram SERVICO, que é como o app se comportava até aqui.
ALTER TABLE "FotoOS" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'SERVICO';

-- A leitura sempre agrupa por momento, então o índice composto substitui o antigo
-- (que era prefixo dele — nenhuma consulta perde cobertura).
-- IF EXISTS: se algum ambiente tiver sido criado por `db push`, o índice antigo pode
-- ter outro nome — e uma falha aqui travaria o `migrate deploy` na subida do app.
DROP INDEX IF EXISTS "FotoOS_ordemId_idx";
CREATE INDEX "FotoOS_ordemId_tipo_idx" ON "FotoOS"("ordemId", "tipo");
