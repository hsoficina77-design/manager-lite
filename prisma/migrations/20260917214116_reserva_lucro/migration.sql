-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "reservaLucroAtiva" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reservaLucroPercentual" DOUBLE PRECISION NOT NULL DEFAULT 10;
