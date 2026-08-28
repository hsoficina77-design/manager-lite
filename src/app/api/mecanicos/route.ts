import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { mecanicoCriarSchema } from "@/lib/schemas";

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
    const { nome, telefone, especialidade } = await lerJson(request, mecanicoCriarSchema);

    const mecanico = await prisma.mecanico.create({
      data: {
        nome,
        telefone: telefone ?? null,
        especialidade: especialidade ?? null,
      },
    });

    return NextResponse.json(mecanico, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar mecânico" }, { status: 500 });
  }
}
