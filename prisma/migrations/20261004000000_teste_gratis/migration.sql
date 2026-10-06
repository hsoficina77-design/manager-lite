-- Teste grátis de 5 dias e pagamento.
--
-- A situação da oficina (teste, assinante, só leitura) sai destas datas a cada
-- requisição (`lib/plano.ts`). As duas nulas = liberada, que é como ficam todas as
-- oficinas que já existem: nada muda para elas.
ALTER TABLE "Oficina" ADD COLUMN "testeAte" TIMESTAMP(3);
ALTER TABLE "Oficina" ADD COLUMN "pagoAte" TIMESTAMP(3);
ALTER TABLE "Oficina" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Oficina" ADD COLUMN "origem" TEXT;
ALTER TABLE "Oficina" ADD COLUMN "gatewayClienteId" TEXT;
ALTER TABLE "Oficina" ADD COLUMN "gatewayAssinaturaId" TEXT;

-- Eventos do gateway. Tabela do sistema, como "Convite": RLS ligada e nenhuma policy
-- (fecha a API pública do Supabase) e nenhum GRANT para app_oficina — só o cliente do
-- sistema, dono da tabela, mexe nela. Nunca FORCE.
CREATE TABLE "EventoPagamento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "oficinaId" TEXT,
    "valor" INTEGER,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoPagamento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventoPagamento_oficinaId_createdAt_idx" ON "EventoPagamento"("oficinaId", "createdAt");

ALTER TABLE "EventoPagamento" ADD CONSTRAINT "EventoPagamento_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventoPagamento" ENABLE ROW LEVEL SECURITY;
