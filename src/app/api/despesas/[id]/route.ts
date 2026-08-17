import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { categoria, descricao, valor, vencimento, recorrente, pago } = body;

    const atual = await prisma.despesa.findUnique({ where: { id } });
    if (!atual) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (categoria !== undefined) data.categoria = categoria;
    if (descricao !== undefined) data.descricao = descricao.trim();
    if (valor !== undefined) data.valor = Number(valor);
    if (vencimento !== undefined) data.vencimento = new Date(vencimento);
    if (recorrente !== undefined) data.recorrente = Boolean(recorrente);

    const marcandoComoPaga = pago === true && !atual.pago;
    if (pago !== undefined) {
      data.pago = Boolean(pago);
      data.pagoEm = pago ? new Date() : null;
    }

    const despesa = await prisma.$transaction(async (tx) => {
      const atualizada = await tx.despesa.update({ where: { id }, data });

      // Despesa recorrente quitada: já deixa a próxima ocorrência lançada.
      if (marcandoComoPaga && atualizada.recorrente) {
        const proximoVencimento = new Date(atualizada.vencimento);
        proximoVencimento.setMonth(proximoVencimento.getMonth() + 1);
        await tx.despesa.create({
          data: {
            categoria: atualizada.categoria,
            descricao: atualizada.descricao,
            valor: atualizada.valor,
            vencimento: proximoVencimento,
            recorrente: true,
          },
        });
      }

      return atualizada;
    });

    return NextResponse.json(despesa);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar despesa" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.despesa.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir despesa" }, { status: 500 });
  }
}
