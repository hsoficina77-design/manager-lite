import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { categoriaDespesaAtualizarSchema } from "@/lib/schemas";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const dados = await lerJson(request, categoriaDespesaAtualizarSchema);

    const data: Record<string, unknown> = {};
    if (dados.nome !== undefined) data.nome = dados.nome;
    if (dados.cor !== undefined) data.cor = dados.cor;
    if (dados.ordem !== undefined) data.ordem = dados.ordem;
    if (dados.ativa !== undefined) data.ativa = dados.ativa;

    const categoria = await prisma.categoriaDespesa.update({ where: { id }, data });
    return NextResponse.json(categoria);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (temCodigo(err, "P2002")) {
      return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 409 });
    }
    if (temCodigo(err, "P2025")) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar a categoria" }, { status: 500 });
  }
}

/**
 * Excluir só a categoria que nunca foi usada.
 *
 * Apagar uma categoria com histórico deixaria gastos passados órfãos e mudaria o total
 * de meses já fechados. Quem quer parar de usar desativa: some dos formulários e o
 * histórico continua legível.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [gastos, regras] = await Promise.all([
      prisma.despesa.count({ where: { categoriaId: id } }),
      prisma.despesaRecorrente.count({ where: { categoriaId: id } }),
    ]);

    if (gastos > 0 || regras > 0) {
      return NextResponse.json(
        {
          error:
            "Esta categoria já tem gastos lançados. Desative-a para parar de usá-la sem apagar o histórico.",
          emUso: { gastos, regras },
        },
        { status: 409 }
      );
    }

    await prisma.categoriaDespesa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (temCodigo(err, "P2025")) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir a categoria" }, { status: 500 });
  }
}

function temCodigo(err: unknown, codigo: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === codigo;
}
