import { NextResponse } from "next/server";
import { avancarEntrega, envioDaLoja, lojaPeloToken } from "@/lib/balcao";

type Params = { params: Promise<{ token: string; envioId: string }> };

/** Próxima etapa da entrega: separando → saiu com o motoboy → entregue. */
export async function POST(_request: Request, { params }: Params) {
  const { token, envioId } = await params;
  const loja = await lojaPeloToken(token);
  if (!loja) return NextResponse.json({ error: "Balcão não encontrado" }, { status: 404 });

  const resultado = await avancarEntrega(loja.id, envioId);
  if (resultado === "nao-encontrado") {
    return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  }
  if (resultado === "sem-pedido") {
    return NextResponse.json({ error: "A oficina ainda não fez pedido nesta cotação" }, { status: 409 });
  }
  return NextResponse.json(await envioDaLoja(loja.id, envioId));
}
