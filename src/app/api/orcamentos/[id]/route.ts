import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { orcamentoAtualizarSchema, valorDoItem } from "@/lib/schemas";

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
    } = await lerJson(request, orcamentoAtualizarSchema);

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

    let totalPecas = current.totalPecas;
    let totalMO = current.totalMO;

    if (itens) {
      totalPecas = itens.filter((i) => i.tipo === "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      totalMO = itens.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + valorDoItem(i), 0);
    }

    const novoDesconto = desconto !== undefined ? desconto : current.desconto;
    const total = totalPecas + totalMO - novoDesconto;

    const data: Record<string, unknown> = {
      desconto: novoDesconto,
      total,
    };

    if (itens) {
      data.totalPecas = totalPecas;
      data.totalMO = totalMO;
    }

    if (status !== undefined) data.status = status;
    if (clienteId !== undefined) data.clienteId = clienteId;
    if (veiculoId !== undefined) data.veiculoId = veiculoId;
    if (descricao !== undefined) data.descricao = descricao;

    // Dados livres só existem enquanto não há cadastro: vincular o real limpa o rascunho.
    if (clienteId) {
      data.clienteNome = null;
      data.clienteTelefone = null;
    } else {
      if (clienteNome !== undefined) data.clienteNome = clienteNome;
      if (clienteTelefone !== undefined) data.clienteTelefone = clienteTelefone;
    }
    if (veiculoId) data.veiculoDesc = null;
    else if (veiculoDesc !== undefined) data.veiculoDesc = veiculoDesc;
    if (validade !== undefined) data.validade = validade;
    if (obs !== undefined) data.obs = obs;

    if (itens) {
      await prisma.$transaction(async (tx) => {
        await tx.itemOrcamento.deleteMany({ where: { orcamentoId: id } });
        if (itens.length > 0) {
          await tx.itemOrcamento.createMany({
            data: itens.map((i) => ({
              orcamentoId: id,
              tipo: i.tipo,
              descricao: i.descricao,
              quantidade: i.quantidade,
              valorUnit: i.valorUnit,
              valorTotal: valorDoItem(i),
              custoUnit: i.custoUnit ?? null,
              fornecedor: i.fornecedor ?? null,
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
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
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
