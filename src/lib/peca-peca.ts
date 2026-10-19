// Peça Peça: cotação de peças nas autopeças da região, de dentro do boxOS.
//
// Por enquanto é uma prévia navegável, aberta só para as contas abaixo. As lojas são
// simuladas e as cotações ficam no navegador (ver components/peca-peca/dados.ts) —
// nenhuma tabela nova no banco. O que é de verdade é a ponta final: o orçamento sai
// pela API de orçamentos de sempre, e a OS nasce dele pela conversão que já existe.

import { redirect } from "next/navigation";
import { exigirUsuario, type UsuarioSessao } from "@/lib/auth";
import { bancoDaOficina } from "@/lib/db-oficina";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";

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

/** Como a loja enxerga quem pediu: só o nome da oficina, o mesmo do menu. */
export async function nomeDaOficina(usuario: UsuarioSessao): Promise<string> {
  return nomeDoMenu(await getConfiguracao(bancoDaOficina(usuario.oficinaId)));
}
