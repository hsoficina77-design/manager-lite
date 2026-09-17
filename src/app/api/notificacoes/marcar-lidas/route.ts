import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardaApi } from "@/lib/auth";

export async function POST() {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const visibilidade = guarda.usuario.papel === "ADMIN" ? {} : { publico: "TODOS" as const };
  await prisma.notificacao.updateMany({
    where: { lida: false, ...visibilidade },
    data: { lida: true, lidaEm: new Date() },
  });
  return NextResponse.json({ ok: true });
}
