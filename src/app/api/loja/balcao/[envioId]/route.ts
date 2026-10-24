import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { envioDaLoja } from "@/lib/balcao";

type Params = { params: Promise<{ envioId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const guarda = await guardaLoja();
  if (guarda.resposta) return guarda.resposta;
  const { envioId } = await params;
  const envio = await envioDaLoja(guarda.conta.loja.id, envioId);
  if (!envio) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  return NextResponse.json(envio);
}
