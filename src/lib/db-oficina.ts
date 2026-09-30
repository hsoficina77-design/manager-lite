// Acesso ao banco de UMA oficina — a trava 1 do isolamento (ver o topo do schema).
//
// Toda rota e tela que mexe em dado de oficina recebe um `Db` daqui, já amarrado à
// oficina de quem está logado (`guardaApi`/`exigirUsuario` entregam pronto). Ele faz
// duas coisas em cada operação:
//
//   1. Filtro no código: acrescenta `oficinaId` ao `where` de toda leitura, alteração e
//      exclusão. `findUnique({ where: { id } })` de um id de outra oficina volta `null`,
//      como se o registro não existisse — e não existe, para quem está perguntando.
//
//   2. RLS no banco: abre a transação como o papel `app_oficina`, com a oficina em
//      `app.oficina_id`. O Postgres passa a filtrar sozinho (trava 3) e o `oficinaId`
//      de toda linha criada sai do default da coluna — inclusive as aninhadas, como os
//      itens criados junto com a OS. Se o banco não tiver o papel, só a oficina é
//      definida e a trava 3 fica desligada, com aviso no log (ver `verificarRls`).
//
// O cliente cru (`@/lib/prisma`) passa por cima das duas coisas. Ele fica restrito a
// login, sessão, cadastro de oficina e plataforma — `scripts/checar-isolamento.mjs`
// barra o build se alguém importá-lo em outro lugar.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Tabelas do sistema: não pertencem a oficina nenhuma e não passam por aqui. */
const MODELOS_DO_SISTEMA = new Set(["Oficina", "Convite", "Sessao"]);

/** Operações cujo `where` recebe a oficina. */
const COM_WHERE = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
]);

type Args = Record<string, unknown> & { where?: Record<string, unknown> };

/** Recusa gravação que tente, explicitamente, marcar o registro com outra oficina. */
function conferirOficinaDosDados(dados: unknown, oficinaId: string, modelo: string) {
  const linhas = Array.isArray(dados) ? dados : [dados];
  for (const linha of linhas) {
    if (linha && typeof linha === "object" && "oficinaId" in linha) {
      const informada = (linha as { oficinaId?: unknown }).oficinaId;
      if (informada !== undefined && informada !== oficinaId) {
        throw new Error(`Gravação em ${modelo} com oficinaId de outra oficina foi recusada`);
      }
    }
  }
}

function filtrar(modelo: string, operacao: string, args: Args | undefined, oficinaId: string): Args {
  if (MODELOS_DO_SISTEMA.has(modelo)) {
    throw new Error(`${modelo} é tabela do sistema e não pode ser acessada pelo banco da oficina`);
  }

  const filtrados: Args = { ...(args ?? {}) };

  if (COM_WHERE.has(operacao)) {
    // A oficina sobrescreve qualquer `oficinaId` que viesse no where: não há como uma
    // rota pedir, nem por engano, dado de outra oficina.
    filtrados.where = { ...(filtrados.where ?? {}), oficinaId };
  }

  if ("data" in filtrados) conferirOficinaDosDados(filtrados.data, oficinaId, modelo);
  if ("create" in filtrados) conferirOficinaDosDados(filtrados.create, oficinaId, modelo);
  if ("update" in filtrados) conferirOficinaDosDados(filtrados.update, oficinaId, modelo);

  return filtrados;
}

/**
 * A trava 3 (RLS) está disponível neste banco?
 *
 * A migração que cria o papel `app_oficina` é tolerante: se o banco recusar criar o
 * papel ou conceder a membresia (privilégios variam entre instalações), ela segue sem
 * ele. Aqui se descobre isso uma vez, na primeira consulta, em vez de cada operação
 * da oficina falhar com "permission denied to set role" e derrubar o sistema.
 *
 * Sem o papel, o sistema segue com as travas 1 (filtro) e 2 (gatilhos) e avisa no log.
 * Erro que não seja de papel/permissão (banco fora do ar) não decide nada: o cache é
 * descartado e a próxima operação tenta de novo.
 */
let rlsDisponivel: Promise<boolean> | null = null;

function verificarRls(): Promise<boolean> {
  rlsDisponivel ??= prisma
    .$transaction([prisma.$executeRaw`SELECT set_config('role', 'app_oficina', true)`])
    .then(() => true)
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (/app_oficina|permission denied to set role|must be able to SET ROLE/i.test(msg)) {
        console.warn(
          "[isolamento] RLS por oficina DESLIGADA: o papel app_oficina não está disponível " +
            "para esta conexão. As travas 1 (filtro) e 2 (gatilhos) seguem ativas. " +
            `Detalhe: ${msg.trim().split(/\r?\n/).pop()}`
        );
        return false;
      }
      rlsDisponivel = null;
      throw err;
    });
  return rlsDisponivel;
}

/** Abre a transação como a oficina: id da oficina e, se disponível, o papel sem bypass de RLS. */
function entrarNaOficina(oficinaId: string, comRls: boolean) {
  // Os `true` tornam os valores locais à transação: somem no COMMIT e não contaminam a
  // próxima requisição que pegar esta conexão do pool. O `app.oficina_id` vale mesmo
  // sem RLS — é dele que sai o default do `oficinaId` nas linhas criadas.
  return comRls
    ? Prisma.sql`SELECT set_config('role', 'app_oficina', true), set_config('app.oficina_id', ${oficinaId}, true)`
    : Prisma.sql`SELECT set_config('app.oficina_id', ${oficinaId}, true)`;
}

function criarFiltrado(oficinaId: string) {
  return prisma.$extends({
    name: "filtro-da-oficina",
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          return query(filtrar(model, operation, args as Args, oficinaId));
        },
      },
    },
  });
}

type Filtrado = ReturnType<typeof criarFiltrado>;

/**
 * O banco visto por uma oficina.
 *
 * Sem `$transaction` (use `transacao`), sem SQL cru e sem as tabelas do sistema — são
 * as portas por onde daria para sair do filtro. Fechá-las no tipo faz o erro aparecer
 * no editor, e não em produção.
 */
export type Db = Omit<
  Filtrado,
  | "$transaction"
  | "$extends"
  | "$connect"
  | "$disconnect"
  | "$on"
  | "$use"
  | "$queryRaw"
  | "$executeRaw"
  | "$queryRawUnsafe"
  | "$executeRawUnsafe"
  | "$metrics"
  | "oficina"
  | "convite"
  | "sessao"
>;

export type OpcoesTransacao = { maxWait?: number; timeout?: number };

export type BancoDaOficina = {
  oficinaId: string;
  /** Operações avulsas: cada uma roda na sua própria transação, já dentro da oficina. */
  db: Db;
  /** Várias operações atômicas. Substitui o `prisma.$transaction(async (tx) => …)`. */
  transacao: <T>(fn: (tx: Db) => Promise<T>, opcoes?: OpcoesTransacao) => Promise<T>;
};

function criarBanco(oficinaId: string): BancoDaOficina {
  const filtrado = criarFiltrado(oficinaId);

  // Operação avulsa: [entrar na oficina, operação] numa transação curta. É o padrão
  // da documentação do Prisma para RLS — a variável precisa estar na mesma transação
  // que a consulta, senão o pool pode entregar outra conexão.
  const db = filtrado.$extends({
    name: "rls-da-oficina",
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const comRls = await verificarRls();
          const [, resultado] = await prisma.$transaction([
            prisma.$executeRaw(entrarNaOficina(oficinaId, comRls)),
            query(args),
          ]);
          return resultado;
        },
      },
    },
  });

  // Dentro de uma transação interativa, a oficina é definida uma vez no começo e vale
  // até o fim. O `tx` vem do cliente filtrado (e não de `db`): a extensão de RLS abriria
  // uma transação separada por operação, fora desta.
  const transacao = async <T>(fn: (tx: Db) => Promise<T>, opcoes?: OpcoesTransacao) => {
    const comRls = await verificarRls();
    return filtrado.$transaction(async (tx) => {
      await tx.$executeRaw(entrarNaOficina(oficinaId, comRls));
      return fn(tx as unknown as Db);
    }, opcoes);
  };

  return { oficinaId, db: db as unknown as Db, transacao };
}

/**
 * O registro pedido não existe — para quem pergunta. Com o filtro da oficina, um id de
 * outra oficina cai aqui igual a um id inventado (P2025 do Prisma em update/delete), e
 * a rota deve responder 404, nunca 500.
 */
export function registroNaoEncontrado(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2025";
}

// Um por oficina, reaproveitado entre requisições. `$extends` é barato, mas não há
// motivo para refazê-lo a cada chamada. O teto só existe para a memória não crescer
// sem limite com muitas oficinas — passar dele apenas recomeça o cache.
const LIMITE_CACHE = 1000;
const cache = new Map<string, BancoDaOficina>();

/** Banco da oficina `oficinaId`. Quem chama garante que o id veio da sessão. */
export function bancoDaOficina(oficinaId: string): BancoDaOficina {
  if (!oficinaId) throw new Error("bancoDaOficina: oficina ausente");
  let banco = cache.get(oficinaId);
  if (!banco) {
    if (cache.size >= LIMITE_CACHE) cache.clear();
    banco = criarBanco(oficinaId);
    cache.set(oficinaId, banco);
  }
  return banco;
}
