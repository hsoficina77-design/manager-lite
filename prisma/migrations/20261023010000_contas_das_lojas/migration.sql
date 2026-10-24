-- Contas de quem trabalha nas autopeças: o painel da loja no Peça Peça, com login e
-- níveis de acesso, no lugar do link secreto do balcão.
--
-- As três tabelas são do sistema, como "Loja": RLS ligada só para fechar a API pública
-- do Supabase, e nenhum GRANT para app_oficina — quem lê e grava é o código do sistema
-- (lib/conta-loja.ts), como dono das tabelas.

-- CreateTable
CREATE TABLE "UsuarioLoja" (
    "id" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoLoja" (
    "id" TEXT NOT NULL,
    "usuarioLojaId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "SessaoLoja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConviteLoja" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lojaId" TEXT NOT NULL,
    "usuarioLojaId" TEXT,
    "nome" TEXT,
    "email" TEXT,
    "perfil" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "permissoes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConviteLoja_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "CotacaoLoja" ADD COLUMN "respondidoPor" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioLoja_email_key" ON "UsuarioLoja"("email");

-- CreateIndex
CREATE INDEX "UsuarioLoja_lojaId_idx" ON "UsuarioLoja"("lojaId");

-- CreateIndex
CREATE INDEX "SessaoLoja_usuarioLojaId_idx" ON "SessaoLoja"("usuarioLojaId");

-- CreateIndex
CREATE INDEX "SessaoLoja_expiraEm_idx" ON "SessaoLoja"("expiraEm");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteLoja_tokenHash_key" ON "ConviteLoja"("tokenHash");

-- CreateIndex
CREATE INDEX "ConviteLoja_lojaId_createdAt_idx" ON "ConviteLoja"("lojaId", "createdAt");

-- AddForeignKey
ALTER TABLE "UsuarioLoja" ADD CONSTRAINT "UsuarioLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoLoja" ADD CONSTRAINT "SessaoLoja_usuarioLojaId_fkey" FOREIGN KEY ("usuarioLojaId") REFERENCES "UsuarioLoja"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConviteLoja" ADD CONSTRAINT "ConviteLoja_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "Loja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS sem policy: fecha a API pública. Nunca FORCE — o app conecta como dono.
ALTER TABLE "UsuarioLoja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SessaoLoja" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConviteLoja" ENABLE ROW LEVEL SECURITY;
