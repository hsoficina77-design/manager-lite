import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const orcamento = await prisma.orcamento.findUnique({
    where: { id },
    include: {
      cliente: true,
      veiculo: true,
      ordem: { select: { id: true, numero: true } },
      itens: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json(orcamento);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      status,
      clienteId,
      veiculoId,
      clienteNome,
      clienteTelefone,
      veiculoDesc,
      descricao,
      validade,
      desconto,
      obs,
      itens,
    } = body;

    const current = await prisma.orcamento.findUnique({
      where: { id },
      select: {
        totalPecas: true, totalMO: true, desconto: true,
        clienteId: true, clienteNome: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }

    // O orçamento nunca pode ficar sem nenhuma identificação — cadastro ou texto livre.
    const efetivoClienteId = clienteId !== undefined ? clienteId : current.clienteId;
    const efetivoNome = clienteNome !== undefined ? clienteNome : current.clienteNome;
    if (!efetivoClienteId && !efetivoNome?.trim()) {
      return NextResponse.json(
        { error: "Informe o cliente cadastrado ou ao menos um nome de referência" },
        { status: 400 }
      );
    }

    const temItens = Array.isArray(itens);
    let totalPecas = current.totalPecas;
    let totalMO = current.totalMO;

    if (temItens) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lista = itens as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const valorDoItem = (i: any) =>
        Number(i.valorTotal ?? Number(i.quantidade) * Number(i.valorUnit));
      totalPecas = lista.filter((i) => i.tipo === "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      totalMO = lista.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + valorDoItem(i), 0);
    }

    const novoDesconto = desconto !== undefined ? Number(desconto) : current.desconto;
    const total = totalPecas + totalMO - novoDesconto;

    const data: Record<string, unknown> = {
      desconto: novoDesconto,
      total,
    };

    if (temItens) {
      data.totalPecas = totalPecas;
      data.totalMO = totalMO;
    }

    if (status !== undefined) data.status = status;
    if (clienteId !== undefined) data.clienteId = clienteId || null;
    if (veiculoId !== undefined) data.veiculoId = veiculoId || null;
    if (descricao !== undefined) data.descricao = descricao?.trim() || null;

    // Dados livres só existem enquanto não há cadastro: vincular o real limpa o rascunho.
    if (clienteId) {
      data.clienteNome = null;
      data.clienteTelefone = null;
    } else {
      if (clienteNome !== undefined) data.clienteNome = clienteNome?.trim() || null;
      if (clienteTelefone !== undefined) data.clienteTelefone = clienteTelefone?.trim() || null;
    }
    if (veiculoId) data.veiculoDesc = null;
    else if (veiculoDesc !== undefined) data.veiculoDesc = veiculoDesc?.trim() || null;
    if (validade !== undefined) data.validade = validade ? new Date(validade) : null;
    if (obs !== undefined) data.obs = obs?.trim() || null;

    if (temItens) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lista = itens as any[];
      await prisma.$transaction(async (tx) => {
        await tx.itemOrcamento.deleteMany({ where: { orcamentoId: id } });
        if (lista.length > 0) {
          await tx.itemOrcamento.createMany({
            data: lista.map((i) => ({
              orcamentoId: id,
              tipo: i.tipo || "PECA",
              descricao: String(i.descricao).trim(),
              quantidade: Number(i.quantidade),
              valorUnit: Number(i.valorUnit),
              valorTotal: Number(i.valorTotal ?? Number(i.quantidade) * Number(i.valorUnit)),
              custoUnit: i.custoUnit != null && i.custoUnit !== "" ? Number(i.custoUnit) : null,
              fornecedor: i.fornecedor?.trim() || null,
            })),
          });
        }
        await tx.orcamento.update({ where: { id }, data });
      });
    } else {
      await prisma.orcamento.update({ where: { id }, data });
    }

    const orcamento = await prisma.orcamento.findUnique({ where: { id } });
    return NextResponse.json(orcamento);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.orcamento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir orçamento" }, { status: 500 });
  }
}
