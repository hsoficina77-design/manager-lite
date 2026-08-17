-- Orçamento vira rascunho: dá para passar preço antes de ter o cadastro do cliente.
--
-- clienteId e descricao deixam de ser obrigatórios; no lugar entram campos de texto
-- livre para identificar o orçamento enquanto não há cadastro. O cliente/veículo
-- reais continuam obrigatórios na conversão em OS.

ALTER TABLE "Orcamento" ALTER COLUMN "clienteId" DROP NOT NULL;
ALTER TABLE "Orcamento" ALTER COLUMN "descricao" DROP NOT NULL;

ALTER TABLE "Orcamento" ADD COLUMN "clienteNome" TEXT;
ALTER TABLE "Orcamento" ADD COLUMN "clienteTelefone" TEXT;
ALTER TABLE "Orcamento" ADD COLUMN "veiculoDesc" TEXT;

-- A relação passa de obrigatória para opcional: o Prisma espera SET NULL no lugar
-- do RESTRICT usado em relações obrigatórias.
ALTER TABLE "Orcamento" DROP CONSTRAINT "Orcamento_clienteId_fkey";
ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_clienteId_fkey"
  FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
