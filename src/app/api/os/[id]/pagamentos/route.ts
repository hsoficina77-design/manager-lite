import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalcularPagamento } from "@/lib/pagamentos";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ordemId } = await params;

  try {
    const body = await request.json();
    const { valor, formaPagamento, obs } = body;

    if (!valor || Number(valor) <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser maior que zero" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const pagamento = await tx.pagamentoOS.create({
        data: {
          ordemId,
          valor: Number(valor),
          formaPagamento: formaPagamento || "DINHEIRO",
          obs: obs?.trim() || null,
        },
      });

      const os = await tx.ordemServico.findUnique({
        where: { id: ordemId },
        select: { total: true, valorPago: true },
      });

      if (!os) throw new Error("OS não encontrada");

      const novoValorPago = os.valorPago + Number(valor);
      const pago = novoValorPago >= os.total;

      await tx.ordemServico.update({
        where: { id: ordemId },
        data: { valorPago: novoValorPago, pago },
      });

      return pagamento;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento" },
      { status: 500 }
    );
  }
}

// Estorna todos os pagamentos da OS — desmarca como recebido de uma vez.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ordemId } = await params;

  try {
    const os = await prisma.ordemServico.findUnique({
      where: { id: ordemId },
      select: { id: true },
    });
    if (!os) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.pagamentoOS.deleteMany({ where: { ordemId } });
      return recalcularPagamento(tx, ordemId);
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao estornar pagamentos" },
      { status: 500 }
    );
  }
}
