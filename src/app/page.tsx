import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { exigirUsuario } from "@/lib/auth";
import { formatCurrency, cn } from "@/lib/utils";
import { labelStatus, corStatus, margemOS, corMargem } from "@/lib/constants";
import {
  janela,
  janelaAnterior,
  janelaHoje,
  subJanelas,
  ehPeriodo,
  PERIODOS,
  type Janela,
  type PeriodoKey,
} from "@/lib/periodo";
import { osEntreguesNoPeriodo, osNoPatio, dataProducao, diasParado } from "@/lib/os-periodo";
import { custoDoIntervalo } from "@/lib/despesas";

// O dashboard responde duas perguntas de naturezas diferentes, e por isso são duas abas:
//
//   Operação  — "o que eu tenho na mão pra finalizar?"  É estado, não tem data.
//               Toda OS no pátio entra, tenha sido aberta hoje ou há 40 dias.
//   Resultado — "o quanto eu produzi?"                  É fluxo, tem data.
//               Só OS entregue, contada na data da entrega.
//
// Antes existia um filtro único que misturava as duas: OS concluída contava pelo
// fechamento e OS em aberto pela abertura. Isso fazia o carro aberto semana passada e
// trabalhado hoje sumir de "Hoje" (não fechou hoje, não abriu hoje) e ao mesmo tempo
// inflar o "Mês" sem ter produzido nada.

type OSLista = {
  id: string;
  numero: number;
  status: string;
  total: number;
  valorPago: number;
  custoTotalPecas: number;
  lucroReal: number;
  pago: boolean;
  mecanico: string | null;
  abertura: Date;
  fechamento: Date | null;
  cliente: { id: string; nome: string; apelido: string | null };
  veiculo: { marca: string; modelo: string; placa: string | null };
};

const INCLUDE_LISTA = {
  cliente: { select: { id: true, nome: true, apelido: true } },
  veiculo: { select: { marca: true, modelo: true, placa: true } },
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; periodo?: string; offset?: string }>;
}) {
  const sp = await searchParams;
  const usuario = await exigirUsuario();
  // Resultado é a aba do dinheiro (DRE, lucro, despesas): só o dono. Para o operador
  // ela nem aparece, e um link direto cai na Operação.
  const ehDono = usuario.papel === "ADMIN";
  const aba = ehDono && sp.aba === "resultado" ? "resultado" : "operacao";
  const periodo: PeriodoKey = ehPeriodo(sp.periodo) ? sp.periodo : "mes";
  const offset = Number.parseInt(sp.offset ?? "0", 10) || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {aba === "operacao"
              ? "O que está no pátio agora"
              : "O que foi entregue no período"}
          </p>
        </div>
        {ehDono && (
          <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
            <AbaLink href="/?aba=operacao" ativa={aba === "operacao"}>
              Operação
            </AbaLink>
            <AbaLink href={`/?aba=resultado&periodo=${periodo}`} ativa={aba === "resultado"}>
              Resultado
            </AbaLink>
          </div>
        )}
      </div>

      {aba === "operacao" ? (
        <Operacao ehDono={ehDono} />
      ) : (
        <Resultado periodo={periodo} offset={offset} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Operação */

// Foto do pátio neste instante. Nenhuma query aqui tem filtro de data: a OS aberta há
// 40 dias continua sendo trabalho a fazer, e o dinheiro dela continua sendo dinheiro a
// entrar. O que separa o carro ativo do encalhado é o aging na lista, não um recorte
// que faz ele desaparecer da conta.
async function Operacao({ ehDono }: { ehDono: boolean }) {
  const agora = new Date();
  const hoje = janelaHoje(agora);

  const [patio, entreguesHoje, devedoresOS, dividasAvulsas] = await Promise.all([
    prisma.ordemServico.findMany({
      where: osNoPatio,
      include: INCLUDE_LISTA,
      orderBy: { abertura: "asc" }, // mais parada no topo
    }) as unknown as Promise<OSLista[]>,
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo(hoje),
      select: { total: true, lucroReal: true },
    }),
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
  ]);

  const emServico = patio.filter((o) => o.status !== "AGUARDANDO_PECA").length;
  const agPeca = patio.length - emServico;

  const previsao = {
    receita: patio.reduce((s, o) => s + o.total, 0),
    custoPecas: patio.reduce((s, o) => s + o.custoTotalPecas, 0),
    lucro: patio.reduce((s, o) => s + o.lucroReal, 0),
    // Já descontando adiantamentos: é o que de fato ainda pinga no caixa.
    aEntrar: patio.reduce((s, o) => s + (o.total - o.valorPago), 0),
  };

  const hojeResumo = {
    n: entreguesHoje.length,
    faturado: entreguesHoje.reduce((s, o) => s + o.total, 0),
    lucro: entreguesHoje.reduce((s, o) => s + o.lucroReal, 0),
  };

  const { total: totalAReceber, quantidade: devedoresCount, top5 } = await resumoDevedores(
    devedoresOS,
    dividasAvulsas
  );

  return (
    <>
      <div className={cn("grid gap-4", ehDono ? "grid-cols-2 lg:grid-cols-5" : "grid-cols-3")}>
        <StatCard label="No pátio" value={String(patio.length)} href="/os?status=patio" />
        <StatCard label="Em serviço" value={String(emServico)} href="/os?status=patio" />
        <StatCard label="Ag. peça" value={String(agPeca)} href="/os?status=patio" />
        {ehDono && (
          <>
            <StatCard
              label="A Receber"
              value={formatCurrency(totalAReceber)}
              sub="de OS já entregues"
              href="/contas-receber"
              highlight={totalAReceber > 0}
            />
            <StatCard
              label="Devedores"
              value={String(devedoresCount)}
              href="/contas-receber"
              highlight={devedoresCount > 0}
            />
          </>
        )}
      </div>

      {/* Previsibilidade de caixa: o resultado de fechar tudo que está no pátio. */}
      {ehDono && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3">
            <h2 className="font-semibold text-zinc-800">Se finalizar tudo do pátio</h2>
            <p className="text-xs text-zinc-500">
              {patio.length} OS em aberto · custo de peças estimado pelo que já está lançado nas OS
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Metrica label="Receita potencial" valor={formatCurrency(previsao.receita)} />
            <Metrica label="Custo de peças" valor={`- ${formatCurrency(previsao.custoPecas)}`} />
            <Metrica
              label="Lucro potencial"
              valor={formatCurrency(previsao.lucro)}
              cor={previsao.lucro >= 0 ? "text-green-600" : "text-red-600"}
              forte
            />
            <Metrica label="Caixa a entrar" valor={formatCurrency(previsao.aEntrar)} />
          </div>
        </div>
      )}

      {/* O único número com data nesta aba: o realizado do dia. */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div>
            <p className="text-xs text-zinc-400">Entregue hoje</p>
            <p className="font-semibold text-zinc-900">
              {hojeResumo.n} OS
            </p>
          </div>
          {ehDono && (
            <>
              <Metrica label="Faturado" valor={formatCurrency(hojeResumo.faturado)} />
              <Metrica
                label="Lucro"
                valor={formatCurrency(hojeResumo.lucro)}
                cor={hojeResumo.lucro >= 0 ? "text-green-600" : "text-red-600"}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div>
            <h2 className="font-semibold text-zinc-800">Pátio</h2>
            <p className="text-xs text-zinc-500">Parada há mais tempo primeiro</p>
          </div>
          <ListaOS
            ordens={patio}
            vazio="Nenhuma OS em aberto."
            patio
            agora={agora}
            mostrarLucro={ehDono}
          />
        </div>

        <div className="space-y-4">
          <AcoesRapidas />
          {ehDono && <CardDevedores top5={top5} />}
        </div>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- Resultado */

// Só OS entregue, contada na data de entrega. Nenhuma OS em aberto entra aqui — é o que
// impede um carro aberto no dia 2 e ainda no elevador de aparecer como faturamento do mês.
async function Resultado({ periodo, offset }: { periodo: PeriodoKey; offset: number }) {
  const agora = new Date();
  const j = janela(periodo, offset, agora);
  const jAnterior = janelaAnterior(periodo, offset, agora);

  // Contas a pagar continuam entrando por vencimento, como já era. O corte em `agora`
  // preserva o comportamento atual no período corrente (conta que ainda vai vencer não
  // conta como despesa já incorrida) e, em período passado, fecha na borda da janela em
  // vez de truncar em "hoje" — que era o que quebrava o DRE de qualquer mês fechado.
  const fimDespesas = j.fim < agora ? j.fim : agora;

  const [ordens, ordensAnterior, recebidoOS, recebidoDivida, totalDespesas] = await Promise.all([
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo(j),
      include: INCLUDE_LISTA,
    }) as unknown as Promise<OSLista[]>,
    prisma.ordemServico.findMany({
      where: osEntreguesNoPeriodo(jAnterior),
      select: { total: true },
    }),
    prisma.pagamentoOS.aggregate({
      where: { data: { gte: j.inicio, lt: j.fim } },
      _sum: { valor: true },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).pagamentoDivida.aggregate({
      where: { data: { gte: j.inicio, lt: j.fim } },
      _sum: { valor: true },
    }) as Promise<{ _sum: { valor: number | null } }>,
    // Passa por `custoDoIntervalo` (e não direto no Prisma) porque é ele que
    // materializa os lançamentos das despesas fixas do período. Sem isso, o mês que
    // ninguém abriu em /despesas entraria no DRE sem o aluguel.
    custoDoIntervalo(j.inicio, fimDespesas),
  ]);

  const receita = ordens.reduce((s, o) => s + o.total, 0);
  const custoPecas = ordens.reduce((s, o) => s + o.custoTotalPecas, 0);
  const lucroBruto = ordens.reduce((s, o) => s + o.lucroReal, 0);
  const lucroLiquido = lucroBruto - totalDespesas;
  const recebido = (recebidoOS._sum.valor ?? 0) + (recebidoDivida._sum.valor ?? 0);

  const receitaAnterior = ordensAnterior.reduce((s, o) => s + o.total, 0);
  const ticket = ordens.length > 0 ? receita / ordens.length : 0;

  // A distribuição interna sai do que já foi carregado — nada de query por barra.
  const partes = subJanelas(periodo, j).map((sub) => {
    const doBucket = ordens.filter((o) => {
      const d = dataProducao(o);
      return d >= sub.inicio && d < sub.fim;
    });
    return {
      label: sub.label,
      receita: doBucket.reduce((s, o) => s + o.total, 0),
      n: doBucket.length,
    };
  });
  const maiorBucket = Math.max(...partes.map((p) => p.receita), 1);

  const ordenadas = [...ordens].sort(
    (a, b) => dataProducao(b).getTime() - dataProducao(a).getTime()
  );

  return (
    <>
      <NavegacaoPeriodo periodo={periodo} offset={offset} janela={j} podeAvancar={offset < 0} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="OS entregues" value={String(ordens.length)} href="/os?status=entregues" />
        <StatCard
          label="Faturado"
          value={formatCurrency(receita)}
          sub={variacao(receita, receitaAnterior)}
          href="/os?status=entregues"
        />
        <StatCard label="Ticket médio" value={formatCurrency(ticket)} href="/os?status=entregues" />
        <StatCard label="Recebido" value={formatCurrency(recebido)} sub="dinheiro que entrou" href="/caixa" />
        <StatCard
          label="Lucro líquido"
          value={formatCurrency(lucroLiquido)}
          sub={`bruto ${formatCurrency(lucroBruto)} − despesas`}
          href="/despesas"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="font-semibold text-zinc-800">DRE Simplificado</h2>
            <p className="text-xs text-zinc-500">Mesmas OS listadas abaixo</p>
          </div>
          <Link href="/despesas" className="shrink-0 text-xs text-brand-600 hover:underline">
            Controle de gastos →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <Metrica label="Receita" valor={formatCurrency(receita)} />
          <Metrica label="Custo de peças" valor={`- ${formatCurrency(custoPecas)}`} />
          <Metrica label="Despesas fixas" valor={`- ${formatCurrency(totalDespesas)}`} />
          <Metrica
            label="Lucro líquido"
            valor={formatCurrency(lucroLiquido)}
            cor={lucroLiquido >= 0 ? "text-green-600" : "text-red-600"}
            forte
          />
        </div>
        {receita > 0 && recebido < receita && (
          <p className="mt-3 text-xs text-zinc-500">
            Faturado {formatCurrency(receita)} · recebido {formatCurrency(recebido)} — diferença de{" "}
            <span className="font-medium text-red-600">{formatCurrency(receita - recebido)}</span>{" "}
            entre o serviço entregue e o dinheiro que entrou no período.
          </p>
        )}
      </div>

      {/* Distribuição interna: é aqui que dá pra ver qual semana rendeu. */}
      {partes.length > 1 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold text-zinc-800 mb-3">Distribuição no período</h2>
          <div className="space-y-2">
            {partes.map((p) => (
              <div key={p.label} className="flex items-center gap-3 text-xs">
                <span className="w-10 shrink-0 text-zinc-500">{p.label}</span>
                <div className="flex-1 h-5 rounded bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded bg-zinc-800"
                    style={{ width: `${(p.receita / maiorBucket) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-medium text-zinc-900">
                  {formatCurrency(p.receita)}
                </span>
                <span className="w-12 shrink-0 text-right text-zinc-400">
                  {p.n} OS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h2 className="font-semibold text-zinc-800">Entregues no período</h2>
          <p className="text-xs text-zinc-500">Mais recente primeiro</p>
        </div>
        <ListaOS ordens={ordenadas} vazio="Nenhuma OS entregue neste período." agora={agora} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Auxiliares */

// Saldo devedor completo (OS entregues não quitadas + dívidas avulsas), sem recorte de
// período: uma dívida não deixa de existir por ter sido aberta fora do período.
async function resumoDevedores(
  devedoresOS: { clienteId: string; _sum: { total: number | null; valorPago: number | null } }[],
  dividas: { clienteId: string; _sum: { valor: number | null; valorPago: number | null } }[]
) {
  const saldoPorCliente = new Map<string, number>();
  const somar = (clienteId: string, saldo: number) => {
    if (saldo > 0) saldoPorCliente.set(clienteId, (saldoPorCliente.get(clienteId) ?? 0) + saldo);
  };

  for (const row of devedoresOS) somar(row.clienteId, (row._sum.total ?? 0) - (row._sum.valorPago ?? 0));
  for (const row of dividas) somar(row.clienteId, (row._sum.valor ?? 0) - (row._sum.valorPago ?? 0));

  const total = [...saldoPorCliente.values()].reduce((s, v) => s + v, 0);
  const ids = [...saldoPorCliente.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const clientes =
    ids.length > 0
      ? await prisma.cliente.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true } })
      : [];

  const top5 = clientes
    .map((c) => ({ nome: c.nome, saldo: saldoPorCliente.get(c.id) ?? 0 }))
    .sort((a, b) => b.saldo - a.saldo);

  return { total, quantidade: saldoPorCliente.size, top5 };
}

// Sem base de comparação (período anterior zerado) não há percentual honesto a mostrar.
function variacao(atual: number, anterior: number): string | undefined {
  if (anterior <= 0) return undefined;
  const pct = ((atual - anterior) / anterior) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs. período anterior`;
}

function corAging(dias: number): string {
  if (dias >= 15) return "bg-red-100 text-red-700";
  if (dias >= 7) return "bg-orange-100 text-orange-700";
  return "bg-zinc-100 text-zinc-500";
}

function AbaLink({ href, ativa, children }: { href: string; ativa: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
        ativa ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
      )}
    >
      {children}
    </Link>
  );
}

function NavegacaoPeriodo({
  periodo,
  offset,
  janela: j,
  podeAvancar,
}: {
  periodo: PeriodoKey;
  offset: number;
  janela: Janela;
  podeAvancar: boolean;
}) {
  const url = (p: PeriodoKey, o: number) => `/?aba=resultado&periodo=${p}&offset=${o}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Link
          href={url(periodo, offset - 1)}
          aria-label="Período anterior"
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          ←
        </Link>
        <span className="min-w-36 text-center text-sm font-semibold text-zinc-800">{j.label}</span>
        {podeAvancar ? (
          <Link
            href={url(periodo, offset + 1)}
            aria-label="Próximo período"
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            →
          </Link>
        ) : (
          <span className="rounded-lg border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 text-sm text-zinc-300">
            →
          </span>
        )}
      </div>

      {/* Trocar de período volta para o atual: "3 meses atrás" de uma semana não é
          equivalente a "3 meses atrás" de um mês, e manter o offset confundiria. */}
      <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-1">
        {PERIODOS.map((opt) => (
          <Link
            key={opt.value}
            href={url(opt.value, 0)}
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
  );
}

// Serve as duas abas. `patio` marca a lista de OS em aberto, onde o tempo parado importa
// e o lucro ainda é previsão; na lista de entregues ele já é resultado.
function ListaOS({
  ordens,
  vazio,
  patio,
  agora,
  mostrarLucro = true,
}: {
  ordens: OSLista[];
  vazio: string;
  patio?: boolean;
  agora: Date;
  /** Lucro e margem por OS são coisa de dono. */
  mostrarLucro?: boolean;
}) {
  if (ordens.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-sm text-zinc-400">
        {vazio}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
      {ordens.map((os) => {
        const dias = diasParado(os.abertura, agora);
        const margem = margemOS(os);
        const lucroTitulo = patio
          ? "Lucro previsto se a OS fechar com os valores atuais"
          : "Lucro real (após custo de peças)";
        return (
          <Link
            key={os.id}
            href={`/os/${os.id}`}
            className="flex flex-col gap-1.5 px-4 py-3 hover:bg-zinc-50 transition-colors sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="flex items-center gap-3 sm:contents">
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
              <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                {patio && (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", corAging(dias))}>
                    {dias}d
                  </span>
                )}
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", corStatus(os.status))}>
                  {labelStatus(os.status)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
              {mostrarLucro && (
                <div className="text-right text-xs sm:w-24" title={lucroTitulo}>
                  <p className={cn("font-semibold", corMargem(margem))}>{formatCurrency(os.lucroReal)}</p>
                  <p className={cn("text-[11px]", corMargem(margem))}>
                    {margem === null ? "—" : `${margem.toFixed(0)}% margem`}
                  </p>
                </div>
              )}
              {patio && (
                <span
                  className={cn("hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block", corAging(dias))}
                  title={`No pátio há ${dias} dia${dias === 1 ? "" : "s"}`}
                >
                  {dias}d
                </span>
              )}
              <span
                className={cn(
                  "hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block",
                  corStatus(os.status)
                )}
              >
                {labelStatus(os.status)}
              </span>
              <div className="text-right text-xs">
                <p className="font-semibold text-zinc-900">{formatCurrency(os.total)}</p>
                {!os.pago && <p className="text-red-500">Pendente</p>}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function AcoesRapidas() {
  return (
    <div className="space-y-2">
      <Link
        href="/clientes/novo"
        className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        + Novo Cliente
      </Link>
      <Link
        href="/os/nova"
        className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors"
      >
        + Nova OS
      </Link>
    </div>
  );
}

function CardDevedores({ top5 }: { top5: { nome: string; saldo: number }[] }) {
  if (top5.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-red-800 text-sm">Maiores devedores</h3>
        <Link href="/contas-receber" className="text-xs text-brand-600 hover:underline">
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
  );
}

function Metrica({
  label,
  valor,
  cor,
  forte,
}: {
  label: string;
  valor: string;
  cor?: string;
  forte?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className={cn(forte ? "font-bold" : "font-semibold", cor ?? "text-zinc-900")}>{valor}</p>
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
