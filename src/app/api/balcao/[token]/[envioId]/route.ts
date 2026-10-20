import { NextResponse } from "next/server";
import { envioDaLoja, lojaPeloToken } from "@/lib/balcao";

type Params = { params: Promise<{ token: string; envioId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token, envioId } = await params;
  const loja = await lojaPeloToken(token);
  const envio = loja ? await envioDaLoja(loja.id, envioId) : null;
  if (!envio) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  return NextResponse.json(envio);
}
