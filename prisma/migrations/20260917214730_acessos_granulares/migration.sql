-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "podeExcluir" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "podeFinanceiro" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RegistroExclusao" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroExclusao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistroExclusao_createdAt_idx" ON "RegistroExclusao"("createdAt");

-- AddForeignKey
ALTER TABLE "RegistroExclusao" ADD CONSTRAINT "RegistroExclusao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tabela nova: fecha a API REST pública do Supabase sem policy. Nunca usar FORCE.
ALTER TABLE "RegistroExclusao" ENABLE ROW LEVEL SECURITY;
