import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OS_EM_ABERTO } from "@/lib/constants";
import { janela, janelaMes, mesesDaJanela, type PeriodoKey } from "@/lib/periodo";
import { osEntreguesNoPeriodo, osNoPatio, dataProducao } from "@/lib/os-periodo";

function mediaOuNull(valores: number[]): number | null {
  return valores.length > 0 ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
}

// Períodos aceitos por esta rota — próprios da Produtividade, não o `PERIODOS` do
// Dashboard (que tem "semana" e "trimestre", que não fazem sentido aqui).
const PERIODOS_VALIDOS: PeriodoKey[] = ["mes", "semestre", "ano"];

// Produtividade dos mecânicos num período (mês, semestre ou ano), mais a visão
// consolidada da oficina: lucro real, NPS médio, SLA (tempo médio de execução), pátio
// atual e evolução mensal dentro do período. ?periodo=mes&offset=0 — default: mês
// atual. `offset` navega dentro do tipo de período escolhido (cada passo é 1 mês, 6
// meses ou 12 meses) e volta a 0 quando o período muda, igual ao Dashboard.
//
// O período de uma OS é o da **entrega**, igual ao dashboard. Antes era o da abertura, o que
// dava três problemas: o mecânico não recebia crédito no mês em que trabalhou no carro,
// OS ainda no elevador já entrava como faturamento, e a meta era batida com serviço que
// não tinha saído. Os cortes são no fuso de Brasília, não no do servidor.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodoParam = searchParams.get("periodo");
  const periodo: PeriodoKey = PERIODOS_VALIDOS.includes(periodoParam as PeriodoKey)
    ? (periodoParam as PeriodoKey)
    : "mes";
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0;

  const j = janela(periodo, offset);

  // Evolução mensal do painel: com um só mês selecionado, os últimos 6 meses dão
  // contexto de tendência; com semestre ou ano, os próprios meses do período já são a
  // distribuição que interessa — não faz sentido somar mais meses em volta.
  const mesesEvolucao =
    periodo === "mes"
      ? Array.from({ length: 6 }, (_, i) => {
          const d = new Date(Date.UTC(j.inicio.getUTCFullYear(), j.inicio.getUTCMonth() - (5 - i), 1));
          return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
        })
      : mesesDaJanela(j);
  const primeiroMesEvolucao = mesesEvolucao[0];
  const jHistorico = {
    inicio: janelaMes(primeiroMesEvolucao.ano, primeiroMesEvolucao.mes).inicio,
    fim: j.fim,
    label: "",
  };

  const [mecanicosAtivos, ordensPeriodo, ordensHistorico, patio, metas] = await Promise.all([
    prisma.mecanico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo(j),
      select: {
        mecanicoId: true, status: true, total: true, totalMO: true,
        lucroReal: true, nps: true, abertura: true, fechamento: true,
      },
    }),
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo(jHistorico),
      select: { abertura: true, fechamento: true, total: true, lucroReal: true },
    }),
    prisma.ordemServico.groupBy({
      by: ["status"],
      where: osNoPatio,
      _count: { _all: true },
    }),
    // A meta é mensal; num semestre ou ano ela é a soma das metas dos meses cobertos.
    prisma.meta.findMany({ where: { OR: mesesDaJanela(j).map(({ ano, mes }) => ({ ano, mes })) } }),
  ]);

  const metaPorMecanico = new Map<string, number>();
  for (const m of metas) {
    metaPorMecanico.set(m.mecanicoId, (metaPorMecanico.get(m.mecanicoId) ?? 0) + m.valorAlvo);
  }

  // --- Por mecânico ---
  const mecanicos = mecanicosAtivos.map((mec) => {
    const suas = ordensPeriodo.filter((o) => o.mecanicoId === mec.id);
    const nOS = suas.length;
    const faturamento = suas.reduce((s, o) => s + o.total, 0);
    const maoDeObra = suas.reduce((s, o) => s + o.totalMO, 0);
    const lucroReal = suas.reduce((s, o) => s + o.lucroReal, 0);
    const ticketMedio = nOS > 0 ? faturamento / nOS : 0;
    const margem = faturamento > 0 ? (lucroReal / faturamento) * 100 : null;
    const npsMedio = mediaOuNull(suas.map((o) => o.nps).filter((n): n is number => n != null));
    const tempoMedioDias = mediaOuNull(
      suas
        .filter((o) => o.fechamento)
        .map((o) => (o.fechamento!.getTime() - o.abertura.getTime()) / 86400000)
    );
    const meta = metaPorMecanico.get(mec.id) ?? 0;
    const progresso = meta > 0 ? (lucroReal / meta) * 100 : null;

    return {
      mecanicoId: mec.id,
      nome: mec.nome,
      especialidade: mec.especialidade,
      nOS,
      faturamento,
      maoDeObra,
      lucroReal,
      margem,
      npsMedio,
      tempoMedioDias,
      ticketMedio,
      meta,
      progresso,
    };
  });

  // --- Oficina (todas as OS entregues no período, com ou sem mecânico) ---
  const nOS = ordensPeriodo.length;
  const faturamento = ordensPeriodo.reduce((s, o) => s + o.total, 0);
  const maoDeObra = ordensPeriodo.reduce((s, o) => s + o.totalMO, 0);
  const lucroReal = ordensPeriodo.reduce((s, o) => s + o.lucroReal, 0);
  const margem = faturamento > 0 ? (lucroReal / faturamento) * 100 : null;
  const npsMedio = mediaOuNull(ordensPeriodo.map((o) => o.nps).filter((n): n is number => n != null));
  const tempoMedioDias = mediaOuNull(
    ordensPeriodo
      .filter((o) => o.fechamento)
      .map((o) => (o.fechamento!.getTime() - o.abertura.getTime()) / 86400000)
  );

  // Pátio é estado, não fluxo: contar "quantas OS estão em andamento" dentro de um
  // período de entrega seria contraditório, porque OS em aberto não tem entrega. Por
  // isso este bloco é sempre o agora, independente do período escolhido acima.
  const patioPorStatus: Record<string, number> = Object.fromEntries(OS_EM_ABERTO.map((s) => [s, 0]));
  for (const linha of patio) {
    patioPorStatus[linha.status] = linha._count._all;
  }

  // --- Evolução mensal (faturamento x lucro real) ---
  const evolucaoMensal = mesesEvolucao.map(({ ano: a, mes: m }) => {
    const jm = janelaMes(a, m);
    const doMes = ordensHistorico.filter((o) => {
      const d = dataProducao(o);
      return d >= jm.inicio && d < jm.fim;
    });
    return {
      ano: a,
      mes: m,
      faturamento: doMes.reduce((s, o) => s + o.total, 0),
      lucroReal: doMes.reduce((s, o) => s + o.lucroReal, 0),
    };
  });

  return NextResponse.json({
    periodo,
    offset,
    label: j.label,
    mecanicos,
    oficina: { nOS, faturamento, maoDeObra, lucroReal, margem, npsMedio, tempoMedioDias, patio: patioPorStatus },
    evolucaoMensal,
  });
}
