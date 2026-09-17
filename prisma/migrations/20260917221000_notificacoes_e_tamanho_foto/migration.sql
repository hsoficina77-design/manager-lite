-- AlterTable
ALTER TABLE "FotoOS" ADD COLUMN     "tamanhoBytes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "link" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "lidaEm" TIMESTAMP(3),
    "publico" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacao_lida_createdAt_idx" ON "Notificacao"("lida", "createdAt");

-- CreateIndex
CREATE INDEX "Notificacao_publico_lida_idx" ON "Notificacao"("publico", "lida");
