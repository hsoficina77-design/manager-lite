import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { contarNaoLidas, listarNotificacoes } from "@/lib/notificacoes";

// Criação é sempre interna (via `criarNotificacao`, chamada pelo próprio servidor) —
// não há POST aqui porque nada no cliente deveria poder inventar uma notificação.
export async function GET() {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const [notificacoes, naoLidas] = await Promise.all([
    listarNotificacoes(guarda.usuario.papel),
    contarNaoLidas(guarda.usuario.papel),
  ]);
  return NextResponse.json({ notificacoes, naoLidas });
}
