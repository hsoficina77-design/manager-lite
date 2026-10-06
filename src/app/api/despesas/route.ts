import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaCriarSchema } from "@/lib/schemas";
import { INCLUDE_CATEGORIA, dividirEmParcelas, mesDeGastos } from "@/lib/despesas";
import { competenciaDe } from "@/lib/periodo";

/**
 * Lançamentos de um mês (`?mes=AAAA-MM`; sem o parâmetro, o mês corrente).
 *
 * Ler o mês é o que materializa os lançamentos das despesas fixas dele — por isso a
 * leitura pode escrever. É o que substitui o job de fundo que este app não tem.
 */
export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { searchParams } = new URL(request.url);
  const { janela, lancamentos } = await mesDeGastos(guarda.db, searchParams.get("mes") ?? undefined);
  return NextResponse.json({ mes: janela.label, lancamentos });
}

/**
 * Gasto avulso — o que não tem regra: uma peça de fornecedor, um conserto do portão.
 * Com `parcelas` > 1 é uma compra dividida: `valor` é o total e vira N lançamentos.
 */
export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  try {
    const dados = await lerJson(request, despesaCriarSchema);

    if (dados.parcelas && dados.parcelas > 1) {
      if (Math.round(dados.valor * 100) < dados.parcelas) {
        return NextResponse.json(
          { error: "O valor total é pequeno demais para tantas parcelas" },
          { status: 400 }
        );
      }
      // Um INSERT só: ou nascem todas as parcelas, ou nenhuma — metade de um
      // parcelamento no banco seria pior do que o erro.
      const parcelamentoId = randomUUID();
      const partes = dividirEmParcelas(
        dados.valor,
        dados.parcelas,
        dados.vencimento,
        dados.intervalo ?? "SEMANAL"
      );
      await db.despesa.createMany({
        data: partes.map((p) => ({
          categoriaId: dados.categoriaId,
          descricao: dados.descricao,
          valor: p.valor,
          vencimento: p.vencimento,
          competencia: competenciaDe(p.vencimento),
          fornecedor: dados.fornecedor ?? null,
          observacao: dados.observacao ?? null,
          parcelamentoId,
          parcela: p.parcela,
          parcelas: dados.parcelas,
        })),
      });
      return NextResponse.json({ parcelamentoId, parcelas: partes.length }, { status: 201 });
    }

    const despesa = await db.despesa.create({
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
