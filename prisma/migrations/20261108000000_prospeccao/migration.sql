-- Prospecção: o CRM do painel admin. Oficinas achadas no Google Maps (CSV do scraper),
-- abordadas pelo WhatsApp à mão, com histórico e tarefas do dia.
--
-- As três tabelas são do sistema, como "Convite": RLS ligada só para fechar a API
-- pública do Supabase, e nenhum GRANT para app_oficina — quem lê e grava é o código do
-- painel admin (lib/prospeccao-banco.ts), como dono das tabelas.

-- CreateTable
CREATE TABLE "LoteProspeccao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "arquivo" TEXT,
    "linhas" INTEGER NOT NULL,
    "novos" INTEGER NOT NULL,
    "atualizados" INTEGER NOT NULL,
    "descartados" INTEGER NOT NULL,
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoteProspeccao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "loteId" TEXT,
    "placeId" TEXT,
    "publico" TEXT NOT NULL DEFAULT 'OFICINA',
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "telefone" TEXT,
    "tipoTelefone" TEXT NOT NULL DEFAULT 'SEM',
    "temWhatsapp" BOOLEAN,
    "email" TEXT,
    "site" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "rua" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "cep" TEXT,
    "uf" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "linkMaps" TEXT,
    "nota" DOUBLE PRECISION,
    "avaliacoes" INTEGER,
    "pctNegativas" DOUBLE PRECISION,
    "horario" TEXT,
    "abreSeg" TEXT,
    "sinaisDeDor" TEXT,
    "avaliacoesRuins" TEXT,
    "fotoUrl" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'NOVO',
    "motivoPerda" TEXT,
    "naoContatar" BOOLEAN NOT NULL DEFAULT false,
    "oficinaId" TEXT,
    "ultimoContato" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteracaoLead" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "regra" TEXT,
    "texto" TEXT NOT NULL,
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteracaoLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_placeId_key" ON "Lead"("placeId");

-- CreateIndex
CREATE INDEX "Lead_telefone_idx" ON "Lead"("telefone");

-- CreateIndex
CREATE INDEX "Lead_cidade_idx" ON "Lead"("cidade");

-- CreateIndex
CREATE INDEX "Lead_loteId_idx" ON "Lead"("loteId");

-- CreateIndex
CREATE INDEX "InteracaoLead_leadId_createdAt_idx" ON "InteracaoLead"("leadId", "createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "LoteProspeccao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteracaoLead" ADD CONSTRAINT "InteracaoLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS sem policy: fecha a API pública. Nunca FORCE — o app conecta como dono.
ALTER TABLE "LoteProspeccao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InteracaoLead" ENABLE ROW LEVEL SECURITY;
