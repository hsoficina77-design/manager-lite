import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lerCotacao } from "@/lib/cotacoes";
import { fecharConversas } from "@/lib/conversa";
import { getConfiguracao } from "@/lib/configuracao-db";
import { cnpjValido } from "@/lib/documento";
import { destinoDoPedido } from "@/lib/destino-do-pedido";

/**
 * Faz o pedido: manda as peças escolhidas para cada loja de quem se escolheu alguma. A
 * partir daqui é o balconista quem avança a entrega, do painel dele.
 *
 * Não exige orçamento: no Peça Peça o pedido sai direto da escolha. Se a oficina tem o
 * boxOS e já gerou o orçamento, ele é marcado como aprovado (só se ainda estiver
 * pendente — não desfaz uma conversão em OS).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao, usuario } = guarda;
  const { id } = await params;

  const c = await lerCotacao(db, id);
  if (!c) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  if (c.pedidoEm) return NextResponse.json({ error: "O pedido já foi feito" }, { status: 409 });

  const escolhidas = new Set(c.pecas.flatMap((p) => (p.ofertaId ? [p.ofertaId] : [])));
  const comPedido = c.envios.filter((e) => e.ofertas.some((o) => escolhidas.has(o.id))).map((e) => e.id);
  if (comPedido.length === 0) {
    return NextResponse.json({ error: "Escolha ao menos uma peça antes de pedir" }, { status: 400 });
  }

  // A autopeça só entrega, e cadastra a oficina, com CNPJ e endereço. Conta que nasceu
  // antes dessa exigência completa os dados em Configurações, uma vez só.
  const [config, chefe] = await Promise.all([
    getConfiguracao(guarda),
    db.usuario.findFirst({ where: { papel: "ADMIN", ativo: true }, orderBy: { createdAt: "asc" }, select: { nome: true } }),
  ]);
  const destino = destinoDoPedido(config, chefe?.nome ?? usuario.nome);
  if (!destino || !cnpjValido(destino.cnpj)) {
    return NextResponse.json(
      { error: "Para fazer o pedido, complete o CNPJ e o endereço da oficina em Configurações. A autopeça precisa deles para entregar." },
      { status: 422 }
    );
  }

  const feito = await transacao(async (tx) => {
    const marcada = await tx.cotacao.updateMany({ where: { id, pedidoEm: null }, data: { pedidoEm: new Date() } });
    if (marcada.count === 0) return false;
    if (c.orcamento) {
      await tx.orcamento.updateMany({ where: { id: c.orcamento.id, status: "PENDENTE" }, data: { status: "APROVADO" } });
    }
    // A forma de pagamento vai junto: o balcão sabe se manda a maquininha, e os preços
    // do pedido ficam presos a ela.
    await tx.cotacaoLoja.updateMany({
      where: { id: { in: comPedido } },
      data: { entrega: "ENVIADO", formaPagamento: c.formaPagamento, destino },
    });
    // Com a loja que ficou de fora do pedido não há mais o que conversar.
    await fecharConversas(
      tx,
      c.envios.filter((e) => !comPedido.includes(e.id)).map((e) => e.id)
    );
    return true;
  });
  if (!feito) return NextResponse.json({ error: "O pedido já foi feito" }, { status: 409 });

  return NextResponse.json(await lerCotacao(db, id));
}
