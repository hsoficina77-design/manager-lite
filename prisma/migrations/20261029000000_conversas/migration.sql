-- Peça Peça: conversa entre a oficina e a loja sobre uma cotação, e o aviso no celular
-- (Web Push) quando chega mensagem com o app fechado.
--
-- "Mensagem" é da oficina, como o envio, e entra nas três travas. A loja lê e grava
-- pelo lib/conversa.ts, sempre a partir do envio para ela e com o "oficinaId" dele.
-- As mensagens não ficam guardadas: são apagadas quando a entrega fecha.
--
-- "InscricaoPush" é do sistema, como "Loja": RLS ligada só para fechar a API pública do
-- Supabase, sem GRANT para app_oficina (quem lê e grava é lib/push.ts, como dono).

-- AlterTable
ALTER TABLE "CotacaoLoja" ADD COLUMN     "conversaFechadaEm" TIMESTAMP(3),
ADD COLUMN     "lidoLojaAte" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lidoOficinaAte" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "naoLidasLoja" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "naoLidasOficina" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimaMensagem" TEXT,
ADD COLUMN     "ultimaMensagemDe" TEXT,
ADD COLUMN     "ultimaMensagemEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Mensagem" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "oficinaId" TEXT NOT NULL DEFAULT current_setting('app.oficina_id'::text, true),
    "envioId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "autorId" TEXT,
    "autorNome" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "idCliente" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscricaoPush" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "usuarioId" TEXT,
    "oficinaId" TEXT,
    "usuarioLojaId" TEXT,
    "lojaId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscricaoPush_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mensagem_seq_key" ON "Mensagem"("seq");

-- CreateIndex
CREATE INDEX "Mensagem_envioId_seq_idx" ON "Mensagem"("envioId", "seq");

-- CreateIndex
CREATE INDEX "Mensagem_oficinaId_idx" ON "Mensagem"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Mensagem_envioId_idCliente_key" ON "Mensagem"("envioId", "idCliente");

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoPush_endpoint_key" ON "InscricaoPush"("endpoint");

-- CreateIndex
CREATE INDEX "InscricaoPush_oficinaId_idx" ON "InscricaoPush"("oficinaId");

-- CreateIndex
CREATE INDEX "InscricaoPush_lojaId_idx" ON "InscricaoPush"("lojaId");

-- CreateIndex
CREATE INDEX "CotacaoLoja_lojaId_ultimaMensagemEm_idx" ON "CotacaoLoja"("lojaId", "ultimaMensagemEm");

-- CreateIndex
CREATE INDEX "CotacaoLoja_oficinaId_ultimaMensagemEm_idx" ON "CotacaoLoja"("oficinaId", "ultimaMensagemEm");

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagem" ADD CONSTRAINT "Mensagem_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "CotacaoLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoPush" ADD CONSTRAINT "InscricaoPush_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoPush" ADD CONSTRAINT "InscricaoPush_usuarioLojaId_fkey" FOREIGN KEY ("usuarioLojaId") REFERENCES "UsuarioLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Trava 3: RLS ────────────────────────────────────────────────────────────

ALTER TABLE "Mensagem" ENABLE ROW LEVEL SECURITY;
-- Sem policy: fecha a API pública. Nunca FORCE — o app conecta como dono.
ALTER TABLE "InscricaoPush" ENABLE ROW LEVEL SECURITY;

-- Tolerante como a 20261019000000: sem o papel app_oficina, segue sem a policy e o
-- sistema roda com as travas 1 e 2.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_oficina') THEN
    RAISE WARNING 'Peça Peça: papel app_oficina ausente, Mensagem sem a policy oficina_isolada';
    RETURN;
  END IF;

  GRANT SELECT, INSERT, UPDATE, DELETE ON "Mensagem" TO app_oficina;
  -- O "seq" vem de uma sequência nova: a concessão de 20260929010000 só pegou as que
  -- existiam na época.
  GRANT USAGE, SELECT ON SEQUENCE "Mensagem_seq_seq" TO app_oficina;
  EXECUTE format(
    'CREATE POLICY oficina_isolada ON %I TO app_oficina '
    'USING ("oficinaId" = current_setting(%L, true)) '
    'WITH CHECK ("oficinaId" = current_setting(%L, true))',
    'Mensagem', 'app.oficina_id', 'app.oficina_id'
  );
END $$;

-- ─── Trava 2: vínculo só dentro da mesma oficina ─────────────────────────────

CREATE TRIGGER "Mensagem_envioId_mesma_oficina"
  BEFORE INSERT OR UPDATE OF "envioId" ON "Mensagem"
  FOR EACH ROW EXECUTE FUNCTION mesma_oficina('envioId', 'CotacaoLoja', 'text');

CREATE TRIGGER "Mensagem_oficina_imutavel"
  BEFORE UPDATE OF "oficinaId" ON "Mensagem"
  FOR EACH ROW EXECUTE FUNCTION oficina_imutavel();

-- ─── Acesso novo no painel da loja ───────────────────────────────────────────
--
-- "Conversar com as oficinas" entra para quem já responde cotações: é quem tira a dúvida
-- da aplicação. As contas guardam as chaves que têm, então a chave nova não chega
-- sozinha — nem nos convites que ainda não foram usados.
UPDATE "UsuarioLoja"
SET "permissoes" = array_append("permissoes", 'balcao.conversa')
WHERE 'balcao.responder' = ANY("permissoes") AND NOT ('balcao.conversa' = ANY("permissoes"));

UPDATE "ConviteLoja"
SET "permissoes" = array_append("permissoes", 'balcao.conversa')
WHERE "usadoEm" IS NULL
  AND 'balcao.responder' = ANY("permissoes")
  AND NOT ('balcao.conversa' = ANY("permissoes"));
