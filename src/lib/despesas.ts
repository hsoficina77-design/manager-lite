// Controle de gastos — a parte que fala com o banco.
//
// A ideia central: uma despesa fixa é uma REGRA, não uma lista de boletos. "Aluguel,
// todo dia 5, R$ 3.000" é um fato só; os lançamentos de agosto, setembro e outubro são
// consequência dele. Antes só existiam os lançamentos, e o de setembro só nascia quando
// o de agosto fosse marcado como pago — por isso o mês nunca aparecia inteiro.
//
// Os lançamentos das regras são materializados sob demanda (`garantirLancamentos`),
// quando alguém abre o mês ou quando o dashboard soma o período. Não há job de fundo:
// a chave única (recorrenteId, competencia) é o que deixa a geração ser chamada quantas
// vezes for e criar cada linha uma vez só.
//
// As regras puras (periodicidade, situação, resumo do mês) ficam em `despesas-comum`,
// que os modais da tela importam sem trazer o Prisma junto. Reexportadas aqui para o
// lado servidor ter um import só.

import { prisma } from "@/lib/prisma";
import { diaDaCompetencia, janelaDaChave, type Janela } from "@/lib/periodo";
import { osEntreguesNoPeriodo } from "@/lib/os-periodo";
import { competenciasDoIntervalo, regraValeNoMes, valorEfetivo } from "@/lib/despesas-comum";

export * from "@/lib/despesas-comum";

/**
 * Garante que os meses informados tenham o lançamento de cada regra ativa.
 *
 * `skipDuplicates` sobre a chave única faz o trabalho: abrir o mesmo mês dez vezes,
 * ou dois navegadores abrindo junto, não duplica nada. Nunca mexe em lançamento que
 * já existe — o valor que o dono editou ali continua sendo dele.
 */
export async function garantirLancamentos(competencias: Date[]): Promise<void> {
  if (competencias.length === 0) return;

  const regras = await prisma.despesaRecorrente.findMany({ where: { ativa: true } });
  if (regras.length === 0) return;

  const novos = competencias.flatMap((competencia) =>
    regras
      .filter((regra) => regraValeNoMes(regra, competencia))
      .map((regra) => ({
        categoriaId: regra.categoriaId,
        recorrenteId: regra.id,
        competencia,
        descricao: regra.descricao,
        valor: regra.valor,
        fornecedor: regra.fornecedor,
        vencimento: diaDaCompetencia(competencia, regra.diaVencimento),
      }))
  );

  if (novos.length > 0) {
    await prisma.despesa.createMany({ data: novos, skipDuplicates: true });
  }
}

export const INCLUDE_CATEGORIA = {
  categoria: { select: { id: true, nome: true, cor: true } },
} as const;

/**
 * Tudo o que a tela de um mês precisa, com os lançamentos das regras já materializados.
 */
export async function mesDeGastos(chave: string | undefined, agora = new Date()) {
  const j = janelaDaChave(chave, agora);
  await garantirLancamentos([j.inicio]);

  const [lancamentos, cancelados, categorias, regras] = await Promise.all([
    prisma.despesa.findMany({
      where: { competencia: j.inicio, cancelado: false },
      include: INCLUDE_CATEGORIA,
      orderBy: [{ vencimento: "asc" }, { descricao: "asc" }],
    }),
    prisma.despesa.findMany({
      where: { competencia: j.inicio, cancelado: true },
      include: INCLUDE_CATEGORIA,
      orderBy: { descricao: "asc" },
    }),
    prisma.categoriaDespesa.findMany({ orderBy: [{ ordem: "asc" }, { nome: "asc" }] }),
    prisma.despesaRecorrente.findMany({
      include: INCLUDE_CATEGORIA,
      orderBy: [{ ativa: "desc" }, { diaVencimento: "asc" }],
    }),
  ]);

  return { janela: j, lancamentos, cancelados, categorias, regras };
}

/** Soma dos gastos de um intervalo, materializando os meses que ele toca.
 *  É por aqui que o DRE do dashboard passa a enxergar a conta fixa ainda não paga. */
export async function custoDoIntervalo(inicio: Date, fim: Date): Promise<number> {
  await garantirLancamentos(competenciasDoIntervalo(inicio, fim));
  const lancamentos = await prisma.despesa.findMany({
    where: { vencimento: { gte: inicio, lte: fim }, cancelado: false },
    select: { valor: true, valorPago: true, pago: true },
  });
  return lancamentos.reduce((soma, d) => soma + valorEfetivo(d), 0);
}

/**
 * Quanto a oficina precisa faturar no mês para cobrir os gastos.
 *
 * A margem vem dos últimos três meses de OS entregue, não só do mês corrente: no dia 3
 * o mês tem uma OS só, e dividir o custo por uma margem tirada de uma OS daria um
 * número que muda todo dia e não serve para decidir nada.
 */
export async function pontoDeEquilibrio(j: Janela, custoDoMes: number) {
  const inicioMargem = new Date(j.inicio);
  inicioMargem.setUTCMonth(inicioMargem.getUTCMonth() - 2);

  const [doMes, paraMargem] = await Promise.all([
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo(j),
      select: { total: true, lucroReal: true },
    }),
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo({ ...j, inicio: inicioMargem }),
      select: { total: true, lucroReal: true },
    }),
  ]);

  const faturado = doMes.reduce((s, o) => s + o.total, 0);
  const lucroBruto = doMes.reduce((s, o) => s + o.lucroReal, 0);

  const receitaMargem = paraMargem.reduce((s, o) => s + o.total, 0);
  const brutoMargem = paraMargem.reduce((s, o) => s + o.lucroReal, 0);
  const margem = receitaMargem > 0 ? brutoMargem / receitaMargem : null;

  // Sem histórico de margem não há como projetar faturamento — melhor não mostrar um
  // número inventado do que mostrar um que o dono vai usar para formar preço.
  const necessario = margem && margem > 0 ? custoDoMes / margem : null;

  return {
    custoDoMes,
    faturado,
    lucroBruto,
    resultado: lucroBruto - custoDoMes,
    margem,
    necessario,
    falta: necessario === null ? null : Math.max(0, necessario - faturado),
    osNoMes: doMes.length,
    osNaMargem: paraMargem.length,
  };
}
