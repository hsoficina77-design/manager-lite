// Controle de gastos — as regras que não precisam do banco.
//
// Separado de `despesas.ts` porque os modais da tela importam daqui: qualquer import
// que passe por `lib/prisma` arrasta o cliente Prisma para o bundle do navegador.
// Aqui só entra o que roda nos dois lados.

import { competenciaDe, janelaHoje, mesesEntre } from "@/lib/periodo";

export const PERIODICIDADES = [
  { value: "MENSAL", label: "Todo mês", passo: 1 },
  { value: "BIMESTRAL", label: "A cada 2 meses", passo: 2 },
  { value: "TRIMESTRAL", label: "A cada 3 meses", passo: 3 },
  { value: "SEMESTRAL", label: "A cada 6 meses", passo: 6 },
  { value: "ANUAL", label: "Uma vez por ano", passo: 12 },
] as const;

export type Periodicidade = (typeof PERIODICIDADES)[number]["value"];

export const FORMAS_PAGAMENTO_DESPESA = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "DEBITO_AUTOMATICO", label: "Débito automático" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
] as const;

export function labelPeriodicidade(valor: string): string {
  return PERIODICIDADES.find((p) => p.value === valor)?.label ?? valor;
}

export function labelFormaPagamento(valor: string | null): string | null {
  if (!valor) return null;
  return FORMAS_PAGAMENTO_DESPESA.find((f) => f.value === valor)?.label ?? valor;
}

function passoDe(periodicidade: string): number {
  return PERIODICIDADES.find((p) => p.value === periodicidade)?.passo ?? 1;
}

// ─── Geração dos lançamentos a partir das regras ──────────────────────────────

type RegraGeradora = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: number;
  fornecedor: string | null;
  diaVencimento: number;
  periodicidade: string;
  inicio: Date;
  fim: Date | null;
  ativa: boolean;
};

/**
 * A regra produz lançamento neste mês?
 *
 * O passo é contado a partir do mês de início, não do mês de janeiro: um IPVA que
 * começa em março cai em março do ano seguinte, e não em janeiro.
 */
export function regraValeNoMes(regra: RegraGeradora, competencia: Date): boolean {
  if (!regra.ativa) return false;
  const desdeInicio = mesesEntre(competenciaDe(regra.inicio), competencia);
  if (desdeInicio < 0) return false;
  if (regra.fim && mesesEntre(competenciaDe(regra.fim), competencia) > 0) return false;
  return desdeInicio % passoDe(regra.periodicidade) === 0;
}

/** Todas as competências (1º dia de cada mês) tocadas por um intervalo. */
export function competenciasDoIntervalo(inicio: Date, fim: Date): Date[] {
  const meses: Date[] = [];
  let cursor = competenciaDe(inicio);
  const ultimo = competenciaDe(fim);
  // Teto de segurança: um intervalo absurdo não vira milhares de linhas no banco.
  for (let i = 0; cursor <= ultimo && i < 36; i++) {
    meses.push(cursor);
    cursor = competenciaDe(new Date(cursor.getTime() + 40 * 86_400_000));
  }
  return meses;
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

/** O que a oficina realmente desembolsou num lançamento — previsto até ser pago. */
export function valorEfetivo(d: { valor: number; valorPago: number | null; pago: boolean }): number {
  return d.pago ? d.valorPago ?? d.valor : d.valor;
}

export type Situacao = "paga" | "vencida" | "vence-breve" | "a-vencer";

export function situacaoDe(
  d: { pago: boolean; vencimento: Date | string },
  agora = new Date()
): Situacao {
  if (d.pago) return "paga";
  const hoje = janelaHoje(agora).inicio;
  const dias = Math.floor((new Date(d.vencimento).getTime() - hoje.getTime()) / 86_400_000);
  if (dias < 0) return "vencida";
  if (dias <= 5) return "vence-breve";
  return "a-vencer";
}

type LancamentoResumivel = {
  valor: number;
  valorPago: number | null;
  pago: boolean;
  vencimento: Date;
  recorrenteId: string | null;
  categoria: { id: string; nome: string; cor: string };
};

export function resumirMes(lancamentos: LancamentoResumivel[], agora = new Date()) {
  let total = 0;
  let pago = 0;
  let aberto = 0;
  let vencido = 0;
  let vencidas = 0;
  let fixo = 0;
  let avulso = 0;

  const porCategoria = new Map<string, { nome: string; cor: string; valor: number }>();

  for (const d of lancamentos) {
    const efetivo = valorEfetivo(d);
    total += efetivo;
    if (d.pago) pago += efetivo;
    else {
      aberto += efetivo;
      if (situacaoDe(d, agora) === "vencida") {
        vencido += efetivo;
        vencidas += 1;
      }
    }
    if (d.recorrenteId) fixo += efetivo;
    else avulso += efetivo;

    const atual = porCategoria.get(d.categoria.id);
    if (atual) atual.valor += efetivo;
    else porCategoria.set(d.categoria.id, { ...d.categoria, valor: efetivo });
  }

  return {
    total,
    pago,
    aberto,
    vencido,
    vencidas,
    fixo,
    avulso,
    quantidade: lancamentos.length,
    porCategoria: [...porCategoria.values()].sort((a, b) => b.valor - a.valor),
  };
}

// ─── Custo operacional e ponto de equilíbrio ─────────────────────────────────

/**
 * Custo operacional mensal: o que a oficina paga só para continuar aberta, vindo das
 * REGRAS e não dos lançamentos. Conta a fatia mensal das contas que não são mensais
 * (o IPVA anual entra como 1/12), porque é assim que ele serve para decidir preço.
 */
export function custoOperacionalMensal(regras: { valor: number; periodicidade: string; ativa: boolean }[]): number {
  return regras
    .filter((r) => r.ativa)
    .reduce((soma, r) => soma + r.valor / passoDe(r.periodicidade), 0);
}
