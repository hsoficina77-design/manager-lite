// Resultados da loja, no painel da autopeça — os blocos da tela `/loja/resumo`.
//
// Componentes de servidor: nada aqui tem estado. O "passar o dedo/mouse" dos gráficos é
// CSS (`group-hover` e `group-focus-visible`), então cada barra e cada quadradinho do
// mapa de horários também abre o detalhe pelo teclado, e a página não carrega
// JavaScript de gráfico nenhum.
//
// Cores: os desfechos da cotação têm uma cor cada, a mesma em todos os blocos
// (`--gr-*` em globals.css). Texto nunca vai na cor do gráfico — vai na tinta, com a
// bolinha colorida do lado.

import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { SimboloPecaPeca } from "@/components/marca/LogoPecaPeca";
import { MOTIVOS_DEVOLUCAO } from "@/components/peca-peca/regras";
import type { DesfechoDoEnvio, PeriodoDosResultados, ResultadosDaLoja } from "@/lib/balcao";

// ─── Formatos ───────────────────────────────────────────────────────────────

/** Reais sem centavos a partir de mil: "R$ 12.340" lê melhor que "R$ 12.340,00". */
export function reais(v: number) {
  const inteiro = Math.abs(v) >= 1000;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: inteiro ? 0 : 2,
    maximumFractionDigits: inteiro ? 0 : 2,
  }).format(v);
}

/** "R$ 12,3 mil" — para rótulo de gráfico, onde cabe pouco. */
function reaisCurto(v: number) {
  if (Math.abs(v) < 1000) return reais(v);
  return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
}

export function tempo(minutos: number | null) {
  if (minutos === null) return "—";
  if (minutos < 1) return "1 min";
  if (minutos < 60) return `${Math.round(minutos)} min`;
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h >= 24) return `${Math.round(h / 24)} ${Math.round(h / 24) === 1 ? "dia" : "dias"}`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const porcento = (parte: number, todo: number) => (todo ? Math.round((parte / todo) * 100) : 0);
const plural = (n: number, um: string, varios: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DIAS_LONGOS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-11-11" → "11/11". */
const diaMes = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
/** "2026-11-11" → "qua, 11/11" (o dia da semana sai da data em si, sem fuso). */
function diaComSemana(dia: string) {
  const [a, m, d] = dia.split("-").map(Number);
  return `${DIAS_CURTOS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()]}, ${diaMes(dia)}`;
}
const nomeDoMes = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]}/${mes.slice(2, 4)}`;

export const textoDoPeriodo = (dias: PeriodoDosResultados) => `últimos ${dias} dias`;

// ─── Cores dos desfechos ────────────────────────────────────────────────────

const DESFECHOS: { chave: DesfechoDoEnvio; rotulo: string; fundo: string; tinta: string }[] = [
  { chave: "VENDIDA", rotulo: "Vendeu", fundo: "bg-[rgb(var(--gr-vendida))]", tinta: "text-[#0B1F4D]" },
  { chave: "ABERTA", rotulo: "Oficina decidindo", fundo: "bg-[rgb(var(--gr-aberta))]", tinta: "text-white" },
  { chave: "SEM_RESPOSTA", rotulo: "Ficou sem resposta", fundo: "bg-[rgb(var(--gr-sem-resposta))]", tinta: "text-[#0B1F4D]" },
  { chave: "OUTRA_LOJA", rotulo: "Fechou com outra loja", fundo: "bg-[rgb(var(--gr-outra-loja))]", tinta: "text-white" },
];

// ─── Peças pequenas ─────────────────────────────────────────────────────────

/** O detalhe que abre ao passar o mouse (ou o foco do teclado) num pedaço do gráfico. */
function Detalhe({ lado = "centro", children }: { lado?: "inicio" | "centro" | "fim"; children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-full z-20 mb-2 hidden w-max max-w-[14rem] rounded-lg bg-contraste px-2.5 py-1.5 text-left text-xs leading-snug text-contraste-fg shadow-lg group-hover:block group-focus-visible:block",
        lado === "inicio" && "left-0",
        lado === "centro" && "left-1/2 -translate-x-1/2",
        lado === "fim" && "right-0"
      )}
    >
      {children}
    </span>
  );
}

/** De que lado abre o detalhe, para não sair da tela nas pontas do gráfico. */
const ladoDo = (i: number, total: number) => (i < total * 0.2 ? "inicio" : i >= total * 0.8 ? "fim" : "centro");

function Seta({ sobe, className }: { sobe: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden className={cn("shrink-0", className)}>
      <path
        d={sobe ? "M6 2.5v7M2.8 5.7 6 2.5l3.2 3.2" : "M6 9.5v-7M2.8 6.3 6 9.5l3.2-3.2"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Comparacao = { sobe: boolean | null; bom: boolean | null; texto: string };

/** Variação em %, de um período para o outro. Sem base para comparar, não há variação. */
function variacao(atual: number, anterior: number, menorEhMelhor = false): Comparacao | null {
  if (anterior === 0) return atual > 0 ? { sobe: true, bom: !menorEhMelhor, texto: "novo" } : null;
  const mudou = (atual - anterior) / Math.abs(anterior);
  if (Math.abs(mudou) < 0.005) return { sobe: null, bom: null, texto: "igual" };
  const sobe = mudou > 0;
  return { sobe, bom: sobe !== menorEhMelhor, texto: `${Math.round(Math.abs(mudou) * 100)}%` };
}

/** Variação de uma taxa, em pontos: "de 72% para 80%" vira "8 pontos". */
function variacaoDaTaxa(atual: number, anterior: number, temBase: boolean): Comparacao | null {
  if (!temBase) return null;
  const d = atual - anterior;
  if (d === 0) return { sobe: null, bom: null, texto: "igual" };
  // "Subiu" ou "caiu", com o número de antes ao lado: "75 pontos" era jargão de planilha.
  return { sobe: d > 0, bom: d > 0, texto: d > 0 ? "subiu" : "caiu" };
}

/** A comparação com o período anterior, numa linha só. Sem base, não diz nada. */
function Variacao({ c, antes }: { c: Comparacao | null; antes?: string }) {
  if (!c) return antes ? <p className="mt-1.5 text-xs text-tinta-3">Antes, {antes}</p> : null;
  const cor = c.bom === null ? "text-tinta-3" : c.bom ? "text-ok" : "text-perigo";
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs">
      {c.sobe !== null && <Seta sobe={c.sobe} className={cor} />}
      <span className={cn("font-semibold", cor)}>{c.texto}</span>
      {antes && <span className="truncate text-tinta-3">(antes, {antes})</span>}
    </p>
  );
}

function TituloDoBloco({ titulo, ajuda, acao }: { titulo: string; ajuda?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-tinta">{titulo}</h2>
        {ajuda && <p className="mt-0.5 text-xs text-tinta-3">{ajuda}</p>}
      </div>
      {acao}
    </div>
  );
}

/** Folha de conteúdo: branca, filete fino, canto discreto. Sem sombra. */
function Bloco({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-xl border border-linha bg-superficie p-4 sm:p-5", className)}>{children}</section>;
}

function SemDados({ children }: { children: React.ReactNode }) {
  return <p className="border-l-2 border-linha-forte py-1 pl-3 text-sm text-tinta-3">{children}</p>;
}

// ─── Período ────────────────────────────────────────────────────────────────

/** Abas de texto com o traço embaixo da escolhida: é navegação, não botão. */
export function EscolhaDoPeriodo({ atual, periodos }: { atual: PeriodoDosResultados; periodos: readonly PeriodoDosResultados[] }) {
  return (
    <nav aria-label="Período" className="flex gap-5 border-b border-linha">
      {periodos.map((d) => (
        <Link
          key={d}
          href={d === 30 ? "/loja/resumo" : `/loja/resumo?dias=${d}`}
          scroll={false}
          aria-current={d === atual ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 pb-2 text-sm font-medium transition-colors",
            d === atual ? "border-brand-600 text-tinta" : "border-transparent text-tinta-3 hover:text-tinta"
          )}
        >
          {d} dias
        </Link>
      ))}
    </nav>
  );
}

// ─── Destaque: quanto vendeu ────────────────────────────────────────────────

export function Destaque({ r }: { r: ResultadosDaLoja }) {
  const { agora, antes, serie, dias } = r;
  const c = variacao(agora.valor, antes.valor);
  const maior = Math.max(...serie.map((p) => p.valor), 0);
  const ticket = agora.vendidas ? agora.valor / agora.vendidas : 0;
  const porSemana = dias > 30;

  // A comparação dita como frase, não como selo.
  const frase =
    !c || c.texto === "novo"
      ? agora.vendidas > 0
        ? "As primeiras vendas pelo Peça Peça."
        : null
      : c.sobe === null
        ? `O mesmo que nos ${dias} dias anteriores.`
        : `${c.texto} ${c.sobe ? "a mais" : "a menos"} que nos ${dias} dias anteriores.`;

  // A manchete da tela é o número na Baloo, a fonte da marca, solto sobre a prata: é o
  // único momento ousado da página. O resto fica em folhas brancas e quietas.
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-end">
      <div className="min-w-0">
        <p className="text-sm text-tinta-3">Vendido pelo Peça Peça nos {textoDoPeriodo(dias)}</p>
        <p className="mt-1 font-pecapeca text-[3.75rem] font-extrabold leading-[0.95] tracking-[-0.02em] text-tinta sm:text-[4.75rem]">
          {reais(agora.valor)}
        </p>
        {frase && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-tinta-2">
            {c && c.sobe !== null && c.texto !== "novo" && (
              <Seta sobe={c.sobe} className={c.bom ? "text-ok" : "text-perigo"} />
            )}
            {frase}
          </p>
        )}
        {agora.vendidas > 0 && (
          <p className="mt-1 text-sm text-tinta-3">
            Em {plural(agora.vendidas, "pedido", "pedidos")}, com ticket médio de {reais(ticket)}.
          </p>
        )}
      </div>

      <div className="min-w-0">
        <div>
          <div className="flex h-24 items-end gap-[2px]" role="list" aria-label={`Vendas por ${porSemana ? "semana" : "dia"}`}>
            {serie.map((p, i) => {
              const altura = maior ? Math.max((p.valor / maior) * 100, p.valor > 0 ? 6 : 0) : 0;
              const ultimo = i === serie.length - 1;
              const quando = porSemana ? `${diaMes(p.inicio)} a ${diaMes(p.fim)}` : ultimo ? "Hoje" : diaComSemana(p.fim);
              return (
                <div
                  key={p.fim}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${quando}: ${reais(p.valor)}, ${plural(p.vendidas, "pedido", "pedidos")}`}
                  className="group relative flex h-full flex-1 items-end justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  {p.valor > 0 ? (
                    <div
                      className={cn(
                        "w-full max-w-[24px] rounded-t-[4px] bg-[rgb(var(--gr-aberta))] transition-opacity",
                        ultimo ? "opacity-100" : "opacity-45 group-hover:opacity-80"
                      )}
                      style={{ height: `${altura}%` }}
                    />
                  ) : (
                    <div className="h-[2px] w-full max-w-[24px] rounded-full bg-linha-forte" />
                  )}
                  <Detalhe lado={ladoDo(i, serie.length)}>
                    <span className="block font-semibold">{quando}</span>
                    {reais(p.valor)} em {plural(p.vendidas, "pedido", "pedidos")}
                  </Detalhe>
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between border-t border-linha-forte pt-1.5 text-[11px] text-tinta-3">
            <span>{diaMes(serie[0]?.inicio ?? "")}</span>
            <span>{porSemana ? "por semana" : "por dia"}</span>
            <span>hoje</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Os quatro números ──────────────────────────────────────────────────────

export function Indicadores({ r }: { r: ResultadosDaLoja }) {
  const { agora, antes } = r;
  const taxa = porcento(agora.respondidas, agora.recebidas);
  const taxaAntes = porcento(antes.respondidas, antes.recebidas);
  const ganho = porcento(agora.vendidas, agora.decididas);
  const ganhoAntes = porcento(antes.vendidas, antes.decididas);

  const itens = [
    {
      rotulo: "Cotações recebidas",
      valor: agora.recebidas.toLocaleString("pt-BR"),
      sub: null,
      c: variacao(agora.recebidas, antes.recebidas),
      antes: antes.recebidas ? antes.recebidas.toLocaleString("pt-BR") : undefined,
    },
    {
      rotulo: "Respondidas",
      valor: agora.recebidas ? `${taxa}%` : "—",
      sub: agora.recebidas ? `${agora.respondidas} de ${agora.recebidas}` : null,
      c: agora.recebidas ? variacaoDaTaxa(taxa, taxaAntes, antes.recebidas > 0) : null,
      antes: antes.recebidas ? `${taxaAntes}%` : undefined,
    },
    {
      rotulo: "Responde em",
      valor: tempo(agora.minutosParaResponder),
      sub: agora.minutosParaResponder !== null ? "tempo típico da loja" : null,
      c:
        agora.minutosParaResponder !== null && antes.minutosParaResponder !== null
          ? variacao(agora.minutosParaResponder, antes.minutosParaResponder, true)
          : null,
      antes: antes.minutosParaResponder !== null ? tempo(antes.minutosParaResponder) : undefined,
      ajuda: "Metade das respostas sai em até esse tempo, contado de quando a cotação chega.",
    },
    {
      rotulo: "Disputas ganhas",
      valor: agora.decididas ? `${ganho}%` : "—",
      sub: agora.decididas ? `${agora.vendidas} de ${agora.decididas} decididas` : null,
      c: agora.decididas ? variacaoDaTaxa(ganho, ganhoAntes, antes.decididas > 0) : null,
      antes: antes.decididas ? `${ganhoAntes}%` : undefined,
      ajuda: "Das cotações que a loja respondeu e a oficina já decidiu, em quantas ela comprou com você.",
    },
  ];

  // Uma régua só, dividida por filetes — não quatro cartões iguais. As bordas de cima e
  // da esquerda de cada célula caem sobre a moldura (a grade anda 1px), como em
  // FaixaMetricas: sobram só as divisórias de dentro, em duas ou quatro colunas.
  return (
    <section className="overflow-hidden rounded-xl border border-linha bg-superficie">
      <div className="-ml-px -mt-px grid grid-cols-2 lg:grid-cols-4">
        {itens.map((i) => (
          <div key={i.rotulo} className="min-w-0 border-l border-t border-linha p-4 sm:p-5" title={i.ajuda}>
            <p className="truncate text-xs text-tinta-3">{i.rotulo}</p>
            <p className="mt-1 text-[1.75rem] font-semibold leading-tight text-tinta">{i.valor}</p>
            {i.sub && <p className="truncate text-xs text-tinta-3">{i.sub}</p>}
            <Variacao c={i.c} antes={i.antes} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Dicas ──────────────────────────────────────────────────────────────────

type Dica = { titulo: string; texto: string; tom: "boa" | "atencao" | "ideia" };

/** Até três recados em linguagem de balcão, tirados dos números do período. */
export function dicasDosResultados(r: ResultadosDaLoja): Dica[] {
  const dicas: Dica[] = [];
  const { agora, desfechos } = r;

  const semResposta = desfechos.SEM_RESPOSTA;
  if (semResposta > 0 && porcento(semResposta, agora.recebidas) >= 10) {
    dicas.push({
      tom: "atencao",
      titulo: `${plural(semResposta, "cotação ficou", "cotações ficaram")} sem resposta`,
      texto:
        "Cada uma é uma venda que nem entrou na disputa. Deixe o aviso do Peça Peça ligado no celular de quem fica no balcão.",
    });
  }

  const comDados = r.porRapidez.filter((f) => f.decididas >= 3);
  if (comDados.length >= 2) {
    const rapida = comDados[0];
    const lenta = comDados[comDados.length - 1];
    const a = porcento(rapida.vendidas, rapida.decididas);
    const b = porcento(lenta.vendidas, lenta.decididas);
    if (a - b >= 10) {
      dicas.push({
        tom: "ideia",
        titulo: "Responder rápido vende mais",
        texto: `Respondendo em ${rapida.faixa.toLowerCase()}, a loja ganhou ${a}% das disputas. Em ${lenta.faixa.toLowerCase()}, só ${b}%.`,
      });
    }
  }

  const falta = r.naoTinha[0];
  if (falta && falta.vezes >= 2) {
    dicas.push({
      tom: "ideia",
      titulo: `Pediram “${falta.descricao}” ${falta.vezes} vezes`,
      texto: "E a loja respondeu que não tinha. Vale olhar o estoque dessa peça.",
    });
  }

  const perdida = r.perdidas[0];
  if (perdida && perdida.vezes >= 2 && dicas.length < 3) {
    dicas.push({
      tom: "atencao",
      titulo: `“${perdida.descricao}” foi para outra loja ${perdida.vezes} vezes`,
      texto: "A loja tinha e ofereceu, mas a oficina comprou em outro lugar. Pode ser preço ou prazo.",
    });
  }

  if (dicas.length < 3 && agora.recebidas >= 10) {
    const { dia, hora } = picoDoMovimento(r.horarios);
    if (dia !== null && hora !== null) {
      dicas.push({
        tom: "ideia",
        titulo: `O movimento aperta ${dia === 0 || dia === 6 ? "no" : "na"} ${DIAS_LONGOS[dia]}, das ${hora}h às ${hora + 1}h`,
        texto: "Bom horário para ter alguém de olho no balcão do Peça Peça.",
      });
    }
  }

  const c = variacao(agora.valor, r.antes.valor);
  if (dicas.length < 3 && c?.bom && c.sobe && c.texto !== "novo") {
    dicas.push({
      tom: "boa",
      titulo: `As vendas subiram ${c.texto}`,
      texto: `Em relação aos ${r.dias} dias anteriores. Continue respondendo rápido.`,
    });
  }

  return dicas.slice(0, 3);
}

/** A régua à esquerda de cada recado: âmbar pede atenção, verde é notícia boa. */
const REGUA_DA_DICA = {
  boa: "border-ok",
  atencao: "border-[rgb(var(--gr-sem-resposta))]",
  ideia: "border-brand-600",
} as const;

// Recados como anotação de balcão: a frase manda, uma régua de cor diz o tom. Sem
// ícone dentro de bolinha e sem cartão dentro de cartão.
export function Dicas({ dicas }: { dicas: Dica[] }) {
  if (dicas.length === 0) return null;
  return (
    <Bloco>
      <TituloDoBloco titulo="O que dá para fazer" />
      <ul className="grid gap-x-8 gap-y-5 md:grid-cols-3">
        {dicas.map((d) => (
          <li key={d.titulo} className={cn("min-w-0 border-l-[3px] pl-3.5", REGUA_DA_DICA[d.tom])}>
            <p className="text-sm font-semibold leading-snug text-tinta">{d.titulo}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-tinta-2">{d.texto}</p>
          </li>
        ))}
      </ul>
    </Bloco>
  );
}

// ─── O que aconteceu com as cotações ────────────────────────────────────────

export function Desfechos({ r }: { r: ResultadosDaLoja }) {
  const total = r.agora.recebidas;
  return (
    <Bloco>
      <TituloDoBloco titulo="O que aconteceu com as cotações" ajuda={`Todas as que chegaram nos ${textoDoPeriodo(r.dias)}.`} />
      {total === 0 ? (
        <SemDados>Nenhuma cotação chegou neste período.</SemDados>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-tinta-2">
            De <strong className="text-tinta">{plural(total, "cotação", "cotações")}</strong>, a loja respondeu{" "}
            <strong className="text-tinta">{r.agora.respondidas}</strong> e vendeu em{" "}
            <strong className="text-tinta">{r.agora.vendidas}</strong>.
          </p>
          <div className="mt-4 flex h-7 w-full gap-[2px]" role="img" aria-label={DESFECHOS.map((d) => `${d.rotulo}: ${r.desfechos[d.chave]}`).join(", ")}>
            {DESFECHOS.filter((d) => r.desfechos[d.chave] > 0).map((d, i, lista) => {
              const n = r.desfechos[d.chave];
              const parte = porcento(n, total);
              return (
                <div
                  key={d.chave}
                  tabIndex={0}
                  className={cn(
                    "group relative flex min-w-[6px] items-center rounded-[4px] px-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                    d.fundo
                  )}
                  style={{ flexGrow: n, flexBasis: 0 }}
                >
                  {parte >= 9 && <span className={cn("text-xs font-semibold", d.tinta)}>{parte}%</span>}
                  <Detalhe lado={ladoDo(i, lista.length)}>
                    <span className="block font-semibold">{d.rotulo}</span>
                    {plural(n, "cotação", "cotações")}, {parte}%
                  </Detalhe>
                </div>
              );
            })}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
            {DESFECHOS.map((d) => (
              <li key={d.chave} className="flex min-w-0 items-start gap-2 text-sm">
                <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", d.fundo)} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-tinta-2">{d.rotulo}</span>
                  <span className="font-semibold tabular-nums text-tinta">{r.desfechos[d.chave]}</span>
                  <span className="ml-1.5 text-tinta-3">{porcento(r.desfechos[d.chave], total)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Bloco>
  );
}

// ─── Rapidez × vendas ───────────────────────────────────────────────────────

/** Abaixo disso, comparar a rapidez com as vendas é chute: o bloco não aparece. */
export const MINIMO_PARA_RAPIDEZ = 5;

/** Quantas disputas a loja já teve decididas, para saber se o bloco da rapidez aparece. */
export function disputasDecididas(r: ResultadosDaLoja) {
  return r.porRapidez.reduce((s, f) => s + f.decididas, 0);
}

export function RapidezVende({ r }: { r: ResultadosDaLoja }) {
  const decididas = r.porRapidez.reduce((s, f) => s + f.decididas, 0);
  const taxas = r.porRapidez.map((f) => (f.decididas ? porcento(f.vendidas, f.decididas) : null));
  const melhor = Math.max(...taxas.map((t) => t ?? -1));
  // Com poucas disputas o gráfico não diz nada: o bloco some, e a página avisa no pé.
  if (decididas < MINIMO_PARA_RAPIDEZ) return null;

  return (
    <Bloco>
      <TituloDoBloco
        titulo="Responder rápido vende mais?"
        ajuda="Quanto a loja ganhou das disputas, conforme o tempo que levou para responder."
      />
      {(
        <div className="grid grid-cols-4 gap-2">
          {r.porRapidez.map((f, i) => {
            const t = taxas[i];
            return (
              <div key={f.faixa} className="flex min-w-0 flex-col items-center">
                <div
                  tabIndex={f.decididas ? 0 : -1}
                  className="group relative flex h-36 w-full items-end justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  {t !== null ? (
                    <div className="flex h-full w-full flex-col items-center justify-end">
                      <span className="mb-1 text-sm font-bold tabular-nums text-tinta">{t}%</span>
                      <div
                        className={cn(
                          "w-full max-w-[40px] rounded-t-[4px] bg-[rgb(var(--gr-aberta))] transition-opacity",
                          t === melhor ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                        )}
                        style={{ height: `${Math.max(t, 2)}%` }}
                      />
                    </div>
                  ) : (
                    <span className="mb-1 text-sm text-tinta-3">—</span>
                  )}
                  {t !== null && (
                    <Detalhe lado={ladoDo(i, 4)}>
                      <span className="block font-semibold">{f.faixa}</span>
                      Vendeu em {f.vendidas} de {plural(f.decididas, "disputa", "disputas")}
                    </Detalhe>
                  )}
                </div>
                <div className="mt-2 w-full border-t border-linha pt-2 text-center">
                  <p className="text-xs font-medium leading-tight text-tinta-2">{f.faixa}</p>
                  <p className="mt-0.5 text-[11px] text-tinta-3">{plural(f.decididas, "disputa", "disputas")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Bloco>
  );
}

// ─── Mapa de horários ───────────────────────────────────────────────────────

const ORDEM_DA_SEMANA = [1, 2, 3, 4, 5, 6, 0];

function picoDoMovimento(horarios: number[][]) {
  const porDia = horarios.map((h) => h.reduce((s, n) => s + n, 0));
  const porHora = Array.from({ length: 24 }, (_, h) => horarios.reduce((s, d) => s + d[h], 0));
  const maxDia = Math.max(...porDia);
  const maxHora = Math.max(...porHora);
  return {
    dia: maxDia > 0 ? porDia.indexOf(maxDia) : null,
    hora: maxHora > 0 ? porHora.indexOf(maxHora) : null,
  };
}

export function Horarios({ r }: { r: ResultadosDaLoja }) {
  const { horarios } = r;
  const maior = Math.max(...horarios.flat());
  const horasComDados = horarios.flatMap((d) => d.flatMap((n, h) => (n > 0 ? [h] : [])));
  const de = Math.min(7, ...horasComDados);
  const ate = Math.max(19, ...horasComDados);
  const horas = Array.from({ length: ate - de + 1 }, (_, i) => de + i);
  const { dia, hora } = picoDoMovimento(horarios);
  const nivel = (n: number) => (n === 0 ? 0 : n / maior <= 0.25 ? 0.25 : n / maior <= 0.5 ? 0.45 : n / maior <= 0.75 ? 0.7 : 1);

  return (
    <Bloco>
      <TituloDoBloco
        titulo="Quando as cotações chegam"
        ajuda="Cada quadradinho é uma hora da semana. Quanto mais escuro, mais cotação chegou."
      />
      {maior === 0 ? (
        <SemDados>Nenhuma cotação chegou neste período.</SemDados>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_13rem]">
          <div className="min-w-0">
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: `2.25rem repeat(${horas.length}, minmax(0, 1fr))` }}>
              {ORDEM_DA_SEMANA.map((d) => (
                <div key={d} className="contents">
                  <span className="flex items-center text-[11px] font-medium capitalize text-tinta-3">{DIAS_CURTOS[d]}</span>
                  {horas.map((h, i) => {
                    const n = horarios[d][h];
                    return (
                      <div
                        key={h}
                        tabIndex={n ? 0 : -1}
                        className={cn(
                          "group relative aspect-square min-h-[10px] rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                          n === 0 && "bg-superficie-2"
                        )}
                        style={n ? { backgroundColor: `rgb(var(--gr-aberta) / ${nivel(n)})` } : undefined}
                      >
                        <Detalhe lado={ladoDo(i, horas.length)}>
                          <span className="block font-semibold capitalize">
                            {DIAS_LONGOS[d]}, {h}h às {h + 1}h
                          </span>
                          {plural(n, "cotação", "cotações")}
                        </Detalhe>
                      </div>
                    );
                  })}
                </div>
              ))}
              <span />
              {horas.map((h) => (
                <span key={h} className="pt-1 text-center text-[10px] tabular-nums text-tinta-3">
                  {(h - de) % 3 === 0 ? `${h}h` : ""}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-tinta-3">
              <span>Menos</span>
              {[0, 0.25, 0.45, 0.7, 1].map((a) => (
                <span
                  key={a}
                  className={cn("h-3 w-3 rounded-[3px]", a === 0 && "bg-superficie-2")}
                  style={a ? { backgroundColor: `rgb(var(--gr-aberta) / ${a})` } : undefined}
                />
              ))}
              <span>Mais</span>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 self-start lg:grid-cols-1 lg:border-l lg:border-linha lg:pl-6">
            <div>
              <dt className="text-xs text-tinta-3">Dia mais movimentado</dt>
              <dd className="mt-0.5 text-lg font-bold capitalize text-tinta">{dia !== null ? DIAS_LONGOS[dia] : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-tinta-3">Horário de pico</dt>
              <dd className="mt-0.5 text-lg font-bold text-tinta">{hora !== null ? `${hora}h às ${hora + 1}h` : "—"}</dd>
            </div>
          </dl>
        </div>
      )}
    </Bloco>
  );
}

// ─── Listas com barra ───────────────────────────────────────────────────────

type ItemDaLista = { rotulo: string; valor: number; texto: string; sub?: string };

function ListaComBarras({ itens, cor, vazio }: { itens: ItemDaLista[]; cor: string; vazio: string }) {
  if (itens.length === 0) return <SemDados>{vazio}</SemDados>;
  const maior = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <ol className="space-y-3.5">
      {itens.map((i) => (
        <li key={i.rotulo}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-tinta" title={i.rotulo}>
              {i.rotulo}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-tinta">{i.texto}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-superficie-2">
            <div className={cn("h-2 rounded-full", cor)} style={{ width: `${Math.max((i.valor / maior) * 100, 3)}%` }} />
          </div>
          {i.sub && <p className="mt-1 text-xs text-tinta-3">{i.sub}</p>}
        </li>
      ))}
    </ol>
  );
}

export function Pecas({ r }: { r: ResultadosDaLoja }) {
  const blocos = [
    {
      titulo: "Mais vendidas",
      ajuda: "O que as oficinas mais compraram da loja.",
      cor: "bg-[rgb(var(--gr-vendida))]",
      vazio: "Nenhuma venda neste período.",
      itens: r.maisVendidas.map((p) => ({
        rotulo: p.descricao,
        valor: p.valor,
        texto: reais(p.valor),
        sub: plural(p.quantidade, "unidade", "unidades"),
      })),
    },
    {
      titulo: "Ofereceu, mas foi para outra loja",
      ajuda: "A loja tinha a peça e a oficina comprou em outro lugar.",
      cor: "bg-[rgb(var(--gr-outra-loja))]",
      vazio: "Nenhuma peça perdida para outra loja. Ótimo sinal.",
      itens: r.perdidas.map((p) => ({ rotulo: p.descricao, valor: p.vezes, texto: plural(p.vezes, "vez", "vezes") })),
    },
    {
      titulo: "Pediram e a loja não tinha",
      ajuda: "Peças que a loja respondeu sem oferta. Pista para o estoque.",
      cor: "bg-[rgb(var(--gr-sem-resposta))]",
      vazio: "A loja teve tudo o que pediram.",
      itens: r.naoTinha.map((p) => ({ rotulo: p.descricao, valor: p.vezes, texto: plural(p.vezes, "vez", "vezes") })),
    },
  ];
  // Uma folha só com três colunas separadas por filete, não três cartões iguais.
  return (
    <Bloco className="p-0 sm:p-0">
      <div className="grid divide-y divide-linha lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {blocos.map((b) => (
          <div key={b.titulo} className="min-w-0 p-4 sm:p-5">
            <TituloDoBloco titulo={b.titulo} ajuda={b.ajuda} />
            <ListaComBarras itens={b.itens} cor={b.cor} vazio={b.vazio} />
          </div>
        ))}
      </div>
    </Bloco>
  );
}

// ─── Clientes e marcas ──────────────────────────────────────────────────────

export function Clientes({ r }: { r: ResultadosDaLoja }) {
  return (
    <Bloco>
      <TituloDoBloco titulo="Melhores clientes" ajuda="As oficinas que mais compraram da loja no período." />
      {r.clientes.length === 0 ? (
        <SemDados>Nenhuma oficina mandou cotação neste período.</SemDados>
      ) : (
        <ol className="divide-y divide-linha">
          {r.clientes.map((c, i) => (
            <li key={`${c.oficina}-${i}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {/* É um ranking de verdade, então a posição fica — na Baloo, sem bolinha. */}
              <span
                className={cn(
                  "w-6 shrink-0 text-center font-pecapeca text-xl font-extrabold leading-none",
                  i === 0 ? "text-brand-600" : "text-tinta-3"
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-tinta">{c.oficina}</p>
                <p className="text-xs text-tinta-3">
                  {plural(c.vendidas, "pedido", "pedidos")} em {plural(c.recebidas, "cotação", "cotações")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-tinta">{reais(c.valor)}</span>
            </li>
          ))}
        </ol>
      )}
    </Bloco>
  );
}

export function Marcas({ r }: { r: ResultadosDaLoja }) {
  return (
    <Bloco>
      <TituloDoBloco titulo="Marcas que mais saem" ajuda="Pelo valor vendido no período." />
      <ListaComBarras
        cor="bg-[rgb(var(--gr-aberta))]"
        vazio="Nenhuma venda neste período."
        itens={r.marcas.map((m) => ({
          rotulo: m.marca,
          valor: m.valor,
          texto: reais(m.valor),
          sub: plural(m.quantidade, "unidade", "unidades"),
        }))}
      />
    </Bloco>
  );
}

// ─── Equipe ─────────────────────────────────────────────────────────────────

export function Equipe({ r }: { r: ResultadosDaLoja }) {
  if (r.equipe.length === 0) return null;
  return (
    <Bloco>
      <TituloDoBloco titulo="Equipe no balcão" ajuda="Quem respondeu pelo painel, com login." />
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr className="text-left text-xs text-tinta-3">
              <th className="pb-2 pr-3 font-medium">Pessoa</th>
              <th className="pb-2 pr-3 text-right font-medium">Respostas</th>
              <th className="pb-2 pr-3 text-right font-medium">Responde em</th>
              <th className="pb-2 pr-3 text-right font-medium">Vendas</th>
              <th className="pb-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {r.equipe.map((p, i) => (
              <tr key={`${p.nome}-${i}`} className="tabular-nums text-tinta">
                <td className="py-2.5 pr-3">
                  <span className="block truncate">{p.nome}</span>
                </td>
                <td className="py-2.5 pr-3 text-right">{p.respostas}</td>
                <td className="py-2.5 pr-3 text-right">{tempo(p.minutosParaResponder)}</td>
                <td className="py-2.5 pr-3 text-right">{p.vendidas}</td>
                <td className="py-2.5 text-right font-medium">{reais(p.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Bloco>
  );
}

// ─── Entrega e devoluções ───────────────────────────────────────────────────

export function Entrega({ r, mediaDaLoja }: { r: ResultadosDaLoja; mediaDaLoja: number | null }) {
  return (
    <Bloco>
      <TituloDoBloco titulo="Entrega" ajuda="Do pedido até a peça chegar na oficina." />
      {r.entrega.entregas === 0 ? (
        <SemDados>Nenhuma entrega fechada neste período.</SemDados>
      ) : (
        <>
          <p className="text-[1.75rem] font-semibold leading-tight text-tinta">{tempo(r.entrega.minutos)}</p>
          <p className="mt-1 text-sm text-tinta-3">
            Tempo típico de {plural(r.entrega.entregas, "entrega", "entregas")} no período.
          </p>
        </>
      )}
      <p className="mt-4 border-t border-linha pt-3 text-xs leading-relaxed text-tinta-2">
        {mediaDaLoja !== null ? (
          <>
            As oficinas veem a loja com entrega em <strong className="text-tinta">{tempo(mediaDaLoja)}</strong>, medido nas
            últimas entregas. Entregar rápido faz a loja aparecer melhor na hora da escolha.
          </>
        ) : (
          <>Depois de 3 entregas, as oficinas passam a ver o tempo real da loja no lugar da faixa padrão de 20 a 40 min.</>
        )}
      </p>
    </Bloco>
  );
}

const COR_DO_MOTIVO = [
  "bg-[rgb(var(--gr-aberta))]",
  "bg-[rgb(var(--gr-sem-resposta))]",
  "bg-[rgb(var(--gr-outra-loja))]",
];

export function Devolucoes({ r }: { r: ResultadosDaLoja }) {
  const { pedidas, porMotivo, devolvido } = r.devolucoes;
  const motivos = MOTIVOS_DEVOLUCAO.map((m, i) => ({ ...m, n: porMotivo[m.value], cor: COR_DO_MOTIVO[i % COR_DO_MOTIVO.length] }));
  return (
    <Bloco>
      <TituloDoBloco titulo="Devoluções" ajuda="O valor vendido lá em cima já vem sem o que a loja devolveu." />
      {pedidas === 0 ? (
        <p className="border-l-[3px] border-ok pl-3.5 text-sm text-tinta">Nenhuma peça voltou neste período.</p>
      ) : (
        <>
          <p className="text-[1.75rem] font-semibold leading-tight text-tinta">{pedidas}</p>
          <p className="mt-1 text-sm text-tinta-3">
            {pedidas === 1 ? "devolução pedida" : "devoluções pedidas"}
            {r.agora.vendidas > 0 && <>, {porcento(pedidas, r.agora.vendidas)}% dos pedidos</>}
          </p>
          <div className="mt-4 flex h-2 gap-[2px]">
            {motivos.filter((m) => m.n > 0).map((m) => (
              <div key={m.value} className={cn("rounded-full", m.cor)} style={{ flexGrow: m.n, flexBasis: 0 }} />
            ))}
          </div>
          <ul className="mt-3 space-y-1.5">
            {motivos.map((m) => (
              <li key={m.value} className="flex items-center gap-2 text-sm">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", m.cor)} aria-hidden />
                <span className="flex-1 text-tinta-2">{m.rotulo}</span>
                <span className="font-semibold tabular-nums text-tinta">{m.n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-linha pt-3 text-sm text-tinta-2">
            Devolvido às oficinas: <strong className="text-tinta">{formatCurrency(devolvido)}</strong>
          </p>
        </>
      )}
    </Bloco>
  );
}

// ─── Mês a mês ──────────────────────────────────────────────────────────────

export function MesAMes({ r }: { r: ResultadosDaLoja }) {
  const maior = Math.max(...r.meses.map((m) => m.valor), 0);
  const indiceDoMaior = r.meses.findIndex((m) => m.valor === maior && maior > 0);
  return (
    <Bloco>
      <TituloDoBloco titulo="Mês a mês" ajuda="Valor vendido nos últimos seis meses, já sem as devoluções." />
      <div className="grid grid-cols-6 gap-2">
        {r.meses.map((m, i) => {
          const ultimo = i === r.meses.length - 1;
          const altura = maior > 0 ? Math.max((Math.max(m.valor, 0) / maior) * 100, m.valor > 0 ? 3 : 0) : 0;
          return (
            <div key={m.mes} className="flex min-w-0 flex-col items-center">
              <div
                tabIndex={0}
                className="group relative flex h-36 w-full flex-col items-center justify-end rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              >
                {(ultimo || i === indiceDoMaior) && m.valor > 0 && (
                  <span className="mb-1 whitespace-nowrap text-[11px] font-semibold tabular-nums text-tinta">{reaisCurto(m.valor)}</span>
                )}
                {m.valor > 0 ? (
                  <div
                    className={cn(
                      "w-full max-w-[32px] rounded-t-[4px] bg-[rgb(var(--gr-aberta))] transition-opacity",
                      ultimo ? "opacity-100" : "opacity-50 group-hover:opacity-80"
                    )}
                    style={{ height: `${altura}%` }}
                  />
                ) : (
                  <div className="h-[2px] w-full max-w-[32px] rounded-full bg-linha-forte" />
                )}
                <Detalhe lado={ladoDo(i, r.meses.length)}>
                  <span className="block font-semibold">{nomeDoMes(m.mes)}</span>
                  {reais(m.valor)} em {plural(m.pedidos, "pedido", "pedidos")}
                  <br />
                  {plural(m.recebidas, "cotação", "cotações")}, {m.respondidas} respondidas
                </Detalhe>
              </div>
              <span className={cn("mt-2 w-full border-t border-linha pt-2 text-center text-xs", ultimo ? "font-semibold text-tinta" : "text-tinta-3")}>
                {nomeDoMes(m.mes)}
              </span>
            </div>
          );
        })}
      </div>

      <details className="group/tabela mt-4">
        <summary className="cursor-pointer select-none text-sm font-medium text-brand-texto hover:underline">Ver em tabela</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-tinta-3">
                <th className="py-1.5 pr-3 font-medium">Mês</th>
                <th className="py-1.5 pr-3 text-right font-medium">Recebidas</th>
                <th className="py-1.5 pr-3 text-right font-medium">Respondidas</th>
                <th className="py-1.5 pr-3 text-right font-medium">Pedidos</th>
                <th className="py-1.5 pr-3 text-right font-medium">Devolvido</th>
                <th className="py-1.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {[...r.meses].reverse().map((m) => (
                <tr key={m.mes} className="tabular-nums text-tinta">
                  <td className="py-2 pr-3">{nomeDoMes(m.mes)}</td>
                  <td className="py-2 pr-3 text-right">{m.recebidas}</td>
                  <td className="py-2 pr-3 text-right">{m.respondidas}</td>
                  <td className="py-2 pr-3 text-right">{m.pedidos}</td>
                  <td className="py-2 pr-3 text-right">{m.devolvido ? formatCurrency(m.devolvido) : "—"}</td>
                  <td className="py-2 text-right">{formatCurrency(m.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Bloco>
  );
}

// ─── Loja sem nada ainda ────────────────────────────────────────────────────

export function Comeco({ nomeDaLoja }: { nomeDaLoja: string }) {
  return (
    <section className="relative overflow-hidden rounded-xl bg-brand-600 px-6 py-12 text-center text-white">
      <SimboloPecaPeca mono className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 text-white/[0.07]" />
      <SimboloPecaPeca className="relative mx-auto h-14 w-14" />
      <h2 className="relative mt-4 text-xl font-bold">Os resultados da {nomeDaLoja} aparecem aqui</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-white/85">
        Assim que as primeiras cotações chegarem, esta tela mostra quanto a loja vendeu, o que mais sai, os melhores
        clientes e o que dá para melhorar.
      </p>
      <Link
        href="/loja"
        className="relative mt-6 inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
      >
        Ir para o balcão
      </Link>
    </section>
  );
}
