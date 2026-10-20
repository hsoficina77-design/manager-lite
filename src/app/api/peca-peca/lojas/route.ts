import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { garantirLojasDaPrevia, lojasComLink } from "@/lib/balcao";

/** Lojas para mandar cotação — com o link do balcão, para testar em outra aba. */
export async function GET() {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  await garantirLojasDaPrevia();
  return NextResponse.json(await lojasComLink());
}
