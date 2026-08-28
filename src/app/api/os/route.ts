import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";

export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

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

  // Custo, lucro e margem não saem daqui para quem não é dono.
  return NextResponse.json(semFinanceiro(ordens, guarda.usuario.papel));
}

export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  // Operador não vê custo — logo, também não define custo. OS aberta por ele nasce
  // sem custo de peça, e o dono preenche depois.
  const podeDefinirCusto = guarda.usuario.papel === "ADMIN";
  const custoDoItem = (item: { custoUnit?: unknown }) =>
    podeDefinirCusto && item.custoUnit != null && item.custoUnit !== ""
      ? Number(item.custoUnit)
      : null;

  try {
    const body = await request.json();
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
      itens = [],
    } = body;

    if (!clienteId || !veiculoId || !descricao?.trim()) {
      return NextResponse.json(
        { error: "Cliente, veículo e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    // Resolve o nome do mecânico para gravar denormalizado (compat com PDF/listas).
    let mecanicoNome: string | null = null;
    if (mecanicoId) {
      const mec = await prisma.mecanico.findUnique({
        where: { id: mecanicoId },
        select: { nome: true },
      });
      mecanicoNome = mec?.nome ?? null;
    }

    const totalPecas = (itens as any[])
      .filter((i) => i.tipo === "PECA")
      .reduce((sum: number, i: any) => sum + Number(i.valorTotal), 0);

    const totalMO = (itens as any[])
      .filter((i) => i.tipo !== "PECA")
      .reduce((sum: number, i: any) => sum + Number(i.valorTotal), 0);

    const custoTotalPecas = (itens as any[])
      .filter((i) => i.tipo === "PECA")
      .reduce((sum: number, i: any) => sum + (custoDoItem(i) ?? 0) * Number(i.quantidade), 0);

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
          descricao: descricao.trim(),
          defeitoRelatado: defeitoRelatado?.trim() || null,
          kmEntrada: kmEntrada ? Number(kmEntrada) : null,
          obs: obs?.trim() || null,
          mecanicoId: mecanicoId || null,
          mecanico: mecanicoNome,
          nivelCombustivel: nivelCombustivel?.trim() || null,
          combustivelEmUso: combustivelEmUso?.trim() || null,
          totalPecas,
          totalMO,
          total,
          custoTotalPecas,
          lucroReal,
          margemPecas,
          itens: {
            create: (itens as any[]).map((item) => ({
              tipo: item.tipo || "PECA",
              descricao: item.descricao.trim(),
              quantidade: Number(item.quantidade),
              valorUnit: Number(item.valorUnit),
              valorTotal: Number(item.valorTotal),
              custoUnit: custoDoItem(item),
              fornecedor: item.fornecedor?.trim() || null,
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

    return NextResponse.json(semFinanceiro(os, guarda.usuario.papel), { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar OS" }, { status: 500 });
  }
}
