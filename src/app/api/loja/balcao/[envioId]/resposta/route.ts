import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { envioDaLoja, responderEnvio } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { respostaDoBalcaoSchema } from "@/lib/schemas-peca-peca";

type Params = { params: Promise<{ envioId: string }> };

/** O balconista manda marca, preço e prazo de cada peça (lista vazia = não tenho). */
export async function POST(request: Request, { params }: Params) {
  const guarda = await guardaLoja("balcao.responder");
  if (guarda.resposta) return guarda.resposta;
  const { conta } = guarda;
  const { envioId } = await params;

  try {
    const { itens } = await lerJson(request, respostaDoBalcaoSchema);
    const resultado = await responderEnvio(conta.loja.id, envioId, itens, conta.id);
    if (resultado === "nao-encontrado") {
      return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    }
    if (resultado === "travada") {
      return NextResponse.json({ error: "A oficina já fechou esta cotação" }, { status: 409 });
    }
    return NextResponse.json(await envioDaLoja(conta.loja.id, envioId));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao enviar a resposta" }, { status: 500 });
  }
}
