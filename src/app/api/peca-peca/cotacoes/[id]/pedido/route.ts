import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lerCotacao } from "@/lib/cotacoes";

/**
 * O cliente aprovou: marca o orçamento como aprovado (se ainda estiver pendente — não
 * desfaz uma conversão em OS) e manda o pedido para cada loja de quem se escolheu peça.
 * A partir daqui é o balconista quem avança a entrega, do balcão dele.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;
  const { id } = await params;

  const c = await lerCotacao(db, id);
  if (!c) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  if (!c.orcamento) return NextResponse.json({ error: "Gere o orçamento antes de pedir" }, { status: 400 });
  if (c.pedidoEm) return NextResponse.json({ error: "O pedido já foi feito" }, { status: 409 });

  const escolhidas = new Set(c.pecas.flatMap((p) => (p.ofertaId ? [p.ofertaId] : [])));
  const comPedido = c.envios.filter((e) => e.ofertas.some((o) => escolhidas.has(o.id))).map((e) => e.id);

  const feito = await transacao(async (tx) => {
    const marcada = await tx.cotacao.updateMany({ where: { id, pedidoEm: null }, data: { pedidoEm: new Date() } });
    if (marcada.count === 0) return false;
    await tx.orcamento.updateMany({ where: { id: c.orcamento!.id, status: "PENDENTE" }, data: { status: "APROVADO" } });
    await tx.cotacaoLoja.updateMany({ where: { id: { in: comPedido } }, data: { entrega: "ENVIADO" } });
    return true;
  });
  if (!feito) return NextResponse.json({ error: "O pedido já foi feito" }, { status: 409 });

  return NextResponse.json(await lerCotacao(db, id));
}
