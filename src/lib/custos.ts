// Preserva o custo das peças quando quem salva não pode vê-lo.
//
// O problema que isto resolve: a API apaga `custoUnit` da resposta para o operador,
// então o formulário dele carrega os itens sem custo. Se ele editasse a OS e salvasse,
// o custo voltaria vazio e o lucro do dono seria zerado sem ninguém perceber.
//
// A solução é o formulário devolver o `id` de cada item que já existia. Para o
// operador, o custo enviado é ignorado e o do banco é mantido; item novo entra sem
// custo, e o dono preenche depois.
//
// Server-side apenas.

import { prisma } from "@/lib/prisma";

export type ItemEntrada = { id?: unknown; custoUnit?: unknown };

function numeroOuNulo(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/**
 * Custo a gravar para cada item recebido, na mesma ordem do array de entrada.
 *
 * `pai` limita a busca aos itens da própria OS/orçamento: id de outro documento não
 * entra, mesmo que alguém o envie de propósito.
 */
export async function custosParaSalvar(
  itens: ItemEntrada[],
  papel: string,
  pai: { os: string } | { orcamento: string }
): Promise<(number | null)[]> {
  if (papel === "ADMIN") return itens.map((i) => numeroOuNulo(i.custoUnit));

  const ids = itens.map((i) => (typeof i.id === "string" ? i.id : null)).filter(Boolean) as string[];
  if (ids.length === 0) return itens.map(() => null);

  const existentes =
    "os" in pai
      ? await prisma.itemOrdem.findMany({
          where: { id: { in: ids }, ordemId: pai.os },
          select: { id: true, custoUnit: true },
        })
      : await prisma.itemOrcamento.findMany({
          where: { id: { in: ids }, orcamentoId: pai.orcamento },
          select: { id: true, custoUnit: true },
        });

  const porId = new Map(existentes.map((i) => [i.id, i.custoUnit]));
  return itens.map((i) => (typeof i.id === "string" ? porId.get(i.id) ?? null : null));
}
