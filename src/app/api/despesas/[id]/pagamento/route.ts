import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaPagamentoSchema } from "@/lib/schemas";
import { INCLUDE_CATEGORIA } from "@/lib/despesas";

/**
 * Baixa (e estorno) do pagamento.
 *
 * Rota própria porque pagar não é editar: a tela quita com um clique, sem abrir
 * formulário, e o campo que muda — quanto saiu de fato — não é o valor previsto.
 * Sem `valorPago`, pagou o previsto; com ele, é a conta de luz que veio diferente.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { pago, valorPago, pagoEm, formaPagamento } = await lerJson(
      request,
      despesaPagamentoSchema
    );

    const atual = await prisma.despesa.findUnique({ where: { id } });
    if (!atual) {
      return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
    }

    const despesa = await prisma.despesa.update({
      where: { id },
      data: pago
        ? {
            pago: true,
            valorPago: valorPago ?? atual.valorPago ?? atual.valor,
            pagoEm: pagoEm ?? atual.pagoEm ?? new Date(),
            formaPagamento: formaPagamento ?? atual.formaPagamento,
            // Quitar traz de volta o que estava marcado como "não teve este mês":
            // se está sendo pago, teve.
            cancelado: false,
          }
        : { pago: false, valorPago: null, pagoEm: null, formaPagamento: null },
      include: INCLUDE_CATEGORIA,
    });

    return NextResponse.json(despesa);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao registrar o pagamento" }, { status: 500 });
  }
}
