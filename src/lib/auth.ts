// Sessão do lado do servidor: quem está logado, e o que ele pode.
//
// O proxy (`src/proxy.ts`) já barrou quem não tem cookie válido. Aqui é onde se
// confirma o que o cookie não pode provar sozinho: a sessão ainda existe no banco,
// o usuário continua ativo e o papel é o de agora — não o de quando ele entrou.

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";
import { ehPapelValido, type Papel } from "@/lib/permissoes";
import { bancoDaOficina, type BancoDaOficina } from "@/lib/db-oficina";
import { sistemaVazio } from "@/lib/sistema";

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  /** Já resolvido com o papel: dono sempre `true`, mesmo que a coluna diga outra coisa. */
  podeFinanceiro: boolean;
  /** Idem — dono sempre pode excluir. */
  podeExcluir: boolean;
  /** Sessão desta requisição — permite poupá-la ao derrubar as demais. */
  sessaoId: string;
  /** Oficina da pessoa. Vem do banco, nunca do cookie nem da requisição. */
  oficinaId: string;
  /** Dono da plataforma: gera convites. Não abre dados de outras oficinas. */
  administraPlataforma: boolean;
};

/**
 * Usuário da requisição, ou `null`.
 *
 * Sessão vencida ou de usuário desativado é apagada na hora — assim desligar um acesso
 * tem efeito no próximo carregamento de página, sem esperar o cookie expirar.
 *
 * `cache` junta as chamadas da mesma renderização (layout, metadados e página pedem o
 * usuário cada um) numa consulta só ao banco.
 */
export const getUsuarioAtual = cache(lerUsuarioDaSessao);

async function lerUsuarioDaSessao(): Promise<UsuarioSessao | null> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const lido = await lerToken(token);
  if (!lido) return null;

  try {
    const sessao = await prisma.sessao.findUnique({
      where: { id: lido.sessaoId },
      select: {
        expiraEm: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            podeFinanceiro: true,
            podeExcluir: true,
            ativo: true,
            oficinaId: true,
            administraPlataforma: true,
            oficina: { select: { ativa: true } },
          },
        },
      },
    });

    // Oficina suspensa pelo dono da plataforma derruba todo mundo dela, do mesmo jeito
    // que um acesso desativado.
    if (
      !sessao ||
      sessao.expiraEm <= new Date() ||
      !sessao.usuario.ativo ||
      !sessao.usuario.oficina.ativa
    ) {
      if (sessao) await encerrarSessao(lido.sessaoId);
      return null;
    }

    const { usuario } = sessao;
    const papel = ehPapelValido(usuario.papel) ? usuario.papel : "OPERADOR";
    const ehDono = papel === "ADMIN";
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel,
      podeFinanceiro: ehDono || usuario.podeFinanceiro,
      podeExcluir: ehDono || usuario.podeExcluir,
      sessaoId: lido.sessaoId,
      oficinaId: usuario.oficinaId,
      administraPlataforma: usuario.administraPlataforma,
    };
  } catch (err) {
    console.error("Falha ao ler a sessão:", err);
    return null;
  }
}

/** Apaga uma sessão (logout, desativação, troca de papel). Não lança. */
export async function encerrarSessao(sessaoId: string) {
  try {
    await prisma.sessao.delete({ where: { id: sessaoId } });
  } catch {
    // Já não existia — o efeito desejado é o mesmo.
  }
}

/**
 * Derruba as sessões de um usuário — ao trocar senha, papel ou desativar o acesso.
 *
 * `exceto` poupa uma sessão: quem acaba de trocar a própria senha não deve ser expulso
 * da tela em que está.
 */
export async function encerrarSessoesDoUsuario(usuarioId: string, exceto?: string) {
  try {
    await prisma.sessao.deleteMany({
      where: { usuarioId, ...(exceto ? { id: { not: exceto } } : {}) },
    });
  } catch (err) {
    console.error("Falha ao encerrar sessões do usuário:", err);
  }
}

/** Ainda não existe ninguém cadastrado — o app deve abrir a tela de primeiro acesso. */
export async function precisaPrimeiroAcesso(): Promise<boolean> {
  try {
    return await sistemaVazio();
  } catch (err) {
    // Banco fora do ar não pode virar "instale de novo": no erro, assume que já existe
    // dono cadastrado, e a tela de login mostra a falha.
    console.error("Falha ao contar usuários:", err);
    return false;
  }
}

/** Página que exige login. Manda para o login guardando para onde a pessoa ia. */
export async function exigirUsuario(destino?: string): Promise<UsuarioSessao> {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    redirect(destino ? `/login?next=${encodeURIComponent(destino)}` : "/login");
  }
  return usuario;
}

/** Página que só o dono acessa. Operador volta para o início. */
export async function exigirDono(): Promise<UsuarioSessao> {
  const usuario = await exigirUsuario();
  if (usuario.papel !== "ADMIN") redirect("/");
  return usuario;
}

/** Página que lê dados: usuário logado + o banco da oficina dele. */
export async function exigirOficina(
  destino?: string
): Promise<BancoDaOficina & { usuario: UsuarioSessao }> {
  const usuario = await exigirUsuario(destino);
  return { usuario, ...bancoDaOficina(usuario.oficinaId) };
}

// ─── Rotas de API ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

/**
 * Guarda para rotas de API. Devolve `{ usuario, db, transacao }` — o banco já preso à
 * oficina de quem está logado — ou `{ resposta }` já pronta.
 *
 *   const guarda = await guardaApi({ dono: true });
 *   if (guarda.resposta) return guarda.resposta;
 *   const { db } = guarda;
 */
export async function guardaApi(
  opcoes: { dono?: boolean; financeiro?: boolean; exclusao?: boolean; plataforma?: boolean } = {}
): Promise<
  | (BancoDaOficina & { usuario: UsuarioSessao; resposta?: never })
  | { usuario?: never; db?: never; transacao?: never; resposta: NextResponse }
> {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return { resposta: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  if (opcoes.dono && usuario.papel !== "ADMIN") {
    return { resposta: NextResponse.json({ error: "Acesso restrito ao dono" }, { status: 403 }) };
  }
  if (opcoes.financeiro && !usuario.podeFinanceiro) {
    return { resposta: NextResponse.json({ error: "Acesso restrito ao financeiro" }, { status: 403 }) };
  }
  if (opcoes.exclusao && !usuario.podeExcluir) {
    return { resposta: NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 }) };
  }
  if (opcoes.plataforma && !usuario.administraPlataforma) {
    return { resposta: NextResponse.json({ error: "Acesso restrito à plataforma" }, { status: 403 }) };
  }
  // O banco entregue à rota já vem preso à oficina da sessão — é a trava 1.
  return { usuario, ...bancoDaOficina(usuario.oficinaId) };
}
