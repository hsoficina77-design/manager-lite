import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function recalcOS(itens: { tipo: string; valorTotal: number; custoUnit: number | null; quantidade: number }[], desconto: number) {
  const totalPecas = itens.filter((i) => i.tipo === "PECA").reduce((s, i) => s + i.valorTotal, 0);
  const totalMO = itens.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + i.valorTotal, 0);
  const custoTotalPecas = itens
    .filter((i) => i.tipo === "PECA")
    .reduce((s, i) => s + (i.custoUnit ?? 0) * i.quantidade, 0);
  const total = totalPecas + totalMO - desconto;
  const lucroReal = total - custoTotalPecas;
  const margemPecas = totalPecas > 0 ? ((totalPecas - custoTotalPecas) / totalPecas) * 100 : 0;
  return { totalPecas, totalMO, custoTotalPecas, total, lucroReal, margemPecas };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ordemId } = await params;

  try {
    const body = await request.json();
    const { tipo, descricao, quantidade, valorUnit, custoUnit, fornecedor } = body;

    if (!descricao?.trim() || !quantidade || !valorUnit) {
      return NextResponse.json(
        { error: "Descrição, quantidade e valor unitário são obrigatórios" },
        { status: 400 }
      );
    }

    const valorTotal = Number(quantidade) * Number(valorUnit);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.itemOrdem.create({
        data: {
          ordemId,
          tipo: tipo || "PECA",
          descricao: descricao.trim(),
          quantidade: Number(quantidade),
          valorUnit: Number(valorUnit),
          valorTotal,
          custoUnit: custoUnit ? Number(custoUnit) : null,
          fornecedor: fornecedor?.trim() || null,
        },
      });

      const itens = await tx.itemOrdem.findMany({ where: { ordemId } });
      const os = await tx.ordemServico.findUnique({
        where: { id: ordemId },
        select: { desconto: true },
      });
      const desconto = os?.desconto ?? 0;
      const calc = recalcOS(itens, desconto);

      await tx.ordemServico.update({ where: { id: ordemId }, data: calc });

      return item;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao adicionar item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ordemId } = await params;
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId é obrigatório" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.itemOrdem.delete({ where: { id: itemId } });

      const itens = await tx.itemOrdem.findMany({ where: { ordemId } });
      const os = await tx.ordemServico.findUnique({
        where: { id: ordemId },
        select: { desconto: true },
      });
      const desconto = os?.desconto ?? 0;
      const calc = recalcOS(itens, desconto);

      await tx.ordemServico.update({ where: { id: ordemId }, data: calc });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover item" }, { status: 500 });
  }
}
