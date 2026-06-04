import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { marca, modelo, ano, placa, cor, km, motorizacao, valvulas, anoFabricacao, anoModelo, combustivel, combustivelEmUso } = body;

    if (!marca?.trim() || !modelo?.trim()) {
      return NextResponse.json({ error: "Marca e modelo são obrigatórios" }, { status: 400 });
    }

    const veiculo = await prisma.veiculo.update({
      where: { id },
      data: {
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: ano ? Number(ano) : null,
        placa: placa?.trim().toUpperCase() || null,
        cor: cor?.trim() || null,
        km: km ? Number(km) : null,
        motorizacao: motorizacao?.trim() || null,
        valvulas: valvulas?.trim() || null,
        anoFabricacao: anoFabricacao ? Number(anoFabricacao) : null,
        anoModelo: anoModelo ? Number(anoModelo) : null,
        combustivel: combustivel?.trim() || null,
        combustivelEmUso: combustivelEmUso?.trim() || null,
      },
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
