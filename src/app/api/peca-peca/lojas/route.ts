import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lojasQueAtendem } from "@/lib/balcao";
import { getConfiguracao } from "@/lib/configuracao-db";
import { formaDa } from "@/lib/cotacoes";

/**
 * Lojas que atendem a cidade da oficina (a da configuração), e a forma de pagamento da
 * última cotação — a nova já vem com ela marcada.
 */
export async function GET() {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const [{ cidade, estado }, ultima] = await Promise.all([
    getConfiguracao(guarda),
    guarda.db.cotacao.findFirst({ orderBy: { createdAt: "desc" }, select: { formaPagamento: true } }),
  ]);
  return NextResponse.json({
    cidade: cidade?.trim() || null,
    estado: estado?.trim() || null,
    lojas: await lojasQueAtendem(cidade, estado),
    formaPagamento: formaDa(ultima?.formaPagamento ?? "PIX"),
  });
}
