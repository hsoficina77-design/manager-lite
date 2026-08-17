import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalcularPagamentoDivida } from "@/lib/pagamentos";

// Estorna um pagamento específico da dívida avulsa.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pagamentoId: string }> }
) {
  const { id, pagamentoId } = await params;
  const dividaId = Number(id);

  try {
    const pagamento = await prisma.pagamentoDivida.findUnique({
      where: { id: Number(pagamentoId) },
      select: { id: true, dividaId: true },
    });

    if (!pagamento || pagamento.dividaId !== dividaId) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.pagamentoDivida.delete({ where: { id: Number(pagamentoId) } });
      return recalcularPagamentoDivida(tx, dividaId);
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao estornar pagamento" },
      { status: 500 }
    );
  }
}
