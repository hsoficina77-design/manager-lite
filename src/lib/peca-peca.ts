// Peça Peça: cotação de peças nas autopeças da região.
//
// É um produto à parte do boxOS, com endereço próprio (ver lib/produto.ts) e cadastro
// grátis — mas o mesmo app, o mesmo banco e a mesma conta. A oficina só do Peça Peça
// cota e pede; a que também tem boxOS ainda transforma a cotação num orçamento comum,
// que vira OS pela conversão de sempre. As cotações moram no banco (Cotacao e
// companhia, ver o fim do schema) e cada loja responde do próprio painel (lib/balcao.ts).

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { exigirUsuario, guardaApi, type UsuarioSessao } from "@/lib/auth";

/**
 * Quem usa o Peça Peça: o dono, e o operador com acesso ao financeiro. O preço da loja
 * é o custo da peça, e o operador do boxOS não vê custo — a regra é a mesma. Na oficina
 * só do Peça Peça, todo mundo é dono.
 */
export function vePecaPeca(usuario: Pick<UsuarioSessao, "podeFinanceiro">): boolean {
  return usuario.podeFinanceiro;
}

/**
 * Página do Peça Peça: quem não pode vê o aviso. Não volta para "/": no endereço do
 * Peça Peça, "/" é a própria lista de cotações.
 */
export async function exigirPecaPeca(): Promise<UsuarioSessao> {
  const usuario = await exigirUsuario();
  if (!vePecaPeca(usuario)) redirect("/peca-peca/sem-acesso");
  return usuario;
}

/** Rota de API do Peça Peça: a `guardaApi` de sempre, mais a regra de quem usa. */
export async function guardaPecaPeca(): ReturnType<typeof guardaApi> {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda;
  if (!vePecaPeca(guarda.usuario)) {
    return { resposta: NextResponse.json({ error: "Acesso restrito ao financeiro" }, { status: 403 }) };
  }
  return guarda;
}
