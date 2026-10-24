-- Peça Peça como produto à parte: a oficina pode existir só com o Peça Peça.
--
-- "boxosDesde" nula = só Peça Peça (cadastro grátis do domínio do Peça Peça). As
-- oficinas que já existem são todas do boxOS e recebem a data do próprio cadastro; o
-- default faz as novas (convite, teste grátis, instalação) nascerem com boxOS.
--
-- "veioDoPecaPeca" marca quem nasceu pelo cadastro do Peça Peça, e continua marcado
-- depois de ativar o boxOS — é o funil Peça Peça → boxOS do painel admin.

-- AlterTable
ALTER TABLE "Oficina" ADD COLUMN "boxosDesde" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Oficina" ADD COLUMN "veioDoPecaPeca" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Oficina" SET "boxosDesde" = "createdAt";
