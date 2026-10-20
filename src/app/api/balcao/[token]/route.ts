import { NextResponse } from "next/server";
import { caixaDaLoja, lojaPeloToken } from "@/lib/balcao";

// Rotas do balcão: públicas (a loja não tem conta), e o segredo é o próprio link.
// Token desconhecido responde 404, igual a uma página que não existe.

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const loja = await lojaPeloToken(token);
  if (!loja) return NextResponse.json({ error: "Balcão não encontrado" }, { status: 404 });
  return NextResponse.json(await caixaDaLoja(loja));
}
