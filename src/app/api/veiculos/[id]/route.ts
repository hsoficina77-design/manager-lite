import { NextResponse } from "next/server";
import { dadosVeiculo, erroVeiculo } from "@/lib/veiculo";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { veiculoSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { registrarExclusao } from "@/lib/exclusoes";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const { id } = await params;
  try {
    const body = await lerJson(request, veiculoSchema);

    const dados = dadosVeiculo(body);
    const erro = erroVeiculo(dados);
    if (erro) return NextResponse.json({ error: erro }, { status: 400 });

    const veiculo = await db.veiculo.update({
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
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
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
  const { db } = guarda;

  const { id } = await params;

  const osCount = await db.ordemServico.count({ where: { veiculoId: id } });
  if (osCount > 0) {
    return NextResponse.json(
      { error: "Veículo possui ordens de serviço e não pode ser excluído" },
      { status: 409 }
    );
  }

  try {
    const veiculo = await db.veiculo.findUnique({
      where: { id },
      select: { placa: true, marca: true, modelo: true },
    });
    if (!veiculo) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
    }

    await db.veiculo.delete({ where: { id } });
    await registrarExclusao(
      db,
      "Veículo",
      `${veiculo.marca} ${veiculo.modelo}${veiculo.placa ? ` — ${veiculo.placa}` : ""}`,
      guarda.usuario
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir veículo" }, { status: 500 });
  }
}
