import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_ORDEM = ["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PECA", "PRONTA", "FECHADA", "ENTREGUE", "CANCELADA"];

function mediaOuNull(valores: number[]): number | null {
  return valores.length > 0 ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
}

// Agrega a produtividade dos mecânicos num mês (por data de abertura da OS),
// mais a visão consolidada da oficina: lucro real, NPS médio, SLA (tempo médio de
// execução), funil de status e evolução dos últimos 6 meses.
// ?ano=2026&mes=6 — default: mês atual.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const ano = Number(searchParams.get("ano")) || now.getFullYear();
  const mes = Number(searchParams.get("mes")) || now.getMonth() + 1;

  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1); // primeiro dia do mês seguinte
  const inicioHistorico = new Date(ano, mes - 1 - 5, 1); // 6 meses de janela, incluindo o atual

  const [mecanicosAtivos, ordensPeriodo, ordensHistorico, metas] = await Promise.all([
    prisma.mecanico.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.ordemServico.findMany({
      where: { abertura: { gte: inicio, lt: fim } },
      select: {
        mecanicoId: true, status: true, total: true, totalMO: true,
        lucroReal: true, nps: true, abertura: true, fechamento: true,
      },
    }),
    prisma.ordemServico.findMany({
      where: { abertura: { gte: inicioHistorico, lt: fim }, status: { not: "CANCELADA" } },
      select: { abertura: true, total: true, lucroReal: true },
    }),
    prisma.meta.findMany({ where: { ano, mes } }),
  ]);

  const metaPorMecanico = new Map(metas.map((m) => [m.mecanicoId, m.valorAlvo]));
  const validas = ordensPeriodo.filter((o) => o.status !== "CANCELADA");

  // --- Por mecânico ---
  const mecanicos = mecanicosAtivos.map((mec) => {
    const suas = validas.filter((o) => o.mecanicoId === mec.id);
    const nOS = suas.length;
    const faturamento = suas.reduce((s, o) => s + o.total, 0);
    const maoDeObra = suas.reduce((s, o) => s + o.totalMO, 0);
    const lucroReal = suas.reduce((s, o) => s + o.lucroReal, 0);
    const ticketMedio = nOS > 0 ? faturamento / nOS : 0;
    const margem = faturamento > 0 ? (lucroReal / faturamento) * 100 : null;
    const npsMedio = mediaOuNull(suas.map((o) => o.nps).filter((n): n is number => n != null));
    const fechadas = suas.filter((o) => o.fechamento);
    const tempoMedioDias = mediaOuNull(
      fechadas.map((o) => (o.fechamento!.getTime() - o.abertura.getTime()) / 86400000)
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

  // --- Oficina (todas as OS do período, com ou sem mecânico) ---
  const nOS = validas.length;
  const faturamento = validas.reduce((s, o) => s + o.total, 0);
  const maoDeObra = validas.reduce((s, o) => s + o.totalMO, 0);
  const lucroReal = validas.reduce((s, o) => s + o.lucroReal, 0);
  const margem = faturamento > 0 ? (lucroReal / faturamento) * 100 : null;
  const npsMedio = mediaOuNull(validas.map((o) => o.nps).filter((n): n is number => n != null));
  const fechadasOficina = validas.filter((o) => o.fechamento);
  const tempoMedioDias = mediaOuNull(
    fechadasOficina.map((o) => (o.fechamento!.getTime() - o.abertura.getTime()) / 86400000)
  );

  const funil: Record<string, number> = Object.fromEntries(STATUS_ORDEM.map((s) => [s, 0]));
  for (const o of ordensPeriodo) {
    funil[o.status] = (funil[o.status] ?? 0) + 1;
  }

  // --- Evolução dos últimos 6 meses (faturamento x lucro real) ---
  const meses: { ano: number; mes: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ano, mes - 1 - i, 1);
    meses.push({ ano: d.getFullYear(), mes: d.getMonth() + 1 });
  }
  const evolucaoMensal = meses.map(({ ano: a, mes: m }) => {
    const doMes = ordensHistorico.filter(
      (o) => o.abertura.getFullYear() === a && o.abertura.getMonth() + 1 === m
    );
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
    oficina: { nOS, faturamento, maoDeObra, lucroReal, margem, npsMedio, tempoMedioDias, funil },
    evolucaoMensal,
  });
}
