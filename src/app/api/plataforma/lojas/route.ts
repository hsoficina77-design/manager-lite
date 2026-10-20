import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { criarLoja, lojasDoPainel } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { lojaCriarSchema } from "@/lib/schemas-peca-peca";

// Autopeças do Peça Peça. Só o dono da plataforma: o cadastro é manual, dele.

export async function GET() {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;
  return NextResponse.json(await lojasDoPainel());
}

export async function POST(request: Request) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;
  try {
    const dados = await lerJson(request, lojaCriarSchema);
    const loja = await criarLoja(dados);
    return NextResponse.json(loja, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao cadastrar a loja" }, { status: 500 });
  }
}
