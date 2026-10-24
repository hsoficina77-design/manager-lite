// Contas do painel da autopeça no Peça Peça: quem trabalha na loja, a sessão, os
// convites e a equipe.
//
// Separado das contas de oficina de propósito — cookie próprio (`pp_loja`), sessão
// própria (`SessaoLoja`), guarda própria. Uma conta de loja não alcança rota de oficina
// (o proxy recusa o cookie dela lá), e uma de oficina não alcança o painel da loja.
//
// Cliente Prisma cru, como balcao.ts: estas tabelas são do sistema (a loja atende
// várias oficinas). Nada de oficina passa por aqui — o balcão e o resumo da loja são
// lidos por lib/balcao.ts, sempre a partir do `lojaId` da sessão.
//
// Os acessos (o que cada pessoa pode no painel) vêm do catálogo de lib/acessos-loja.ts
// e são lidos do banco a cada requisição: mudar o acesso de alguém vale na hora.

import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  CABECALHO_CONTA_DA_ABA,
  COOKIE_SESSAO_LOJA,
  DURACAO_MS,
  PAPEL_LOJA,
  assinarToken,
  lerTokenDeLoja,
  novoIdDeSessao,
  opcoesDoCookie,
} from "@/lib/sessao";
import { VALIDADE_CONVITE_MS, emailOcupado } from "@/lib/sistema";
import {
  PERFIS_DA_LOJA,
  acessosDepoisDaMudanca,
  permissoesValidas,
  type PerfilLoja,
  type PermissaoLoja,
} from "@/lib/acessos-loja";

// ─── Sessão ──────────────────────────────────────────────────────────────────

export type ContaLoja = {
  id: string;
  nome: string;
  email: string;
  sessaoId: string;
  /** O que esta pessoa pode no painel — já filtrado pelo catálogo. */
  permissoes: PermissaoLoja[];
  loja: {
    id: string;
    nome: string;
    cidade: string | null;
    uf: string | null;
    atende: string[];
    telefone: string | null;
    /** Tempo real de entrega (ver lib/balcao.ts). Nulo enquanto vale a faixa padrão. */
    entregaMedia: number | null;
    entregasMedidas: number;
  };
};

/** De quanto em quanto tempo o uso renova `UsuarioLoja.ultimoAcesso`. */
const INTERVALO_ACESSO_MS = 60 * 60 * 1000;

async function lerContaDaSessao(): Promise<ContaLoja | null> {
  const lido = await lerTokenDeLoja((await cookies()).get(COOKIE_SESSAO_LOJA)?.value);
  if (!lido) return null;

  try {
    const sessao = await prisma.sessaoLoja.findUnique({
      where: { id: lido.sessaoId },
      select: {
        expiraEm: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            permissoes: true,
            ativo: true,
            ultimoAcesso: true,
            loja: {
              select: {
                id: true,
                nome: true,
                cidade: true,
                uf: true,
                atende: true,
                telefone: true,
                entregaMedia: true,
                entregasMedidas: true,
                ativa: true,
              },
            },
          },
        },
      },
    });

    // Loja desativada pela plataforma derruba todo mundo dela, como a oficina suspensa.
    if (!sessao || sessao.expiraEm <= new Date() || !sessao.usuario.ativo || !sessao.usuario.loja.ativa) {
      if (sessao) await encerrarSessaoLoja(lido.sessaoId);
      return null;
    }

    const { usuario } = sessao;
    if (!usuario.ultimoAcesso || Date.now() - usuario.ultimoAcesso.getTime() > INTERVALO_ACESSO_MS) {
      prisma.usuarioLoja
        .update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } })
        .catch((err: unknown) => console.error("Falha ao registrar o último acesso da loja:", err));
    }

    const { loja } = usuario;
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      sessaoId: lido.sessaoId,
      permissoes: permissoesValidas(usuario.permissoes),
      loja: {
        id: loja.id,
        nome: loja.nome,
        cidade: loja.cidade,
        uf: loja.uf,
        atende: loja.atende,
        telefone: loja.telefone,
        entregaMedia: loja.entregaMedia,
        entregasMedidas: loja.entregasMedidas,
      },
    };
  } catch (err) {
    console.error("Falha ao ler a sessão da loja:", err);
    return null;
  }
}

/** Quem está no painel da loja, ou `null`. Uma consulta só por renderização. */
export const getContaLojaAtual = cache(lerContaDaSessao);

/** Página do painel da loja. Sem o acesso pedido, volta para o balcão. */
export async function exigirContaLoja(permissao?: PermissaoLoja): Promise<ContaLoja> {
  const conta = await getContaLojaAtual();
  if (!conta) redirect("/login?next=/loja");
  if (permissao && !conta.permissoes.includes(permissao)) redirect("/loja");
  return conta;
}

/**
 * Guarda das rotas `/api/loja/...`: a conta da sessão, com o acesso pedido — ou a
 * resposta já pronta. O que a rota lê e grava parte sempre de `conta.loja.id`.
 */
export async function guardaLoja(
  permissao?: PermissaoLoja
): Promise<{ conta: ContaLoja; resposta?: never } | { conta?: never; resposta: NextResponse }> {
  const conta = await getContaLojaAtual();
  if (!conta) return { resposta: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  // A aba que nasceu noutra conta não lê nem grava como esta: para ela, a sessão acabou
  // — e ela recarrega já na conta que o navegador tem agora.
  const daAba = (await headers()).get(CABECALHO_CONTA_DA_ABA);
  if (daAba && daAba !== conta.id) {
    return {
      resposta: NextResponse.json(
        { error: "Este navegador entrou em outra conta de loja. A tela vai recarregar." },
        { status: 401 }
      ),
    };
  }
  if (permissao && !conta.permissoes.includes(permissao)) {
    return {
      resposta: NextResponse.json(
        { error: "Seu acesso não inclui isto. Fale com quem cuida da equipe da loja." },
        { status: 403 }
      ),
    };
  }
  return { conta };
}

/** Pessoa da loja pelo e-mail — só o login precisa disto. */
export function usuarioLojaPorEmail(email: string) {
  return prisma.usuarioLoja.findUnique({
    where: { email },
    select: { id: true, nome: true, email: true, senhaHash: true, ativo: true, loja: { select: { ativa: true } } },
  });
}

/** Abre a sessão do painel da loja e grava o cookie `pp_loja`. */
export async function abrirSessaoLoja(usuario: { id: string }, request: Request) {
  const sessaoId = novoIdDeSessao();
  const expiraEm = new Date(Date.now() + DURACAO_MS);

  await prisma.sessaoLoja.create({
    data: {
      id: sessaoId,
      usuarioLojaId: usuario.id,
      expiraEm,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  const token = await assinarToken(sessaoId, expiraEm, PAPEL_LOJA, false, false);
  (await cookies()).set(COOKIE_SESSAO_LOJA, token, opcoesDoCookie(expiraEm));

  await prisma.usuarioLoja.update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } });

  prisma.sessaoLoja
    .deleteMany({ where: { expiraEm: { lt: new Date() } } })
    .catch((err: unknown) => console.error("Falha ao limpar sessões de loja vencidas:", err));
}

/** Apaga uma sessão de loja (sair, acesso desligado). Não lança. */
export async function encerrarSessaoLoja(sessaoId: string) {
  try {
    await prisma.sessaoLoja.delete({ where: { id: sessaoId } });
  } catch {
    // Já não existia — o efeito desejado é o mesmo.
  }
}

// ─── Convites e "novo acesso" ────────────────────────────────────────────────
//
// Um link de uso único, válido por 14 dias, que leva ao painel: quem recebe define o
// nome e a senha e já entra. O mesmo link serve para trocar a senha esquecida ("novo
// acesso"), quando aponta para alguém que já existe. Só o hash do segredo é guardado.

function hashDoToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Cria o convite e devolve o segredo do link — a única vez que ele existe por inteiro.
 *
 * Os acessos do convite passam pela mesma regra da equipe: quem convida não dá o que
 * não tem. O "novo acesso" de alguém vence os links antigos dele que ainda estavam
 * abertos.
 */
export async function criarConviteLoja(dados: {
  lojaId: string;
  criadoPor: string;
  deQuemConvida: readonly PermissaoLoja[];
  perfil: PerfilLoja;
  nome?: string | null;
  email?: string | null;
  /** "Novo acesso": troca a senha desta pessoa, em vez de criar outra. */
  usuarioLojaId?: string | null;
}) {
  const token = randomBytes(32).toString("base64url");
  const permissoes = PERFIS_DA_LOJA[dados.perfil].permissoes.filter((p) => dados.deQuemConvida.includes(p));

  await prisma.$transaction(async (tx) => {
    if (dados.usuarioLojaId) {
      await tx.conviteLoja.updateMany({
        where: { usuarioLojaId: dados.usuarioLojaId, usadoEm: null },
        data: { expiraEm: new Date() },
      });
    }
    await tx.conviteLoja.create({
      data: {
        tokenHash: hashDoToken(token),
        lojaId: dados.lojaId,
        usuarioLojaId: dados.usuarioLojaId ?? null,
        nome: dados.nome?.trim() || null,
        email: dados.email?.trim().toLowerCase() || null,
        perfil: dados.perfil,
        permissoes,
        expiraEm: new Date(Date.now() + VALIDADE_CONVITE_MS),
        criadoPor: dados.criadoPor,
      },
    });
  });
  return { token, caminho: `/acesso-loja/${token}` };
}

export type SituacaoConviteLoja = "valido" | "usado" | "vencido" | "inexistente";

/** O convite pelo segredo do link: situação, a loja e o que a tela precisa mostrar. */
export async function lerConviteLoja(token: string | null | undefined) {
  if (!token || token.length > 200) return { situacao: "inexistente" as SituacaoConviteLoja, convite: null };
  const convite = await prisma.conviteLoja.findUnique({
    where: { tokenHash: hashDoToken(token) },
    select: {
      nome: true,
      email: true,
      perfil: true,
      usadoEm: true,
      expiraEm: true,
      usuarioLojaId: true,
      loja: { select: { nome: true, cidade: true, ativa: true } },
    },
  });
  if (!convite || !convite.loja.ativa) return { situacao: "inexistente" as SituacaoConviteLoja, convite: null };

  const pessoa = convite.usuarioLojaId
    ? await prisma.usuarioLoja.findUnique({ where: { id: convite.usuarioLojaId }, select: { nome: true, email: true } })
    : null;
  const vista = {
    loja: convite.loja.nome,
    cidade: convite.loja.cidade,
    nome: pessoa?.nome ?? convite.nome,
    email: pessoa?.email ?? convite.email,
    novoAcesso: Boolean(convite.usuarioLojaId),
  };

  if (convite.usadoEm) return { situacao: "usado" as SituacaoConviteLoja, convite: vista };
  if (convite.expiraEm <= new Date()) return { situacao: "vencido" as SituacaoConviteLoja, convite: vista };
  return { situacao: "valido" as SituacaoConviteLoja, convite: vista };
}

/** Por que o convite não virou acesso — a rota responde com a frase de cada um. */
export type RecusaDoConvite = "invalido" | "email";

class Recusa extends Error {
  constructor(readonly motivo: RecusaDoConvite) {
    super(motivo);
  }
}

/**
 * Troca o convite pelo acesso: cria a pessoa na loja ou, no "novo acesso", troca a
 * senha de quem já existe (e derruba as sessões abertas dela).
 *
 * Serializable, e o convite é carimbado com `updateMany` condicionado a `usadoEm`
 * nulo: dois cliques no mesmo link não criam duas pessoas. Toda recusa lança, para a
 * transação desfazer o carimbo — o link continua valendo para a próxima tentativa.
 */
export async function usarConviteLoja(
  token: string,
  dados: { nome: string; email: string | null; senhaHash: string }
): Promise<{ id: string } | RecusaDoConvite> {
  const tokenHash = hashDoToken(token);
  try {
    return await prisma.$transaction(
      async (tx) => {
        const carimbado = await tx.conviteLoja.updateMany({
          where: { tokenHash, usadoEm: null, expiraEm: { gt: new Date() }, loja: { ativa: true } },
          data: { usadoEm: new Date() },
        });
        if (carimbado.count === 0) throw new Recusa("invalido");
        const convite = await tx.conviteLoja.findUniqueOrThrow({ where: { tokenHash } });

        if (convite.usuarioLojaId) {
          const pessoa = await tx.usuarioLoja.findFirst({
            where: { id: convite.usuarioLojaId, lojaId: convite.lojaId, ativo: true },
            select: { id: true },
          });
          if (!pessoa) throw new Recusa("invalido");
          await tx.usuarioLoja.update({
            where: { id: pessoa.id },
            data: { senhaHash: dados.senhaHash, nome: dados.nome },
          });
          await tx.sessaoLoja.deleteMany({ where: { usuarioLojaId: pessoa.id } });
          return pessoa;
        }

        if (!dados.email || (await emailOcupado(tx, dados.email))) throw new Recusa("email");
        return tx.usuarioLoja.create({
          data: {
            lojaId: convite.lojaId,
            nome: dados.nome,
            email: dados.email,
            senhaHash: dados.senhaHash,
            perfil: convite.perfil,
            permissoes: permissoesValidas(convite.permissoes),
          },
          select: { id: true },
        });
      },
      { isolationLevel: "Serializable" }
    );
  } catch (err) {
    if (err instanceof Recusa) return err.motivo;
    throw err;
  }
}

// ─── Equipe ──────────────────────────────────────────────────────────────────

export async function equipeDaLoja(lojaId: string) {
  const [pessoas, convites] = await Promise.all([
    prisma.usuarioLoja.findMany({
      where: { lojaId },
      orderBy: [{ ativo: "desc" }, { createdAt: "asc" }],
      select: { id: true, nome: true, email: true, permissoes: true, ativo: true, ultimoAcesso: true, createdAt: true },
    }),
    prisma.conviteLoja.findMany({
      where: { lojaId, usadoEm: null, expiraEm: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, nome: true, email: true, perfil: true, usuarioLojaId: true, expiraEm: true },
    }),
  ]);
  return {
    pessoas: pessoas.map((p) => ({
      ...p,
      permissoes: permissoesValidas(p.permissoes),
      ultimoAcesso: p.ultimoAcesso?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    convites: convites.map((c) => ({
      id: c.id,
      nome: c.nome,
      email: c.email,
      perfil: c.perfil,
      novoAcesso: Boolean(c.usuarioLojaId),
      expiraEm: c.expiraEm.toISOString(),
    })),
  };
}

export type EquipeDaLoja = Awaited<ReturnType<typeof equipeDaLoja>>;

export type ResultadoDaEquipe = "ok" | "nao-encontrado" | "ultimo-responsavel";

/**
 * Muda os acessos de alguém, ou liga e desliga a pessoa.
 *
 * Duas regras, as duas aqui no servidor:
 *   - ninguém dá nem tira o que não tem (`acessosDepoisDaMudanca`);
 *   - a loja nunca fica sem alguém ativo que cuide da equipe — senão ninguém mais
 *     consegue convidar, e só a plataforma destrava.
 */
export async function alterarPessoaDaLoja(
  lojaId: string,
  alvoId: string,
  mudanca: { permissoes?: readonly unknown[]; ativo?: boolean },
  deQuemMexe: readonly PermissaoLoja[]
): Promise<ResultadoDaEquipe> {
  return prisma.$transaction(
    async (tx) => {
      const alvo = await tx.usuarioLoja.findFirst({
        where: { id: alvoId, lojaId },
        select: { id: true, permissoes: true, ativo: true },
      });
      if (!alvo) return "nao-encontrado";

      const atuais = permissoesValidas(alvo.permissoes);
      const permissoes = mudanca.permissoes
        ? acessosDepoisDaMudanca(atuais, permissoesValidas(mudanca.permissoes), deQuemMexe)
        : atuais;
      const ativo = mudanca.ativo ?? alvo.ativo;

      const cuidavaDaEquipe = alvo.ativo && atuais.includes("loja.equipe");
      const continuaCuidando = ativo && permissoes.includes("loja.equipe");
      if (cuidavaDaEquipe && !continuaCuidando) {
        const outros = await tx.usuarioLoja.count({
          where: { lojaId, ativo: true, id: { not: alvo.id }, permissoes: { has: "loja.equipe" } },
        });
        if (outros === 0) return "ultimo-responsavel";
      }

      await tx.usuarioLoja.update({ where: { id: alvo.id }, data: { permissoes, ativo } });
      if (!ativo) await tx.sessaoLoja.deleteMany({ where: { usuarioLojaId: alvo.id } });
      return "ok";
    },
    { isolationLevel: "Serializable" }
  );
}

/** Cancela um convite ainda aberto da loja (vence na hora). */
export async function cancelarConviteLoja(lojaId: string, conviteId: string) {
  const r = await prisma.conviteLoja.updateMany({
    where: { id: conviteId, lojaId, usadoEm: null },
    data: { expiraEm: new Date() },
  });
  return r.count > 0;
}

/** A loja existe? A plataforma mexe na equipe de qualquer uma, pelo id da URL. */
export async function lojaExiste(lojaId: string) {
  return (await prisma.loja.count({ where: { id: lojaId } })) > 0;
}

/** A pessoa é desta loja? Antes de gerar o "novo acesso" para ela. */
export async function pessoaDaLoja(lojaId: string, usuarioLojaId: string) {
  return prisma.usuarioLoja.findFirst({
    where: { id: usuarioLojaId, lojaId, ativo: true },
    select: { id: true, nome: true, email: true },
  });
}
