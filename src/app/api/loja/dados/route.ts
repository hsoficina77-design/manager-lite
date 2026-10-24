import { NextResponse } from "next/server";
import { atualizarDadosDaLoja, guardaLoja } from "@/lib/conta-loja";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { dadosDaLojaSchema } from "@/lib/schemas-peca-peca";

/** Telefone e prazo do motoboy. A região (cidades atendidas) é da plataforma. */
export async function PATCH(request: Request) {
  const guarda = await guardaLoja("loja.dados");
  if (guarda.resposta) return guarda.resposta;
  try {
    const dados = await lerJson(request, dadosDaLojaSchema);
    await atualizarDadosDaLoja(guarda.conta.loja.id, dados);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar os dados da loja" }, { status: 500 });
  }
}
