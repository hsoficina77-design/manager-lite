import { NextResponse } from "next/server";
import { lerEvento, verificarWebhook } from "@/lib/abacatepay";
import { processarEventoPagamento } from "@/lib/sistema";

// Avisos da AbacatePay: pagamento confirmado, renovação, cancelamento, estorno.
//
// Pública (o gateway não tem cookie), então a primeira coisa é provar a origem:
// segredo na URL + assinatura HMAC do corpo cru. Só depois o corpo é lido como JSON.
//
// Responder 200 só depois de gravar: qualquer outra resposta faz a AbacatePay reenviar
// (até 7 vezes em ~18h), e a reentrega é inofensiva — o id do evento é a chave.

export async function POST(request: Request) {
  const corpoCru = await request.text();
  // Evento de pagamento tem poucos KB; acima disso não é a AbacatePay.
  if (corpoCru.length > 64 * 1024) return NextResponse.json({ error: "Corpo grande demais" }, { status: 413 });

  if (!verificarWebhook(new URL(request.url), corpoCru, request.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let corpo: unknown;
  try {
    corpo = JSON.parse(corpoCru);
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const evento = lerEvento(corpo);
  if (!evento) return NextResponse.json({ error: "Evento sem id ou tipo" }, { status: 400 });

  try {
    const resultado = await processarEventoPagamento(evento, corpo);
    if (resultado === "ignorado") {
      console.warn(`[pagamento] evento ${evento.tipo} (${evento.id}) ignorado — oficina: ${evento.oficinaId ?? "não encontrada"}`);
    }
    return NextResponse.json({ ok: true, resultado });
  } catch (err) {
    // Duas entregas do mesmo evento ao mesmo tempo: a segunda bate na chave primária
    // ou no Serializable. A primeira já aplicou — para o gateway, está entregue.
    const codigo = (err as { code?: string }).code;
    if (codigo === "P2002" || codigo === "P2034") return NextResponse.json({ ok: true, resultado: "repetido" });
    console.error("[pagamento] falha ao processar evento:", err);
    return NextResponse.json({ error: "Erro ao processar" }, { status: 500 });
  }
}
