"use client";

// Peças visuais compartilhadas pelas seções do painel. Ficam aqui para uma seção
// nova nascer com a mesma cara das outras sem copiar classe de Tailwind.

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { corValida } from "@/lib/tema";

export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

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
    <section className={cn("rounded-xl border border-zinc-200 bg-white p-4 sm:p-5", className)}>
      {titulo && (
        <div className="mb-4">
          <h3 className="font-semibold text-zinc-800">{titulo}</h3>
          {ajuda && <p className="mt-0.5 text-xs text-zinc-500">{ajuda}</p>}
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
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          {label}
          {obrigatorio && <span className="text-brand-600"> *</span>}
        </span>
        {children}
      </label>
      {ajuda && <p className="mt-1 text-xs text-zinc-500">{ajuda}</p>}
    </div>
  );
}

/** Campo de cor: amostra clicável, hex digitável e atalhos prontos. */
export function SeletorDeCor({
  titulo,
  ajuda,
  valor,
  padrao,
  sugestoes,
  onChange,
}: {
  titulo: string;
  ajuda: string;
  valor: string;
  padrao: string;
  sugestoes: readonly { nome: string; cor: string }[];
  onChange: (cor: string) => void;
}) {
  // O campo de texto guarda o que está sendo digitado; só cor válida vira tema.
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-medium text-zinc-700">{titulo}</span>
        <span className="text-xs text-zinc-500">{ajuda}</span>
        {valor.toLowerCase() !== padrao && (
          <button
            type="button"
            onClick={() => onChange(padrao)}
            className="ml-auto text-xs text-zinc-400 underline hover:text-zinc-600"
          >
            Restaurar padrão
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          aria-label={titulo}
          className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
        />
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (corValida(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setTexto(valor)}
          spellCheck={false}
          aria-label={`${titulo} em hexadecimal`}
          className={cn(inputCls, "w-28 font-mono uppercase")}
        />
        <div className="flex flex-wrap gap-1.5">
          {sugestoes.map((s) => (
            <button
              key={s.cor}
              type="button"
              title={s.nome}
              aria-label={s.nome}
              onClick={() => onChange(s.cor)}
              style={{ backgroundColor: s.cor }}
              className={cn(
                "h-8 w-8 rounded-full border transition-transform hover:scale-110",
                valor.toLowerCase() === s.cor
                  ? "border-zinc-900 ring-2 ring-zinc-300"
                  : "border-zinc-200"
              )}
            />
          ))}
        </div>
      </div>
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
