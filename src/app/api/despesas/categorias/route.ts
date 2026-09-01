import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { categoriaDespesaSchema } from "@/lib/schemas";

export async function GET() {
  const categorias = await prisma.categoriaDespesa.findMany({
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
  });
  return NextResponse.json(categorias);
}

export async function POST(request: Request) {
  try {
    const { nome, cor, ordem, ativa } = await lerJson(request, categoriaDespesaSchema);

    // Categoria nova entra no fim da lista sem o dono precisar pensar em ordem.
    const ultima = await prisma.categoriaDespesa.findFirst({
      orderBy: { ordem: "desc" },
      select: { ordem: true },
    });

    const categoria = await prisma.categoriaDespesa.create({
      data: {
        nome,
        cor: cor ?? "#71717a",
        ordem: ordem ?? (ultima ? ultima.ordem + 10 : 10),
        ativa: ativa ?? true,
      },
    });
    return NextResponse.json(categoria, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (temCodigo(err, "P2002")) {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar a categoria" }, { status: 500 });
  }
}

function temCodigo(err: unknown, codigo: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === codigo;
}
