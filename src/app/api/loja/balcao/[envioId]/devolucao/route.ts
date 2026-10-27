import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { envioDaLoja, responderDevolucao } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { devolucaoLojaSchema } from "@/lib/schemas-peca-peca";

type Params = { params: Promise<{ envioId: string }> };

/** A loja responde à devolução: aceita, recusa, manda a troca ou confirma a peça que voltou. */
export async function POST(request: Request, { params }: Params) {
  const guarda = await guardaLoja("balcao.devolucao");
  if (guarda.resposta) return guarda.resposta;
  const lojaId = guarda.conta.loja.id;
  const { envioId } = await params;

  try {
    const { devolucaoId, ...pedido } = await lerJson(request, devolucaoLojaSchema);
    const resultado = await responderDevolucao(lojaId, envioId, devolucaoId, pedido, guarda.conta.id);
    if (resultado === "nao-encontrado") {
      return NextResponse.json({ error: "Devolução não encontrada" }, { status: 404 });
    }
    if (resultado !== "ok") return NextResponse.json({ error: resultado.recusa }, { status: 409 });
    return NextResponse.json(await envioDaLoja(lojaId, envioId));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a devolução" }, { status: 500 });
  }
}
