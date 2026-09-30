import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { registroNaoEncontrado } from "@/lib/db-oficina";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { metaAtualizarSchema } from "@/lib/schemas";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  const { id } = await params;
  try {
    const { valorAlvo: alvo } = await lerJson(request, metaAtualizarSchema);
    if (alvo <= 0) {
      await db.meta.delete({ where: { id } });
      return NextResponse.json({ ok: true, removed: true });
    }
    const meta = await db.meta.update({
      where: { id },
      data: { valorAlvo: alvo },
    });
    return NextResponse.json(meta);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (registroNaoEncontrado(err)) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
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
    await db.meta.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (registroNaoEncontrado(err)) {
      return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 });
  }
}
