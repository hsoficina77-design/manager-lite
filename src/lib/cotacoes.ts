// Cotações do Peça Peça — o lado da oficina.
//
// Tudo passa pelo banco da oficina (`Db`), então as três travas valem como em qualquer
// outra tela. A única coisa que vem de fora é o nome das lojas: `Loja` é tabela do
// sistema, lida por `lib/balcao.ts`, e nunca entra nos `include` daqui.

import type { Prisma } from "@prisma/client";
import type { Db } from "@/lib/db-oficina";
import {
  CAMPOS_DA_DEVOLUCAO,
  TIPO_AVISO_ENTREGA,
  devolucaoVista,
  medirEntregasDaLoja,
  todasAsLojas,
} from "@/lib/balcao";
import {
  ehEtapaEntrega,
  precoDaPeca,
  type CotacaoVista,
  type LojaVista,
} from "@/components/peca-peca/regras";

const INCLUIR = {
  cliente: { select: { nome: true } },
  orcamento: { select: { id: true, numero: true, status: true } },
  pecas: { orderBy: { ordem: "asc" } },
  envios: {
    orderBy: { createdAt: "asc" },
    include: {
      ofertas: { orderBy: [{ preco: "asc" }, { createdAt: "asc" }] },
      devolucoes: { orderBy: { createdAt: "asc" }, select: CAMPOS_DA_DEVOLUCAO },
    },
  },
} satisfies Prisma.CotacaoInclude;

type CotacaoDoBanco = NonNullable<Awaited<ReturnType<typeof lerDoBanco>>>;

function lerDoBanco(db: Db, id: string) {
  return db.cotacao.findUnique({ where: { id }, include: INCLUIR });
}

function vista(c: CotacaoDoBanco, lojas: Map<string, LojaVista>): CotacaoVista {
  return {
    id: c.id,
    numero: c.numero,
    criadaEm: c.createdAt.toISOString(),
    veiculo: { placa: c.placa ?? "", marca: c.marca ?? "", modelo: c.modelo, ano: c.ano ?? "", motor: c.motor ?? "" },
    observacao: c.observacao ?? "",
    clienteId: c.clienteId,
    veiculoId: c.veiculoId,
    clienteNome: c.cliente?.nome ?? null,
    margem: c.margem,
    orcamento: c.orcamento,
    pedidoEm: c.pedidoEm?.toISOString() ?? null,
    pecas: c.pecas.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      quantidade: p.quantidade,
      ofertaId: p.ofertaId,
      vendaUnit: p.vendaUnit,
    })),
    envios: c.envios.map((e) => {
      const loja = lojas.get(e.lojaId);
      return {
        id: e.id,
        lojaId: e.lojaId,
        lojaNome: loja?.nome ?? "Loja",
        respondidaEm: e.respondidaEm?.toISOString() ?? null,
        entrega: ehEtapaEntrega(e.entrega) ? e.entrega : null,
        oficinaRecebeuEm: e.oficinaRecebeuEm?.toISOString() ?? null,
        entregueEm: e.entregueEm?.toISOString() ?? null,
        prazoDevolucao: loja?.prazoDevolucao ?? 0,
        ofertas: e.ofertas.map((o) => ({ id: o.id, pecaId: o.pecaId, marca: o.marca, preco: o.preco, prazoMin: o.prazoMin })),
      };
    }),
    devolucoes: c.envios.flatMap((e) => e.devolucoes.map(devolucaoVista)),
  };
}

export async function lerCotacao(db: Db, id: string): Promise<CotacaoVista | null> {
  const [c, lojas] = await Promise.all([lerDoBanco(db, id), todasAsLojas()]);
  return c ? vista(c, lojas) : null;
}

export async function listarCotacoes(db: Db): Promise<CotacaoVista[]> {
  const [lista, lojas] = await Promise.all([
    db.cotacao.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: INCLUIR }),
    todasAsLojas(),
  ]);
  return lista.map((c) => vista(c, lojas));
}

/**
 * A oficina confirma que as peças de uma loja chegaram: é o que fecha a entrega. Vale com
 * a loja já tendo marcado "entregue" ou não — se não marcou, a etapa dela pula para
 * "entregue" junto, e o balcão para de pedir para avançar.
 *
 * Roda dentro da transação de quem chama. Devolve a loja cuja entrega terminou agora
 * (para `medirSeEntregou`, fora da transação), ou nulo.
 */
export async function confirmarRecebimento(
  tx: Db,
  cotacaoId: string,
  envio: { id: string; lojaId: string; oficinaRecebeuEm: Date | null; entregueEm: Date | null }
): Promise<string | null> {
  if (envio.oficinaRecebeuEm) return null;
  const agora = new Date();
  await tx.cotacaoLoja.updateMany({
    where: { id: envio.id, oficinaRecebeuEm: null },
    // A loja não marcou "entregue": as peças chegaram agora, e é aqui que a entrega
    // dela termina para o tempo de entrega.
    data: { oficinaRecebeuEm: agora, entrega: "ENTREGUE", entregueEm: envio.entregueEm ?? agora },
  });
  // Sem outra loja esperando conferência, o aviso de "a loja entregou" sai do sino.
  const faltaConferir = await tx.cotacaoLoja.count({
    where: { cotacaoId, entrega: "ENTREGUE", oficinaRecebeuEm: null },
  });
  if (faltaConferir === 0) {
    await tx.notificacao.updateMany({
      where: { tipo: TIPO_AVISO_ENTREGA, link: `/peca-peca/${cotacaoId}`, lida: false },
      data: { lida: true, lidaEm: agora },
    });
  }
  return envio.entregueEm ? null : envio.lojaId;
}

/**
 * Refaz o tempo de entrega da loja cuja entrega acabou de fechar. O tempo é do sistema
 * (lib/balcao.ts), fora da transação da oficina: falhar aqui não desfaz a confirmação, e
 * a próxima entrega da loja refaz a conta.
 */
export async function medirSeEntregou(lojaId: string | null) {
  if (!lojaId) return;
  await medirEntregasDaLoja(lojaId).catch((err: unknown) =>
    console.error("Falha ao medir o tempo de entrega da loja:", err)
  );
}

/**
 * Itens do orçamento a partir das escolhas. O cliente vê só o nome da peça; a loja e
 * a marca ficam no `fornecedor` do item, que não sai no documento.
 */
export function itensDoOrcamento(c: CotacaoVista) {
  return c.pecas.flatMap((p) => {
    const envio = c.envios.find((e) => e.ofertas.some((o) => o.id === p.ofertaId));
    const oferta = envio?.ofertas.find((o) => o.id === p.ofertaId);
    if (!envio || !oferta) return [];
    const venda = precoDaPeca(p, oferta.preco, c.margem);
    return [
      {
        tipo: "PECA",
        descricao: p.descricao,
        quantidade: p.quantidade,
        valorUnit: venda,
        valorTotal: venda * p.quantidade,
        // O preço da loja vira o custo: é o que faz o lucro da OS sair certo.
        custoUnit: oferta.preco,
        fornecedor: `${envio.lojaNome} · ${oferta.marca}`,
      },
    ];
  });
}
