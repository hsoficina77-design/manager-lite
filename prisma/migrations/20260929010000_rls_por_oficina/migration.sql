-- Trava 3 do isolamento entre oficinas: RLS de verdade.
--
-- Até aqui a RLS só fechava a API pública do Supabase (nenhuma policy = nega tudo
-- para anon/authenticated), e o Prisma, conectado como dono das tabelas, passava por
-- cima dela. Continua assim para o que é do sistema (login, cadastro, plataforma).
--
-- O que é de oficina passa a rodar como o papel "app_oficina": a aplicação abre cada
-- transação com
--
--     set_config('role', 'app_oficina', true)
--     set_config('app.oficina_id', '<id>', true)
--
-- e, a partir daí, o próprio Postgres só mostra — e só aceita gravar — linhas daquela
-- oficina. Mesmo que o código esqueça um filtro, a consulta volta vazia em vez de
-- trazer dado de outra oficina. Os dois valores são locais à transação (`true`), então
-- não vazam para a próxima requisição que pegar a mesma conexão do pool.
--
-- Tolerante de propósito: criar papel e conceder a membresia dependem de privilégios
-- que variam entre instalações (no Supabase o usuário `postgres` não é superusuário).
-- Se algum passo for recusado, a migração segue com um WARNING e o sistema funciona
-- com as travas 1 e 2 — `lib/db-oficina.ts` testa o papel ao subir e só o usa se
-- estiver disponível, avisando no log quando não está. Uma migração que falhasse aqui
-- deixaria a oficina fora do ar no deploy, o que é pior que ficar sem a terceira trava.
--
-- ATENÇÃO (continua valendo): nunca FORCE ROW LEVEL SECURITY. O dono das tabelas
-- precisa continuar passando, senão login e migrações param.
--
-- Tabela nova de dados de oficina precisa, na migração que a cria: ENABLE RLS, a
-- policy "oficina_isolada" e o GRANT para app_oficina — senão a aplicação recebe
-- "permission denied" (fechado por padrão, que é o lado certo de errar).

DO $$
DECLARE
  tabela text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_oficina') THEN
    BEGIN
      CREATE ROLE app_oficina NOLOGIN NOBYPASSRLS;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'RLS por oficina desligada: não foi possível criar o papel app_oficina (%)', SQLERRM;
      RETURN;
    END;
  END IF;

  -- A conexão da aplicação precisa poder assumir o papel.
  BEGIN
    EXECUTE format('GRANT app_oficina TO %I', current_user);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'RLS por oficina desligada: não foi possível conceder app_oficina a % (%)', current_user, SQLERRM;
  END;

  GRANT USAGE ON SCHEMA public TO app_oficina;
  -- Dívida avulsa e pagamento de dívida têm id sequencial.
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_oficina;

  FOREACH tabela IN ARRAY ARRAY[
    'Cliente', 'Veiculo', 'OrdemServico', 'Mecanico', 'Meta', 'Orcamento',
    'ItemOrcamento', 'ItemOrdem', 'Produto', 'MovimentoEstoque', 'PagamentoOS',
    'DividaAvulsa', 'PagamentoDivida', 'FotoOS', 'Sequencia', 'Usuario',
    'RegistroExclusao', 'Configuracao', 'Notificacao', 'CategoriaDespesa',
    'DespesaRecorrente', 'Despesa'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tabela);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_oficina', tabela);
    EXECUTE format(
      'CREATE POLICY oficina_isolada ON %I TO app_oficina '
      'USING ("oficinaId" = current_setting(%L, true)) '
      'WITH CHECK ("oficinaId" = current_setting(%L, true))',
      tabela, 'app.oficina_id', 'app.oficina_id'
    );
  END LOOP;
END $$;

-- "Oficina", "Convite" e "Sessao" ficam de fora de propósito: nenhuma permissão para
-- app_oficina. Quem mexe nelas é o código do sistema, como dono das tabelas.
