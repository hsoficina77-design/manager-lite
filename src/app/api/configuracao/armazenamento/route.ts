import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { statusArmazenamento } from "@/lib/armazenamento";

// Rota própria (em vez de inchar o GET de /api/configuracao): é só leitura, não
// entra no formulário nem no fluxo de salvar da tela de configurações.
export async function GET() {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  return NextResponse.json(await statusArmazenamento());
}
