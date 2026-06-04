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
      descricao,
      kmEntrada,
      kmSaida,
      desconto,
      obs,
      formaPagamento,
      mecanico,
      nivelCombustivel,
      combustivelEmUso,
      nps,
    } = body;

    const current = await prisma.ordemServico.findUnique({
      where: { id },
      select: { totalPecas: true, totalMO: true, desconto: true, custoTotalPecas: true },
    });

    if (!current) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    const novoDesconto = desconto !== undefined ? Number(desconto) : current.desconto;
    const total = current.totalPecas + current.totalMO - novoDesconto;
    const lucroReal = total - current.custoTotalPecas;
    const margemPecas = current.totalPecas > 0
      ? ((current.totalPecas - current.custoTotalPecas) / current.totalPecas) * 100
      : 0;

    const data: Record<string, unknown> = {
      desconto: novoDesconto,
      total,
      lucroReal,
      margemPecas,
    };

    if (status !== undefined) data.status = status;
    if (descricao !== undefined) data.descricao = descricao.trim();
    if (kmEntrada !== undefined) data.kmEntrada = kmEntrada ? Number(kmEntrada) : null;
    if (kmSaida !== undefined) data.kmSaida = kmSaida ? Number(kmSaida) : null;
    if (obs !== undefined) data.obs = obs?.trim() || null;
    if (formaPagamento !== undefined) data.formaPagamento = formaPagamento || null;
    if (mecanico !== undefined) data.mecanico = mecanico?.trim() || null;
    if (nivelCombustivel !== undefined) data.nivelCombustivel = nivelCombustivel || null;
    if (combustivelEmUso !== undefined) data.combustivelEmUso = combustivelEmUso || null;
    if (nps !== undefined) data.nps = nps ? Number(nps) : null;

    if (status === "ENTREGUE" || status === "FECHADA") {
      data.fechamento = new Date();
    }

    const os = await prisma.ordemServico.update({ where: { id }, data });
    return NextResponse.json(os);
  } catch {
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
