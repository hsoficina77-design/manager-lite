import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { definirOficinaAtiva } from "@/lib/sistema";
import { lerJsonCru, respostaDeValidacao } from "@/lib/validacao";

/** Suspende ou reativa uma oficina. Suspender tira todo mundo dela do sistema na hora. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const { id } = await params;
    const corpo = (await lerJsonCru(request)) as Record<string, unknown> | null;
    if (typeof corpo?.ativa !== "boolean") {
      return NextResponse.json({ error: "Informe se a oficina fica ativa" }, { status: 400 });
    }

    const oficina = await definirOficinaAtiva(id, corpo.ativa, guarda.oficinaId);
    return NextResponse.json({ id: oficina.id, ativa: oficina.ativa });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (err instanceof Error && err.message.includes("própria oficina")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Oficina não encontrada" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a oficina" }, { status: 500 });
  }
}
