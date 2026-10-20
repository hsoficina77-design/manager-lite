// Cotações do Peça Peça — o lado da oficina.
//
// Tudo passa pelo banco da oficina (`Db`), então as três travas valem como em qualquer
// outra tela. A única coisa que vem de fora é o nome das lojas: `Loja` é tabela do
// sistema, lida por `lib/balcao.ts`, e nunca entra nos `include` daqui.

import type { Prisma } from "@prisma/client";
import type { Db } from "@/lib/db-oficina";
import { todasAsLojas } from "@/lib/balcao";
import {
  ehEtapaEntrega,
  precoDaPeca,
  type CotacaoVista,
} from "@/components/peca-peca/regras";

const INCLUIR = {
  cliente: { select: { nome: true } },
  orcamento: { select: { id: true, numero: true, status: true } },
  pecas: { orderBy: { ordem: "asc" } },
  envios: {
    orderBy: { createdAt: "asc" },
    include: { ofertas: { orderBy: [{ preco: "asc" }, { createdAt: "asc" }] } },
  },
} satisfies Prisma.CotacaoInclude;

type CotacaoDoBanco = NonNullable<Awaited<ReturnType<typeof lerDoBanco>>>;

function lerDoBanco(db: Db, id: string) {
  return db.cotacao.findUnique({ where: { id }, include: INCLUIR });
}

function vista(c: CotacaoDoBanco, nomesDasLojas: Map<string, string>): CotacaoVista {
  return {
    id: c.id,
    numero: c.numero,
    criadaEm: c.createdAt.toISOString(),
    veiculo: { placa: c.placa ?? "", marca: c.marca ?? "", modelo: c.modelo, ano: c.ano ?? "", motor: c.motor ?? "" },
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
    envios: c.envios.map((e) => ({
      id: e.id,
      lojaId: e.lojaId,
      lojaNome: nomesDasLojas.get(e.lojaId) ?? "Loja",
      respondidaEm: e.respondidaEm?.toISOString() ?? null,
      entrega: ehEtapaEntrega(e.entrega) ? e.entrega : null,
      ofertas: e.ofertas.map((o) => ({ id: o.id, pecaId: o.pecaId, marca: o.marca, preco: o.preco, prazoMin: o.prazoMin })),
    })),
  };
}

async function nomesDasLojas() {
  return new Map([...(await todasAsLojas()).values()].map((l) => [l.id, l.nome]));
}

export async function lerCotacao(db: Db, id: string): Promise<CotacaoVista | null> {
  const [c, nomes] = await Promise.all([lerDoBanco(db, id), nomesDasLojas()]);
  return c ? vista(c, nomes) : null;
}

export async function listarCotacoes(db: Db): Promise<CotacaoVista[]> {
  const [lista, nomes] = await Promise.all([
    db.cotacao.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: INCLUIR }),
    nomesDasLojas(),
  ]);
  return lista.map((c) => vista(c, nomes));
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
