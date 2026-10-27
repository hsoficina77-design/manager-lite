-- Uso pelo app instalado (aberto pelo ícone na tela ou na área de trabalho), à parte do
-- uso pelo navegador. Mede, no /admin, se o convite para instalar funciona.
--
-- Só colunas novas em tabelas que já existem: as políticas de RLS de "Usuario" e de
-- "UsuarioLoja" continuam valendo como estão.

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "appDesde" TIMESTAMP(3),
ADD COLUMN "ultimoAcessoApp" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UsuarioLoja" ADD COLUMN "appDesde" TIMESTAMP(3),
ADD COLUMN "ultimoAcessoApp" TIMESTAMP(3);
