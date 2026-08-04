-- CreateTable
CREATE TABLE "FotoOS" (
    "id" TEXT NOT NULL,
    "ordemId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "legenda" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FotoOS_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FotoOS_ordemId_idx" ON "FotoOS"("ordemId");

-- AddForeignKey
ALTER TABLE "FotoOS" ADD CONSTRAINT "FotoOS_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
