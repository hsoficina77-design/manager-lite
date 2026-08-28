import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dadosVeiculo, erroVeiculo } from "@/lib/veiculo";

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
    const { clienteId } = body;

    if (!clienteId) {
      return NextResponse.json({ error: "clienteId é obrigatório" }, { status: 400 });
    }

    const dados = dadosVeiculo(body);
    const erro = erroVeiculo(dados);
    if (erro) return NextResponse.json({ error: erro }, { status: 400 });

    const veiculo = await prisma.veiculo.create({
      data: { clienteId, ...dados },
    });

    return NextResponse.json(veiculo, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Placa já cadastrada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar veículo" }, { status: 500 });
  }
}
