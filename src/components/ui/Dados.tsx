"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Blocos de leitura.

   Duas correções vivem aqui.

   A primeira é de repetição: existiam nove componentes diferentes desenhando o
   mesmo cartão de número — StatCard, SummaryCard, MetricCard, dois Metric, dois
   Metrica, Cartao e Mini. Como eram cópias, já tinham divergido: uns em
   `text-2xl`, outros em `text-lg`, um com numeral tabular e o resto sem.

   A segunda é de hierarquia: toda região da tela era o mesmo cartão branco com
   borda. Borda, raio e fundo dizem "objeto separado", e gastá-los em tudo anula
   os três. Agora um grupo de números é UM objeto com divisórias internas, não
   cinco cartões idênticos empilhados; a moldura fica para o que de fato é uma
   unidade à parte.
   ========================================================================== */

export type TomMetrica = "neutro" | "ok" | "atencao" | "perigo";

const TOM_TEXTO: Record<TomMetrica, string> = {
  neutro: "text-tinta",
  ok: "text-ok",
  atencao: "text-atencao",
  perigo: "text-perigo",
};

/** Um número com rótulo. Sem moldura própria — quem molda é o container. */
export function Metrica({
  rotulo,
  valor,
  sub,
  tom = "neutro",
  tamanho = "normal",
  title,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  tom?: TomMetrica;
  tamanho?: "normal" | "grande";
  title?: string;
}) {
  return (
    <div className="min-w-0" title={title}>
      <p className="truncate text-xs text-tinta-3">{rotulo}</p>
      <p
        className={cn(
          "mt-0.5 font-bold tabular-nums",
          tamanho === "grande" ? "text-2xl" : "text-base",
          TOM_TEXTO[tom]
        )}
      >
        {valor}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-tinta-3">{sub}</p>}
    </div>
  );
}

/**
 * Faixa de números: uma superfície só, dividida por filetes.
 *
 * É o que substitui as fileiras de cartões repetidos no dashboard, em contas a
 * receber, no caixa, na produtividade e no controle de gastos.
 */
export function FaixaMetricas({
  colunas = 4,
  className,
  children,
}: {
  colunas?: 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
}) {
  const grade = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }[colunas];

  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-xl border border-linha bg-superficie",
        "divide-x divide-y divide-linha [&>*]:p-4",
        grade,
        className
      )}
    >
      {children}
    </div>
  );
}

/** Métrica que leva a algum lugar. Mesmo desenho, com estado de toque. */
export function MetricaLink({
  href,
  ...props
}: React.ComponentProps<typeof Metrica> & { href: string }) {
  return (
    <Link href={href} className="block min-w-0 transition-colors hover:bg-superficie-2">
      <Metrica {...props} />
    </Link>
  );
}

/**
 * Superfície de conteúdo — o cartão de verdade, para o que é mesmo uma unidade
 * separada: um formulário, uma lista, um painel de ferramenta.
 */
export function Painel({
  titulo,
  ajuda,
  acao,
  className,
  children,
}: {
  titulo?: string;
  ajuda?: string;
  acao?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-linha bg-superficie p-4 sm:p-5", className)}>
      {(titulo || acao) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {titulo && <h2 className="font-semibold text-tinta">{titulo}</h2>}
            {ajuda && <p className="mt-0.5 text-xs text-tinta-3">{ajuda}</p>}
          </div>
          {acao && <div className="shrink-0">{acao}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Cabeçalho de seção sobre o fundo da página — sem moldura. */
export function Secao({
  titulo,
  ajuda,
  acao,
  children,
}: {
  titulo: string;
  ajuda?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-tinta">{titulo}</h2>
          {ajuda && <p className="text-xs text-tinta-3">{ajuda}</p>}
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
      {children}
    </section>
  );
}

/**
 * Estado vazio com saída.
 *
 * O controle de gastos já fazia certo: explica e oferece o botão. Todos os
 * outros eram uma linha cinza e nada mais, então as primeiras telas de uma
 * oficina recém-instalada eram becos sem ação.
 */
export function Vazio({
  titulo,
  texto,
  acao,
  compacto,
}: {
  titulo: string;
  texto?: string;
  acao?: React.ReactNode;
  compacto?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-linha-forte bg-superficie px-6 text-center",
        compacto ? "py-8" : "py-12"
      )}
    >
      <p className="font-medium text-tinta-2">{titulo}</p>
      {texto && <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-3">{texto}</p>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

/* --- carregamento --------------------------------------------------------- */

/** Bloco cinza que reserva a altura do que está por vir. */
export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn("esqueleto", className)} aria-hidden="true" />;
}

/** Lista em carregamento: mesma altura de linha do conteúdo real, para a tela
 *  não saltar quando os dados chegam. */
export function EsqueletoLista({ linhas = 5 }: { linhas?: number }) {
  return (
    <div
      className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie"
      role="status"
      aria-label="Carregando"
    >
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Esqueleto className="h-8 w-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Esqueleto className="h-3.5 w-1/3" />
            <Esqueleto className="h-3 w-2/3" />
          </div>
          <Esqueleto className="h-6 w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoFaixa({ colunas = 4 }: { colunas?: 2 | 3 | 4 | 5 | 6 }) {
  return (
    <FaixaMetricas colunas={colunas}>
      {Array.from({ length: colunas }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Esqueleto className="h-3 w-16" />
          <Esqueleto className="h-6 w-24" />
        </div>
      ))}
    </FaixaMetricas>
  );
}
