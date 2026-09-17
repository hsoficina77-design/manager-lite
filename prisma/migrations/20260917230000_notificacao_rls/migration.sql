-- A migração anterior criou "Notificacao" sem RLS — ficava exposta pela API pública
-- (PostgREST) do Supabase sem nenhuma policy, ao contrário de toda tabela nova desde
-- a migração `enable_rls`. Sem policy nenhuma, RLS nega tudo para anon/authenticated
-- sem afetar o Prisma (que acessa como dono e ignora RLS).
--
-- ATENÇÃO: não usar FORCE ROW LEVEL SECURITY — derrubaria o acesso do Prisma também.

ALTER TABLE "Notificacao" ENABLE ROW LEVEL SECURITY;
