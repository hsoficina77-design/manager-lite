import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const os = await prisma.ordemServico.findUnique({
    where: { id },
    include: {
      cliente: true,
      veiculo: true,
      itens: { orderBy: { createdAt: "asc" } },
      pagamentos: { orderBy: { data: "desc" } },
    },
  });

  if (!os) {
    return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
  }

  return NextResponse.json(os);
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
      descricao,
      defeitoRelatado,
      kmEntrada,
      kmSaida,
      desconto,
      obs,
      formaPagamento,
      mecanicoId,
      nivelCombustivel,
      combustivelEmUso,
      nps,
      itens,
    } = body;

    const current = await prisma.ordemServico.findUnique({
      where: { id },
      select: { totalPecas: true, totalMO: true, desconto: true, custoTotalPecas: true, valorPago: true },
    });

    if (!current) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    // Quando os itens são enviados (edição completa), recalcula os totais a partir deles.
    const temItens = Array.isArray(itens);
    let totalPecas = current.totalPecas;
    let totalMO = current.totalMO;
    let custoTotalPecas = current.custoTotalPecas;

    if (temItens) {
      const lista = itens as any[];
      const valorDoItem = (i: any) => Number(i.valorTotal ?? Number(i.quantidade) * Number(i.valorUnit));
      totalPecas = lista.filter((i) => i.tipo === "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      totalMO = lista.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      custoTotalPecas = lista
        .filter((i) => i.tipo === "PECA")
        .reduce((s, i) => s + Number(i.custoUnit || 0) * Number(i.quantidade), 0);
    }

    const novoDesconto = desconto !== undefined ? Number(desconto) : current.desconto;
    const total = totalPecas + totalMO - novoDesconto;
    const lucroReal = total - custoTotalPecas;
    const margemPecas = totalPecas > 0
      ? ((totalPecas - custoTotalPecas) / totalPecas) * 100
      : 0;

    const data: Record<string, unknown> = {
      desconto: novoDesconto,
      total,
      lucroReal,
      margemPecas,
    };

    if (temItens) {
      data.totalPecas = totalPecas;
      data.totalMO = totalMO;
      data.custoTotalPecas = custoTotalPecas;
      // O total mudou — recalcula se a OS está quitada.
      data.pago = current.valorPago >= total;
    }

    if (status !== undefined) data.status = status;
    if (clienteId !== undefined) data.clienteId = clienteId;
    if (veiculoId !== undefined) data.veiculoId = veiculoId;
    if (descricao !== undefined) data.descricao = descricao.trim();
    if (defeitoRelatado !== undefined) data.defeitoRelatado = defeitoRelatado?.trim() || null;
    if (kmEntrada !== undefined) data.kmEntrada = kmEntrada ? Number(kmEntrada) : null;
    if (kmSaida !== undefined) data.kmSaida = kmSaida ? Number(kmSaida) : null;
    if (obs !== undefined) data.obs = obs?.trim() || null;
    if (formaPagamento !== undefined) data.formaPagamento = formaPagamento || null;
    if (mecanicoId !== undefined) {
      data.mecanicoId = mecanicoId || null;
      const mec = mecanicoId
        ? await prisma.mecanico.findUnique({ where: { id: mecanicoId }, select: { nome: true } })
        : null;
      data.mecanico = mec?.nome ?? null;
    }
    if (nivelCombustivel !== undefined) data.nivelCombustivel = nivelCombustivel || null;
    if (combustivelEmUso !== undefined) data.combustivelEmUso = combustivelEmUso || null;
    if (nps !== undefined) data.nps = nps ? Number(nps) : null;

    if (status === "ENTREGUE" || status === "FECHADA") {
      data.fechamento = new Date();
    }

    if (temItens) {
      const lista = itens as any[];
      await prisma.$transaction(async (tx) => {
        await tx.itemOrdem.deleteMany({ where: { ordemId: id } });
        if (lista.length > 0) {
          await tx.itemOrdem.createMany({
            data: lista.map((i) => ({
              ordemId: id,
              tipo: i.tipo || "PECA",
              descricao: String(i.descricao).trim(),
              quantidade: Number(i.quantidade),
              valorUnit: Number(i.valorUnit),
              valorTotal: Number(i.valorTotal ?? Number(i.quantidade) * Number(i.valorUnit)),
              custoUnit: i.custoUnit ? Number(i.custoUnit) : null,
              fornecedor: i.fornecedor?.trim() || null,
            })),
          });
        }
        await tx.ordemServico.update({ where: { id }, data });
      });
    } else {
      await prisma.ordemServico.update({ where: { id }, data });
    }

    const os = await prisma.ordemServico.findUnique({ where: { id } });
    return NextResponse.json(os);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar OS" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.ordemServico.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir OS" }, { status: 500 });
  }
}
