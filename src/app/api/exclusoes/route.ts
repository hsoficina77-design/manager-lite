import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardaApi } from "@/lib/auth";

// Backlog de exclusões — só o dono vê, mesmo que a exclusão em si tenha sido feita
// por um operador liberado (checkbox "Excluir").
export async function GET() {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  const exclusoes = await prisma.registroExclusao.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, tipo: true, descricao: true, usuarioNome: true, createdAt: true },
  });
  return NextResponse.json(exclusoes);
}
