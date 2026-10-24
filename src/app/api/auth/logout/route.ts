import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, COOKIE_SESSAO_LOJA, lerToken, lerTokenDeLoja } from "@/lib/sessao";
import { encerrarSessao } from "@/lib/auth";
import { encerrarSessaoLoja } from "@/lib/conta-loja";

export async function POST() {
  const jar = await cookies();
  const [lido, daLoja] = await Promise.all([
    lerToken(jar.get(COOKIE_SESSAO)?.value),
    lerTokenDeLoja(jar.get(COOKIE_SESSAO_LOJA)?.value),
  ]);

  // Apaga a sessão no banco, não só o cookie: se o token tiver sido copiado, ele
  // também para de valer. Sai das duas — oficina e painel da loja — de uma vez.
  if (lido) await encerrarSessao(lido.sessaoId);
  if (daLoja) await encerrarSessaoLoja(daLoja.sessaoId);

  jar.delete(COOKIE_SESSAO);
  jar.delete(COOKIE_SESSAO_LOJA);
  return NextResponse.json({ ok: true });
}
