import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const alvo = Number(body.valorAlvo);
    if (!alvo || alvo <= 0) {
      await prisma.meta.delete({ where: { id } });
      return NextResponse.json({ ok: true, removed: true });
    }
    const meta = await prisma.meta.update({
      where: { id },
      data: { valorAlvo: alvo },
    });
    return NextResponse.json(meta);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.meta.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 });
  }
}
