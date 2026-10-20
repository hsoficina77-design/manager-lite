// Peça Peça: cotação de peças nas autopeças da região, de dentro do boxOS.
//
// Por enquanto é uma prévia, aberta só para as contas abaixo. As cotações moram no
// banco (Cotacao e companhia, ver o fim do schema) e cada loja responde do próprio
// balcão — um link secreto em /balcao, sem conta (ver lib/balcao.ts). O orçamento
// que sai no fim é um orçamento comum do boxOS, e a OS nasce dele pela conversão
// de sempre.

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { exigirUsuario, guardaApi, type UsuarioSessao } from "@/lib/auth";

/** Contas que enxergam a prévia. Outras oficinas não veem nem o item no menu. */
const CONTAS_PECA_PECA = ["bushidomatsui8@gmail.com"];

export function vePecaPeca(usuario: Pick<UsuarioSessao, "email">): boolean {
  return CONTAS_PECA_PECA.includes(usuario.email.trim().toLowerCase());
}

/** Página do Peça Peça: quem não está na lista volta para o início. */
export async function exigirPecaPeca(): Promise<UsuarioSessao> {
  const usuario = await exigirUsuario();
  if (!vePecaPeca(usuario)) redirect("/");
  return usuario;
}

/** Rota de API do Peça Peça: a `guardaApi` de sempre, mais a lista da prévia. */
export async function guardaPecaPeca(): ReturnType<typeof guardaApi> {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda;
  if (!vePecaPeca(guarda.usuario)) {
    return { resposta: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  }
  return guarda;
}
