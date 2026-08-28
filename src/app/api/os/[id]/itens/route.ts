import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { itemAvulsoSchema, valorDoItem } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";

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
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id: ordemId } = await params;

  try {
    const entrada = await lerJson(request, itemAvulsoSchema);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.itemOrdem.create({
        data: {
          ordemId,
          tipo: entrada.tipo,
          descricao: entrada.descricao,
          quantidade: entrada.quantidade,
          valorUnit: entrada.valorUnit,
          valorTotal: valorDoItem(entrada),
          // Operador não vê nem define custo; item lançado por ele entra sem custo.
          custoUnit: guarda.usuario.papel === "ADMIN" ? entrada.custoUnit ?? null : null,
          fornecedor: entrada.fornecedor ?? null,
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

    return NextResponse.json(semFinanceiro(result, guarda.usuario.papel), { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
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
