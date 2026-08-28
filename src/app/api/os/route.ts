import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { osCriarSchema, valorDoItem } from "@/lib/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const pendente = searchParams.get("pendente") === "true";
  const clienteId = searchParams.get("clienteId");
  const mecanicoId = searchParams.get("mecanicoId");

  const where: Record<string, unknown> = {};

  if (status) {
    const statusList = status.split(",").map((s) => s.trim());
    where.status = statusList.length === 1 ? statusList[0] : { in: statusList };
  }
  if (pendente) {
    where.pago = false;
    where.status = { not: "CANCELADA" };
  }
  if (clienteId) {
    where.clienteId = clienteId;
  }
  if (mecanicoId) {
    where.mecanicoId = mecanicoId;
  }

  const ordens = await prisma.ordemServico.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true, telefone: true, apelido: true } },
      veiculo: { select: { id: true, marca: true, modelo: true, placa: true } },
    },
    orderBy: { abertura: "desc" },
  });

  return NextResponse.json(ordens);
}

export async function POST(request: Request) {
  try {
    const {
      clienteId,
      veiculoId,
      descricao,
      defeitoRelatado,
      kmEntrada,
      obs,
      mecanicoId,
      nivelCombustivel,
      combustivelEmUso,
      itens,
    } = await lerJson(request, osCriarSchema);

    // Resolve o nome do mecânico para gravar denormalizado (compat com PDF/listas).
    let mecanicoNome: string | null = null;
    if (mecanicoId) {
      const mec = await prisma.mecanico.findUnique({
        where: { id: mecanicoId },
        select: { nome: true },
      });
      mecanicoNome = mec?.nome ?? null;
    }

    const totalPecas = itens
      .filter((i) => i.tipo === "PECA")
      .reduce((sum, i) => sum + valorDoItem(i), 0);

    const totalMO = itens
      .filter((i) => i.tipo !== "PECA")
      .reduce((sum, i) => sum + valorDoItem(i), 0);

    const custoTotalPecas = itens
      .filter((i) => i.tipo === "PECA")
      .reduce((sum, i) => sum + (i.custoUnit ?? 0) * i.quantidade, 0);

    const total = totalPecas + totalMO;
    const lucroReal = total - custoTotalPecas;
    const margemPecas = totalPecas > 0 ? ((totalPecas - custoTotalPecas) / totalPecas) * 100 : 0;

    const os = await prisma.$transaction(async (tx) => {
      const seq = await tx.sequencia.upsert({
        where: { id: "os" },
        update: { ultimo: { increment: 1 } },
        create: { id: "os", ultimo: 1 },
      });

      return tx.ordemServico.create({
        data: {
          numero: seq.ultimo,
          clienteId,
          veiculoId,
          descricao,
          defeitoRelatado: defeitoRelatado ?? null,
          kmEntrada: kmEntrada ?? null,
          obs: obs ?? null,
          mecanicoId: mecanicoId ?? null,
          mecanico: mecanicoNome,
          nivelCombustivel: nivelCombustivel ?? null,
          combustivelEmUso: combustivelEmUso ?? null,
          totalPecas,
          totalMO,
          total,
          custoTotalPecas,
          lucroReal,
          margemPecas,
          itens: {
            create: itens.map((item) => ({
              tipo: item.tipo,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valorUnit: item.valorUnit,
              valorTotal: valorDoItem(item),
              custoUnit: item.custoUnit ?? null,
              fornecedor: item.fornecedor ?? null,
            })),
          },
        },
        include: {
          cliente: true,
          veiculo: true,
          itens: true,
        },
      });
    });

    return NextResponse.json(os, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar OS" }, { status: 500 });
  }
}
