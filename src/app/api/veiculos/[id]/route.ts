import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dadosVeiculo, erroVeiculo } from "@/lib/veiculo";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const dados = dadosVeiculo(body);
    const erro = erroVeiculo(dados);
    if (erro) return NextResponse.json({ error: erro }, { status: 400 });

    const veiculo = await prisma.veiculo.update({
      where: { id },
      data: dados,
    });

    return NextResponse.json(veiculo);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Placa já cadastrada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao atualizar veículo" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const osCount = await prisma.ordemServico.count({ where: { veiculoId: id } });
  if (osCount > 0) {
    return NextResponse.json(
      { error: "Veículo possui ordens de serviço e não pode ser excluído" },
      { status: 409 }
    );
  }

  try {
    await prisma.veiculo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir veículo" }, { status: 500 });
  }
}
