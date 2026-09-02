import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaReclassificarSchema } from "@/lib/schemas";

/**
 * Troca a categoria de vários lançamentos de uma vez.
 *
 * Existe por causa do balaio "Outros": na hora de lançar, criar uma categoria nova dava
 * mais trabalho do que marcar "Outros", e o mês terminava com um terço do gasto num
 * rótulo que não responde nada. Corrigir um por um, abrindo o modal de cada gasto, é
 * trabalho suficiente para ninguém corrigir.
 *
 * Mexe só nos lançamentos, nunca na regra que gerou algum deles — é a mesma regra da
 * edição de um lançamento de despesa fixa: o que se corrige aqui vale para este mês, e
 * quem muda de vez é a despesa fixa. A tela avisa quando a seleção tem lançamentos de
 * regra para que a escolha seja consciente.
 */
export async function PUT(request: Request) {
  try {
    const { ids, categoriaId } = await lerJson(request, despesaReclassificarSchema);

    const categoria = await prisma.categoriaDespesa.findUnique({
      where: { id: categoriaId },
      select: { id: true },
    });
    if (!categoria) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
    }

    const { count } = await prisma.despesa.updateMany({
      where: { id: { in: ids } },
      data: { categoriaId },
    });

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao reclassificar os gastos" }, { status: 500 });
  }
}
