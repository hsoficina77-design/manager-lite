-- DropForeignKey
ALTER TABLE "DividaAvulsa" DROP CONSTRAINT "DividaAvulsa_clienteId_fkey";

-- AlterTable
ALTER TABLE "DividaAvulsa" ADD COLUMN     "devedorNome" TEXT,
ALTER COLUMN "clienteId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "DividaAvulsa_clienteId_idx" ON "DividaAvulsa"("clienteId");

-- AddForeignKey
ALTER TABLE "DividaAvulsa" ADD CONSTRAINT "DividaAvulsa_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
