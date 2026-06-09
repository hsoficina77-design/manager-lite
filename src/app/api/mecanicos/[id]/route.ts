import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const mecanico = await prisma.mecanico.findUnique({
    where: { id },
    include: {
      metas: { orderBy: [{ ano: "desc" }, { mes: "desc" }] },
      _count: { select: { ordens: true } },
    },
  });

  if (!mecanico) {
    return NextResponse.json({ error: "Mecânico não encontrado" }, { status: 404 });
  }

  return NextResponse.json(mecanico);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { nome, telefone, especialidade, ativo } = body;

    const data: Record<string, unknown> = {};
    if (nome !== undefined) {
      if (!nome?.trim()) {
        return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
      }
      data.nome = nome.trim();
    }
    if (telefone !== undefined) data.telefone = telefone?.trim() || null;
    if (especialidade !== undefined) data.especialidade = especialidade?.trim() || null;
    if (ativo !== undefined) data.ativo = Boolean(ativo);

    const mecanico = await prisma.mecanico.update({ where: { id }, data });

    // Mantém o nome denormalizado nas OS sincronizado quando o nome muda.
    if (data.nome) {
      await prisma.ordemServico.updateMany({
        where: { mecanicoId: id },
        data: { mecanico: data.nome as string },
      });
    }

    return NextResponse.json(mecanico);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar mecânico" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const ordens = await prisma.ordemServico.count({ where: { mecanicoId: id } });
    if (ordens > 0) {
      return NextResponse.json(
        { error: "Mecânico possui OS vinculadas. Desative-o em vez de excluir." },
        { status: 409 }
      );
    }
    await prisma.mecanico.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir mecânico" }, { status: 500 });
  }
}
