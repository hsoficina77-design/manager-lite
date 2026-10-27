-- Peça Peça: devolução de peça depois da entrega (defeito, sem uso ou peça errada).
--
-- "Devolucao" é da oficina, como as outras tabelas da cotação, e entra nas três travas.
-- A loja lê e grava pelo lib/balcao.ts, sempre a partir do envio para ela e com o
-- "oficinaId" do próprio envio — os gatilhos recusam vínculo com outra oficina.

-- CreateTable
CREATE TABLE "Devolucao" (
    "id" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL DEFAULT current_setting('app.oficina_id'::text, true),
    "envioId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "detalhe" TEXT,
    "querTroca" BOOLEAN NOT NULL DEFAULT false,
    "valor" DOUBLE PRECISION NOT NULL,
    "aceitaEm" TIMESTAMP(3),
    "recusadaEm" TIMESTAMP(3),
    "motivoRecusa" TEXT,
    "semAPeca" BOOLEAN NOT NULL DEFAULT false,
    "trocaMarca" TEXT,
    "trocaPreco" DOUBLE PRECISION,
    "trocaSaiuEm" TIMESTAMP(3),
    "lojaRecebeuEm" TIMESTAMP(3),
    "valorDevolvido" DOUBLE PRECISION,
    "respondidoPor" TEXT,
    "precoAceitoEm" TIMESTAMP(3),
    "oficinaRecebeuTrocaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devolucao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Devolucao_oficinaId_idx" ON "Devolucao"("oficinaId");

-- CreateIndex
CREATE INDEX "Devolucao_envioId_idx" ON "Devolucao"("envioId");

-- CreateIndex
CREATE INDEX "Devolucao_pecaId_idx" ON "Devolucao"("pecaId");

-- AddForeignKey
ALTER TABLE "Devolucao" ADD CONSTRAINT "Devolucao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucao" ADD CONSTRAINT "Devolucao_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "CotacaoLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Devolucao" ADD CONSTRAINT "Devolucao_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "CotacaoPeca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prazo da loja para peça sem uso. Sete dias é o costume do balcão; o dono muda na
-- tela "Loja".
ALTER TABLE "Loja" ADD COLUMN "prazoDevolucao" INTEGER NOT NULL DEFAULT 7;

-- ─── Trava 3: RLS ────────────────────────────────────────────────────────────

ALTER TABLE "Devolucao" ENABLE ROW LEVEL SECURITY;

-- Tolerante como a 20261019000000: sem o papel app_oficina, segue sem a policy e o
-- sistema roda com as travas 1 e 2.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_oficina') THEN
    RAISE WARNING 'Peça Peça: papel app_oficina ausente, Devolucao sem a policy oficina_isolada';
    RETURN;
  END IF;

  GRANT SELECT, INSERT, UPDATE, DELETE ON "Devolucao" TO app_oficina;
  EXECUTE format(
    'CREATE POLICY oficina_isolada ON %I TO app_oficina '
    'USING ("oficinaId" = current_setting(%L, true)) '
    'WITH CHECK ("oficinaId" = current_setting(%L, true))',
    'Devolucao', 'app.oficina_id', 'app.oficina_id'
  );
END $$;

-- ─── Trava 2: vínculo só dentro da mesma oficina ─────────────────────────────

CREATE TRIGGER "Devolucao_envioId_mesma_oficina"
  BEFORE INSERT OR UPDATE OF "envioId" ON "Devolucao"
  FOR EACH ROW EXECUTE FUNCTION mesma_oficina('envioId', 'CotacaoLoja', 'text');

CREATE TRIGGER "Devolucao_pecaId_mesma_oficina"
  BEFORE INSERT OR UPDATE OF "pecaId" ON "Devolucao"
  FOR EACH ROW EXECUTE FUNCTION mesma_oficina('pecaId', 'CotacaoPeca', 'text');

CREATE TRIGGER "Devolucao_oficina_imutavel"
  BEFORE UPDATE OF "oficinaId" ON "Devolucao"
  FOR EACH ROW EXECUTE FUNCTION oficina_imutavel();

-- ─── Acesso novo no painel da loja ───────────────────────────────────────────
--
-- "Cuidar das devoluções" entra para quem já avança a entrega: é o mesmo balconista que
-- manda o motoboy. As contas guardam as chaves que têm, então a chave nova não chega
-- sozinha — nem nos convites que ainda não foram usados.
UPDATE "UsuarioLoja"
SET "permissoes" = array_append("permissoes", 'balcao.devolucao')
WHERE 'balcao.entrega' = ANY("permissoes") AND NOT ('balcao.devolucao' = ANY("permissoes"));

UPDATE "ConviteLoja"
SET "permissoes" = array_append("permissoes", 'balcao.devolucao')
WHERE "usadoEm" IS NULL
  AND 'balcao.entrega' = ANY("permissoes")
  AND NOT ('balcao.devolucao' = ANY("permissoes"));
