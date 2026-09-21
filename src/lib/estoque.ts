// Baixa e devolução de peça no estoque.
//
// A peça sai da prateleira na ENTREGA do veículo (ver `consomeEstoque`, lib/constants).
// Mas o gatilho é só metade do problema. A outra metade é que a gravação da OS
// **substitui a lista de itens inteira** a cada save, e uma OS entregue continua sendo
// editada — corrige-se um valor, acrescenta-se a peça esquecida. Se cada gravação
// desse baixa no que recebeu, salvar duas vezes baixaria a mesma peça duas vezes, e em
// três dias o estoque não valeria mais nada.
//
// Por isso aqui nada é absoluto: o que se calcula é a DIFERENÇA entre o que aquela OS
// já segurava e o que ela passa a segurar. Salvar sem mexer em peça nenhuma dá
// diferença zero e não escreve uma linha sequer. Trocar 2 por 3 tira 1. Apagar o item
// devolve os 2. Entregar tira tudo de uma vez; reabrir ou cancelar devolve tudo.
//
// Server-side apenas.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Cliente do Prisma dentro de uma transação — escrever no estoque exige uma. */
type Tx = Prisma.TransactionClient;

export type ItemComProduto = { produtoId?: string | null; quantidade: number };

/** De onde veio o movimento, para o histórico do produto ficar legível. */
export type OrigemMovimento = {
  ordemId?: string | null;
  ordemNumero?: number | null;
  usuarioNome?: string | null;
  motivo?: string | null;
};

/** Quantas peças distintas saíram e quantas voltaram — a frase que a tela dá de volta. */
export type ResultadoConsumo = { baixados: number; devolvidos: number };

/** Abaixo disto é ruído de ponto flutuante (0,1 + 0,2), não movimento de verdade. */
const EPSILON = 1e-9;

/**
 * Quanto cada produto precisa SAIR do estoque para a OS deixar de segurar `antes` e
 * passar a segurar `depois`. Positivo sai da prateleira; negativo volta para ela.
 *
 * Quem não tem `produtoId` não entra na conta: é peça comprada na hora ou mão de
 * obra, e nada disso está na prateleira.
 */
export function consumoLiquido(
  antes: ItemComProduto[],
  depois: ItemComProduto[]
): Map<string, number> {
  const saldo = new Map<string, number>();

  const somar = (itens: ItemComProduto[], sinal: 1 | -1) => {
    for (const item of itens) {
      if (!item.produtoId) continue;
      const qtd = Number(item.quantidade);
      if (!Number.isFinite(qtd) || qtd === 0) continue;
      saldo.set(item.produtoId, (saldo.get(item.produtoId) ?? 0) + sinal * qtd);
    }
  };

  somar(depois, 1);
  somar(antes, -1);

  for (const [id, qtd] of saldo) {
    if (Math.abs(qtd) < EPSILON) saldo.delete(id);
  }
  return saldo;
}

/**
 * Aplica a baixa/devolução e registra um movimento por produto.
 *
 * Saldo negativo é permitido de propósito: a peça já foi parafusada no carro quando
 * alguém percebe que ela não estava cadastrada, e recusar a gravação da OS por causa
 * disso travaria o atendimento. A tela do estoque mostra o negativo em vermelho, que
 * é o pedido de acerto — o sistema não perde o serviço para cobrar o cadastro.
 */
export async function aplicarConsumo(
  tx: Tx,
  consumo: Map<string, number>,
  origem: OrigemMovimento = {}
): Promise<ResultadoConsumo> {
  const resultado: ResultadoConsumo = { baixados: 0, devolvidos: 0 };

  for (const [produtoId, saida] of consumo) {
    // `update` devolve a linha já atualizada — é de lá que sai o saldo do movimento,
    // sem uma segunda leitura que outra transação poderia ter mudado no meio.
    const produto = await tx.produto.update({
      where: { id: produtoId },
      data: { quantidade: { decrement: saida } },
      select: { quantidade: true, custoUnit: true },
    });

    await tx.movimentoEstoque.create({
      data: {
        produtoId,
        tipo: saida > 0 ? "SAIDA" : "ENTRADA",
        quantidade: -saida,
        saldoDepois: produto.quantidade,
        custoUnit: produto.custoUnit,
        motivo:
          origem.motivo ??
          (origem.ordemNumero != null
            ? `${saida > 0 ? "Baixa" : "Devolução"} da OS #${origem.ordemNumero}`
            : null),
        ordemId: origem.ordemId ?? null,
        ordemNumero: origem.ordemNumero ?? null,
        usuarioNome: origem.usuarioNome ?? null,
      },
    });

    if (saida > 0) resultado.baixados++;
    else resultado.devolvidos++;
  }

  return resultado;
}

export type ProdutoDoItem = {
  id: string;
  nome: string;
  custoUnit: number;
  valorVenda: number;
  quantidade: number;
};

/**
 * Os produtos citados por uma lista de itens, pelo id.
 *
 * Serve para duas coisas ao gravar: pegar o custo de quem veio da prateleira e
 * descartar vínculo que não existe — um `produtoId` inventado no corpo da requisição
 * viraria erro de chave estrangeira (500) em vez de item sem vínculo.
 */
export async function produtosDosItens(
  itens: { produtoId?: string | null }[]
): Promise<Map<string, ProdutoDoItem>> {
  const ids = [...new Set(itens.map((i) => i.produtoId).filter((id): id is string => !!id))];
  if (ids.length === 0) return new Map();

  const produtos = await prisma.produto.findMany({
    where: { id: { in: ids } },
    select: { id: true, nome: true, custoUnit: true, valorVenda: true, quantidade: true },
  });
  return new Map(produtos.map((p) => [p.id, p]));
}

/** O vínculo do item, ou null quando o produto não existe (mais). */
export function vinculoDoItem(
  item: { produtoId?: string | null },
  produtos: Map<string, ProdutoDoItem>
): string | null {
  return item.produtoId && produtos.has(item.produtoId) ? item.produtoId : null;
}

// ─── Busca ───────────────────────────────────────────────────────────────────

/** Minúsculo e sem acento: é assim que "agua" acha "Água". */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * O texto que o campo `Produto.busca` guarda.
 *
 * Nome, código e fornecedor juntos, para que a mesma caixa de busca encontre a peça
 * pelo nome que o mecânico usa, pelo código do catálogo ou pelo fornecedor de quem
 * se compra sempre.
 */
export function textoDeBusca(p: {
  nome: string;
  codigo?: string | null;
  fornecedor?: string | null;
}): string {
  return normalizarBusca([p.nome, p.codigo, p.fornecedor].filter(Boolean).join(" "));
}
