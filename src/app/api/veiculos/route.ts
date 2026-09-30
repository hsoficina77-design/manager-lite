import { NextResponse } from "next/server";
import { dadosVeiculo, erroVeiculo } from "@/lib/veiculo";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { veiculoCriarSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";

export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get("clienteId");

  const veiculos = await db.veiculo.findMany({
    where: clienteId ? { clienteId } : undefined,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(veiculos);
}

export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  try {
    const { clienteId, ...campos } = await lerJson(request, veiculoCriarSchema);

    const dados = dadosVeiculo(campos);
    const erro = erroVeiculo(dados);
    if (erro) return NextResponse.json({ error: erro }, { status: 400 });

    // Cliente de outra oficina some no filtro: responde "não encontrado" em vez de
    // deixar a trava do banco estourar como erro 500.
    const cliente = await db.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    const veiculo = await db.veiculo.create({
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
