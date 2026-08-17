import type { Prisma } from "@prisma/client";

/**
 * Recalcula valorPago/pago da OS a partir dos pagamentos que sobraram.
 * Usado no estorno — a soma dos PagamentoOS é a fonte da verdade.
 */
export async function recalcularPagamento(
  tx: Prisma.TransactionClient,
  ordemId: string
) {
  const os = await tx.ordemServico.findUnique({
    where: { id: ordemId },
    select: { total: true },
  });
  if (!os) throw new Error("OS não encontrada");

  const soma = await tx.pagamentoOS.aggregate({
    where: { ordemId },
    _sum: { valor: true },
  });

  const valorPago = soma._sum.valor ?? 0;
  // Sem nenhum pagamento a OS nunca fica quitada, mesmo com total zerado.
  const pago = valorPago > 0 && valorPago >= os.total;

  return tx.ordemServico.update({
    where: { id: ordemId },
    data: {
      valorPago,
      pago,
      // Some a forma de pagamento quando não sobrou pagamento nenhum.
      ...(valorPago === 0 ? { formaPagamento: null } : {}),
    },
    select: { id: true, total: true, valorPago: true, pago: true },
  });
}

/** Mesma lógica de estorno, para dívidas avulsas. */
export async function recalcularPagamentoDivida(
  tx: Prisma.TransactionClient,
  dividaId: number
) {
  const divida = await tx.dividaAvulsa.findUnique({
    where: { id: dividaId },
    select: { valor: true },
  });
  if (!divida) throw new Error("Dívida não encontrada");

  const soma = await tx.pagamentoDivida.aggregate({
    where: { dividaId },
    _sum: { valor: true },
  });

  const valorPago = soma._sum.valor ?? 0;
  const pago = valorPago > 0 && valorPago >= divida.valor;

  return tx.dividaAvulsa.update({
    where: { id: dividaId },
    data: { valorPago, pago },
    select: { id: true, valor: true, valorPago: true, pago: true },
  });
}
