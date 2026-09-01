import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaAtualizarSchema } from "@/lib/schemas";
import { INCLUDE_CATEGORIA } from "@/lib/despesas";
import { competenciaDe } from "@/lib/periodo";

/**
 * Edita um lançamento — inclusive um gerado por regra: a conta de luz de agosto veio
 * R$ 80 acima do previsto e é agosto que muda, não a regra.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const dados = await lerJson(request, despesaAtualizarSchema);

    const data: Record<string, unknown> = {};
    if (dados.categoriaId !== undefined) data.categoriaId = dados.categoriaId;
    if (dados.descricao !== undefined) data.descricao = dados.descricao;
    if (dados.valor !== undefined) data.valor = dados.valor;
    if (dados.fornecedor !== undefined) data.fornecedor = dados.fornecedor;
    if (dados.observacao !== undefined) data.observacao = dados.observacao;
    if (dados.cancelado !== undefined) data.cancelado = dados.cancelado;
    if (dados.vencimento !== undefined) {
      data.vencimento = dados.vencimento;
      // O mês do gasto acompanha o vencimento: adiar um boleto de 30/08 para 02/09 o
      // move para setembro, senão ele ficaria contado num mês e vencendo em outro.
      data.competencia = competenciaDe(dados.vencimento);
    }

    const despesa = await prisma.despesa.update({
      where: { id },
      data,
      include: INCLUDE_CATEGORIA,
    });
    return NextResponse.json(despesa);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (temCodigo(err, "P2025")) {
      return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
    }
    // Mover um lançamento de regra para um mês que já tem o dele bate na chave única.
    if (temCodigo(err, "P2002")) {
      return NextResponse.json(
        { error: "Já existe o lançamento desta despesa fixa no mês de destino" },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar o gasto" }, { status: 500 });
  }
}

/**
 * Tira o gasto do mês.
 *
 * Avulso some de vez. O que veio de uma despesa fixa vira lápide (`cancelado`) em vez
 * de sumir: apagar a linha faria a regra recriar o lançamento na próxima vez que o mês
 * fosse aberto, e o dono ficaria excluindo a mesma conta para sempre.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const atual = await prisma.despesa.findUnique({
      where: { id },
      select: { recorrenteId: true },
    });
    if (!atual) {
      return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
    }

    if (atual.recorrenteId) {
      await prisma.despesa.update({
        where: { id },
        data: { cancelado: true, pago: false, valorPago: null, pagoEm: null, formaPagamento: null },
      });
      return NextResponse.json({ ok: true, cancelado: true });
    }

    await prisma.despesa.delete({ where: { id } });
    return NextResponse.json({ ok: true, cancelado: false });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir o gasto" }, { status: 500 });
  }
}

function temCodigo(err: unknown, codigo: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === codigo;
}
