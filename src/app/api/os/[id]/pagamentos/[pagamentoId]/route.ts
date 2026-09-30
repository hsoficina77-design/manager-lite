import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { recalcularPagamento } from "@/lib/pagamentos";

// Estorna um pagamento específico da OS.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; pagamentoId: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;

  const { id: ordemId, pagamentoId } = await params;

  try {
    const pagamento = await db.pagamentoOS.findUnique({
      where: { id: pagamentoId },
      select: { id: true, ordemId: true },
    });

    if (!pagamento || pagamento.ordemId !== ordemId) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    const result = await transacao(async (tx) => {
      await tx.pagamentoOS.delete({ where: { id: pagamentoId } });
      return recalcularPagamento(tx, ordemId);
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
