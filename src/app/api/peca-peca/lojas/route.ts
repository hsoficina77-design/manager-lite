import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lojasQueAtendem } from "@/lib/balcao";
import { getConfiguracao } from "@/lib/configuracao-db";

/** Lojas que atendem a cidade da oficina (a da configuração). */
export async function GET() {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { cidade, estado } = await getConfiguracao(guarda);
  return NextResponse.json({
    cidade: cidade?.trim() || null,
    estado: estado?.trim() || null,
    lojas: await lojasQueAtendem(cidade, estado),
  });
}
