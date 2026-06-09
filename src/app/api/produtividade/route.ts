import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Agrega a produtividade dos mecânicos num mês (por data de abertura da OS).
// ?ano=2026&mes=6 — default: mês atual.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const ano = Number(searchParams.get("ano")) || now.getFullYear();
  const mes = Number(searchParams.get("mes")) || now.getMonth() + 1;

  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1); // primeiro dia do mês seguinte

  const [mecanicos, ordens, metas] = await Promise.all([
    prisma.mecanico.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.ordemServico.findMany({
      where: {
        mecanicoId: { not: null },
        status: { not: "CANCELADA" },
        abertura: { gte: inicio, lt: fim },
      },
      select: { mecanicoId: true, total: true, totalMO: true },
    }),
    prisma.meta.findMany({ where: { ano, mes } }),
  ]);

  const metaPorMecanico = new Map(metas.map((m) => [m.mecanicoId, m.valorAlvo]));

  const resultado = mecanicos.map((mec) => {
    const suas = ordens.filter((o) => o.mecanicoId === mec.id);
    const nOS = suas.length;
    const faturamento = suas.reduce((s, o) => s + o.total, 0);
    const maoDeObra = suas.reduce((s, o) => s + o.totalMO, 0);
    const ticketMedio = nOS > 0 ? faturamento / nOS : 0;
    const meta = metaPorMecanico.get(mec.id) ?? 0;
    const progresso = meta > 0 ? (faturamento / meta) * 100 : null;

    return {
      mecanicoId: mec.id,
      nome: mec.nome,
      especialidade: mec.especialidade,
      nOS,
      faturamento,
      maoDeObra,
      ticketMedio,
      meta,
      progresso,
    };
  });

  return NextResponse.json({ ano, mes, mecanicos: resultado });
}
