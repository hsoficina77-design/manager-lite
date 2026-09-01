import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaRecorrenteCriarSchema } from "@/lib/schemas";
import { INCLUDE_CATEGORIA } from "@/lib/despesas";

export async function GET() {
  const regras = await prisma.despesaRecorrente.findMany({
    include: INCLUDE_CATEGORIA,
    orderBy: [{ ativa: "desc" }, { diaVencimento: "asc" }],
  });
  return NextResponse.json(regras);
}

/**
 * Cadastra uma despesa fixa. Os lançamentos de cada mês não são criados aqui: nascem
 * quando o mês é aberto (`lib/despesas.garantirLancamentos`), o que mantém a regra
 * como fonte única e evita gerar anos de linhas que ninguém pediu.
 */
export async function POST(request: Request) {
  try {
    const dados = await lerJson(request, despesaRecorrenteCriarSchema);

    if (dados.fim && dados.fim < dados.inicio) {
      return NextResponse.json(
        { error: "O mês final não pode ser anterior ao mês de início" },
        { status: 400 }
      );
    }

    const regra = await prisma.despesaRecorrente.create({
      data: {
        categoriaId: dados.categoriaId,
        descricao: dados.descricao,
        valor: dados.valor,
        fornecedor: dados.fornecedor ?? null,
        diaVencimento: dados.diaVencimento,
        periodicidade: dados.periodicidade,
        inicio: dados.inicio,
        fim: dados.fim ?? null,
        ativa: dados.ativa ?? true,
        observacao: dados.observacao ?? null,
      },
      include: INCLUDE_CATEGORIA,
    });

    return NextResponse.json(regra, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar a despesa fixa" }, { status: 500 });
  }
}
