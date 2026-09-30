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
-- ATENÇÃO (continua valendo): nunca FORCE ROW LEVEL SECURITY. O dono das tabelas
-- precisa continuar passando, senão login e migrações param.
--
-- Tabela nova de dados de oficina precisa, na migração que a cria: ENABLE RLS, a
-- policy "oficina_isolada" e o GRANT para app_oficina — senão a aplicação recebe
-- "permission denied" (fechado por padrão, que é o lado certo de errar).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_oficina') THEN
    CREATE ROLE app_oficina NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

-- A conexão da aplicação precisa poder assumir o papel.
GRANT app_oficina TO CURRENT_USER;

GRANT USAGE ON SCHEMA public TO app_oficina;

-- Dívida avulsa e pagamento de dívida têm id sequencial.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_oficina;

DO $$
DECLARE
  tabela text;
BEGIN
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
