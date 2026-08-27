// Janelas de tempo do negócio, calculadas no fuso de Brasília.
//
// Brasília é UTC-3 o ano todo (sem horário de verão desde 2019) e o servidor roda em
// UTC (Railway). Se os limites forem calculados no fuso do processo, o dia vira às
// 21h de Brasília — e a OS entregue às 22h cai no dia seguinte. Por isso todo corte
// aqui desloca 3h antes de truncar.
//
// Tudo devolve intervalo semiaberto [inicio, fim): a OS entregue exatamente à
// meia-noite pertence ao período novo, e nenhuma é contada em dois períodos.

const BR_OFFSET_HOURS = 3;
const BR_OFFSET_MS = BR_OFFSET_HOURS * 60 * 60 * 1000;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DIAS_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type PeriodoKey = "semana" | "mes" | "trimestre" | "ano";

export type Janela = {
  inicio: Date;
  fim: Date;
  /** Rótulo do período para exibição, ex.: "18/08 – 24/08", "Agosto/2026". */
  label: string;
};

export const PERIODOS: { value: PeriodoKey; label: string }[] = [
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "trimestre", label: "3 Meses" },
  { value: "ano", label: "Ano" },
];

export function ehPeriodo(v: string | undefined): v is PeriodoKey {
  return PERIODOS.some((p) => p.value === v);
}

/** Meia-noite de Brasília do dia informado, como instante UTC. Aceita overflow
 *  (dia 0, mês 12) — `Date.UTC` normaliza, o que faz a aritmética de offset funcionar. */
function brMidnightUTC(ano: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(ano, mes, dia, BR_OFFSET_HOURS, 0, 0, 0));
}

/** Campos de calendário de Brasília para um instante. Ler via `getUTC*` sobre o valor
 *  deslocado dá o dia que está no calendário da oficina, não no do servidor. */
function camposBR(instante: Date) {
  const br = new Date(instante.getTime() - BR_OFFSET_MS);
  return {
    ano: br.getUTCFullYear(),
    mes: br.getUTCMonth(),
    dia: br.getUTCDate(),
    diaSemana: br.getUTCDay(), // 0 = domingo
  };
}

function ddmm(instante: Date): string {
  const { mes, dia } = camposBR(instante);
  return `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}`;
}

/**
 * Janela do período. `offset` navega no tempo: 0 = atual, -1 = anterior, +1 = seguinte.
 *
 * Semana é de calendário (segunda a domingo), não janela móvel de 7 dias — senão
 * "semana passada" nunca fecha e a comparação entre semanas não vale nada.
 */
export function janela(periodo: PeriodoKey, offset = 0, agora = new Date()): Janela {
  const { ano, mes, dia, diaSemana } = camposBR(agora);

  switch (periodo) {
    case "semana": {
      const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
      const primeiroDia = dia + diffParaSegunda + offset * 7;
      const inicio = brMidnightUTC(ano, mes, primeiroDia);
      const fim = brMidnightUTC(ano, mes, primeiroDia + 7);
      // O rótulo mostra o domingo (último dia da semana), não a segunda seguinte.
      return { inicio, fim, label: `${ddmm(inicio)} – ${ddmm(new Date(fim.getTime() - 1))}` };
    }
    case "mes": {
      const inicio = brMidnightUTC(ano, mes + offset, 1);
      const fim = brMidnightUTC(ano, mes + offset + 1, 1);
      const c = camposBR(inicio);
      return { inicio, fim, label: `${MESES[c.mes]}/${c.ano}` };
    }
    case "trimestre": {
      // Trimestre móvel: os três meses civis terminando no mês atual.
      const inicio = brMidnightUTC(ano, mes - 2 + offset * 3, 1);
      const fim = brMidnightUTC(ano, mes + 1 + offset * 3, 1);
      const ci = camposBR(inicio);
      const cf = camposBR(new Date(fim.getTime() - 1));
      return { inicio, fim, label: `${MESES_CURTO[ci.mes]} – ${MESES_CURTO[cf.mes]}/${cf.ano}` };
    }
    case "ano": {
      const inicio = brMidnightUTC(ano + offset, 0, 1);
      const fim = brMidnightUTC(ano + offset + 1, 0, 1);
      return { inicio, fim, label: String(ano + offset) };
    }
  }
}

/** Janela de um mês civil específico (mes 1-12), no fuso de Brasília. */
export function janelaMes(ano: number, mes: number): Janela {
  const inicio = brMidnightUTC(ano, mes - 1, 1);
  const fim = brMidnightUTC(ano, mes, 1);
  return { inicio, fim, label: `${MESES[mes - 1]}/${ano}` };
}

/** O dia corrente no calendário de Brasília. */
export function janelaHoje(agora = new Date()): Janela {
  const { ano, mes, dia } = camposBR(agora);
  return {
    inicio: brMidnightUTC(ano, mes, dia),
    fim: brMidnightUTC(ano, mes, dia + 1),
    label: "Hoje",
  };
}

/** Janela do mesmo tamanho imediatamente anterior — base das comparações Δ%. */
export function janelaAnterior(periodo: PeriodoKey, offset = 0, agora = new Date()): Janela {
  return janela(periodo, offset - 1, agora);
}

/**
 * Recorte interno do período, para ver a distribuição em vez de só o total:
 * semana vira dias, mês vira semanas, trimestre e ano viram meses.
 *
 * As semanas do mês são recortadas nas bordas — a "S1" começa no dia 1º, mesmo que
 * ele caia numa quinta. Assim a soma das barras bate exatamente com o total do mês.
 */
export function subJanelas(periodo: PeriodoKey, j: Janela): Janela[] {
  const partes: Janela[] = [];

  if (periodo === "semana") {
    const { ano, mes, dia } = camposBR(j.inicio);
    for (let i = 0; i < 7; i++) {
      const inicio = brMidnightUTC(ano, mes, dia + i);
      const fim = brMidnightUTC(ano, mes, dia + i + 1);
      partes.push({ inicio, fim, label: DIAS_CURTO[camposBR(inicio).diaSemana] });
    }
    return partes;
  }

  if (periodo === "mes") {
    const c = camposBR(j.inicio);
    // Recua até a segunda-feira da semana em que o mês começa.
    const diffParaSegunda = c.diaSemana === 0 ? -6 : 1 - c.diaSemana;
    let cursor = brMidnightUTC(c.ano, c.mes, c.dia + diffParaSegunda);
    while (cursor < j.fim) {
      const cc = camposBR(cursor);
      const fimSemana = brMidnightUTC(cc.ano, cc.mes, cc.dia + 7);
      partes.push({
        inicio: cursor < j.inicio ? j.inicio : cursor,
        fim: fimSemana > j.fim ? j.fim : fimSemana,
        label: "",
      });
      cursor = fimSemana;
    }
    return numerarSemanas(juntarPontas(partes));
  }

  // trimestre e ano: um bucket por mês civil.
  let cursor = j.inicio;
  while (cursor < j.fim) {
    const cc = camposBR(cursor);
    const fim = brMidnightUTC(cc.ano, cc.mes + 1, 1);
    partes.push({
      inicio: cursor,
      fim: fim > j.fim ? j.fim : fim,
      label: MESES_CURTO[cc.mes],
    });
    cursor = fim;
  }
  return partes;
}

const DIAS_MINIMOS_NA_PONTA = 4;

function duracaoEmDias(j: Janela): number {
  return (j.fim.getTime() - j.inicio.getTime()) / 86_400_000;
}

/**
 * Absorve a ponta curta do mês na semana vizinha.
 *
 * Um mês que começa num sábado gera uma "S1" de dois dias e às vezes uma última semana
 * de um dia só — barras minúsculas que sugerem uma queda de produção que não existe.
 * Juntar as pontas devolve as 4 ou 5 semanas cheias que se lê naturalmente, e o total
 * continua exato porque os intervalos são só mesclados, nunca descartados.
 */
function juntarPontas(partes: Janela[]): Janela[] {
  const r = [...partes];
  if (r.length > 1 && duracaoEmDias(r[0]) < DIAS_MINIMOS_NA_PONTA) {
    r[1] = { ...r[1], inicio: r[0].inicio };
    r.shift();
  }
  const ultima = r.length - 1;
  if (r.length > 1 && duracaoEmDias(r[ultima]) < DIAS_MINIMOS_NA_PONTA) {
    r[ultima - 1] = { ...r[ultima - 1], fim: r[ultima].fim };
    r.pop();
  }
  return r;
}

function numerarSemanas(partes: Janela[]): Janela[] {
  return partes.map((p, i) => ({ ...p, label: `S${i + 1}` }));
}

/** Verdadeiro quando a janela contém o instante atual — usado para não oferecer
 *  navegação para o futuro e para rotular o período corrente. */
export function ehPeriodoAtual(j: Janela, agora = new Date()): boolean {
  return agora >= j.inicio && agora < j.fim;
}

export function dentro(data: Date, j: Janela): boolean {
  return data >= j.inicio && data < j.fim;
}
