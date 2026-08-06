import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFotos } from "@/lib/supabase-storage";
import { FOTO_TIPO_VALUES } from "@/lib/constants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const { id, fotoId } = await params;
  try {
    const body = await request.json();
    const foto = await prisma.fotoOS.findUnique({ where: { id: fotoId } });
    if (!foto || foto.ordemId !== id) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }

    // Atualização parcial: legenda e momento são editados em chamadas separadas,
    // então só mexe no que veio no corpo.
    const data: { legenda?: string | null; tipo?: string } = {};
    if ("legenda" in body) {
      data.legenda = typeof body.legenda === "string" ? body.legenda.trim() || null : null;
    }
    if ("tipo" in body) {
      if (!FOTO_TIPO_VALUES.includes(body.tipo)) {
        return NextResponse.json({ error: "Momento da foto inválido" }, { status: 400 });
      }
      data.tipo = body.tipo;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
    }

    const atualizada = await prisma.fotoOS.update({ where: { id: fotoId }, data });
    return NextResponse.json(atualizada);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar foto" }, { status: 500 });
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
