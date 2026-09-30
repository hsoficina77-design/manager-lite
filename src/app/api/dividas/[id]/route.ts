import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { registroNaoEncontrado } from "@/lib/db-oficina";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { dividaAtualizarSchema } from "@/lib/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  const { id } = await params;
  try {
    const { descricao, valor } = await lerJson(request, dividaAtualizarSchema);

    const divida = await db.dividaAvulsa.update({
      where: { id: Number(id) },
      data: {
        ...(descricao !== undefined && { descricao }),
        ...(valor !== undefined && { valor }),
      },
    });

    return NextResponse.json(divida);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (registroNaoEncontrado(err)) {
      return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao atualizar dívida" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  const { id } = await params;
  try {
    // A contagem de pagamentos já é filtrada pela oficina; sem esta checagem, dívida de
    // outra oficina daria "0 pagamentos" e só falharia no delete.
    const divida = await db.dividaAvulsa.findUnique({ where: { id: Number(id) }, select: { id: true } });
    if (!divida) return NextResponse.json({ error: "Dívida não encontrada" }, { status: 404 });

    const count = await db.pagamentoDivida.count({ where: { dividaId: Number(id) } });
    if (count > 0) {
      return NextResponse.json({ error: "Dívida já possui pagamentos e não pode ser excluída" }, { status: 409 });
    }

    await db.dividaAvulsa.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir dívida" }, { status: 500 });
  }
}
