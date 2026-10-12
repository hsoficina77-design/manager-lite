-- A plataforma passa a ter conta própria (contato.boxos77@gmail.com), que entra no
-- painel admin (/admin). A flag sai de todas as outras contas — a HS vira só oficina.
--
-- Se a conta ainda não existir, ninguém fica com a flag até ela ser criada: o cadastro
-- (convite ou link da bio) com esse e-mail já nasce administrando a plataforma
-- (`EMAIL_PLATAFORMA` em src/lib/sistema.ts).
UPDATE "Usuario" SET "administraPlataforma" = ("email" = 'contato.boxos77@gmail.com');
