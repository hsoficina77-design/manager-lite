import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { listarOficinas } from "@/lib/sistema";

/** As oficinas do sistema — só nome, situação e volume de uso, nada de dentro delas. */
export async function GET() {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  return NextResponse.json(await listarOficinas());
}
