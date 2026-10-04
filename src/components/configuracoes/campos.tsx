"use client";

// Peças visuais compartilhadas pelas seções do painel. Ficam aqui para uma seção
// nova nascer com a mesma cara das outras sem copiar classe de Tailwind.

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm text-tinta " +
  "placeholder:text-tinta-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

/** Cartão branco que agrupa campos. Título é opcional: a seção já se apresenta no topo. */
export function Cartao({
  titulo,
  ajuda,
  children,
  className,
}: {
  titulo?: string;
  ajuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-linha bg-superficie p-4 sm:p-5", className)}>
      {titulo && (
        <div className="mb-4">
          <h3 className="font-semibold text-tinta">{titulo}</h3>
          {ajuda && <p className="mt-0.5 text-xs text-tinta-3">{ajuda}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Grade de campos: uma coluna no celular, seis colunas fracionáveis no computador. */
export function Grade({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-6">{children}</div>;
}

/**
 * Rótulo + campo + ajuda. O `<label>` embrulha o input, então tocar no texto
 * já foca o campo — o alvo de toque no celular fica bem maior que o input sozinho.
 */
export function Campo({
  label,
  ajuda,
  colunas = 6,
  obrigatorio,
  children,
}: {
  label: string;
  ajuda?: string;
  /** Quantas das 6 colunas ocupar em telas médias para cima. */
  colunas?: 2 | 3 | 4 | 6;
  obrigatorio?: boolean;
  children: ReactNode;
}) {
  const span = {
    2: "sm:col-span-2",
    3: "sm:col-span-3",
    4: "sm:col-span-4",
    6: "sm:col-span-6",
  }[colunas];

  return (
    <div className={span}>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-tinta-2">
          {label}
          {obrigatorio && <span className="text-brand-texto"> *</span>}
        </span>
        {children}
      </label>
      {ajuda && <p className="mt-1 text-xs text-tinta-3">{ajuda}</p>}
    </div>
  );
}

/** Ícone de traço no padrão do menu lateral — 24x24, herda a cor do texto. */
export function Icone({ children, tamanho = 18 }: { children: ReactNode; tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}
