# boxOS — pacote visual para o vídeo · parte 2 de 5

**Esta parte:** Pátio (Dashboard e lista de OS).

Pacote gerado em 07/10/2026 a partir do repositório do boxOS, só por leitura: nenhum arquivo do projeto foi alterado. Serve para recriar as telas num vídeo animado, fora do repositório.

Partes: 1. Mapa das telas, tokens, marca e componentes base · 2. Pátio (Dashboard e lista de OS) · 3. Orçamento, OS aberta e documento da OS · 4. Fiado e painel financeiro · 5. Dados fictícios. Os tokens, a marca e os componentes base estão na parte 1, e os dados fictícios na parte 5.

## Índice (todas as partes)

| Parte | Arquivo | Conteúdo | Tamanho aprox. |
|---|---|---|---|
| 1 | `src/app/globals.css` | íntegro | 17,8 KB |
| 1 | `tailwind.config.ts` | íntegro | 4,2 KB |
| 1 | `src/app/layout.tsx` | trecho: Poppins e variável de fonte | 0,9 KB |
| 1 | `src/components/marca/LogoBoxOS.tsx` | íntegro | 3,5 KB |
| 1 | `public/brand/boxOS_horizontal.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_fundo_escuro.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_mono_branco.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_mono_preto.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_icone_app.svg` | íntegro | 0,9 KB |
| 1 | `public/brand/boxOS_simbolo.svg` | íntegro | 0,8 KB |
| 1 | `public/brand/favicon_16.svg` | íntegro | 0,5 KB |
| 1 | `src/components/ui/Icones.tsx` | íntegro | 8,5 KB |
| 1 | `src/components/ui/Botao.tsx` | íntegro | 2,5 KB |
| 1 | `src/lib/constants.ts` | trecho: corStatus() e OS_STATUS | 1,8 KB |
| 1 | `src/lib/cor-documento.ts` | íntegro | 4,8 KB |
| 1 | `src/app/layout.tsx` | trecho: casca do app (menu + conteúdo) | 1,4 KB |
| 1 | `src/components/Sidebar.tsx` | lógica de dados removida | 11,8 KB |
| 1 | `src/components/ui/BarraInferior.tsx` | íntegro | 3,2 KB |
| 1 | `src/components/ui/Dados.tsx` | íntegro | 7,7 KB |
| 1 | `src/components/ui/Campos.tsx` | íntegro | 6,2 KB |
| 1 | `src/components/ui/Modal.tsx` | íntegro | 5,3 KB |
| 1 | `src/components/ui/Avisos.tsx` | íntegro | 5,8 KB |
| 1 | `src/components/MaisDaLista.tsx` | íntegro | 1,1 KB |
| 1 | `src/components/ui/TextoFormatado.tsx` | íntegro | 2,7 KB |
| 1 | `src/components/CopiarVeiculo.tsx` | íntegro | 4,3 KB |
| 1 | `src/lib/utils.ts` | íntegro | 5,5 KB |
| 1 | `src/lib/configuracao.ts` | íntegro | 3,9 KB |
| **2** ← | `src/app/page.tsx` | lógica de dados removida | 29,9 KB |
| **2** ← | `src/app/os/page.tsx` | lógica de dados removida | 12,9 KB |
| **2** ← | `src/lib/os-periodo.ts` | íntegro | 1,5 KB |
| **2** ← | `src/lib/periodo.ts` | íntegro | 12,6 KB |
| **2** ← | `src/lib/texto-formatado.ts` | íntegro | 7,2 KB |
| 3 | `src/app/orcamentos/[id]/page.tsx` | lógica de dados removida | 21,3 KB |
| 3 | `src/components/BaixarOrcamento.tsx` | lógica de dados removida | 1,5 KB |
| 3 | `src/app/os/[id]/page.tsx` | lógica de dados removida | 43,5 KB |
| 3 | `src/components/CabecalhoDocumento.tsx` | lógica de dados removida | 2,2 KB |
| 3 | `src/components/Fotos.tsx` | lógica de dados removida | 24,5 KB |
| 3 | `src/components/BaixarOS.tsx` | lógica de dados removida | 1,4 KB |
| 3 | `src/components/BaixarDocumento.tsx` | íntegro | 10,5 KB |
| 3 | `src/lib/formato-download.ts` | íntegro | 1,4 KB |
| 3 | `src/components/OSPdfDocument.tsx` | íntegro | 16,7 KB |
| 3 | `src/components/TextoFormatadoPdf.tsx` | íntegro | 1,8 KB |
| 3 | `src/lib/pdf-para-imagem.ts` | íntegro | 3,9 KB |
| 4 | `src/app/contas-receber/page.tsx` | lógica de dados removida | 31,2 KB |
| 4 | `src/components/BaixarComprovante.tsx` | lógica de dados removida | 4,0 KB |
| 4 | `src/components/ComprovantePagamentoPdfDocument.tsx` | íntegro | 12,5 KB |
| 4 | `src/components/ClienteSelect.tsx` | íntegro | 8,2 KB |
| 4 | `src/app/despesas/page.tsx` | lógica de dados removida | 1,5 KB |
| 4 | `src/components/despesas/ControleDeGastos.tsx` | lógica de dados removida | 33,2 KB |
| 4 | `src/components/despesas/campos.tsx` | íntegro | 3,5 KB |
| 4 | `src/components/despesas/tipos.ts` | íntegro | 1,4 KB |
| 4 | `src/lib/despesas-comum.ts` | íntegro | 8,3 KB |
| 5 | `dados-ficticios.json` | gerado para o vídeo: não existe no repositório | 48,9 KB |

---

## 4.1 Pátio

Não existe rota `/patio`. O pátio aparece em dois lugares:

- **Dashboard → aba Operação** (`src/app/page.tsx`): os números do pátio, "Se finalizar tudo do pátio", "Hoje" e a lista **Pátio**, com a pílula de dias parado (`.idade`) e a mais antiga no topo. O mesmo arquivo tem a aba **Resultado**, que é o painel financeiro da seção 4.6 (parte 4).
- **Ordens de serviço → aba Pátio** (`src/app/os/page.tsx`, rota `/os?status=patio`): a lista completa, com busca e filtros.

O Dashboard é componente de servidor: as consultas ao banco viraram comentários que dizem quais variáveis o JSX usa.

### src/app/page.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
import Link from "next/link";
import { exigirOficina } from "@/lib/auth";
import type { BancoDaOficina, Db } from "@/lib/db-oficina";
import { formatCurrency, cn, situacaoRecebimento } from "@/lib/utils";
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
  // [removido: autenticação] — `banco` (acesso ao banco da oficina) e `usuario` (sessão).
  // `usuario.podeFinanceiro` decide se a aba Resultado aparece. Dados fictícios: `sidebar.usuario`.
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
        <Operacao banco={banco} podeVerFinanceiro={podeVerFinanceiro} />
      ) : (
        <Resultado banco={banco} periodo={periodo} offset={offset} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Operação */

// Foto do pátio neste instante. Nenhuma query aqui tem filtro de data: a OS aberta há
// 40 dias continua sendo trabalho a fazer, e o dinheiro dela continua sendo dinheiro a
// entrar. O que separa o carro ativo do encalhado é o aging na lista, não um recorte
// que faz ele desaparecer da conta.
async function Operacao({
  banco,
  podeVerFinanceiro,
}: {
  banco: BancoDaOficina;
  podeVerFinanceiro: boolean;
}) {
  const agora = new Date();
  // [removido: busca de dados] — consultas ao banco (Prisma). O JSX abaixo usa:
  //   patio               OSLista[] — OS ABERTA / EM_ANDAMENTO / AGUARDANDO_PECA, a mais antiga primeiro
  //   entreguesHoje       { total, lucroReal }[] — OS entregues hoje
  //   devedoresOS, dividasDeCliente, dividasAvulsas — saldos em aberto (entram em resumoDevedores)
  //   recebidoHojeOS, recebidoHojeDivida — { _sum: { valor } }, dinheiro que entrou hoje
  //   config              Configuracao
  // Dados fictícios: `dashboardOperacao` e `configuracao`.

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
    db,
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
async function Resultado({
  banco,
  periodo,
  offset,
}: {
  banco: BancoDaOficina;
  periodo: PeriodoKey;
  offset: number;
}) {
  const agora = new Date();
  const j = janela(periodo, offset, agora);
  const jAnterior = janelaAnterior(periodo, offset, agora);

  // [removido: busca de dados] — consultas ao banco (Prisma). O JSX abaixo usa:
  //   ordens            OSLista[] — OS entregues no período (contadas pela data de entrega)
  //   ordensAnterior    { total }[] — OS do período anterior (para o "+x% vs. período anterior")
  //   recebidoOS, recebidoDivida — { _sum: { valor } }, dinheiro que entrou no período
  //   totalDespesas     number — gastos do período, por vencimento (Controle de gastos)
  //   config            Configuracao
  // Dados fictícios: `dashboardResultado` e `configuracao`.

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
            className="inline-flex items-center gap-1 text-xs text-brand-texto hover:underline"
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
  db: Db,
  devedoresOS: { clienteId: string; _sum: { total: number | null; valorPago: number | null } }[],
  dividasDeCliente: { clienteId: string; _sum: { valor: number | null; valorPago: number | null } }[],
  dividasAvulsas: { devedorNome: string | null; _sum: { valor: number | null; valorPago: number | null } }[]
) {
  // [removido: busca de dados] — soma o saldo em aberto por cliente (OS entregues sem quitar +
  // dívidas avulsas), busca os nomes no banco e devolve
  //   { total: number; quantidade: number; top5: { nome: string; saldo: number }[] }
  // Dados fictícios: `dashboardOperacao.devedores`.
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
    const recebimento = situacaoRecebimento(os);
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
            {!os.pago && <p className={recebimento.cor}>{recebimento.texto}</p>}
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
              className="flex min-h-11 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-brand-texto transition-colors hover:bg-superficie-2"
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
```

### src/app/os/page.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatCurrency, formatDate, situacaoRecebimento } from "@/lib/utils";
import { corMargem, corStatus, labelStatus, margemOS, OS_STATUS } from "@/lib/constants";
import { usePodeFinanceiro } from "@/components/UsuarioProvider";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Entrada, Selecao } from "@/components/ui/Campos";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import { Busca, Chevron, Mais } from "@/components/ui/Icones";
import { resumoDoTexto } from "@/lib/texto-formatado";

const TABS = [
  { label: "Todas", value: "" },
  { label: "Pátio", value: "patio" },
  { label: "Entregues", value: "entregues" },
];

const ORDENACOES = [
  { value: "recentes", label: "Mais recentes" },
  { value: "lucro_desc", label: "Maior lucro" },
  { value: "lucro_asc", label: "Menor lucro" },
  { value: "valor_desc", label: "Maior valor" },
] as const;

const POR_PAGINA = 40;

type OS = {
  id: string; numero: number; status: string; descricao: string;
  total: number; valorPago: number; pago: boolean; abertura: string; mecanico: string | null;
  lucroReal?: number; // ausente para o operador (ver src/lib/permissoes.ts)
  cliente: { id: string; nome: string; apelido: string | null };
  veiculo: { marca: string; modelo: string; placa: string | null };
};

type Resposta = {
  itens: OS[];
  total: number;
  temMais: boolean;
  resumo: { quantidade: number; faturamento: number; lucro?: number; margem?: number | null };
};

// As abas viram recorte de status no servidor. O agrupamento visual que existia
// aqui perdeu a função quando cada status ganhou cor própria.
const STATUS_DA_ABA: Record<string, string> = {
  patio: "ABERTA,EM_ANDAMENTO,AGUARDANDO_PECA",
  entregues: "ENTREGUE",
};

function OSListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const podeFinanceiro = usePodeFinanceiro();

  const aba = searchParams.get("status") || "";
  const q = searchParams.get("q") || "";
  const mecanico = searchParams.get("mecanico") || "";
  const situacao = searchParams.get("situacao") || "";
  const de = searchParams.get("de") || "";
  const ate = searchParams.get("ate") || "";
  const ordenacao = searchParams.get("ordenar") || "recentes";

  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [mecanicos, setMecanicos] = useState<{ id: string; nome: string }[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(!!(mecanico || situacao || de || ate));

  const trocarParam = useCallback(
    (mudancas: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor) p.set(chave, valor);
        else p.delete(chave);
      }
      router.replace(p.toString() ? `/os?${p}` : "/os", { scroll: false });
    },
    [router, searchParams]
  );

  // O campo responde a cada tecla; a URL só recebe o termo depois de uma pausa,
  // para não disparar uma consulta por letra. Antes nada disso existia: a busca
  // ficava atrás de "Filtros avançados", exigia o botão Aplicar e ignorava Enter.
  const [busca, setBusca] = useState(q);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    setBusca(q);
  }, [q]);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    if (busca === q) return;
    const t = setTimeout(() => trocarParam({ q: busca }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  // [removido: busca de dados] — GET /api/os (paginado; recorte pela aba, busca, filtros e
  // ordenação) preenchia `dados` (Resposta) e GET /api/mecanicos preenchia `mecanicos`.
  // Dados fictícios: `listaOS.resposta` e `mecanicos`.

  async function carregarMais() {
    // [removido: busca de dados] — pedia a próxima página de /api/os e somava à lista.
  }

  function limparFiltros() {
    setBusca("");
    router.replace(aba ? `/os?status=${aba}` : "/os", { scroll: false });
  }

  const temFiltro = !!(q || mecanico || situacao || de || ate);
  const itens = dados?.itens ?? [];

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-tinta sm:text-2xl">Ordens de serviço</h1>
        <BotaoLink href="/os/nova">
          <Mais tamanho={16} /> Nova OS
        </BotaoLink>
      </div>

      <div className="-mx-4 flex gap-1 overflow-x-auto rounded-lg bg-superficie-3 p-1 px-4 sm:mx-0 sm:w-fit sm:px-1">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/os?status=${tab.value}` : "/os"}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              aba === tab.value
                ? "bg-superficie text-tinta shadow-sm"
                : "text-tinta-3 hover:text-tinta-2"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Busca
            tamanho={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3"
          />
          <Entrada
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, placa, mecânico ou nº da OS"
            aria-label="Buscar ordens de serviço"
            className="pl-9"
          />
        </div>
        <Selecao
          value={ordenacao}
          onChange={(e) => trocarParam({ ordenar: e.target.value })}
          aria-label="Ordenação"
          className="sm:w-auto"
        >
          {ORDENACOES.filter((o) => podeFinanceiro || !o.value.startsWith("lucro")).map((o) => (
            <option key={o.value} value={o.value}>
              Ordenar: {o.label}
            </option>
          ))}
        </Selecao>
        <Botao
          variante="secundario"
          onClick={() => setMostrarFiltros((v) => !v)}
          aria-expanded={mostrarFiltros}
          className="sm:w-auto"
        >
          <Chevron
            tamanho={15}
            className={cn("transition-transform", mostrarFiltros && "rotate-180")}
          />
          Filtros
          {temFiltro && (
            <span className="rounded-full bg-brand-600 px-1.5 text-xs font-bold text-brand-fg">!</span>
          )}
        </Botao>
      </div>

      {mostrarFiltros && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-linha bg-superficie-2 p-3">
          <label className="min-w-40 flex-1">
            <span className="mb-1 block text-xs font-medium text-tinta-2">Mecânico</span>
            <Selecao value={mecanico} onChange={(e) => trocarParam({ mecanico: e.target.value })}>
              <option value="">Todos</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.nome}>
                  {m.nome}
                </option>
              ))}
            </Selecao>
          </label>
          <label className="min-w-40 flex-1">
            <span className="mb-1 block text-xs font-medium text-tinta-2">Situação</span>
            <Selecao value={situacao} onChange={(e) => trocarParam({ situacao: e.target.value })}>
              <option value="">Todas</option>
              {OS_STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Selecao>
          </label>
          <label className="min-w-32 flex-1">
            <span className="mb-1 block text-xs font-medium text-tinta-2">Aberta de</span>
            <Entrada type="date" value={de} onChange={(e) => trocarParam({ de: e.target.value })} />
          </label>
          <label className="min-w-32 flex-1">
            <span className="mb-1 block text-xs font-medium text-tinta-2">Até</span>
            <Entrada type="date" value={ate} onChange={(e) => trocarParam({ ate: e.target.value })} />
          </label>
          {temFiltro && (
            <Botao variante="secundario" onClick={limparFiltros}>
              Limpar
            </Botao>
          )}
        </div>
      )}

      {carregando ? (
        <EsqueletoLista linhas={6} />
      ) : itens.length === 0 ? (
        temFiltro ? (
          <Vazio
            titulo="Nenhuma OS com esse filtro"
            texto="Ajuste a busca, o mecânico, a situação ou o período."
            acao={
              <Botao variante="secundario" onClick={limparFiltros}>
                Limpar filtros
              </Botao>
            }
          />
        ) : (
          <Vazio
            titulo="Nenhuma ordem de serviço ainda"
            texto="Abra a primeira OS quando o carro entrar no pátio."
            acao={
              <BotaoLink href="/os/nova">
                <Mais tamanho={16} /> Nova OS
              </BotaoLink>
            }
          />
        )
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
            {itens.map((os) => (
              <OSRow key={os.id} os={os} podeFinanceiro={podeFinanceiro} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-tinta-3">
            <span className="tabular-nums">
              {itens.length} de {dados?.total ?? itens.length}
            </span>
            {dados?.temMais && (
              <Botao variante="secundario" onClick={carregarMais} disabled={carregandoMais}>
                {carregandoMais ? "Carregando..." : "Carregar mais"}
              </Botao>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OSRow({ os, podeFinanceiro }: { os: OS; podeFinanceiro: boolean }) {
  const margem = margemOS({ ...os, lucroReal: os.lucroReal ?? 0 });
  const mostrarLucro = podeFinanceiro && os.status !== "CANCELADA" && os.total > 0;
  const recebimento = situacaoRecebimento(os);
  return (
    <Link
      href={`/os/${os.id}`}
      className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex items-center gap-3 sm:contents">
        <div className="w-10 shrink-0 text-center sm:w-12">
          <p className="text-xs text-tinta-3">OS</p>
          <p className="font-bold tabular-nums text-tinta">#{os.numero}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-tinta">{os.cliente.nome}</p>
            {os.cliente.apelido && (
              <span className="shrink-0 rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">
                {os.cliente.apelido}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-tinta-3">
            {os.veiculo.marca} {os.veiculo.modelo}
            {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
            {" · "}
            {resumoDoTexto(os.descricao)}
          </p>
        </div>
        <span className={cn("shrink-0 sm:hidden", corStatus(os.status))}>
          {labelStatus(os.status)}
        </span>
      </div>
      <div className="hidden shrink-0 text-sm text-tinta-3 md:block">{os.mecanico || "—"}</div>
      {mostrarLucro && (
        <div
          className="hidden w-20 shrink-0 text-right text-xs tabular-nums lg:block"
          title="Lucro real (após custo de peças)"
        >
          <p className={cn("font-semibold", corMargem(margem))}>
            {formatCurrency(os.lucroReal ?? 0)}
          </p>
          <p className={corMargem(margem)}>{margem === null ? "—" : `${margem.toFixed(0)}%`}</p>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-3">
        <span className={cn("hidden sm:inline-flex", corStatus(os.status))}>
          {labelStatus(os.status)}
        </span>
        <div className="w-28 text-right text-xs tabular-nums">
          <p className="font-semibold text-tinta">{formatCurrency(os.total)}</p>
          <p className={recebimento.cor}>{recebimento.texto}</p>
        </div>
        <p className="hidden text-xs tabular-nums text-tinta-3 sm:block">{formatDate(os.abertura)}</p>
      </div>
    </Link>
  );
}

export default function OSPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6">
          <EsqueletoLista linhas={6} />
        </div>
      }
    >
      <OSListContent />
    </Suspense>
  );
}
```

**Apoio do pátio e dos períodos.** `diasParado()` dá o número da pílula de dias parado. `periodo.ts` monta os rótulos e as fatias do período: "Setembro/2026", as semanas da "Distribuição no período" e as abas Semana / Mês / 3 Meses / Ano. `texto-formatado.ts` lê as marcas da descrição do serviço (`## título`, `**negrito**`, listas); a lista de OS usa a versão corrida, sem marcas.

### src/lib/os-periodo.ts

```ts
import { OS_CONCLUIDA, OS_EM_ABERTO } from "./constants";
import type { Janela } from "./periodo";

/**
 * OS entregues dentro da janela — a definição de "produção do período".
 *
 * O que define o período é a **data de entrega** (`fechamento`), não a de abertura:
 * um carro aberto há 30 dias e entregue hoje é produção de hoje, e uma OS ainda no
 * pátio não é produção de período nenhum.
 *
 * O segundo ramo é rede de segurança para OS entregues antes de `fechamento` passar
 * a ser carimbado. Sem ele essas OS sumiriam do resultado; com ele caem na
 * `abertura`, que é a melhor aproximação que sobrou. Nenhum dado é reescrito.
 */
export function osEntreguesNoPeriodo(j: Janela) {
  return {
    status: { in: OS_CONCLUIDA },
    OR: [
      { fechamento: { gte: j.inicio, lt: j.fim } },
      { AND: [{ fechamento: null }, { abertura: { gte: j.inicio, lt: j.fim } }] },
    ],
  };
}

/** OS ainda no pátio. Sem recorte de data de propósito: é o estado da oficina agora. */
export const osNoPatio = { status: { in: OS_EM_ABERTO } };

/** Data em que a OS conta como produzida, com o mesmo fallback do filtro acima. */
export function dataProducao(os: { fechamento: Date | null; abertura: Date }): Date {
  return os.fechamento ?? os.abertura;
}

/** Dias corridos que a OS está parada no pátio. */
export function diasParado(abertura: Date, agora = new Date()): number {
  return Math.max(0, Math.floor((agora.getTime() - abertura.getTime()) / 86_400_000));
}
```

### src/lib/periodo.ts

```ts
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

export type PeriodoKey = "semana" | "mes" | "trimestre" | "semestre" | "ano";

export type Janela = {
  inicio: Date;
  fim: Date;
  /** Rótulo do período para exibição, ex.: "18/08 – 24/08", "Agosto/2026". */
  label: string;
};

// "semestre" fica de fora de propósito: é usado pela Produtividade, que tem seu
// próprio seletor de período — colocar aqui também o traria para o Dashboard.
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
    case "semestre": {
      // Semestre móvel: os seis meses civis terminando no mês atual — mesma ideia do
      // trimestre acima, só que com uma janela maior.
      const inicio = brMidnightUTC(ano, mes - 5 + offset * 6, 1);
      const fim = brMidnightUTC(ano, mes + 1 + offset * 6, 1);
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

/**
 * Competência de um instante: a meia-noite de Brasília do 1º dia do mês dele.
 *
 * É a chave pela qual o controle de gastos agrupa — "o aluguel de agosto" é um só,
 * ainda que tenha vencido no dia 5 e sido pago no dia 12.
 */
export function competenciaDe(instante: Date): Date {
  const { ano, mes } = camposBR(instante);
  return brMidnightUTC(ano, mes, 1);
}

/**
 * "AAAA-MM-DD" no calendário de Brasília — o formato que `<input type="date">` usa.
 *
 * `toISOString().slice(0,10)` não serve: a data é guardada como a meia-noite de
 * Brasília, que em UTC é 3h da manhã do mesmo dia — mas qualquer instante da noite
 * volta um dia. Ler pelo calendário de Brasília é o que mantém 05/08 sendo 05/08.
 */
export function chaveDia(instante: Date): string {
  const { ano, mes, dia } = camposBR(instante);
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** O caminho de volta: "AAAA-MM-DD" vira a meia-noite de Brasília daquele dia. */
export function diaDaChave(chave: string): Date {
  const [ano, mes, dia] = chave.split("-").map(Number);
  return brMidnightUTC(ano, mes - 1, dia);
}

/** "Dezembro/2026" — o mês por extenso, para texto de tela. */
export function rotuloMes(instante: Date): string {
  const { ano, mes } = camposBR(instante);
  return `${MESES[mes]}/${ano}`;
}

/** Chave "AAAA-MM" da competência — é o que viaja na URL e no corpo das rotas. */
export function chaveMes(instante: Date): string {
  const { ano, mes } = camposBR(instante);
  return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

/** Janela do mês descrito por "AAAA-MM"; chave ausente ou inválida cai no mês atual. */
export function janelaDaChave(chave: string | undefined, agora = new Date()): Janela {
  const casa = /^(\d{4})-(\d{2})$/.exec(chave ?? "");
  if (casa) {
    const ano = Number(casa[1]);
    const mes = Number(casa[2]);
    if (ano >= 2000 && ano <= 2100 && mes >= 1 && mes <= 12) return janelaMes(ano, mes);
  }
  const c = camposBR(agora);
  return janelaMes(c.ano, c.mes + 1);
}

/** Desloca a chave "AAAA-MM" em `passos` meses. */
export function chaveMesDeslocada(chave: string, passos: number): string {
  const j = janelaDaChave(chave);
  const c = camposBR(j.inicio);
  return chaveMes(brMidnightUTC(c.ano, c.mes + passos, 1));
}

/** A competência `passos` meses depois (ou antes, se negativo) da informada. */
export function competenciaDeslocada(competencia: Date, passos: number): Date {
  const c = camposBR(competencia);
  return brMidnightUTC(c.ano, c.mes + passos, 1);
}

/** Quantos meses civis separam duas competências (positivo quando `b` é posterior). */
export function mesesEntre(a: Date, b: Date): number {
  const ca = camposBR(a);
  const cb = camposBR(b);
  return (cb.ano - ca.ano) * 12 + (cb.mes - ca.mes);
}

/** Dias do mês civil da competência — o que segura o "todo dia 31" em fevereiro. */
export function diasNoMes(competencia: Date): number {
  const c = camposBR(competencia);
  return Math.round(
    (brMidnightUTC(c.ano, c.mes + 1, 1).getTime() - brMidnightUTC(c.ano, c.mes, 1).getTime()) /
      86_400_000
  );
}

/** O dia `dia` dentro da competência, limitado ao último dia do mês. */
export function diaDaCompetencia(competencia: Date, dia: number): Date {
  const usado = Math.min(Math.max(dia, 1), diasNoMes(competencia));
  return new Date(competencia.getTime() + (usado - 1) * 86_400_000);
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

/**
 * Meses civis (ano, mês 1-12) cobertos pela janela, um por bucket.
 *
 * Só faz sentido para janelas cujos limites caem em início de mês — é o caso de
 * "mes", "trimestre", "semestre" e "ano", mas não de "semana".
 */
export function mesesDaJanela(j: Janela): { ano: number; mes: number }[] {
  const meses: { ano: number; mes: number }[] = [];
  let cursor = j.inicio;
  while (cursor < j.fim) {
    const c = camposBR(cursor);
    meses.push({ ano: c.ano, mes: c.mes + 1 });
    cursor = brMidnightUTC(c.ano, c.mes + 1, 1);
  }
  return meses;
}
```

### src/lib/texto-formatado.ts

```ts
// Formatação leve da descrição do serviço (OS e orçamento).
//
// O texto continua salvo como texto simples, com marcas no estilo Markdown:
//
//   ## Título            → título de seção
//   **negrito**          → trecho em negrito
//   1. item              → lista numerada
//   - item  (ou • item)  → lista com marcadores
//   linha vazia          → separa parágrafos
//
// Texto antigo, sem marca nenhuma, sai igual ao que era: um parágrafo por linha.
// A mesma leitura alimenta a tela (TextoFormatado) e o PDF (TextoFormatadoPdf),
// para os dois nunca mostrarem coisas diferentes.

/**
 * Tamanho máximo da descrição do serviço, com as marcas. Mora aqui (e não só em
 * validacao.ts, que é do servidor) para o formulário mostrar o mesmo teto.
 * Um laudo com diagnóstico e lista de peças trocadas passa fácil de 2.000.
 */
export const DESCRICAO_SERVICO_MAX = 5000;

export type Trecho ={ texto: string; negrito: boolean };

export type Bloco =
  | { tipo: "titulo"; trechos: Trecho[] }
  | { tipo: "paragrafo"; trechos: Trecho[] }
  | { tipo: "numerado"; numero: string; nivel: number; trechos: Trecho[] }
  | { tipo: "marcador"; nivel: number; trechos: Trecho[] }
  | { tipo: "espaco" };

const RE_TITULO = /^#{1,6}\s+(.*)$/;
const RE_NUMERADO = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;
const RE_MARCADOR = /^(\s*)[-*•]\s+(.*)$/;

/** Separa `**negrito**` do texto comum. Um `**` sem par fica como está. */
export function trechosDaLinha(linha: string): Trecho[] {
  const trechos: Trecho[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let ultimo = 0;
  for (const m of linha.matchAll(re)) {
    if (m.index > ultimo) trechos.push({ texto: linha.slice(ultimo, m.index), negrito: false });
    trechos.push({ texto: m[1], negrito: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < linha.length) trechos.push({ texto: linha.slice(ultimo), negrito: false });
  return trechos;
}

/** Recuo de 2+ espaços (ou tab) vira sub-item. Só dois níveis: é descrição, não sumário. */
function nivelDoRecuo(recuo: string): number {
  return recuo.replace(/\t/g, "  ").length >= 2 ? 1 : 0;
}

export function blocosDoTexto(texto: string): Bloco[] {
  const blocos: Bloco[] = [];
  for (const bruta of texto.replace(/\r\n?/g, "\n").split("\n")) {
    const linha = bruta.trimEnd();
    if (!linha.trim()) {
      // Várias linhas vazias seguidas valem por uma.
      if (blocos.length > 0 && blocos[blocos.length - 1].tipo !== "espaco") blocos.push({ tipo: "espaco" });
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = linha.trim().match(RE_TITULO))) {
      blocos.push({ tipo: "titulo", trechos: trechosDaLinha(m[1]) });
    } else if ((m = linha.match(RE_NUMERADO))) {
      blocos.push({ tipo: "numerado", numero: m[2], nivel: nivelDoRecuo(m[1]), trechos: trechosDaLinha(m[3]) });
    } else if ((m = linha.match(RE_MARCADOR))) {
      blocos.push({ tipo: "marcador", nivel: nivelDoRecuo(m[1]), trechos: trechosDaLinha(m[2]) });
    } else {
      blocos.push({ tipo: "paragrafo", trechos: trechosDaLinha(linha.trim()) });
    }
  }
  if (blocos.length > 0 && blocos[blocos.length - 1].tipo === "espaco") blocos.pop();
  return blocos;
}

/**
 * Versão corrida, sem marcas, para as listagens que mostram só o começo da
 * descrição numa linha (lista de OS, ficha do cliente).
 */
export function resumoDoTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return blocosDoTexto(texto)
    .flatMap((b) => (b.tipo === "espaco" ? [] : [b.trechos.map((t) => t.texto).join("")]))
    .join(" · ");
}

// ── Colar texto formatado ────────────────────────────────────────────────────

/**
 * Converte o HTML da área de transferência (texto copiado de um chat, do Word,
 * de um site) para as marcas acima, preservando títulos, negrito e listas.
 * Só roda no navegador — usa DOMParser.
 */
export function htmlParaTexto(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const linhas: string[] = [];

  // nodeType em vez de instanceof: o documento do DOMParser é outro, e o teste
  // de classe falha em alguns ambientes.
  const ehElemento = (no: Node): no is HTMLElement => no.nodeType === 1;

  const inline = (no: Node): string => {
    if (no.nodeType === 3) return (no.textContent ?? "").replace(/\s+/g, " ");
    if (!ehElemento(no)) return "";
    const tag = no.tagName;
    if (tag === "BR") return "\n";
    if (tag === "UL" || tag === "OL") return ""; // listas aninhadas saem em linhas próprias
    const dentro = Array.from(no.childNodes).map(inline).join("");
    // O Google Docs embrulha tudo num <b style="font-weight:normal">: o estilo manda.
    const peso = no.getAttribute("style")?.match(/font-weight\s*:\s*(\w+)/i)?.[1];
    const negrito = peso ? peso === "bold" || Number(peso) >= 600 : tag === "B" || tag === "STRONG";
    if (negrito && dentro.trim()) {
      // O espaço fica fora das marcas: "** texto**" não é lido como negrito.
      const [, antes, meio, depois] = dentro.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
      return `${antes}**${meio}**${depois}`;
    }
    return dentro;
  };

  const empurra = (texto: string) => {
    for (const l of texto.split("\n")) {
      const limpa = l.trim();
      if (limpa) linhas.push(limpa);
    }
  };
  const separa = () => {
    if (linhas.length > 0 && linhas[linhas.length - 1] !== "") linhas.push("");
  };

  const lista = (el: HTMLElement, nivel: number) => {
    const numerada = el.tagName === "OL";
    let n = Number(el.getAttribute("start")) || 1;
    const recuo = nivel > 0 ? "  " : "";
    for (const li of Array.from(el.children)) {
      if (li.tagName !== "LI") continue;
      const conteudo = inline(li).replace(/\s*\n\s*/g, " ").trim();
      linhas.push(`${recuo}${numerada ? `${n++}.` : "-"} ${conteudo}`);
      for (const filho of Array.from(li.children)) {
        if (filho.tagName === "UL" || filho.tagName === "OL") lista(filho as HTMLElement, nivel + 1);
      }
    }
  };

  const bloco = (no: Node) => {
    if (no.nodeType === 3) {
      empurra(inline(no));
      return;
    }
    if (!ehElemento(no)) return;
    const tag = no.tagName;
    if (/^H[1-6]$/.test(tag)) {
      separa();
      const titulo = inline(no).replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
      if (titulo) linhas.push(`## ${titulo}`);
      return;
    }
    if (tag === "UL" || tag === "OL") {
      lista(no, 0);
      separa();
      return;
    }
    if (tag === "P") {
      // Parágrafo novo ganha uma linha em branco antes, como na tela de onde veio.
      separa();
      empurra(inline(no));
      return;
    }
    if (tag === "HR") {
      separa();
      return;
    }
    if (["DIV", "SECTION", "ARTICLE", "BODY", "MAIN", "BLOCKQUOTE", "SPAN", "B", "STRONG"].includes(tag)) {
      const temBloco = Array.from(no.children).some((c) =>
        /^(H[1-6]|UL|OL|P|DIV|SECTION|ARTICLE|BLOCKQUOTE|HR)$/.test(c.tagName),
      );
      if (temBloco) Array.from(no.childNodes).forEach(bloco);
      else empurra(inline(no));
      return;
    }
    empurra(inline(no));
  };

  Array.from(doc.body.childNodes).forEach(bloco);
  while (linhas.length > 0 && linhas[linhas.length - 1] === "") linhas.pop();
  return linhas.join("\n");
}
```

---

## Observações

### Onde está cada tela pedida

| Pedido | Arquivo real | Observação |
|---|---|---|
| Pátio | `src/app/page.tsx` (aba **Operação**, lista "Pátio") e `src/app/os/page.tsx` (aba "Pátio", rota `/os?status=patio`) | Não existe uma rota `/patio`. A versão com dias parado (pílula `.idade`) é a do Dashboard. |
| Orçamento e conversão em OS | `src/app/orcamentos/[id]/page.tsx` | A conversão é o botão verde **Converter em OS**. Antes de converter aparece uma confirmação do `useConfirmar` (`ui/Avisos.tsx`); depois, o app abre a OS nova. |
| OS aberta | `src/app/os/[id]/page.tsx` | Fotos em `src/components/Fotos.tsx`. Peças e mão de obra estão na tabela "Itens e serviços" do documento. |
| Documento da OS (tela) | O bloco `.documento` dentro de `src/app/os/[id]/page.tsx`, com o cabeçalho em `CabecalhoDocumento.tsx` | **A imagem do WhatsApp não é um print da tela.** Ela sai do PDF (`OSPdfDocument.tsx`), convertido em PNG por `lib/pdf-para-imagem.ts` (pdf.js, escala 3x). Os dois layouts são parecidos, mas o PDF usa Helvetica e uma paleta própria (`#18181b`, `#52525b`, `#e4e4e7`…). |
| Fiado / contas a receber | `src/app/contas-receber/page.tsx` | As faixas de atraso são os cartões `FaixaCard` (0 a 15, 16 a 30, 31 a 60 e mais de 60 dias), com as classes `.idade-1` a `.idade-4`. |
| Painel financeiro | `src/app/page.tsx` (aba **Resultado**) e `src/app/despesas/page.tsx` com `components/despesas/ControleDeGastos.tsx` | O ponto de equilíbrio é o `PainelEquilibrio`, dentro de `ControleDeGastos.tsx`. |

Os caminhos citados no pedido também são outros: `LogoBoxOS.tsx` fica em `src/components/marca/`, e `Icones.tsx` e `Botao.tsx` ficam em `src/components/ui/`.

### Stack e dependências visuais

- **Next.js 16** (App Router), **React 19**, TypeScript.
- **Tailwind CSS 3.4**, configurado em `tailwind.config.ts`. **Não existe bloco `@theme`**: isso é do Tailwind 4, e o projeto está no 3.
- `clsx` + `tailwind-merge`, combinados na função `cn()` de `lib/utils.ts`.
- **Fonte:** Poppins, pesos 600 e 700, via `next/font/google`, e só na logo e nos `h1`. O resto do texto usa a fonte do sistema (`ui-sans-serif, system-ui…`). Fora do Next, carregue a Poppins pelo Google Fonts e defina `--fonte-marca`.
- **Ícones:** SVGs próprios (`ui/Icones.tsx`), com traço 2 e `currentColor`. Não há biblioteca de ícones. `CopiarVeiculo`, `BaixarComprovante` e `Fotos` trazem alguns SVGs embutidos.
- **Gráficos:** nenhuma biblioteca. As barras são `div`s com largura em %: "Distribuição no período" no Dashboard, "Por categoria" e a barra do ponto de equilíbrio no Controle de gastos.
- **PDF:** `@react-pdf/renderer` 4.5. **PDF em imagem:** `pdfjs-dist` 6.3, que precisa do worker em `/pdfjs/pdf.worker.min.mjs`.
- **Animações do próprio app:** só `animate-pulse` e `.esqueleto` (carregamento), a gaveta do menu (`drawer-in`, 0,2 s), `blur-sm` na "Visão interna" escondida e `transition-colors`. O vídeo pode criar as suas sem conflito.

### Tokens e tema

- Os tokens são trios RGB sem vírgula (`--brand-600: 242 169 0`). Use `rgb(var(--brand-600))`, ou `rgb(var(--brand-600) / 0.2)` com transparência.
- Laranja da marca: `#F2A900`. Grafite: `#1E2329`. Texto sobre o laranja é escuro (`brand-fg` = `#18181B`), nunca branco. Texto **na cor** da marca usa `brand-texto`: `#966900` no tema claro e `#F2A900` no escuro.
- Tema escuro: atributo `data-tema="escuro"` no `<html>`, ou `prefers-color-scheme: dark` quando não há atributo. Os componentes não usam `dark:`; só as variáveis mudam.
- Os documentos usam a cor da oficina (`--doc-cor` e `--doc-texto`), escrita por `estiloDoDocumento()`. O padrão é o próprio laranja boxOS.

### Logo

- No app, use `LogoBoxOS` / `SimboloBoxOS` / `IconeBoxOS`, que estão em `LogoBoxOS.tsx`.
- **Cuidado:** nos SVGs horizontais de `public/brand/`, o "boxOS" é `<text font-family="Poppins">`, e não um contorno. Num editor de vídeo sem a Poppins instalada, o texto aparece em outra fonte. Instale a Poppins Bold ou converta o texto em curvas.
- O símbolo tem proporção 70:57. O ícone do app é o símbolo sobre um quadrado grafite com cantos de raio 14/64.

### O que foi removido ou não incluído

- **Removido das telas** (comentários `// [removido: …]`): chamadas `fetch` às rotas `/api/...`, consultas Prisma das páginas de servidor, autenticação (`exigirOficina`, `exigirDono`, logout), envio de fotos e validação dos modais. JSX, classes e estrutura ficaram intactos. Alguns `import` sem uso continuam no topo dos arquivos.
- **Hooks e componentes citados, mas sem arquivo no pacote:**

  | Hook ou componente | O que faz | Valor a usar no vídeo |
  |---|---|---|
  | `usePodeFinanceiro()`, `usePodeExcluir()` (`UsuarioProvider`) | Devolvem `boolean` | `true` (visão do dono) |
  | `useConfiguracao()`, `carregarConfiguracao()` | Devolvem a `Configuracao` | Bloco `configuracao` dos dados fictícios |
  | `usePedirSaida()` (`SaidaSegura`) | Confirma a saída com formulário preenchido | Pode ignorar |
  | `NotificacaoSino` (`ui/Notificacoes`) | Sino de avisos do menu | Pode ignorar |
  | `SeletorTema` (`ui/Tema`) | Três botões Claro / Automático / Escuro no rodapé do menu | Pode ignorar |

- Também ficaram de fora:
  - os modais do Controle de gastos (`ModalGasto`, `ModalPagamento`, `ModalFixar`, `ModalFixas`, `ModalCategorias` e `ModalExcluirParcela`), que só aparecem ao clicar;
  - `OrcamentoPdfDocument.tsx`, o PDF do orçamento, que tem a mesma estrutura do PDF da OS (incluído) com título "Orçamento" e validade;
  - as libs técnicas `foto-pdf`, `image-compress`, `tempo-limite` e `permissoes`.
- **Do `constants.ts`, a parte 1 traz só `corStatus()` e `OS_STATUS`, como pedido.** O restante que as telas usam, em resumo:

  | Constante | Valores |
  |---|---|
  | `labelStatus` (OS) | Aberta, Em andamento, Ag. peça, Entregue, Cancelada |
  | Status do orçamento (`corStatusOrcamento` / `labelStatusOrcamento`) | Pendente (`status-aberta`), Aprovado (`status-entregue`), Recusado (`status-inerte`), Convertido (`status-andamento`) |
  | `corMargem(margem%)` | ≥ 40 → `text-ok`; ≥ 20 → `text-atencao`; abaixo de 20 → `text-perigo`; sem valor → `text-tinta-3` |
  | `margemOS` | `lucroReal / total × 100` |
  | `FORMAS_PAGAMENTO` | Dinheiro, PIX, Cartão de crédito, Cartão de débito, Transferência |
  | `FOTO_TIPOS` | Entrada ("Estado do veículo na chegada"), Serviço ("Peças trocadas, antes e depois"), Saída ("Estado do veículo na entrega") |
  | `anoVeiculo` | "fabricação/modelo", ex.: `2021/2022` |
  | `textoVeiculo` | O texto do botão "Copiar carro": modelo, motor e válvulas na 1ª linha; depois `Ano:`, `Combustível:` e `KM:` |

### Dados fictícios: como usar

- Todos os nomes, placas, telefones, CPFs e valores são **inventados**, e a oficina é "Box 47 Mecânica". Nada veio do banco.
- **"Hoje" é 07/10/2026.** Os dias parado e os dias em atraso foram calculados a partir dessa data. Para o vídeo, fixe `Date.now()` nesse dia, ou os números mudam.
- As datas estão em ISO. Os componentes do Controle de gastos esperam objetos `Date`, então converta com `new Date(...)`.
- As fotos apontam para `/video/fotos/*.jpg`, que **não existem**: coloque imagens próprias nesses caminhos. `configuracao.logoUrl` é `null`, então o cabeçalho do documento sai sem logo; para mostrar uma, use uma logo **fictícia**.
- O mês do painel é **Setembro/2026**, com o Dashboard em `periodo=mes&offset=-1`. Os totais do Dashboard, do DRE e do ponto de equilíbrio fecham entre si; `dashboardResultado.resumoCalculado` traz os números que a tela deve mostrar, para conferência.
- `osAberta` é a OS #1298 do pátio, aberta em detalhe. `orcamento.aposConversao` mostra os campos que mudam depois do clique em **Converter em OS**.

### Segurança

- Nenhum `.env`, chave, token, URL de banco, migration ou código de API entrou no pacote.
- Os arquivos listados **não continham segredos**, e nenhuma linha precisou ser omitida por isso. As rotas internas aparecem só como texto nos comentários de remoção (ex.: `/api/os/:id`), sem domínio.
