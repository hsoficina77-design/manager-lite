import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";

export async function POST() {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const visibilidade = guarda.usuario.papel === "ADMIN" ? {} : { publico: "TODOS" as const };
  await db.notificacao.updateMany({
    where: { lida: false, ...visibilidade },
    data: { lida: true, lidaEm: new Date() },
  });
  return NextResponse.json({ ok: true });
}
