import { NextResponse } from "next/server";
import { cancelarAssinatura, lerEvento, verificarWebhook } from "@/lib/asaas";
import { processarEventoPagamento } from "@/lib/sistema";

// Avisos do Asaas: pagamento confirmado, vencido, estorno, assinatura removida.
//
// Pública (o gateway não tem cookie), então a primeira coisa é provar a origem: o
// token cadastrado junto com a URL no painel do Asaas, no cabeçalho `asaas-access-token`.
//
// Responder 200 só depois de gravar: qualquer outra resposta faz o Asaas reenviar, e a
// reentrega é inofensiva — o id do evento é a chave. Depois de 15 falhas seguidas o
// Asaas pausa a fila (painel → Integrações → Webhooks, para reativar).

export async function POST(request: Request) {
  if (!verificarWebhook(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const corpoCru = await request.text();
  // Evento de pagamento tem poucos KB; acima disso não é o Asaas.
  if (corpoCru.length > 64 * 1024) return NextResponse.json({ error: "Corpo grande demais" }, { status: 413 });

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
    if (resultado === "abandonada" && evento.assinaturaId) {
      // O evento já está gravado; se o cancelamento falhar, a assinatura fica no painel
      // do Asaas para remover na mão — não vale fazer o Asaas reenviar por isso.
      await cancelarAssinatura(evento.assinaturaId).catch((err: unknown) =>
        console.error(`[pagamento] falha ao cancelar assinatura abandonada ${evento.assinaturaId}:`, err)
      );
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
