import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const apenasAtivos = searchParams.get("ativo") === "true";

  const mecanicos = await prisma.mecanico.findMany({
    where: apenasAtivos ? { ativo: true } : undefined,
    orderBy: { nome: "asc" },
    include: { _count: { select: { ordens: true } } },
  });

  return NextResponse.json(mecanicos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, telefone, especialidade } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const mecanico = await prisma.mecanico.create({
      data: {
        nome: nome.trim(),
        telefone: telefone?.trim() || null,
        especialidade: especialidade?.trim() || null,
      },
    });

    return NextResponse.json(mecanico, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar mecânico" }, { status: 500 });
  }
}
