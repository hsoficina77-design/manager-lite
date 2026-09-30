import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { dividaCriarSchema } from "@/lib/schemas";

export async function GET() {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  const dividas = await db.dividaAvulsa.findMany({
    where: { pago: false },
    include: { cliente: { select: { id: true, nome: true, telefone: true, apelido: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(dividas);
}

export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  try {
    const { clienteId, devedorNome, descricao, valor } = await lerJson(request, dividaCriarSchema);

    const divida = await db.dividaAvulsa.create({
      // Um dos dois identifica o devedor — o refine do schema já garante que ao
      // menos um veio preenchido.
      data: {
        clienteId: clienteId ?? null,
        devedorNome: clienteId ? null : (devedorNome ?? null),
        descricao,
        valor,
      },
    });

    return NextResponse.json(divida, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    return NextResponse.json({ error: "Erro ao criar dívida" }, { status: 500 });
  }
}
