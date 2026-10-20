import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { trocarLinkDaLoja } from "@/lib/balcao";

/** Gera outro link de balcão; o antigo para de funcionar na hora. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;
  const { id } = await params;
  const loja = await trocarLinkDaLoja(id);
  if (!loja) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  return NextResponse.json(loja);
}
