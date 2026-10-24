import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { avancarEntrega, envioDaLoja } from "@/lib/balcao";

type Params = { params: Promise<{ envioId: string }> };

/** Próxima etapa da entrega: separando → saiu com o motoboy → entregue. */
export async function POST(_request: Request, { params }: Params) {
  const guarda = await guardaLoja("balcao.entrega");
  if (guarda.resposta) return guarda.resposta;
  const lojaId = guarda.conta.loja.id;
  const { envioId } = await params;

  const resultado = await avancarEntrega(lojaId, envioId);
  if (resultado === "nao-encontrado") {
    return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  }
  if (resultado === "sem-pedido") {
    return NextResponse.json({ error: "A oficina ainda não fez pedido nesta cotação" }, { status: 409 });
  }
  return NextResponse.json(await envioDaLoja(lojaId, envioId));
}
