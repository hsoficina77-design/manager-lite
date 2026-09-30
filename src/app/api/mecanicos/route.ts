import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { mecanicoCriarSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  const { searchParams } = new URL(request.url);
  const apenasAtivos = searchParams.get("ativo") === "true";

  const mecanicos = await db.mecanico.findMany({
    where: apenasAtivos ? { ativo: true } : undefined,
    orderBy: { nome: "asc" },
    include: { _count: { select: { ordens: true } } },
  });

  return NextResponse.json(mecanicos);
}

export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  try {
    const { nome, telefone, especialidade } = await lerJson(request, mecanicoCriarSchema);

    const mecanico = await db.mecanico.create({
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
