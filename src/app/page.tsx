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
import { FaixaMetricas, Metrica, MetricaLink, Painel, Vazio } from "@/components/ui/Dados";
import { BotaoLink } from "@/components/ui/Botao";
import { Avancar, Mais, SetaDireita, Voltar } from "@/components/ui/Icones";

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
      {/* As abas já dizem o que a tela mostra; a linha explicativa embaixo do
          título era ruído em toda página para quem abre o sistema todo dia. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-tinta">Dashboard</h1>
        {ehDono && (
          <div className="flex gap-1 rounded-lg bg-superficie-3 p-1">
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
      {/* Uma superfície com divisórias, não cinco cartões iguais empilhados. */}
      <FaixaMetricas colunas={ehDono ? 5 : 3}>
        <MetricaLink
          href="/os?status=patio"
          rotulo="No pátio"
          valor={String(patio.length)}
          tamanho="grande"
        />
        <MetricaLink
          href="/os?status=patio"
          rotulo="Em serviço"
          valor={String(emServico)}
          tamanho="grande"
        />
        <MetricaLink
          href="/os?status=patio"
          rotulo="Ag. peça"
          valor={String(agPeca)}
          tamanho="grande"
          tom={agPeca > 0 ? "atencao" : "neutro"}
        />
        {ehDono && (
          <>
            <MetricaLink
              href="/contas-receber"
              rotulo="A receber"
              valor={formatCurrency(totalAReceber)}
              sub="de OS já entregues"
              tamanho="grande"
              tom={totalAReceber > 0 ? "perigo" : "neutro"}
            />
            <MetricaLink
              href="/contas-receber"
              rotulo="Devedores"
              valor={String(devedoresCount)}
              tamanho="grande"
              tom={devedoresCount > 0 ? "perigo" : "neutro"}
            />
          </>
        )}
      </FaixaMetricas>

      {/* Previsibilidade de caixa: o resultado de fechar tudo que está no pátio. */}
      {ehDono && (
        <Painel
          titulo="Se finalizar tudo do pátio"
          ajuda={`${patio.length} OS em aberto · custo de peças estimado pelo que já está lançado nas OS`}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metrica rotulo="Receita potencial" valor={formatCurrency(previsao.receita)} />
            <Metrica rotulo="Custo de peças" valor={`- ${formatCurrency(previsao.custoPecas)}`} />
            <Metrica
              rotulo="Lucro potencial"
              valor={formatCurrency(previsao.lucro)}
              tom={previsao.lucro >= 0 ? "ok" : "perigo"}
            />
            <Metrica rotulo="Caixa a entrar" valor={formatCurrency(previsao.aEntrar)} />
          </div>
        </Painel>
      )}

      {/* O único número com data nesta aba: o realizado do dia. */}
      <div className="rounded-xl border border-linha bg-superficie-2 p-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Metrica rotulo="Entregue hoje" valor={`${hojeResumo.n} OS`} />
          {ehDono && (
            <>
              <Metrica rotulo="Faturado" valor={formatCurrency(hojeResumo.faturado)} />
              <Metrica
                rotulo="Lucro"
                valor={formatCurrency(hojeResumo.lucro)}
                tom={hojeResumo.lucro >= 0 ? "ok" : "perigo"}
              />
            </>
          )}
        </div>
      </div>

      {/* No celular a coluna da direita vira "depois de tudo", e "Nova OS" ficava
          atrás da lista inteira do pátio. Agora as ações vêm antes da lista, e só
          voltam para a lateral onde há duas colunas de verdade. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:order-2">
          <AcoesRapidas />
          {ehDono && <CardDevedores top5={top5} />}
        </div>

        <div className="space-y-3 lg:order-1 lg:col-span-2">
          <div>
            <h2 className="font-semibold text-tinta">Pátio</h2>
            <p className="text-xs text-tinta-3">Parada há mais tempo primeiro</p>
          </div>
          <ListaOS
            ordens={patio}
            vazio="Nenhuma OS em aberto."
            vazioTexto="Quando um carro entrar, ele aparece aqui com o tempo parado."
            vazioAcao={
              <BotaoLink href="/os/nova">
                <Mais tamanho={16} /> Abrir a primeira OS
              </BotaoLink>
            }
            patio
            agora={agora}
            mostrarLucro={ehDono}
          />
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

      <FaixaMetricas colunas={5}>
        <MetricaLink
          href="/os?status=entregues"
          rotulo="OS entregues"
          valor={String(ordens.length)}
          tamanho="grande"
        />
        <MetricaLink
          href="/os?status=entregues"
          rotulo="Faturado"
          valor={formatCurrency(receita)}
          sub={variacao(receita, receitaAnterior)}
          tamanho="grande"
        />
        <MetricaLink
          href="/os?status=entregues"
          rotulo="Ticket médio"
          valor={formatCurrency(ticket)}
          tamanho="grande"
        />
        <MetricaLink
          href="/caixa"
          rotulo="Recebido"
          valor={formatCurrency(recebido)}
          sub="dinheiro que entrou"
          tamanho="grande"
        />
        <MetricaLink
          href="/despesas"
          rotulo="Lucro líquido"
          valor={formatCurrency(lucroLiquido)}
          sub={`bruto ${formatCurrency(lucroBruto)} − despesas`}
          tamanho="grande"
          tom={lucroLiquido >= 0 ? "ok" : "perigo"}
        />
      </FaixaMetricas>

      <Painel
        titulo="DRE simplificado"
        ajuda="Mesmas OS listadas abaixo"
        acao={
          <Link
            href="/despesas"
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
          >
            Controle de gastos <SetaDireita tamanho={13} />
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metrica rotulo="Receita" valor={formatCurrency(receita)} />
          <Metrica rotulo="Custo de peças" valor={`- ${formatCurrency(custoPecas)}`} />
          <Metrica rotulo="Despesas fixas" valor={`- ${formatCurrency(totalDespesas)}`} />
          <Metrica
            rotulo="Lucro líquido"
            valor={formatCurrency(lucroLiquido)}
            tom={lucroLiquido >= 0 ? "ok" : "perigo"}
          />
        </div>
        {receita > 0 && recebido < receita && (
          <p className="mt-3 text-xs text-tinta-3">
            Faturado {formatCurrency(receita)} · recebido {formatCurrency(recebido)} — diferença de{" "}
            <span className="font-medium text-perigo">{formatCurrency(receita - recebido)}</span>{" "}
            entre o serviço entregue e o dinheiro que entrou no período.
          </p>
        )}
      </Painel>

      {/* Distribuição interna: é aqui que dá pra ver qual semana rendeu. */}
      {partes.length > 1 && (
        <Painel titulo="Distribuição no período">
          <div className="space-y-2">
            {partes.map((p) => (
              <div key={p.label} className="flex items-center gap-3 text-xs">
                <span className="w-10 shrink-0 text-tinta-3">{p.label}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-superficie-3">
                  <div
                    className="h-full rounded bg-contraste"
                    style={{ width: `${(p.receita / maiorBucket) * 100}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-medium tabular-nums text-tinta">
                  {formatCurrency(p.receita)}
                </span>
                <span className="w-12 shrink-0 text-right tabular-nums text-tinta-3">{p.n} OS</span>
              </div>
            ))}
          </div>
        </Painel>
      )}

      <div className="space-y-3">
        <div>
          <h2 className="font-semibold text-tinta">Entregues no período</h2>
          <p className="text-xs text-tinta-3">Mais recente primeiro</p>
        </div>
        <ListaOS
          ordens={ordenadas}
          vazio="Nenhuma OS entregue neste período"
          vazioTexto="Navegue para outro período ou confira o pátio."
          vazioAcao={
            <BotaoLink href="/?aba=operacao" variante="secundario">
              Ver o pátio
            </BotaoLink>
          }
          agora={agora}
        />
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

// Mesma rampa de tempo em aberto usada em contas a receber, para o olho aprender
// uma escala só. Zero é o normal do pátio, não um acerto — por isso neutro.
function corAging(dias: number): string {
  if (dias >= 15) return "idade idade-4";
  if (dias >= 7) return "idade idade-3";
  return "idade idade-0";
}

function AbaLink({ href, ativa, children }: { href: string; ativa: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 whitespace-nowrap px-4 py-1.5 rounded-md text-xs font-medium transition-colors",
        ativa ? "bg-superficie text-tinta shadow-sm" : "text-tinta-3 hover:text-tinta-2"
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
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
        >
          <Voltar tamanho={16} />
        </Link>
        <span className="min-w-36 text-center text-sm font-semibold text-tinta">{j.label}</span>
        {podeAvancar ? (
          <Link
            href={url(periodo, offset + 1)}
            aria-label="Próximo período"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
          >
            <Avancar tamanho={16} />
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie-2 text-tinta-3 opacity-50 sm:h-9 sm:w-9"
          >
            <Avancar tamanho={16} />
          </span>
        )}
      </div>

      {/* Trocar de período volta para o atual: "3 meses atrás" de uma semana não é
          equivalente a "3 meses atrás" de um mês, e manter o offset confundiria. */}
      <div className="flex gap-1 bg-superficie-3 rounded-lg p-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-1">
        {PERIODOS.map((opt) => (
          <Link
            key={opt.value}
            href={url(opt.value, 0)}
            className={cn(
              "shrink-0 whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              periodo === opt.value
                ? "bg-superficie text-tinta shadow-sm"
                : "text-tinta-3 hover:text-tinta-2"
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
  vazioTexto,
  vazioAcao,
  patio,
  agora,
  mostrarLucro = true,
}: {
  ordens: OSLista[];
  vazio: string;
  vazioTexto?: string;
  vazioAcao?: React.ReactNode;
  patio?: boolean;
  agora: Date;
  /** Lucro e margem por OS são coisa de dono. */
  mostrarLucro?: boolean;
}) {
  if (ordens.length === 0) {
    return <Vazio titulo={vazio} texto={vazioTexto} acao={vazioAcao} compacto />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-linha bg-superficie divide-y divide-linha">
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
            className="flex flex-col gap-1.5 px-4 py-3 hover:bg-superficie-2 transition-colors sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="flex items-center gap-3 sm:contents">
              <div className="shrink-0 text-center w-10">
                <p className="text-xs text-tinta-3">OS</p>
                <p className="font-bold text-tinta text-sm">#{os.numero}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-tinta text-sm truncate">{os.cliente.nome}</p>
                  {os.cliente.apelido && (
                    <span className="shrink-0 rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">
                      {os.cliente.apelido}
                    </span>
                  )}
                </div>
                <p className="text-xs text-tinta-3 truncate">
                  {os.veiculo.marca} {os.veiculo.modelo}
                  {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
                  {os.mecanico ? ` · ${os.mecanico}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                {patio && (
                  <span className={corAging(dias)}>
                    <span className="idade-ponto" aria-hidden="true" />
                    {dias}d
                  </span>
                )}
                <span className={corStatus(os.status)}>{labelStatus(os.status)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
              {mostrarLucro && (
                <div className="text-right text-xs tabular-nums sm:w-24" title={lucroTitulo}>
                  <p className={cn("font-semibold", corMargem(margem))}>{formatCurrency(os.lucroReal)}</p>
                  <p className={cn("text-xs", corMargem(margem))}>
                    {margem === null ? "—" : `${margem.toFixed(0)}% margem`}
                  </p>
                </div>
              )}
              {patio && (
                <span
                  className={cn("hidden sm:inline-flex", corAging(dias))}
                  title={`No pátio há ${dias} dia${dias === 1 ? "" : "s"}`}
                >
                  <span className="idade-ponto" aria-hidden="true" />
                  {dias}d
                </span>
              )}
              <span className={cn("hidden sm:inline-flex", corStatus(os.status))}>
                {labelStatus(os.status)}
              </span>
              <div className="text-right text-xs tabular-nums">
                <p className="font-semibold text-tinta">{formatCurrency(os.total)}</p>
                {!os.pago && <p className="text-perigo">Pendente</p>}
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
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
      <BotaoLink href="/os/nova" className="w-full">
        <Mais tamanho={16} /> Nova OS
      </BotaoLink>
      <BotaoLink href="/clientes/novo" variante="secundario" className="w-full">
        <Mais tamanho={16} /> Novo cliente
      </BotaoLink>
    </div>
  );
}

function CardDevedores({ top5 }: { top5: { nome: string; saldo: number }[] }) {
  if (top5.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-perigo-linha bg-perigo-fraco p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-perigo">Maiores devedores</h3>
        <Link
          href="/contas-receber"
          className="inline-flex shrink-0 items-center gap-1 text-xs text-perigo hover:underline"
        >
          Ver todos <SetaDireita tamanho={13} />
        </Link>
      </div>
      <div className="space-y-2">
        {top5.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-sm">
            <p className="min-w-0 truncate font-medium text-perigo">{d.nome}</p>
            <p className="shrink-0 font-bold tabular-nums text-perigo">{formatCurrency(d.saldo)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
