import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { descricao, valor } = body;

    const divida = await prisma.dividaAvulsa.update({
      where: { id: Number(id) },
      data: {
        ...(descricao !== undefined && { descricao: descricao.trim() }),
        ...(valor !== undefined && { valor: Number(valor) }),
      },
    });

    return NextResponse.json(divida);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar dívida" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const count = await prisma.pagamentoDivida.count({ where: { dividaId: Number(id) } });
    if (count > 0) {
      return NextResponse.json({ error: "Dívida já possui pagamentos e não pode ser excluída" }, { status: 409 });
    }

    await prisma.dividaAvulsa.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir dívida" }, { status: 500 });
  }
}
