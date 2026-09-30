// Operações do sistema — as poucas que, por natureza, olham além de uma oficina.
//
// Criar uma oficina (ela ainda não existe, então não há banco "dela" para usar),
// abrir sessão, e o painel da plataforma. Tudo aqui usa o cliente Prisma cru, que
// passa por cima do filtro de oficina e da RLS: por isso este arquivo está na lista
// curta de `scripts/checar-isolamento.mjs`, e nada daqui devolve dado de dentro de
// uma oficina (cliente, OS, dinheiro) — só a casca: nome, situação, contagens.

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DURACAO_MS, assinarToken, novoIdDeSessao, opcoesDoCookie, COOKIE_SESSAO } from "@/lib/sessao";

/** Categorias de despesa com que toda oficina nasce. O dono edita depois. */
const CATEGORIAS_PADRAO = [
  { nome: "Aluguel", cor: "#6366f1", ordem: 10 },
  { nome: "Salário", cor: "#0ea5e9", ordem: 20 },
  { nome: "Fornecedor", cor: "#14b8a6", ordem: 30 },
  { nome: "Energia", cor: "#f59e0b", ordem: 40 },
  { nome: "Água", cor: "#38bdf8", ordem: 50 },
  { nome: "Internet", cor: "#8b5cf6", ordem: 60 },
  { nome: "Imposto", cor: "#ef4444", ordem: 70 },
  { nome: "Manutenção", cor: "#84cc16", ordem: 80 },
  { nome: "Outros", cor: "#71717a", ordem: 90 },
];

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Cria a oficina, a configuração dela, as categorias padrão e o dono — tudo ou nada.
 *
 * Roda dentro da transação de quem chama (convite, primeiro acesso), para que a
 * checagem que autoriza o cadastro e a criação aconteçam juntas. O `oficinaId` vai
 * explícito em cada linha: aqui não há `app.oficina_id` na transação para o default
 * da coluna preencher.
 */
export async function criarOficinaComDono(
  tx: Tx,
  dados: {
    nomeOficina: string;
    nome: string;
    email: string;
    senhaHash: string;
    administraPlataforma?: boolean;
  }
) {
  const oficina = await tx.oficina.create({ data: { nome: dados.nomeOficina } });

  await tx.configuracao.create({ data: { oficinaId: oficina.id, nome: dados.nomeOficina } });
  await tx.categoriaDespesa.createMany({
    data: CATEGORIAS_PADRAO.map((c) => ({ ...c, oficinaId: oficina.id })),
  });

  const usuario = await tx.usuario.create({
    data: {
      oficinaId: oficina.id,
      nome: dados.nome,
      email: dados.email,
      senhaHash: dados.senhaHash,
      papel: "ADMIN",
      administraPlataforma: dados.administraPlataforma ?? false,
    },
  });

  return { oficina, usuario };
}

/** Abre a sessão e grava o cookie. Usado pelo login, pelo primeiro acesso e pelo convite. */
export async function abrirSessao(
  usuario: { id: string; papel: string; podeFinanceiro: boolean; podeExcluir: boolean },
  request: Request
) {
  const sessaoId = novoIdDeSessao();
  const expiraEm = new Date(Date.now() + DURACAO_MS);

  await prisma.sessao.create({
    data: {
      id: sessaoId,
      usuarioId: usuario.id,
      expiraEm,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  const ehDono = usuario.papel === "ADMIN";
  const token = await assinarToken(
    sessaoId,
    expiraEm,
    usuario.papel,
    ehDono || usuario.podeFinanceiro,
    ehDono || usuario.podeExcluir
  );
  (await cookies()).set(COOKIE_SESSAO, token, opcoesDoCookie(expiraEm));

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } });

  // Faxina barata das sessões vencidas, aproveitando que já estamos no banco.
  prisma.sessao
    .deleteMany({ where: { expiraEm: { lt: new Date() } } })
    .catch((err: unknown) => console.error("Falha ao limpar sessões vencidas:", err));
}

/** Ainda não existe ninguém — a instalação está vazia e aceita o primeiro dono. */
export async function sistemaVazio(): Promise<boolean> {
  return (await prisma.usuario.count()) === 0;
}

/** Dá acesso à criação do primeiro dono, dentro de uma transação serializável. */
export function transacaoDoSistema<T>(fn: (tx: Tx) => Promise<T>) {
  return prisma.$transaction(fn, { isolationLevel: "Serializable" });
}

// ─── Convites ────────────────────────────────────────────────────────────────

/** 14 dias: tempo de a pessoa abrir a mensagem sem o link ficar valendo para sempre. */
export const VALIDADE_CONVITE_MS = 14 * 24 * 60 * 60 * 1000;

function hashDoToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Cria um convite e devolve o segredo que vai no link. O segredo não é guardado —
 * só o hash —, então esta é a única vez que ele existe por inteiro.
 */
export async function criarConvite(dados: { criadoPor: string; nomeOficina?: string | null; email?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const convite = await prisma.convite.create({
    data: {
      tokenHash: hashDoToken(token),
      nomeOficina: dados.nomeOficina?.trim() || null,
      email: dados.email?.trim().toLowerCase() || null,
      expiraEm: new Date(Date.now() + VALIDADE_CONVITE_MS),
      criadoPor: dados.criadoPor,
    },
  });
  return { convite, token };
}

export type SituacaoConvite = "valido" | "usado" | "vencido" | "inexistente";

/** Situação de um convite pelo segredo do link. Não revela nada além disso. */
export async function lerConvite(token: string | null | undefined) {
  if (!token || token.length > 200) return { situacao: "inexistente" as SituacaoConvite, convite: null };
  const convite = await prisma.convite.findUnique({ where: { tokenHash: hashDoToken(token) } });
  if (!convite) return { situacao: "inexistente" as SituacaoConvite, convite: null };
  if (convite.usadoEm) return { situacao: "usado" as SituacaoConvite, convite };
  if (convite.expiraEm <= new Date()) return { situacao: "vencido" as SituacaoConvite, convite };
  return { situacao: "valido" as SituacaoConvite, convite };
}

/**
 * Troca o convite por uma oficina nova com o dono já cadastrado.
 *
 * Serializable, e o convite é carimbado com `updateMany` condicionado a `usadoEm`
 * nulo: dois cliques no mesmo link não criam duas oficinas — o segundo não acha
 * convite livre e é recusado.
 */
export async function usarConvite(
  token: string,
  dados: { nomeOficina: string; nome: string; email: string; senhaHash: string }
) {
  const tokenHash = hashDoToken(token);
  return prisma.$transaction(
    async (tx) => {
      const carimbado = await tx.convite.updateMany({
        where: { tokenHash, usadoEm: null, expiraEm: { gt: new Date() } },
        data: { usadoEm: new Date() },
      });
      if (carimbado.count === 0) return null;

      const criada = await criarOficinaComDono(tx, dados);
      await tx.convite.update({ where: { tokenHash }, data: { oficinaId: criada.oficina.id } });
      return criada;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function listarConvites() {
  return prisma.convite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      nomeOficina: true,
      email: true,
      expiraEm: true,
      usadoEm: true,
      createdAt: true,
      oficina: { select: { id: true, nome: true } },
    },
  });
}

/** Cancela um convite ainda não usado (vence na hora). */
export async function cancelarConvite(id: string) {
  const r = await prisma.convite.updateMany({
    where: { id, usadoEm: null },
    data: { expiraEm: new Date() },
  });
  return r.count > 0;
}

// ─── Plataforma ──────────────────────────────────────────────────────────────

/**
 * As oficinas, para o painel do dono da plataforma. Só a casca: nome, situação e
 * volume de uso — nenhum dado de cliente, OS ou dinheiro de dentro delas.
 */
export async function listarOficinas() {
  const oficinas = await prisma.oficina.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nome: true,
      ativa: true,
      createdAt: true,
      _count: { select: { usuarios: true, ordens: true, clientes: true } },
    },
  });

  // Último acesso de alguém da oficina: o sinal mais simples de "está usando?".
  const acessos = await prisma.usuario.groupBy({
    by: ["oficinaId"],
    _max: { ultimoAcesso: true },
  });
  const ultimoPorOficina = new Map(acessos.map((a) => [a.oficinaId, a._max.ultimoAcesso]));

  return oficinas.map((o) => ({
    id: o.id,
    nome: o.nome,
    ativa: o.ativa,
    criadaEm: o.createdAt,
    usuarios: o._count.usuarios,
    ordens: o._count.ordens,
    clientes: o._count.clientes,
    ultimoAcesso: ultimoPorOficina.get(o.id) ?? null,
  }));
}

/**
 * Suspende ou reativa uma oficina. Suspender derruba as sessões de todos dela na hora
 * (e `getUsuarioAtual` recusa quem ainda tiver cookie).
 *
 * A oficina de quem está suspendendo não pode ser suspensa por ela mesma — seria o
 * dono da plataforma se trancando do lado de fora.
 */
export async function definirOficinaAtiva(id: string, ativa: boolean, oficinaDeQuemPede: string) {
  if (!ativa && id === oficinaDeQuemPede) {
    throw new Error("Não é possível suspender a própria oficina");
  }
  const oficina = await prisma.oficina.update({ where: { id }, data: { ativa } });
  if (!ativa) {
    await prisma.sessao.deleteMany({ where: { usuario: { oficinaId: id } } });
  }
  return oficina;
}

/** Usuário pelo e-mail, em qualquer oficina — só o login precisa disto. */
export function usuarioPorEmail(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
    include: { oficina: { select: { ativa: true } } },
  });
}

/** E-mail já usado por alguém, em qualquer oficina. O e-mail é a chave do login. */
export async function emailEmUso(email: string) {
  return (await prisma.usuario.count({ where: { email } })) > 0;
}
