import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { pagamentoSchema } from "@/lib/schemas";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pagamentos = await prisma.pagamentoDivida.findMany({
    where: { dividaId: Number(id) },
    orderBy: { data: "desc" },
  });
  return NextResponse.json(pagamentos);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { valor, formaPagamento, obs } = await lerJson(request, pagamentoSchema);

    const result = await prisma.$transaction(async (tx) => {
      const pagamento = await tx.pagamentoDivida.create({
        data: {
          dividaId: Number(id),
          valor,
          formaPagamento,
          obs: obs ?? null,
        },
      });

      const divida = await tx.dividaAvulsa.findUnique({
        where: { id: Number(id) },
        select: { valor: true, valorPago: true },
      });

      if (!divida) throw new Error("Dívida não encontrada");

      const novoValorPago = divida.valorPago + valor;
      const pago = novoValorPago >= divida.valor;

      await tx.dividaAvulsa.update({
        where: { id: Number(id) },
        data: { valorPago: novoValorPago, pago },
      });

      return pagamento;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao registrar pagamento" }, { status: 500 });
  }
}
