import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";
import { encerrarSessao } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  const lido = await lerToken(jar.get(COOKIE_SESSAO)?.value);

  // Apaga a sessão no banco, não só o cookie: se o token tiver sido copiado, ele
  // também para de valer.
  if (lido) await encerrarSessao(lido.sessaoId);

  jar.delete(COOKIE_SESSAO);
  return NextResponse.json({ ok: true });
}
