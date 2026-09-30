-- Multi-oficina: cada registro passa a pertencer a uma oficina.
--
-- Até aqui o sistema servia uma oficina só. Esta migração cria a tabela "Oficina",
-- carimba tudo o que já existe como a oficina nº 1 (id fixo 'oficina-1') e só então
-- torna a coluna obrigatória — nenhum dado muda de lugar ou se perde.
--
-- Duas das três travas de isolamento nascem aqui (a terceira, RLS, vem na migração
-- seguinte):
--
--   * DEFAULT current_setting('app.oficina_id', true) em todo "oficinaId": a aplicação
--     define a oficina no começo de cada transação, e qualquer INSERT — inclusive os
--     aninhados, como os itens criados junto com a OS — sai marcado com ela. Sem a
--     variável, o default é NULL e o NOT NULL recusa a gravação: fechado por padrão.
--
--   * Gatilhos "mesma oficina": um registro só pode apontar para outro da mesma
--     oficina (OS → cliente, item → OS, pagamento → dívida…). Ficam em gatilho, e não
--     em chave estrangeira composta, porque o Prisma não expressa FK composta em
--     relação opcional e apagaria uma FK que não conhece na próxima migração gerada.
--     Gatilho ele não enxerga — então não desfaz.

-- ─── Oficina e convite ───────────────────────────────────────────────────────

CREATE TABLE "Oficina" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oficina_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Convite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "nomeOficina" TEXT,
    "email" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "oficinaId" TEXT,
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Convite_tokenHash_key" ON "Convite"("tokenHash");
CREATE INDEX "Convite_createdAt_idx" ON "Convite"("createdAt");
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Toda tabela nova fecha a API pública do Supabase (ver migração enable_rls).
-- Nunca FORCE: derrubaria o acesso do próprio dono das tabelas.
ALTER TABLE "Oficina" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Convite" ENABLE ROW LEVEL SECURITY;

-- A oficina que já usava o sistema. O nome vem da configuração, se houver.
INSERT INTO "Oficina" ("id", "nome", "updatedAt")
SELECT 'oficina-1',
       COALESCE((SELECT NULLIF(TRIM("nome"), '') FROM "Configuracao" WHERE "id" = 'default'), 'Minha Oficina'),
       CURRENT_TIMESTAMP;

-- ─── oficinaId em toda tabela de dados ───────────────────────────────────────
--
-- ADD COLUMN com DEFAULT constante não reescreve a tabela (Postgres 11+), e já
-- preenche as linhas antigas com a oficina nº 1. Depois o default passa a ser o da
-- transação.

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'Cliente', 'Veiculo', 'OrdemServico', 'Mecanico', 'Meta', 'Orcamento',
    'ItemOrcamento', 'ItemOrdem', 'Produto', 'MovimentoEstoque', 'PagamentoOS',
    'DividaAvulsa', 'PagamentoDivida', 'FotoOS', 'Sequencia', 'Usuario',
    'RegistroExclusao', 'Configuracao', 'Notificacao', 'CategoriaDespesa',
    'DespesaRecorrente', 'Despesa'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN "oficinaId" TEXT NOT NULL DEFAULT %L', tabela, 'oficina-1');
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "oficinaId" SET DEFAULT current_setting(%L, true)', tabela, 'app.oficina_id');
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE',
      tabela, tabela || '_oficinaId_fkey'
    );
  END LOOP;
END $$;

-- Configuração: deixa de ser a linha única "default" e passa a ser uma por oficina.
ALTER TABLE "Configuracao" DROP CONSTRAINT "Configuracao_pkey";
ALTER TABLE "Configuracao" DROP COLUMN "id";
ALTER TABLE "Configuracao" ADD CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("oficinaId");

-- Numeração: um contador por oficina e por documento.
ALTER TABLE "Sequencia" DROP CONSTRAINT "Sequencia_pkey";
ALTER TABLE "Sequencia" ADD CONSTRAINT "Sequencia_pkey" PRIMARY KEY ("oficinaId", "id");

-- Dono da plataforma: quem gera convites. Nasce com o primeiro dono cadastrado.
ALTER TABLE "Usuario" ADD COLUMN "administraPlataforma" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Usuario" SET "administraPlataforma" = true
WHERE "id" = (SELECT "id" FROM "Usuario" WHERE "papel" = 'ADMIN' ORDER BY "createdAt" LIMIT 1);

-- ─── Unicidade por oficina ───────────────────────────────────────────────────
--
-- Número de OS, placa, CPF, código de peça e nome de categoria só não podem se
-- repetir dentro da mesma oficina. Duas oficinas atendem o mesmo carro sem conflito.

DROP INDEX "Cliente_cpfCnpj_key";
DROP INDEX "Veiculo_placa_key";
DROP INDEX "OrdemServico_numero_key";
DROP INDEX "Orcamento_numero_key";
DROP INDEX "Produto_codigo_key";
DROP INDEX "CategoriaDespesa_nome_key";

CREATE UNIQUE INDEX "Cliente_oficinaId_cpfCnpj_key" ON "Cliente"("oficinaId", "cpfCnpj");
CREATE UNIQUE INDEX "Veiculo_oficinaId_placa_key" ON "Veiculo"("oficinaId", "placa");
CREATE UNIQUE INDEX "OrdemServico_oficinaId_numero_key" ON "OrdemServico"("oficinaId", "numero");
CREATE UNIQUE INDEX "Orcamento_oficinaId_numero_key" ON "Orcamento"("oficinaId", "numero");
CREATE UNIQUE INDEX "Produto_oficinaId_codigo_key" ON "Produto"("oficinaId", "codigo");
CREATE UNIQUE INDEX "CategoriaDespesa_oficinaId_nome_key" ON "CategoriaDespesa"("oficinaId", "nome");

-- ─── Índices: a oficina vem na frente ────────────────────────────────────────
--
-- Toda consulta passa a filtrar por oficina, então os índices de lista (status,
-- competência, lida…) ganham "oficinaId" como primeira coluna.

DROP INDEX "OrdemServico_status_idx";
DROP INDEX "OrdemServico_pago_idx";
DROP INDEX "Orcamento_status_idx";
DROP INDEX "Produto_ativo_nome_idx";
DROP INDEX "RegistroExclusao_createdAt_idx";
DROP INDEX "Notificacao_lida_createdAt_idx";
DROP INDEX "Notificacao_publico_lida_idx";
DROP INDEX "CategoriaDespesa_ativa_ordem_idx";
DROP INDEX "DespesaRecorrente_ativa_idx";
DROP INDEX "Despesa_competencia_idx";
DROP INDEX "Despesa_pago_idx";
DROP INDEX "Despesa_vencimento_idx";

CREATE INDEX "OrdemServico_oficinaId_status_idx" ON "OrdemServico"("oficinaId", "status");
CREATE INDEX "OrdemServico_oficinaId_pago_idx" ON "OrdemServico"("oficinaId", "pago");
CREATE INDEX "Orcamento_oficinaId_status_idx" ON "Orcamento"("oficinaId", "status");
CREATE INDEX "Produto_oficinaId_ativo_nome_idx" ON "Produto"("oficinaId", "ativo", "nome");
CREATE INDEX "RegistroExclusao_oficinaId_createdAt_idx" ON "RegistroExclusao"("oficinaId", "createdAt");
CREATE INDEX "Notificacao_oficinaId_lida_createdAt_idx" ON "Notificacao"("oficinaId", "lida", "createdAt");
CREATE INDEX "Notificacao_oficinaId_publico_lida_idx" ON "Notificacao"("oficinaId", "publico", "lida");
CREATE INDEX "CategoriaDespesa_oficinaId_ativa_ordem_idx" ON "CategoriaDespesa"("oficinaId", "ativa", "ordem");
CREATE INDEX "DespesaRecorrente_oficinaId_ativa_idx" ON "DespesaRecorrente"("oficinaId", "ativa");
CREATE INDEX "Despesa_oficinaId_competencia_idx" ON "Despesa"("oficinaId", "competencia");
CREATE INDEX "Despesa_oficinaId_pago_idx" ON "Despesa"("oficinaId", "pago");
CREATE INDEX "Despesa_oficinaId_vencimento_idx" ON "Despesa"("oficinaId", "vencimento");

CREATE INDEX "Cliente_oficinaId_idx" ON "Cliente"("oficinaId");
CREATE INDEX "Veiculo_oficinaId_idx" ON "Veiculo"("oficinaId");
CREATE INDEX "Veiculo_clienteId_idx" ON "Veiculo"("clienteId");
CREATE INDEX "Mecanico_oficinaId_idx" ON "Mecanico"("oficinaId");
CREATE INDEX "Meta_oficinaId_idx" ON "Meta"("oficinaId");
CREATE INDEX "ItemOrcamento_oficinaId_idx" ON "ItemOrcamento"("oficinaId");
CREATE INDEX "ItemOrcamento_orcamentoId_idx" ON "ItemOrcamento"("orcamentoId");
CREATE INDEX "ItemOrdem_oficinaId_idx" ON "ItemOrdem"("oficinaId");
CREATE INDEX "ItemOrdem_ordemId_idx" ON "ItemOrdem"("ordemId");
CREATE INDEX "MovimentoEstoque_oficinaId_idx" ON "MovimentoEstoque"("oficinaId");
CREATE INDEX "PagamentoOS_oficinaId_idx" ON "PagamentoOS"("oficinaId");
CREATE INDEX "DividaAvulsa_oficinaId_idx" ON "DividaAvulsa"("oficinaId");
CREATE INDEX "PagamentoDivida_oficinaId_idx" ON "PagamentoDivida"("oficinaId");
CREATE INDEX "PagamentoDivida_dividaId_idx" ON "PagamentoDivida"("dividaId");
CREATE INDEX "FotoOS_oficinaId_idx" ON "FotoOS"("oficinaId");
CREATE INDEX "Usuario_oficinaId_idx" ON "Usuario"("oficinaId");

-- ─── Trava 2: vínculo só dentro da mesma oficina ─────────────────────────────
--
-- mesma_oficina(coluna, tabela_pai): confere que o registro apontado por NEW.<coluna>
-- é da mesma oficina que NEW. Referência nula passa (relação opcional), e pai
-- inexistente também — quem reclama disso é a chave estrangeira, com a mensagem certa.
--
-- SECURITY DEFINER para enxergar o pai mesmo com RLS ligada: o gatilho precisa ver a
-- oficina *verdadeira* do pai para recusar, e não só "não achei".

CREATE FUNCTION mesma_oficina() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coluna      text := TG_ARGV[0];
  tabela_pai  text := TG_ARGV[1];
  referencia  text := to_jsonb(NEW) ->> coluna;
  oficina_pai text;
BEGIN
  IF referencia IS NULL THEN
    RETURN NEW;
  END IF;

  -- O tipo do id (3º argumento, 'text' se omitido) entra no cast do parâmetro, e não
  -- da coluna — assim a busca usa a chave primária também quando o id é inteiro.
  EXECUTE format('SELECT "oficinaId" FROM %I WHERE "id" = $1::%s', tabela_pai, COALESCE(TG_ARGV[2], 'text'))
    INTO oficina_pai
    USING referencia;

  IF oficina_pai IS NOT NULL AND oficina_pai IS DISTINCT FROM NEW."oficinaId" THEN
    RAISE EXCEPTION 'Vínculo entre oficinas recusado: %.% aponta para % de outra oficina',
      TG_TABLE_NAME, coluna, tabela_pai
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  RETURN NEW;
END $$;

-- A oficina de um registro não muda depois de criado. Mover dados entre oficinas, se
-- um dia for preciso, é operação de manutenção — nunca efeito colateral de um UPDATE.
CREATE FUNCTION oficina_imutavel() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."oficinaId" IS DISTINCT FROM OLD."oficinaId" THEN
    RAISE EXCEPTION 'A oficina de um registro de % não pode ser trocada', TG_TABLE_NAME
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE
  vinculo text[];
  tabela  text;
BEGIN
  -- {tabela, coluna, tabela_pai, tipo do id do pai}
  FOREACH vinculo SLICE 1 IN ARRAY ARRAY[
    ['Veiculo',           'clienteId',    'Cliente', 'text'],
    ['OrdemServico',      'clienteId',    'Cliente', 'text'],
    ['OrdemServico',      'veiculoId',    'Veiculo', 'text'],
    ['OrdemServico',      'mecanicoId',   'Mecanico', 'text'],
    ['Meta',              'mecanicoId',   'Mecanico', 'text'],
    ['Orcamento',         'clienteId',    'Cliente', 'text'],
    ['Orcamento',         'veiculoId',    'Veiculo', 'text'],
    ['Orcamento',         'ordemId',      'OrdemServico', 'text'],
    ['ItemOrcamento',     'orcamentoId',  'Orcamento', 'text'],
    ['ItemOrcamento',     'produtoId',    'Produto', 'text'],
    ['ItemOrdem',         'ordemId',      'OrdemServico', 'text'],
    ['ItemOrdem',         'produtoId',    'Produto', 'text'],
    ['MovimentoEstoque',  'produtoId',    'Produto', 'text'],
    ['MovimentoEstoque',  'ordemId',      'OrdemServico', 'text'],
    ['PagamentoOS',       'ordemId',      'OrdemServico', 'text'],
    ['DividaAvulsa',      'clienteId',    'Cliente', 'text'],
    ['PagamentoDivida',   'dividaId',     'DividaAvulsa', 'integer'],
    ['FotoOS',            'ordemId',      'OrdemServico', 'text'],
    ['FotoOS',            'orcamentoId',  'Orcamento', 'text'],
    ['RegistroExclusao',  'usuarioId',    'Usuario', 'text'],
    ['DespesaRecorrente', 'categoriaId',  'CategoriaDespesa', 'text'],
    ['Despesa',           'categoriaId',  'CategoriaDespesa', 'text'],
    ['Despesa',           'recorrenteId', 'DespesaRecorrente', 'text']
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE INSERT OR UPDATE OF %I ON %I FOR EACH ROW EXECUTE FUNCTION mesma_oficina(%L, %L, %L)',
      vinculo[1] || '_' || vinculo[2] || '_mesma_oficina', vinculo[2], vinculo[1], vinculo[2], vinculo[3], vinculo[4]
    );
  END LOOP;

  FOREACH tabela IN ARRAY ARRAY[
    'Cliente', 'Veiculo', 'OrdemServico', 'Mecanico', 'Meta', 'Orcamento',
    'ItemOrcamento', 'ItemOrdem', 'Produto', 'MovimentoEstoque', 'PagamentoOS',
    'DividaAvulsa', 'PagamentoDivida', 'FotoOS', 'Sequencia', 'Usuario',
    'RegistroExclusao', 'Configuracao', 'Notificacao', 'CategoriaDespesa',
    'DespesaRecorrente', 'Despesa'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OF "oficinaId" ON %I FOR EACH ROW EXECUTE FUNCTION oficina_imutavel()',
      tabela || '_oficina_imutavel', tabela
    );
  END LOOP;
END $$;
