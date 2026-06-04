import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get("clienteId");

  const veiculos = await prisma.veiculo.findMany({
    where: clienteId ? { clienteId } : undefined,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(veiculos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clienteId, marca, modelo, ano, placa, cor, km, motorizacao, valvulas, anoFabricacao, anoModelo, combustivel, combustivelEmUso } = body;

    if (!clienteId) {
      return NextResponse.json({ error: "clienteId é obrigatório" }, { status: 400 });
    }
    if (!marca?.trim() || !modelo?.trim()) {
      return NextResponse.json({ error: "Marca e modelo são obrigatórios" }, { status: 400 });
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        clienteId,
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

    return NextResponse.json(veiculo, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Placa já cadastrada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar veículo" }, { status: 500 });
  }
}
