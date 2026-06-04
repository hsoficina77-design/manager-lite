import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();
    const { clienteId, descricao, valor } = body;

    if (!clienteId || !descricao?.trim() || !valor) {
      return NextResponse.json({ error: "clienteId, descrição e valor são obrigatórios" }, { status: 400 });
    }

    const divida = await prisma.dividaAvulsa.create({
      data: {
        clienteId,
        descricao: descricao.trim(),
        valor: Number(valor),
      },
    });

    return NextResponse.json(divida, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar dívida" }, { status: 500 });
  }
}
