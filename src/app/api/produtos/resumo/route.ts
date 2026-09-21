import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardaApi } from "@/lib/auth";
import { ehPeriodo, ehPeriodoAtual, janela, type PeriodoKey } from "@/lib/periodo";
import { osEntreguesNoPeriodo } from "@/lib/os-periodo";

/**
 * O resultado do estoque: quanto de lucro as peças da prateleira deram no período, e
 * quanto dinheiro ainda está parado nela.
 *
 * A base é a **peça baixada**, e não a peça cadastrada: só entra aqui item de OS
 * entregue no período, que é exatamente o momento em que a peça sai da prateleira (ver
 * `consomeEstoque`). Isso faz o lucro desta tela usar a mesma régua do Dashboard e da
 * Produtividade — a data de entrega —, então os três números conversam entre si em vez
 * de contar histórias diferentes sobre o mesmo mês.
 *
 * Só para quem vê financeiro: a tela inteira é custo, lucro e margem.
 */
export async function GET(request: Request) {
  const guarda = await guardaApi({ financeiro: true });
  if (guarda.resposta) return guarda.resposta;

  const { searchParams } = new URL(request.url);
  const periodo: PeriodoKey = ehPeriodo(searchParams.get("periodo") ?? undefined)
    ? (searchParams.get("periodo") as PeriodoKey)
    : "mes";
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0;

  const j = janela(periodo, offset);

  const [itens, produtos] = await Promise.all([
    prisma.itemOrdem.findMany({
      where: { produtoId: { not: null }, ordem: osEntreguesNoPeriodo(j) },
      select: {
        produtoId: true,
        descricao: true,
        quantidade: true,
        valorTotal: true,
        custoUnit: true,
        produto: { select: { nome: true, unidade: true } },
      },
    }),
    prisma.produto.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        unidade: true,
        quantidade: true,
        estoqueMinimo: true,
        custoUnit: true,
        valorVenda: true,
      },
    }),
  ]);

  // ── O que saiu e o que rendeu ──────────────────────────────────────────────
  type Linha = {
    id: string;
    nome: string;
    unidade: string;
    quantidade: number;
    receita: number;
    custo: number;
    lucro: number;
  };

  const porProduto = new Map<string, Linha>();
  let receita = 0;
  let custo = 0;
  let unidadesVendidas = 0;

  for (const item of itens) {
    const id = item.produtoId!;
    const custoItem = (item.custoUnit ?? 0) * item.quantidade;
    receita += item.valorTotal;
    custo += custoItem;
    unidadesVendidas += item.quantidade;

    const linha = porProduto.get(id) ?? {
      id,
      // O nome do produto, com a descrição da OS como reserva: a peça pode ter sido
      // excluída do cadastro depois de vendida, e a linha não pode virar "sem nome".
      nome: item.produto?.nome ?? item.descricao,
      unidade: item.produto?.unidade ?? "UN",
      quantidade: 0,
      receita: 0,
      custo: 0,
      lucro: 0,
    };
    linha.quantidade += item.quantidade;
    linha.receita += item.valorTotal;
    linha.custo += custoItem;
    linha.lucro = linha.receita - linha.custo;
    porProduto.set(id, linha);
  }

  const lucro = receita - custo;

  // ── O que ainda está na prateleira ─────────────────────────────────────────
  // Saldo negativo não é dinheiro parado — é peça que saiu sem ter entrado, e conta
  // como zero na avaliação (o alerta dela é a contagem de `negativos`).
  let valorDeCusto = 0;
  let valorDeVenda = 0;
  let unidades = 0;
  let semEstoque = 0;
  let abaixoDoMinimo = 0;
  let negativos = 0;

  for (const p of produtos) {
    const saldo = Math.max(0, p.quantidade);
    valorDeCusto += saldo * p.custoUnit;
    valorDeVenda += saldo * p.valorVenda;
    unidades += saldo;
    if (p.quantidade < 0) negativos++;
    if (p.quantidade <= 0) semEstoque++;
    else if (p.estoqueMinimo > 0 && p.quantidade <= p.estoqueMinimo) abaixoDoMinimo++;
  }

  return NextResponse.json({
    periodo: { chave: periodo, offset, label: j.label, atual: ehPeriodoAtual(j) },
    vendido: {
      pecas: porProduto.size,
      unidades: unidadesVendidas,
      receita,
      custo,
      lucro,
      margem: receita > 0 ? (lucro / receita) * 100 : null,
    },
    prateleira: {
      produtos: produtos.length,
      unidades,
      valorDeCusto,
      valorDeVenda,
      lucroPotencial: valorDeVenda - valorDeCusto,
      semEstoque,
      abaixoDoMinimo,
      negativos,
    },
    // O ranking é o que transforma o total em decisão: mostra qual peça sustenta o
    // resultado e qual ocupa prateleira sem pagar por ela.
    ranking: [...porProduto.values()].sort((a, b) => b.lucro - a.lucro).slice(0, 8),
  });
}
