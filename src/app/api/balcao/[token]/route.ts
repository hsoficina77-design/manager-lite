import { NextResponse } from "next/server";
import { MENSAGEM_BALCAO_COM_LOGIN, caixaDaLoja, lojaPeloToken } from "@/lib/balcao";

// Rotas do balcão antigo, por link: públicas (a loja não tinha conta), e o segredo é o
// próprio link. Token desconhecido responde 404, igual a uma página que não existe; e
// loja que já tem login responde 410 — o link foi aposentado (ver `lojaPeloToken`).

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const loja = await lojaPeloToken(token);
  if (!loja) return NextResponse.json({ error: "Balcão não encontrado" }, { status: 404 });
  if (loja.comLogin) return NextResponse.json({ error: MENSAGEM_BALCAO_COM_LOGIN }, { status: 410 });
  return NextResponse.json(await caixaDaLoja(loja));
}
