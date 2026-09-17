import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardaApi } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { id } = await params;

  const notificacao = await prisma.notificacao.findUnique({ where: { id } });
  if (!notificacao) {
    return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
  }
  // Um operador não pode marcar como lida uma notificação que nem deveria ver.
  if (notificacao.publico === "ADMIN" && guarda.usuario.papel !== "ADMIN") {
    return NextResponse.json({ error: "Sem acesso a esta notificação" }, { status: 403 });
  }

  const atualizada = await prisma.notificacao.update({
    where: { id },
    data: { lida: true, lidaEm: new Date() },
  });
  return NextResponse.json(atualizada);
}
