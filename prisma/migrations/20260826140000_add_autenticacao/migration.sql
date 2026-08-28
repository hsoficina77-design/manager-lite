-- Autenticação: usuários com papel (ADMIN / OPERADOR) e sessões revogáveis.
--
-- Nenhum usuário é criado aqui de propósito. Com a tabela vazia o app abre a tela de
-- primeiro acesso, onde o dono cria o próprio admin escolhendo a senha — melhor do que
-- nascer com uma senha padrão que ninguém troca.

CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoAcesso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Sessao_usuarioId_idx" ON "Sessao"("usuarioId");

CREATE INDEX "Sessao_expiraEm_idx" ON "Sessao"("expiraEm");

ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_usuarioId_fkey"
    FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma acessa como dono das tabelas e o dono ignora RLS; habilitar sem policy
-- fecha a API REST pública do Supabase. Nunca usar FORCE aqui — e menos ainda nestas
-- duas tabelas, que guardam hash de senha e token de sessão.
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sessao" ENABLE ROW LEVEL SECURITY;
