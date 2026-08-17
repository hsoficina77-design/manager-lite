import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fechamento de caixa: soma os recebimentos (OS + dívidas avulsas) de um dia,
// agrupados por forma de pagamento. ?data=YYYY-MM-DD — default: hoje.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataParam = searchParams.get("data");
  const dia = dataParam ? new Date(`${dataParam}T00:00:00`) : new Date();
  const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);

  const [pagamentosOS, pagamentosDivida] = await Promise.all([
    prisma.pagamentoOS.findMany({
      where: { data: { gte: inicio, lt: fim } },
      include: { ordem: { select: { numero: true, cliente: { select: { nome: true } } } } },
      orderBy: { data: "desc" },
    }),
    prisma.pagamentoDivida.findMany({
      where: { data: { gte: inicio, lt: fim } },
      include: { divida: { select: { descricao: true, cliente: { select: { nome: true } } } } },
      orderBy: { data: "desc" },
    }),
  ]);

  const lancamentos = [
    ...pagamentosOS.map((p) => ({
      id: `os-${p.id}`,
      tipo: "os" as const,
      valor: p.valor,
      formaPagamento: p.formaPagamento,
      data: p.data,
      obs: p.obs,
      referencia: `OS #${p.ordem.numero}`,
      cliente: p.ordem.cliente.nome,
      link: `/os/${p.ordemId}`,
    })),
    ...pagamentosDivida.map((p) => ({
      id: `divida-${p.id}`,
      tipo: "divida" as const,
      valor: p.valor,
      formaPagamento: p.formaPagamento,
      data: p.data,
      obs: p.obs,
      referencia: p.divida.descricao,
      cliente: p.divida.cliente.nome,
      link: null as string | null,
    })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const porForma: Record<string, number> = {};
  for (const l of lancamentos) {
    porForma[l.formaPagamento] = (porForma[l.formaPagamento] ?? 0) + l.valor;
  }
  const total = lancamentos.reduce((s, l) => s + l.valor, 0);

  return NextResponse.json({ data: inicio.toISOString(), total, porForma, lancamentos });
}
