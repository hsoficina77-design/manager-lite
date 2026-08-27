import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OS_EM_ABERTO } from "@/lib/constants";
import { janelaMes } from "@/lib/periodo";
import { osEntreguesNoPeriodo, osNoPatio, dataProducao } from "@/lib/os-periodo";

function mediaOuNull(valores: number[]): number | null {
  return valores.length > 0 ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
}

// Produtividade dos mecânicos num mês, mais a visão consolidada da oficina: lucro real,
// NPS médio, SLA (tempo médio de execução), pátio atual e evolução dos últimos 6 meses.
// ?ano=2026&mes=6 — default: mês atual.
//
// O mês de uma OS é o da **entrega**, igual ao dashboard. Antes era o da abertura, o que
// dava três problemas: o mecânico não recebia crédito no mês em que trabalhou no carro,
// OS ainda no elevador já entrava como faturamento, e a meta era batida com serviço que
// não tinha saído. Os meses cortam no fuso de Brasília, não no do servidor.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const ano = Number(searchParams.get("ano")) || now.getFullYear();
  const mes = Number(searchParams.get("mes")) || now.getMonth() + 1;

  const jMes = janelaMes(ano, mes);
  // 6 meses de janela, incluindo o atual. `Date.UTC` normaliza a virada de ano.
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (5 - i), 1));
    const a = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    return { ano: a, mes: m, janela: janelaMes(a, m) };
  });
  const jHistorico = { inicio: meses[0].janela.inicio, fim: jMes.fim, label: "" };

  const [mecanicosAtivos, ordensPeriodo, ordensHistorico, patio, metas] = await Promise.all([
    prisma.mecanico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo(jMes),
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
    prisma.meta.findMany({ where: { ano, mes } }),
  ]);

  const metaPorMecanico = new Map(metas.map((m) => [m.mecanicoId, m.valorAlvo]));

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
    const progresso = meta > 0 ? (faturamento / meta) * 100 : null;

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

  // --- Oficina (todas as OS entregues no mês, com ou sem mecânico) ---
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

  // Pátio é estado, não fluxo: contar "quantas OS estão em andamento" dentro de um mês de
  // entrega seria contraditório, porque OS em aberto não tem entrega. Por isso este bloco
  // é sempre o agora, independente do mês escolhido acima.
  const patioPorStatus: Record<string, number> = Object.fromEntries(OS_EM_ABERTO.map((s) => [s, 0]));
  for (const linha of patio) {
    patioPorStatus[linha.status] = linha._count._all;
  }

  // --- Evolução dos últimos 6 meses (faturamento x lucro real) ---
  const evolucaoMensal = meses.map(({ ano: a, mes: m, janela: j }) => {
    const doMes = ordensHistorico.filter((o) => {
      const d = dataProducao(o);
      return d >= j.inicio && d < j.fim;
    });
    return {
      ano: a,
      mes: m,
      faturamento: doMes.reduce((s, o) => s + o.total, 0),
      lucroReal: doMes.reduce((s, o) => s + o.lucroReal, 0),
    };
  });

  return NextResponse.json({
    ano,
    mes,
    mecanicos,
    oficina: { nOS, faturamento, maoDeObra, lucroReal, margem, npsMedio, tempoMedioDias, patio: patioPorStatus },
    evolucaoMensal,
  });
}
