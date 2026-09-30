import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { cancelarConvite } from "@/lib/sistema";

/** Cancela um convite que ainda não foi usado. O link para de funcionar na hora. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  if (!(await cancelarConvite(id))) {
    return NextResponse.json({ error: "Convite não encontrado ou já usado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
