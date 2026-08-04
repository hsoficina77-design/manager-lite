-- Bloqueia a API pública (PostgREST) do Supabase em todas as tabelas.
--
-- O app acessa o banco via Prisma, conectado como dono das tabelas — e o dono
-- ignora RLS. Habilitar RLS sem criar nenhuma policy nega tudo para os papéis
-- anon/authenticated (a API REST exposta na internet) sem afetar a aplicação.
--
-- ATENÇÃO: não usar FORCE ROW LEVEL SECURITY — isso aplicaria a trava também ao
-- dono e derrubaria o acesso do Prisma.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
