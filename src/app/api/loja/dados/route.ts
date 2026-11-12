import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { atualizarLoja } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { dadosDaLojaSchema } from "@/lib/schemas-peca-peca";

/**
 * Telefone, cidades atendidas, entrega e pagamento ou prazo de devolução, um bloco por
 * vez. As cidades passam pela mesma conferência do cadastro da plataforma: cada uma na
 * lista do IBGE, e a cidade onde a loja fica sempre junto. A taxa por cidade só guarda
 * as cidades que a loja atende.
 */
export async function PATCH(request: Request) {
  const guarda = await guardaLoja("loja.dados");
  if (guarda.resposta) return guarda.resposta;
  try {
    const dados = await lerJson(request, dadosDaLojaSchema);
    await atualizarLoja(guarda.conta.loja.id, dados);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar os dados da loja" }, { status: 500 });
  }
}
