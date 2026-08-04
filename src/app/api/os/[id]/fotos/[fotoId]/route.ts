import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFotos } from "@/lib/supabase-storage";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const { id, fotoId } = await params;
  try {
    const { legenda } = await request.json();
    const foto = await prisma.fotoOS.findUnique({ where: { id: fotoId } });
    if (!foto || foto.ordemId !== id) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }
    const atualizada = await prisma.fotoOS.update({
      where: { id: fotoId },
      data: { legenda: typeof legenda === "string" ? legenda.trim() || null : null },
    });
    return NextResponse.json(atualizada);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar legenda" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const { id, fotoId } = await params;
  try {
    const foto = await prisma.fotoOS.findUnique({ where: { id: fotoId } });
    if (!foto || foto.ordemId !== id) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }
    await prisma.fotoOS.delete({ where: { id: fotoId } });
    await deleteFotos([foto.path]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir foto" }, { status: 500 });
  }
}
