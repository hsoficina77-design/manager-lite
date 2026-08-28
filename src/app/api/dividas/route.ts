import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { dividaCriarSchema } from "@/lib/schemas";

export async function GET() {
  const dividas = await prisma.dividaAvulsa.findMany({
    where: { pago: false },
    include: { cliente: { select: { id: true, nome: true, telefone: true, apelido: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(dividas);
}

export async function POST(request: Request) {
  try {
    const { clienteId, descricao, valor } = await lerJson(request, dividaCriarSchema);

    const divida = await prisma.dividaAvulsa.create({
      data: { clienteId, descricao, valor },
    });

    return NextResponse.json(divida, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    return NextResponse.json({ error: "Erro ao criar dívida" }, { status: 500 });
  }
}
