import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();
    const { categoria, descricao, valor, vencimento, recorrente } = body;

    if (!categoria || !descricao?.trim() || !valor || !vencimento) {
      return NextResponse.json(
        { error: "Categoria, descrição, valor e vencimento são obrigatórios" },
        { status: 400 }
      );
    }

    const despesa = await prisma.despesa.create({
      data: {
        categoria,
        descricao: descricao.trim(),
        valor: Number(valor),
        vencimento: new Date(vencimento),
        recorrente: Boolean(recorrente),
      },
    });

    return NextResponse.json(despesa, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar despesa" }, { status: 500 });
  }
}
