import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaCriarSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pago = searchParams.get("pago");

  const where: Record<string, unknown> = {};
  if (pago === "true") where.pago = true;
  if (pago === "false") where.pago = false;

  const despesas = await prisma.despesa.findMany({
    where,
    orderBy: { vencimento: "asc" },
  });
  return NextResponse.json(despesas);
}

export async function POST(request: Request) {
  try {
    const { categoria, descricao, valor, vencimento, recorrente } = await lerJson(
      request,
      despesaCriarSchema
    );

    const despesa = await prisma.despesa.create({
      data: {
        categoria,
        descricao,
        valor,
        vencimento,
        recorrente: recorrente ?? false,
      },
    });

    return NextResponse.json(despesa, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar despesa" }, { status: 500 });
  }
}
