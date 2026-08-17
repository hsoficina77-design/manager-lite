import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type OSAtiva = {
  id: string;
  numero: number;
  status: string;
  total: number;
  pago: boolean;
  mecanico: string | null;
  cliente: { id: string; nome: string; apelido: string | null };
  veiculo: { marca: string; modelo: string; placa: string | null };
};

const PERIODO_OPTIONS = [
  { label: "Hoje", value: "hoje" },
  { label: "Semana", value: "semana" },
  { label: "Mês", value: "mes" },
  { label: "3 Meses", value: "trimestre" },
  { label: "Ano", value: "ano" },
];

function getPeriodoStart(periodo: string): Date {
  const now = new Date();
  switch (periodo) {
    case "hoje":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "semana": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "trimestre": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case "ano": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    default: {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
  }
}

const STATUS_COLOR: Record<string, string> = {
  ABERTA: "bg-zinc-200 text-zinc-700",
  EM_ANDAMENTO: "bg-zinc-800 text-zinc-100",
  AGUARDANDO_PECA: "bg-zinc-300 text-zinc-800",
  PRONTA: "bg-zinc-900 text-white",
  FECHADA: "bg-zinc-600 text-white",
  ENTREGUE: "bg-zinc-100 text-zinc-500",
  CANCELADA: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em Andamento",
  AGUARDANDO_PECA: "Ag. Peça",
  PRONTA: "Pronta",
  FECHADA: "Fechada",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo = "mes" } = await searchParams;
  const periodoStart = getPeriodoStart(periodo);

  const [
    patioCount,
    aFecharCount,
    fechadasCount,
    osPendentes,
    osAtivas,
    devedoresData,
    dividasAvulsasRaw,
    ordensDRE,
    despesasDRE,
  ] = await Promise.all([
    prisma.ordemServico.count({
      where: { status: { in: ["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PECA"] } },
    }),
    prisma.ordemServico.count({ where: { status: "PRONTA" } }),
    prisma.ordemServico.count({ where: { status: "FECHADA" } }),
    prisma.ordemServico.findMany({
      where: {
        pago: false,
        status: "ENTREGUE",
        abertura: { gte: periodoStart },
      },
      select: { total: true, valorPago: true },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).ordemServico.findMany({
      where: { status: { in: ["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PECA", "PRONTA"] } },
      include: {
        cliente: { select: { id: true, nome: true, apelido: true } },
        veiculo: { select: { marca: true, modelo: true, placa: true } },
      },
      orderBy: { abertura: "desc" },
    }) as Promise<OSAtiva[]>,
    prisma.ordemServico.groupBy({
      by: ["clienteId"],
      where: { pago: false, status: "ENTREGUE" },
      _sum: { total: true, valorPago: true },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).dividaAvulsa.groupBy({
      by: ["clienteId"],
      where: { pago: false },
      _sum: { valor: true, valorPago: true },
    }) as Promise<{ clienteId: string; _sum: { valor: number; valorPago: number } }[]>,
    prisma.ordemServico.findMany({
      where: { status: { not: "CANCELADA" }, abertura: { gte: periodoStart } },
      select: { total: true, custoTotalPecas: true, lucroReal: true },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).despesa.findMany({
      where: { vencimento: { gte: periodoStart, lte: new Date() } },
      select: { valor: true },
    }) as Promise<{ valor: number }[]>,
  ]);

  const dre = {
    receita: ordensDRE.reduce((s: number, o: { total: number }) => s + o.total, 0),
    custoPecas: ordensDRE.reduce((s: number, o: { custoTotalPecas: number }) => s + o.custoTotalPecas, 0),
    lucroBruto: ordensDRE.reduce((s: number, o: { lucroReal: number }) => s + o.lucroReal, 0),
    despesas: despesasDRE.reduce((s, d) => s + d.valor, 0),
  };
  const lucroLiquido = dre.lucroBruto - dre.despesas;

  const totalAReceber = osPendentes.reduce(
    (sum: number, os: { total: number; valorPago: number }) => sum + (os.total - os.valorPago),
    0
  );

  // Calcular top 5 devedores (OS + dívidas avulsas)
  const devedorMap = new Map<string, number>();
  for (const row of devedoresData) {
    const saldo = (row._sum.total ?? 0) - (row._sum.valorPago ?? 0);
    if (saldo > 0) devedorMap.set(row.clienteId, (devedorMap.get(row.clienteId) ?? 0) + saldo);
  }
  for (const row of dividasAvulsasRaw) {
    const saldo = (row._sum.valor ?? 0) - (row._sum.valorPago ?? 0);
    if (saldo > 0) devedorMap.set(row.clienteId, (devedorMap.get(row.clienteId) ?? 0) + saldo);
  }

  const devedoresIds = [...devedorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const devedoresCount = devedorMap.size;

  const top5Clientes =
    devedoresIds.length > 0
      ? await prisma.cliente.findMany({
          where: { id: { in: devedoresIds } },
          select: { id: true, nome: true },
        })
      : [];

  const top5 = top5Clientes
    .map((c) => ({ nome: c.nome, saldo: devedorMap.get(c.id) ?? 0 }))
    .sort((a, b) => b.saldo - a.saldo);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Visão geral da oficina</p>
        </div>
        {/* Filtro de período */}
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-1">
          {PERIODO_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={`/?periodo=${opt.value}`}
              className={cn(
                "shrink-0 whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                periodo === opt.value
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Pátio" value={String(patioCount)} href="/os?status=ABERTA" />
        <StatCard label="A Fechar" value={String(aFecharCount)} href="/os?status=PRONTA" />
        <StatCard label="Fechadas" value={String(fechadasCount)} href="/os?status=FECHADA" />
        <StatCard
          label="A Receber"
          value={formatCurrency(totalAReceber)}
          sub={`${osPendentes.length} pendente${osPendentes.length !== 1 ? "s" : ""}`}
          href="/contas-receber"
          highlight={totalAReceber > 0}
        />
        <StatCard
          label="Devedores"
          value={String(devedoresCount)}
          href="/contas-receber"
          highlight={devedoresCount > 0}
        />
      </div>

      {/* DRE simplificado */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-800">DRE Simplificado</h2>
          <Link href="/despesas" className="text-xs text-red-600 hover:underline">Contas a pagar →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-zinc-400">Receita</p>
            <p className="font-semibold text-zinc-900">{formatCurrency(dre.receita)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Custo de peças</p>
            <p className="font-semibold text-zinc-900">- {formatCurrency(dre.custoPecas)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Despesas fixas</p>
            <p className="font-semibold text-zinc-900">- {formatCurrency(dre.despesas)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Lucro líquido</p>
            <p className={cn("font-bold", lucroLiquido >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(lucroLiquido)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de OSs pendentes */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-zinc-800">OSs em aberto</h2>
          {osAtivas.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-sm text-zinc-400">
              Nenhuma OS em aberto.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
              {osAtivas.map((os) => (
                <Link
                  key={os.id}
                  href={`/os/${os.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="shrink-0 text-center w-10">
                    <p className="text-xs text-zinc-400">OS</p>
                    <p className="font-bold text-zinc-900 text-sm">#{os.numero}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 text-sm truncate">{os.cliente.nome}</p>
                      {os.cliente.apelido && (
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                          {os.cliente.apelido}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {os.veiculo.marca} {os.veiculo.modelo}
                      {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
                      {os.mecanico ? ` · ${os.mecanico}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLOR[os.status])}>
                      {STATUS_LABEL[os.status] || os.status}
                    </span>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-zinc-900">{formatCurrency(os.total)}</p>
                      {!os.pago && <p className="text-red-500">Pendente</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Ações rápidas */}
          <div className="space-y-2">
            <Link
              href="/clientes/novo"
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              + Novo Cliente
            </Link>
            <Link
              href="/os/nova"
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              + Nova OS
            </Link>
          </div>

          {/* Card de devedores */}
          {top5.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-red-800 text-sm">Maiores devedores</h3>
                <Link href="/contas-receber" className="text-xs text-red-600 hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="space-y-2">
                {top5.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <p className="text-red-900 font-medium truncate">{d.nome}</p>
                    <p className="text-red-700 font-bold shrink-0 ml-2">{formatCurrency(d.saldo)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-xl border p-4 hover:shadow-sm transition-shadow",
        highlight ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"
      )}
    >
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", highlight ? "text-red-600" : "text-zinc-900")}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </Link>
  );
}
