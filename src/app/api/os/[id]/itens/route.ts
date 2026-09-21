import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { itemAvulsoSchema, valorDoItem } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";
import { consomeEstoque } from "@/lib/constants";
import { aplicarConsumo, consumoLiquido, produtosDosItens, vinculoDoItem } from "@/lib/estoque";

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

    const produtos = await produtosDosItens([entrada]);
    const produtoId = vinculoDoItem(entrada, produtos);

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.itemOrdem.create({
        data: {
          ordemId,
          produtoId,
          tipo: entrada.tipo,
          descricao: entrada.descricao,
          quantidade: entrada.quantidade,
          valorUnit: entrada.valorUnit,
          valorTotal: valorDoItem(entrada),
          // Quem não vê financeiro também não define custo; item lançado por essa
          // pessoa entra sem custo — a não ser que a peça tenha saído do estoque, e
          // aí o custo é o do produto (ver lib/custos).
          custoUnit:
            (guarda.usuario.podeFinanceiro ? entrada.custoUnit ?? null : null) ??
            (produtoId ? produtos.get(produtoId)!.custoUnit : null),
          fornecedor: entrada.fornecedor ?? null,
        },
      });

      const itens = await tx.itemOrdem.findMany({ where: { ordemId } });
      const os = await tx.ordemServico.findUnique({
        where: { id: ordemId },
        select: { desconto: true, numero: true, status: true },
      });
      const desconto = os?.desconto ?? 0;
      const calc = recalcOS(itens, desconto);

      await tx.ordemServico.update({ where: { id: ordemId }, data: calc });

      if (os && consomeEstoque(os.status)) {
        await aplicarConsumo(tx, consumoLiquido([], [{ produtoId, quantidade: entrada.quantidade }]), {
          ordemId,
          ordemNumero: os.numero,
          usuarioNome: guarda.usuario.nome,
        });
      }

      return item;
    });

    return NextResponse.json(semFinanceiro(result, guarda.usuario.podeFinanceiro), { status: 201 });
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
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id: ordemId } = await params;
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId é obrigatório" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // O item precisa ser lido antes de sumir: é dele que sai a peça a devolver.
      const removido = await tx.itemOrdem.findUnique({
        where: { id: itemId },
        select: { produtoId: true, quantidade: true },
      });

      await tx.itemOrdem.delete({ where: { id: itemId } });

      const itens = await tx.itemOrdem.findMany({ where: { ordemId } });
      const os = await tx.ordemServico.findUnique({
        where: { id: ordemId },
        select: { desconto: true, numero: true, status: true },
      });
      const desconto = os?.desconto ?? 0;
      const calc = recalcOS(itens, desconto);

      await tx.ordemServico.update({ where: { id: ordemId }, data: calc });

      if (removido && os && consomeEstoque(os.status)) {
        await aplicarConsumo(tx, consumoLiquido([removido], []), {
          ordemId,
          ordemNumero: os.numero,
          usuarioNome: guarda.usuario.nome,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao remover item" }, { status: 500 });
  }
}
