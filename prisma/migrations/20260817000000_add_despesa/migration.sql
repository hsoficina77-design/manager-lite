-- Contas a Pagar: despesas da oficina (aluguel, salário, fornecedor...).
-- Despesas recorrentes geram automaticamente a próxima ocorrência ao serem pagas.

CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "pagoEm" TIMESTAMP(3),
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Despesa_pago_idx" ON "Despesa"("pago");

CREATE INDEX "Despesa_vencimento_idx" ON "Despesa"("vencimento");
