import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dadosVeiculo, erroVeiculo } from "@/lib/veiculo";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { veiculoCriarSchema } from "@/lib/schemas";

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
    const { clienteId, ...campos } = await lerJson(request, veiculoCriarSchema);

    const dados = dadosVeiculo(campos);
    const erro = erroVeiculo(dados);
    if (erro) return NextResponse.json({ error: erro }, { status: 400 });

    const veiculo = await prisma.veiculo.create({
      data: { clienteId, ...dados },
    });

    return NextResponse.json(veiculo, { status: 201 });
  } catch (err: any) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Placa já cadastrada" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar veículo" }, { status: 500 });
  }
}
