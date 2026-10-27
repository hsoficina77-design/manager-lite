import { NextResponse } from "next/server";
import { MENSAGEM_BALCAO_COM_LOGIN, envioDaLoja, lojaPeloToken, responderDevolucao } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { devolucaoLojaSchema } from "@/lib/schemas-peca-peca";

type Params = { params: Promise<{ token: string; envioId: string }> };

/** A loja responde à devolução: aceita, recusa, manda a troca ou confirma a peça que voltou. */
export async function POST(request: Request, { params }: Params) {
  const { token, envioId } = await params;
  const loja = await lojaPeloToken(token);
  if (!loja) return NextResponse.json({ error: "Balcão não encontrado" }, { status: 404 });
  if (loja.comLogin) return NextResponse.json({ error: MENSAGEM_BALCAO_COM_LOGIN }, { status: 410 });

  try {
    const { devolucaoId, ...pedido } = await lerJson(request, devolucaoLojaSchema);
    const resultado = await responderDevolucao(loja.id, envioId, devolucaoId, pedido);
    if (resultado === "nao-encontrado") {
      return NextResponse.json({ error: "Devolução não encontrada" }, { status: 404 });
    }
    if (resultado !== "ok") return NextResponse.json({ error: resultado.recusa }, { status: 409 });
    return NextResponse.json(await envioDaLoja(loja.id, envioId));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a devolução" }, { status: 500 });
  }
}
