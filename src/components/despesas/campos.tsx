"use client";

// Peças de formulário do controle de gastos. Existem por um motivo prático: são quatro
// modais e uma lista, e sem isto a mesma linha de classes do Tailwind apareceria umas
// quarenta vezes — que foi como a tela antiga acabou difícil de mexer.

import { cn } from "@/lib/utils";

const BASE_CAMPO =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-zinc-50 disabled:text-zinc-400";

export function Campo({
  rotulo,
  ajuda,
  className,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-zinc-500">{rotulo}</span>
      {children}
      {ajuda && <span className="mt-1 block text-xs text-zinc-400">{ajuda}</span>}
    </label>
  );
}

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function Selecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(BASE_CAMPO, "bg-white", props.className)} />;
}

export function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(BASE_CAMPO, "resize-y", props.className)} />;
}

/** Campo de dinheiro: teclado numérico do Android e casas decimais. */
export function EntradaValor(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Entrada type="number" inputMode="decimal" min="0.01" step="0.01" {...props} />;
}

export function Botao({
  variante = "primario",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "perigo" | "sucesso";
}) {
  const estilos = {
    primario: "bg-brand-600 text-brand-fg hover:bg-brand-700 border-transparent",
    secundario: "border-zinc-300 text-zinc-700 hover:bg-zinc-50 bg-white",
    // Vermelho é literal neste app: perigo e dinheiro ruim, nunca identidade.
    perigo: "border-red-200 text-red-600 hover:bg-red-50 bg-white",
    sucesso: "bg-green-600 text-white hover:bg-green-700 border-transparent",
  }[variante];

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        estilos,
        className
      )}
    />
  );
}

/**
 * Casca dos modais.
 *
 * `items-start` + `overflow-y-auto` no fundo e `my-auto` no cartão são a convenção
 * daqui: no Android o teclado encolhe a viewport, e um modal centrado sem scroll
 * esconde o botão de salvar sem deixar como chegar nele.
 */
export function Modal({
  titulo,
  descricao,
  largura = "max-w-md",
  onFechar,
  children,
}: {
  titulo: string;
  descricao?: string;
  largura?: string;
  onFechar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        className={cn(
          "my-auto w-full rounded-2xl bg-white shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto",
          largura
        )}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-zinc-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900">{titulo}</h3>
            {descricao && <p className="mt-0.5 text-xs text-zinc-500">{descricao}</p>}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Aviso({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
      {children}
    </p>
  );
}

/** Chip da categoria — a cor é a que o dono escolheu, então vem por style. */
export function ChipCategoria({ nome, cor }: { nome: string; cor: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${cor}1a`, color: cor }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} />
      {nome}
    </span>
  );
}
