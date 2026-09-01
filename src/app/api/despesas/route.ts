import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaCriarSchema } from "@/lib/schemas";
import { INCLUDE_CATEGORIA, mesDeGastos } from "@/lib/despesas";
import { competenciaDe } from "@/lib/periodo";

/**
 * Lançamentos de um mês (`?mes=AAAA-MM`; sem o parâmetro, o mês corrente).
 *
 * Ler o mês é o que materializa os lançamentos das despesas fixas dele — por isso a
 * leitura pode escrever. É o que substitui o job de fundo que este app não tem.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { janela, lancamentos } = await mesDeGastos(searchParams.get("mes") ?? undefined);
  return NextResponse.json({ mes: janela.label, lancamentos });
}

/** Gasto avulso — o que não tem regra: uma peça de fornecedor, um conserto do portão. */
export async function POST(request: Request) {
  try {
    const dados = await lerJson(request, despesaCriarSchema);

    const despesa = await prisma.despesa.create({
      data: {
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        vencimento: dados.vencimento,
        competencia: competenciaDe(dados.vencimento),
        fornecedor: dados.fornecedor ?? null,
        observacao: dados.observacao ?? null,
      },
      include: INCLUDE_CATEGORIA,
    });

    return NextResponse.json(despesa, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o gasto" }, { status: 500 });
  }
}
