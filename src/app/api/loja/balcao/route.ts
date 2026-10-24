import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { caixaDaLoja } from "@/lib/balcao";

// Painel da loja: a caixa de entrada do balcão. Todo mundo da loja vê; o que cada um
// pode fazer com as cotações (responder, avançar a entrega) é conferido nas rotas de
// cada ação. A loja vem sempre da sessão — nunca da requisição.

export async function GET() {
  const guarda = await guardaLoja();
  if (guarda.resposta) return guarda.resposta;
  return NextResponse.json(await caixaDaLoja(guarda.conta.loja));
}
