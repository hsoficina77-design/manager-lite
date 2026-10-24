import { NextResponse } from "next/server";
import { MENSAGEM_BALCAO_COM_LOGIN, envioDaLoja, lojaPeloToken, responderEnvio } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { respostaDoBalcaoSchema } from "@/lib/schemas-peca-peca";

type Params = { params: Promise<{ token: string; envioId: string }> };

/** O balconista manda marca, preço e prazo de cada peça (lista vazia = não tenho). */
export async function POST(request: Request, { params }: Params) {
  const { token, envioId } = await params;
  const loja = await lojaPeloToken(token);
  if (!loja) return NextResponse.json({ error: "Balcão não encontrado" }, { status: 404 });
  if (loja.comLogin) return NextResponse.json({ error: MENSAGEM_BALCAO_COM_LOGIN }, { status: 410 });

  try {
    const { itens } = await lerJson(request, respostaDoBalcaoSchema);
    const resultado = await responderEnvio(loja.id, envioId, itens);
    if (resultado === "nao-encontrado") {
      return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    }
    if (resultado === "travada") {
      return NextResponse.json({ error: "A oficina já fechou esta cotação" }, { status: 409 });
    }
    return NextResponse.json(await envioDaLoja(loja.id, envioId));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao enviar a resposta" }, { status: 500 });
  }
}
