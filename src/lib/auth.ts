// Sessão do lado do servidor: quem está logado, e o que ele pode.
//
// O proxy (`src/proxy.ts`) já barrou quem não tem cookie válido. Aqui é onde se
// confirma o que o cookie não pode provar sozinho: a sessão ainda existe no banco,
// o usuário continua ativo e o papel é o de agora — não o de quando ele entrou.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";
import { ehPapelValido, type Papel } from "@/lib/permissoes";

export type UsuarioSessao = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  /** Sessão desta requisição — permite poupá-la ao derrubar as demais. */
  sessaoId: string;
};

/**
 * Usuário da requisição, ou `null`.
 *
 * Sessão vencida ou de usuário desativado é apagada na hora — assim desligar um acesso
 * tem efeito no próximo carregamento de página, sem esperar o cookie expirar.
 */
export async function getUsuarioAtual(): Promise<UsuarioSessao | null> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const lido = await lerToken(token);
  if (!lido) return null;

  try {
    const sessao = await prisma.sessao.findUnique({
      where: { id: lido.sessaoId },
      select: {
        expiraEm: true,
        usuario: { select: { id: true, nome: true, email: true, papel: true, ativo: true } },
      },
    });

    if (!sessao || sessao.expiraEm <= new Date() || !sessao.usuario.ativo) {
      if (sessao) await encerrarSessao(lido.sessaoId);
      return null;
    }

    const { usuario } = sessao;
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: ehPapelValido(usuario.papel) ? usuario.papel : "OPERADOR",
      sessaoId: lido.sessaoId,
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
    return (await prisma.usuario.count()) === 0;
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

// ─── Rotas de API ─────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

/**
 * Guarda para rotas de API. Devolve `{ usuario }` ou `{ resposta }` já pronta.
 *
 *   const guarda = await guardaApi({ dono: true });
 *   if (guarda.resposta) return guarda.resposta;
 */
export async function guardaApi(
  opcoes: { dono?: boolean } = {}
): Promise<{ usuario: UsuarioSessao; resposta?: never } | { usuario?: never; resposta: NextResponse }> {
  const usuario = await getUsuarioAtual();
  if (!usuario) {
    return { resposta: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  if (opcoes.dono && usuario.papel !== "ADMIN") {
    return { resposta: NextResponse.json({ error: "Acesso restrito ao dono" }, { status: 403 }) };
  }
  return { usuario };
}
