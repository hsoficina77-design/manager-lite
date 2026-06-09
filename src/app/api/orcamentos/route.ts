import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clienteId = searchParams.get("clienteId");

  const where: Record<string, unknown> = {};

  if (status) {
    const statusList = status.split(",").map((s) => s.trim());
    where.status = statusList.length === 1 ? statusList[0] : { in: statusList };
  }
  if (clienteId) {
    where.clienteId = clienteId;
  }

  const orcamentos = await prisma.orcamento.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true, telefone: true, apelido: true } },
      veiculo: { select: { id: true, marca: true, modelo: true, placa: true } },
      ordem: { select: { id: true, numero: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orcamentos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clienteId,
      veiculoId,
      descricao,
      validade,
      obs,
      itens = [],
    } = body;

    if (!clienteId || !descricao?.trim()) {
      return NextResponse.json(
        { error: "Cliente e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lista = itens as any[];
    const totalPecas = lista
      .filter((i) => i.tipo === "PECA")
      .reduce((sum, i) => sum + Number(i.valorTotal), 0);
    const totalMO = lista
      .filter((i) => i.tipo !== "PECA")
      .reduce((sum, i) => sum + Number(i.valorTotal), 0);
    const total = totalPecas + totalMO;

    const orcamento = await prisma.$transaction(async (tx) => {
      const seq = await tx.sequencia.upsert({
        where: { id: "orcamento" },
        update: { ultimo: { increment: 1 } },
        create: { id: "orcamento", ultimo: 1 },
      });

      return tx.orcamento.create({
        data: {
          numero: seq.ultimo,
          clienteId,
          veiculoId: veiculoId || null,
          descricao: descricao.trim(),
          validade: validade ? new Date(validade) : null,
          obs: obs?.trim() || null,
          totalPecas,
          totalMO,
          total,
          itens: {
            create: lista.map((item) => ({
              tipo: item.tipo || "PECA",
              descricao: item.descricao.trim(),
              quantidade: Number(item.quantidade),
              valorUnit: Number(item.valorUnit),
              valorTotal: Number(item.valorTotal),
              custoUnit: item.custoUnit ? Number(item.custoUnit) : null,
              fornecedor: item.fornecedor?.trim() || null,
            })),
          },
        },
        include: { cliente: true, veiculo: true, itens: true },
      });
    });

    return NextResponse.json(orcamento, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar orçamento" }, { status: 500 });
  }
}
