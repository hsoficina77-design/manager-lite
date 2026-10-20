-- Peça Peça: cotação de peças nas autopeças da região.
--
-- "Loja" é do sistema (uma autopeça atende várias oficinas): RLS ligada só para fechar
-- a API pública do Supabase, e nenhum GRANT para app_oficina — quem lê e grava loja é
-- o código do sistema (lib/balcao.ts), como dono das tabelas. As outras quatro são da
-- oficina e entram nas três travas, como as tabelas da migração multi_oficina.

-- CreateTable
CREATE TABLE "Loja" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT,
    "tokenBalcao" TEXT NOT NULL,
    "entregaMin" INTEGER NOT NULL DEFAULT 30,
    "entregaMax" INTEGER NOT NULL DEFAULT 50,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotacao" (
    "id" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL DEFAULT current_setting('app.oficina_id'::text, true),
    "numero" INTEGER NOT NULL,
    "placa" TEXT,
    "marca" TEXT,
    "modelo" TEXT NOT NULL,
    "ano" TEXT,
    "motor" TEXT,
    "clienteId" TEXT,
    "veiculoId" TEXT,
    "margem" INTEGER NOT NULL DEFAULT 30,
    "orcamentoId" TEXT,
    "pedidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotacaoPeca" (
    "id" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL DEFAULT current_setting('app.oficina_id'::text, true),
    "cotacaoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "ofertaId" TEXT,
    "vendaUnit" DOUBLE PRECISION,

    CONSTRAINT "CotacaoPeca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotacaoLoja" (
    "id" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL DEFAULT current_setting('app.oficina_id'::text, true),
    "cotacaoId" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "respondidaEm" TIMESTAMP(3),
    "entrega" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CotacaoLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oferta" (
    "id" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL DEFAULT current_setting('app.oficina_id'::text, true),
    "envioId" TEXT NOT NULL,
    "pecaId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "prazoMin" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Oferta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Loja_tokenBalcao_key" ON "Loja"("tokenBalcao");

-- CreateIndex
CREATE UNIQUE INDEX "Cotacao_orcamentoId_key" ON "Cotacao"("orcamentoId");

-- CreateIndex
CREATE INDEX "Cotacao_oficinaId_createdAt_idx" ON "Cotacao"("oficinaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cotacao_oficinaId_numero_key" ON "Cotacao"("oficinaId", "numero");

-- CreateIndex
CREATE INDEX "CotacaoPeca_oficinaId_idx" ON "CotacaoPeca"("oficinaId");

-- CreateIndex
CREATE INDEX "CotacaoPeca_cotacaoId_idx" ON "CotacaoPeca"("cotacaoId");

-- CreateIndex
CREATE INDEX "CotacaoPeca_ofertaId_idx" ON "CotacaoPeca"("ofertaId");

-- CreateIndex
CREATE INDEX "CotacaoLoja_oficinaId_idx" ON "CotacaoLoja"("oficinaId");

-- CreateIndex
CREATE INDEX "CotacaoLoja_lojaId_createdAt_idx" ON "CotacaoLoja"("lojaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CotacaoLoja_cotacaoId_lojaId_key" ON "CotacaoLoja"("cotacaoId", "lojaId");

-- CreateIndex
CREATE INDEX "Oferta_oficinaId_idx" ON "Oferta"("oficinaId");

-- CreateIndex
CREATE INDEX "Oferta_envioId_idx" ON "Oferta"("envioId");

-- CreateIndex
CREATE INDEX "Oferta_pecaId_idx" ON "Oferta"("pecaId");

-- AddForeignKey
ALTER TABLE "Cotacao" ADD CONSTRAINT "Cotacao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotacao" ADD CONSTRAINT "Cotacao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotacao" ADD CONSTRAINT "Cotacao_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotacao" ADD CONSTRAINT "Cotacao_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotacaoPeca" ADD CONSTRAINT "CotacaoPeca_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotacaoPeca" ADD CONSTRAINT "CotacaoPeca_cotacaoId_fkey" FOREIGN KEY ("cotacaoId") REFERENCES "Cotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotacaoPeca" ADD CONSTRAINT "CotacaoPeca_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "Oferta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotacaoLoja" ADD CONSTRAINT "CotacaoLoja_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotacaoLoja" ADD CONSTRAINT "CotacaoLoja_cotacaoId_fkey" FOREIGN KEY ("cotacaoId") REFERENCES "Cotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotacaoLoja" ADD CONSTRAINT "CotacaoLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_envioId_fkey" FOREIGN KEY ("envioId") REFERENCES "CotacaoLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_pecaId_fkey" FOREIGN KEY ("pecaId") REFERENCES "CotacaoPeca"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ─── Trava 3: RLS ────────────────────────────────────────────────────────────

ALTER TABLE "Loja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cotacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CotacaoPeca" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CotacaoLoja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Oferta" ENABLE ROW LEVEL SECURITY;

-- Tolerante como a 20260929010000: sem o papel app_oficina, segue sem a policy e o
-- sistema roda com as travas 1 e 2.
DO $$
DECLARE
  tabela text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_oficina') THEN
    RAISE WARNING 'Peça Peça: papel app_oficina ausente, tabelas novas sem a policy oficina_isolada';
    RETURN;
  END IF;

  FOREACH tabela IN ARRAY ARRAY['Cotacao', 'CotacaoPeca', 'CotacaoLoja', 'Oferta']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_oficina', tabela);
    EXECUTE format(
      'CREATE POLICY oficina_isolada ON %I TO app_oficina '
      'USING ("oficinaId" = current_setting(%L, true)) '
      'WITH CHECK ("oficinaId" = current_setting(%L, true))',
      tabela, 'app.oficina_id', 'app.oficina_id'
    );
  END LOOP;
END $$;

-- ─── Trava 2: vínculo só dentro da mesma oficina ─────────────────────────────

DO $$
DECLARE
  vinculo text[];
  tabela  text;
BEGIN
  -- {tabela, coluna, tabela_pai, tipo do id do pai}
  FOREACH vinculo SLICE 1 IN ARRAY ARRAY[
    ['Cotacao',     'clienteId',   'Cliente',     'text'],
    ['Cotacao',     'veiculoId',   'Veiculo',     'text'],
    ['Cotacao',     'orcamentoId', 'Orcamento',   'text'],
    ['CotacaoPeca', 'cotacaoId',   'Cotacao',     'text'],
    ['CotacaoPeca', 'ofertaId',    'Oferta',      'text'],
    ['CotacaoLoja', 'cotacaoId',   'Cotacao',     'text'],
    ['Oferta',      'envioId',     'CotacaoLoja', 'text'],
    ['Oferta',      'pecaId',      'CotacaoPeca', 'text']
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF %I ON %I FOR EACH ROW EXECUTE FUNCTION mesma_oficina(%L, %L, %L)',
      vinculo[1] || '_' || vinculo[2] || '_mesma_oficina', vinculo[2], vinculo[1], vinculo[2], vinculo[3], vinculo[4]
    );
  END LOOP;

  FOREACH tabela IN ARRAY ARRAY['Cotacao', 'CotacaoPeca', 'CotacaoLoja', 'Oferta']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OF "oficinaId" ON %I FOR EACH ROW EXECUTE FUNCTION oficina_imutavel()',
      tabela || '_oficina_imutavel', tabela
    );
  END LOOP;
END $$;
