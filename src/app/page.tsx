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
import { getConfiguracao } from "@/lib/configuracao-db";
import { valorReserva } from "@/lib/configuracao";
import { FaixaMetricas, Metrica, MetricaLink, Painel, Vazio } from "@/components/ui/Dados";
import { BotaoLink } from "@/components/ui/Botao";
import { MaisDaLista } from "@/components/MaisDaLista";
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
  // Resultado é a aba do dinheiro (DRE, lucro, despesas): só quem tem financeiro. É ela
  // que abre por padrão — é a pergunta que o dono faz primeiro. Operação fica a um
  // clique. Para quem não tem financeiro a aba nem aparece, e tudo cai na Operação.
  const podeVerFinanceiro = usuario.podeFinanceiro;
  const aba = podeVerFinanceiro && sp.aba !== "operacao" ? "resultado" : "operacao";
  const periodo: PeriodoKey = ehPeriodo(sp.periodo) ? sp.periodo : "mes";
  const offset = Number.parseInt(sp.offset ?? "0", 10) || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* As abas já dizem o que a tela mostra; a linha explicativa embaixo do
          título era ruído em toda página para quem abre o sistema todo dia. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-tinta">Dashboard</h1>
        {podeVerFinanceiro && (
          <div className="flex gap-1 rounded-lg bg-superficie-3 p-1">
            <AbaLink href={`/?aba=resultado&periodo=${periodo}`} ativa={aba === "resultado"}>
              Resultado
            </AbaLink>
            <AbaLink href="/?aba=operacao" ativa={aba === "operacao"}>
              Operação
            </AbaLink>
          </div>
        )}
      </div>

      {aba === "operacao" ? (
        <Operacao podeVerFinanceiro={podeVerFinanceiro} />
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
async function Operacao({ podeVerFinanceiro }: { podeVerFinanceiro: boolean }) {
  const agora = new Date();
  const hoje = janelaHoje(agora);

  const [
    patio,
    entreguesHoje,
    devedoresOS,
    dividasDeCliente,
    dividasAvulsas,
    recebidoHojeOS,
    recebidoHojeDivida,
    config,
  ] = await Promise.all([
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
      where: { pago: false, clienteId: { not: null } },
      _sum: { valor: true, valorPago: true },
    }) as Promise<{ clienteId: string; _sum: { valor: number; valorPago: number } }[]>,
    // Dívida avulsa sem cliente cadastrado: agrupa pelo nome digitado, não dá
    // para juntar por clienteId porque não existe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).dividaAvulsa.groupBy({
      by: ["devedorNome"],
      where: { pago: false, clienteId: null },
      _sum: { valor: true, valorPago: true },
    }) as Promise<{ devedorNome: string | null; _sum: { valor: number; valorPago: number } }[]>,
    // "Guardar hoje" é sobre o dinheiro que entrou hoje, não sobre o que foi entregue —
    // um carro entregue ontem e pago hoje conta; um entregue hoje mas ainda não pago, não.
    prisma.pagamentoOS.aggregate({
      where: { data: { gte: hoje.inicio, lt: hoje.fim } },
      _sum: { valor: true },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).pagamentoDivida.aggregate({
      where: { data: { gte: hoje.inicio, lt: hoje.fim } },
      _sum: { valor: true },
    }) as Promise<{ _sum: { valor: number | null } }>,
    getConfiguracao(),
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

  const recebidoHoje = (recebidoHojeOS._sum.valor ?? 0) + (recebidoHojeDivida._sum.valor ?? 0);
  const guardarHoje = valorReserva(config, recebidoHoje);

  const { total: totalAReceber, quantidade: devedoresCount, top5 } = await resumoDevedores(
    devedoresOS,
    dividasDeCliente,
    dividasAvulsas
  );

  return (
    <>
      {/* Uma superfície com divisórias, não cinco cartões iguais empilhados. */}
      <FaixaMetricas colunas={podeVerFinanceiro ? 5 : 3}>
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
        {podeVerFinanceiro && (
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
      {podeVerFinanceiro && (
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

      {/* O único número com data nesta aba: o realizado do dia.
          Em grade, e não em `flex-wrap`: com quatro números e duas colunas de
          celular, a fileira quebrava onde a largura de cada rótulo mandasse —
          "Lucro" nascia embaixo de "Entregue hoje" numa tela e ao lado dele na
          seguinte, e nenhum número ficava alinhado com o de cima. */}
      <div className="rounded-xl border border-linha bg-superficie-2 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-tinta-3">Hoje</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metrica rotulo="Entregue hoje" valor={`${hojeResumo.n} OS`} />
          {podeVerFinanceiro && (
            <>
              <Metrica rotulo="Faturado" valor={formatCurrency(hojeResumo.faturado)} />
              <Metrica
                rotulo="Lucro"
                valor={formatCurrency(hojeResumo.lucro)}
                tom={hojeResumo.lucro >= 0 ? "ok" : "perigo"}
              />
              {guardarHoje !== null && (
                <Metrica
                  rotulo={`Guardar hoje (${config.reservaLucroPercentual}%)`}
                  valor={formatCurrency(guardarHoje)}
                  sub={`sobre ${formatCurrency(recebidoHoje)} recebidos`}
                />
              )}
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
          {podeVerFinanceiro && <CardDevedores top5={top5} />}
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
            mostrarLucro={podeVerFinanceiro}
            limite={8}
            verTodasHref="/os?status=patio"
            verTodasLabel="Ver o pátio inteiro"
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

  const [ordens, ordensAnterior, recebidoOS, recebidoDivida, totalDespesas, config] = await Promise.all([
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
    getConfiguracao(),
  ]);

  const receita = ordens.reduce((s, o) => s + o.total, 0);
  const custoPecas = ordens.reduce((s, o) => s + o.custoTotalPecas, 0);
  const lucroBruto = ordens.reduce((s, o) => s + o.lucroReal, 0);
  const lucroLiquido = lucroBruto - totalDespesas;
  const reservaSugerida = valorReserva(config, lucroBruto);
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
      // Bruto, e não líquido: as despesas fixas entram por vencimento no período
      // inteiro (`custoDoIntervalo`), então não existe fatia delas por sub-janela —
      // ratear o aluguel por semana seria número inventado.
      lucro: doBucket.reduce((s, o) => s + o.lucroReal, 0),
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

      {/* Seis números em duas fileiras de três, e não uma fileira de seis: a faixa de
          uma linha só espremia "R$ 14.459,96" em coluna de ~130px no notebook, e o
          valor quebrava no meio do número. */}
      <FaixaMetricas colunas={3}>
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
        {/* Os dois lucros são números diferentes e ficam lado a lado de propósito: o
            bruto é o que a oficina ganhou no serviço, o líquido é o que sobrou depois
            do aluguel e afins. Antes o bruto vivia na letra miúda do líquido, e o
            gestor não tinha onde ler "quanto a oficina rendeu" sem fazer conta. */}
        <MetricaLink
          href="/os?status=entregues"
          rotulo="Lucro bruto"
          valor={formatCurrency(lucroBruto)}
          sub="serviços − peças"
          tamanho="grande"
          tom={lucroBruto >= 0 ? "neutro" : "perigo"}
        />
        <MetricaLink
          href="/despesas"
          rotulo="Lucro líquido"
          valor={formatCurrency(lucroLiquido)}
          sub={`depois de ${formatCurrency(totalDespesas)} em despesas`}
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
        {/* Lê na ordem da conta: Receita − Peças = Lucro bruto − Despesas = Lucro líquido. */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Metrica rotulo="Receita" valor={formatCurrency(receita)} />
          <Metrica rotulo="Custo de peças" valor={`- ${formatCurrency(custoPecas)}`} />
          <Metrica
            rotulo="= Lucro bruto"
            valor={formatCurrency(lucroBruto)}
            tom={lucroBruto >= 0 ? "neutro" : "perigo"}
          />
          <Metrica rotulo="Despesas fixas" valor={`- ${formatCurrency(totalDespesas)}`} />
          <Metrica
            rotulo="= Lucro líquido"
            valor={formatCurrency(lucroLiquido)}
            tom={lucroLiquido >= 0 ? "ok" : "perigo"}
          />
          {reservaSugerida !== null && (
            <Metrica
              rotulo={`Reserva sugerida (${config.reservaLucroPercentual}%)`}
              valor={formatCurrency(reservaSugerida)}
            />
          )}
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
        <Painel titulo="Distribuição no período" ajuda="Faturado e, ao lado, o lucro bruto da fatia">
          <div className="space-y-2">
            {/* Duas colunas de dinheiro porque volume e resultado são perguntas
                diferentes: a barra diz qual fatia girou mais, o número verde diz
                se ela rendeu. No celular os números caem para a linha de baixo —
                lado a lado eles não cabem sem espremer a barra a nada. */}
            {partes.map((p) => (
              <div key={p.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="w-10 shrink-0 text-tinta-3">{p.label}</span>
                <div className="h-5 flex-1 basis-20 overflow-hidden rounded bg-superficie-3">
                  <div
                    className="h-full rounded bg-contraste"
                    style={{ width: `${(p.receita / maiorBucket) * 100}%` }}
                  />
                </div>
                <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                  <span className="w-24 text-right font-medium tabular-nums text-tinta">
                    {formatCurrency(p.receita)}
                  </span>
                  <span
                    className={`w-24 text-right font-medium tabular-nums ${
                      p.lucro >= 0 ? "text-ok" : "text-perigo"
                    }`}
                  >
                    {formatCurrency(p.lucro)}
                  </span>
                  <span className="w-12 text-right tabular-nums text-tinta-3">{p.n} OS</span>
                </div>
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
          limite={10}
          expansivel
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
  dividasDeCliente: { clienteId: string; _sum: { valor: number | null; valorPago: number | null } }[],
  dividasAvulsas: { devedorNome: string | null; _sum: { valor: number | null; valorPago: number | null } }[]
) {
  const saldoPorCliente = new Map<string, number>();
  const somar = (clienteId: string, saldo: number) => {
    if (saldo > 0) saldoPorCliente.set(clienteId, (saldoPorCliente.get(clienteId) ?? 0) + saldo);
  };

  for (const row of devedoresOS) somar(row.clienteId, (row._sum.total ?? 0) - (row._sum.valorPago ?? 0));
  for (const row of dividasDeCliente) somar(row.clienteId, (row._sum.valor ?? 0) - (row._sum.valorPago ?? 0));

  // Dívida avulsa sem cliente cadastrado: mesma conta, mas pelo nome digitado —
  // não há linha em Cliente para juntar.
  const saldoPorAvulso = new Map<string, number>();
  for (const row of dividasAvulsas) {
    const saldo = (row._sum.valor ?? 0) - (row._sum.valorPago ?? 0);
    if (saldo <= 0) continue;
    const nome = row.devedorNome?.trim() || "Sem nome";
    saldoPorAvulso.set(nome, (saldoPorAvulso.get(nome) ?? 0) + saldo);
  }

  const total =
    [...saldoPorCliente.values()].reduce((s, v) => s + v, 0) +
    [...saldoPorAvulso.values()].reduce((s, v) => s + v, 0);
  const quantidade = saldoPorCliente.size + saldoPorAvulso.size;

  // Ranking unificado antes de buscar nome: um avulso grande não pode empurrar
  // um cliente cadastrado para fora do top 5 só por vir de uma fonte diferente.
  const candidatos = [
    ...[...saldoPorCliente.entries()].map(([clienteId, saldo]) => ({ clienteId, nome: null as string | null, saldo })),
    ...[...saldoPorAvulso.entries()].map(([nome, saldo]) => ({ clienteId: null as string | null, nome, saldo })),
  ]
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 5);

  const ids = candidatos.filter((c) => c.clienteId).map((c) => c.clienteId!);
  const clientes =
    ids.length > 0
      ? await prisma.cliente.findMany({ where: { id: { in: ids } }, select: { id: true, nome: true } })
      : [];
  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]));

  const top5 = candidatos
    .map((c) => ({ nome: c.clienteId ? (nomePorId.get(c.clienteId) ?? "") : c.nome!, saldo: c.saldo }))
    .sort((a, b) => b.saldo - a.saldo);

  return { total, quantidade, top5 };
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
  limite,
  expansivel,
  verTodasHref,
  verTodasLabel = "Ver todas",
}: {
  ordens: OSLista[];
  vazio: string;
  vazioTexto?: string;
  vazioAcao?: React.ReactNode;
  patio?: boolean;
  agora: Date;
  /** Lucro e margem por OS são coisa de dono. */
  mostrarLucro?: boolean;
  /** Quantas linhas cabem no dashboard antes de virar rolagem. */
  limite?: number;
  /** O resto abre aqui mesmo, em lotes, em vez de mandar para outra tela. */
  expansivel?: boolean;
  verTodasHref?: string;
  verTodasLabel?: string;
}) {
  if (ordens.length === 0) {
    return <Vazio titulo={vazio} texto={vazioTexto} acao={vazioAcao} compacto />;
  }

  // O dashboard é um resumo, não a tela de listagem. Sem corte ele imprimia uma
  // linha por OS: numa oficina com trinta carros no pátio, o card de devedores e
  // o botão de Nova OS ficavam a trinta linhas de rolagem no celular, e a lista
  // deixava de ser "o que está parado há mais tempo" para virar o /os inteiro.
  const visiveis = limite ? ordens.slice(0, limite) : ordens;
  const extras = limite ? ordens.slice(limite) : [];

  const linha = (os: OSLista) => {
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
  };

  return (
    <div className="overflow-hidden rounded-xl border border-linha bg-superficie divide-y divide-linha">
      {visiveis.map(linha)}

      {extras.length > 0 &&
        (expansivel ? (
          <MaisDaLista linhas={extras.map(linha)} passo={limite} />
        ) : (
          verTodasHref && (
            <Link
              href={verTodasHref}
              className="flex min-h-11 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-brand-600 transition-colors hover:bg-superficie-2"
            >
              {verTodasLabel} · mais {extras.length} <SetaDireita tamanho={14} />
            </Link>
          )
        ))}
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
