import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dadosVeiculo, erroVeiculo } from "@/lib/veiculo";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { veiculoSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { registrarExclusao } from "@/lib/exclusoes";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await lerJson(request, veiculoSchema);

    const dados = dadosVeiculo(body);
    const erro = erroVeiculo(dados);
    if (erro) return NextResponse.json({ error: erro }, { status: 400 });

    const veiculo = await prisma.veiculo.update({
      where: { id },
      data: dados,
    });

    return NextResponse.json(veiculo);
  } catch (err: any) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
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
  const guarda = await guardaApi({ exclusao: true });
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;

  const osCount = await prisma.ordemServico.count({ where: { veiculoId: id } });
  if (osCount > 0) {
    return NextResponse.json(
      { error: "Veículo possui ordens de serviço e não pode ser excluído" },
      { status: 409 }
    );
  }

  try {
    const veiculo = await prisma.veiculo.findUnique({
      where: { id },
      select: { placa: true, marca: true, modelo: true },
    });
    if (!veiculo) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
    }

    await prisma.veiculo.delete({ where: { id } });
    await registrarExclusao(
      "Veículo",
      `${veiculo.marca} ${veiculo.modelo}${veiculo.placa ? ` — ${veiculo.placa}` : ""}`,
      guarda.usuario
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir veículo" }, { status: 500 });
  }
}
