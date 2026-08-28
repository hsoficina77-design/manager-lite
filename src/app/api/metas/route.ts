import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { metaCriarSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mecanicoId = searchParams.get("mecanicoId");
  const ano = searchParams.get("ano");
  const mes = searchParams.get("mes");

  const where: Record<string, unknown> = {};
  if (mecanicoId) where.mecanicoId = mecanicoId;
  if (ano) where.ano = Number(ano);
  if (mes) where.mes = Number(mes);

  const metas = await prisma.meta.findMany({
    where,
    orderBy: [{ ano: "desc" }, { mes: "desc" }],
  });

  return NextResponse.json(metas);
}

// Upsert de meta por (mecanicoId, ano, mes). valorAlvo <= 0 remove a meta.
export async function POST(request: Request) {
  try {
    const { mecanicoId, ano, mes, valorAlvo: alvo } = await lerJson(request, metaCriarSchema);

    const chave = { mecanicoId, ano, mes };

    if (alvo <= 0) {
      await prisma.meta.deleteMany({ where: chave });
      return NextResponse.json({ ok: true, removed: true });
    }

    const meta = await prisma.meta.upsert({
      where: { mecanicoId_ano_mes: chave },
      update: { valorAlvo: alvo },
      create: { ...chave, valorAlvo: alvo },
    });

    return NextResponse.json(meta, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar meta" }, { status: 500 });
  }
}
