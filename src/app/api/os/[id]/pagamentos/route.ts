import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { recalcularPagamento } from "@/lib/pagamentos";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { pagamentoSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;

  const { id: ordemId } = await params;

  try {
    const { valor, formaPagamento, obs } = await lerJson(request, pagamentoSchema);

    const existe = await db.ordemServico.findUnique({ where: { id: ordemId }, select: { id: true } });
    if (!existe) return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });

    const result = await transacao(async (tx) => {
      const pagamento = await tx.pagamentoOS.create({
        data: {
          ordemId,
          valor,
          formaPagamento,
          obs: obs ?? null,
        },
      });

      const os = await tx.ordemServico.findUnique({
        where: { id: ordemId },
        select: { total: true, valorPago: true },
      });

      if (!os) throw new Error("OS não encontrada");

      const novoValorPago = os.valorPago + valor;
      const pago = novoValorPago >= os.total;

      await tx.ordemServico.update({
        where: { id: ordemId },
        data: { valorPago: novoValorPago, pago },
      });

      return pagamento;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
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
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;

  const { id: ordemId } = await params;

  try {
    const os = await db.ordemServico.findUnique({
      where: { id: ordemId },
      select: { id: true },
    });
    if (!os) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    const result = await transacao(async (tx) => {
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
