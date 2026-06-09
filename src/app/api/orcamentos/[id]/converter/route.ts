import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Converte um orçamento em Ordem de Serviço.
// Copia os itens, gera o número de OS e marca o orçamento como CONVERTIDO.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!orcamento) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    if (orcamento.ordemId) {
      return NextResponse.json(
        { error: "Este orçamento já foi convertido em OS", ordemId: orcamento.ordemId },
        { status: 409 }
      );
    }
    if (!orcamento.veiculoId) {
      return NextResponse.json(
        { error: "Selecione um veículo no orçamento antes de convertê-lo em OS" },
        { status: 400 }
      );
    }

    const totalPecas = orcamento.itens
      .filter((i) => i.tipo === "PECA")
      .reduce((s, i) => s + i.valorTotal, 0);
    const totalMO = orcamento.itens
      .filter((i) => i.tipo !== "PECA")
      .reduce((s, i) => s + i.valorTotal, 0);
    const custoTotalPecas = orcamento.itens
      .filter((i) => i.tipo === "PECA")
      .reduce((s, i) => s + (i.custoUnit ?? 0) * i.quantidade, 0);

    const total = totalPecas + totalMO - orcamento.desconto;
    const lucroReal = total - custoTotalPecas;
    const margemPecas = totalPecas > 0 ? ((totalPecas - custoTotalPecas) / totalPecas) * 100 : 0;

    const os = await prisma.$transaction(async (tx) => {
      const seq = await tx.sequencia.upsert({
        where: { id: "os" },
        update: { ultimo: { increment: 1 } },
        create: { id: "os", ultimo: 1 },
      });

      const novaOS = await tx.ordemServico.create({
        data: {
          numero: seq.ultimo,
          clienteId: orcamento.clienteId,
          veiculoId: orcamento.veiculoId!,
          descricao: orcamento.descricao,
          obs: orcamento.obs,
          desconto: orcamento.desconto,
          totalPecas,
          totalMO,
          total,
          custoTotalPecas,
          lucroReal,
          margemPecas,
          itens: {
            create: orcamento.itens.map((i) => ({
              tipo: i.tipo,
              descricao: i.descricao,
              quantidade: i.quantidade,
              valorUnit: i.valorUnit,
              valorTotal: i.valorTotal,
              custoUnit: i.custoUnit,
              fornecedor: i.fornecedor,
            })),
          },
        },
      });

      await tx.orcamento.update({
        where: { id },
        data: { status: "CONVERTIDO", ordemId: novaOS.id },
      });

      return novaOS;
    });

    return NextResponse.json({ id: os.id, numero: os.numero }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao converter orçamento" }, { status: 500 });
  }
}
