-- Oficina nova nasce nas cores do boxOS (amarelo + grafite) em vez do vermelho
-- original. Só muda o DEFAULT da coluna: as oficinas que já existem mantêm as
-- cores que têm hoje.
ALTER TABLE "Configuracao" ALTER COLUMN "corPrimaria" SET DEFAULT '#f2a900';
ALTER TABLE "Configuracao" ALTER COLUMN "corMenu" SET DEFAULT '#1e2329';
