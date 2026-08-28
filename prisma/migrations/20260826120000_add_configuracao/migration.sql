-- Painel de configurações: identidade, marca e tema da oficina.
--
-- Uma linha só (id "default"). O INSERT já nasce com os dados que até aqui estavam
-- escritos no código, então nada muda de aparência para quem já usa o sistema — a
-- diferença é que agora dá para editar pela tela.

CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nome" TEXT NOT NULL DEFAULT 'Minha Oficina',
    "nomeCurto" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "site" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "logoUrl" TEXT,
    "logoPath" TEXT,
    "corPrimaria" TEXT NOT NULL DEFAULT '#dc2626',
    "corMenu" TEXT NOT NULL DEFAULT '#09090b',
    "rodapeDocumento" TEXT,
    "mensagemDocumento" TEXT,
    "mostrarAssinatura" BOOLEAN NOT NULL DEFAULT true,
    "validadeOrcamentoDias" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- Prisma acessa como dono da tabela e o dono ignora RLS; habilitar sem policy
-- fecha a API REST pública do Supabase. Nunca usar FORCE aqui.
ALTER TABLE "Configuracao" ENABLE ROW LEVEL SECURITY;

INSERT INTO "Configuracao" (
    "id", "nome", "nomeCurto", "cnpj", "telefone", "logoUrl",
    "corPrimaria", "corMenu", "updatedAt"
) VALUES (
    'default',
    'HS Oficina Mecânica',
    'HS Oficina',
    '67.090.409/0001-17',
    '(11) 91330-4006',
    '/logo-hs.png',
    '#dc2626',
    '#09090b',
    CURRENT_TIMESTAMP
);
