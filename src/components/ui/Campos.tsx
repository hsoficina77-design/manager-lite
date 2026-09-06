"use client";

import { useEffect, useId, useState } from "react";
import { cn, formatarValorBR, paraNumero } from "@/lib/utils";

export const BASE_CAMPO =
  "w-full rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm text-tinta placeholder:text-tinta-3 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-superficie-2 disabled:text-tinta-3";

export function Campo({
  rotulo,
  ajuda,
  erro,
  obrigatorio,
  className,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  erro?: string;
  obrigatorio?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-tinta-2">
        {rotulo}
        {obrigatorio && <span className="ml-0.5 text-perigo">*</span>}
      </span>
      {children}
      {erro ? (
        <span className="mt-1 block text-xs text-perigo">{erro}</span>
      ) : (
        ajuda && <span className="mt-1 block text-xs text-tinta-3">{ajuda}</span>
      )}
    </label>
  );
}

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function Selecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(BASE_CAMPO, props.className)} />;
}

export function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(BASE_CAMPO, "resize-y", props.className)} />;
}

/**
 * Campo de dinheiro.
 *
 * Substitui os dezenove `type="number"` que recusavam a vírgula decimal. Aqui o
 * campo é texto — então aceita `1.250,50`, `1250,50` e `1250.50` — e o valor que
 * sai para o formulário é sempre canônico com ponto, para o `Number()` de quem
 * chama continuar valendo.
 *
 * `inputMode="decimal"` mantém o teclado numérico do Android, e ao sair do campo
 * o texto é reescrito no formato brasileiro para a pessoa conferir o que ficou.
 */
export function CampoDinheiro({
  valor,
  onChange,
  onEnter,
  className,
  id,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  /** Valor canônico, com ponto decimal. String vazia = campo em branco. */
  valor: string;
  onChange: (canonico: string) => void;
  onEnter?: () => void;
}) {
  const gerado = useId();
  const campoId = id ?? gerado;
  const [texto, setTexto] = useState(() => (valor === "" ? "" : formatarValorBR(paraNumero(valor))));
  const [focado, setFocado] = useState(false);

  // Enquanto o campo não está em foco, ele reflete o valor de fora — é assim que
  // "aplicar desconto" ou reabrir um modal mostram o número certo.
  useEffect(() => {
    if (focado) return;
    setTexto(valor === "" ? "" : formatarValorBR(paraNumero(valor)));
  }, [valor, focado]);

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-tinta-3"
      >
        R$
      </span>
      <input
        {...props}
        id={campoId}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        onFocus={(e) => {
          setFocado(true);
          props.onFocus?.(e);
        }}
        onChange={(e) => {
          // Só o que pode compor um valor. Impede letra e símbolo colados sem
          // recusar o que a pessoa está no meio de digitar.
          const bruto = e.target.value.replace(/[^\d.,]/g, "");
          setTexto(bruto);
          onChange(bruto === "" ? "" : String(paraNumero(bruto)));
        }}
        onBlur={(e) => {
          setFocado(false);
          const n = paraNumero(texto);
          setTexto(texto.trim() === "" ? "" : formatarValorBR(n));
          props.onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
          props.onKeyDown?.(e);
        }}
        className={cn(BASE_CAMPO, "pl-9 text-right tabular-nums", className)}
      />
    </div>
  );
}

/**
 * Quantidade — mesmo problema do campo de dinheiro, sem o "R$".
 *
 * Meia hora de mão de obra se escreve `0,5` aqui, e `type="number"` recusava a
 * vírgula do mesmo jeito.
 */
export function CampoQuantidade({
  valor,
  onChange,
  onEnter,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  valor: string;
  onChange: (canonico: string) => void;
  onEnter?: () => void;
}) {
  const [texto, setTexto] = useState(() => valor.replace(".", ","));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (focado) return;
    setTexto(valor.replace(".", ","));
  }, [valor, focado]);

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={texto}
      onFocus={(e) => {
        setFocado(true);
        props.onFocus?.(e);
      }}
      onChange={(e) => {
        const bruto = e.target.value.replace(/[^\d.,]/g, "");
        setTexto(bruto);
        onChange(bruto === "" ? "" : String(paraNumero(bruto)));
      }}
      onBlur={(e) => {
        setFocado(false);
        setTexto(texto.trim() === "" ? "" : String(paraNumero(texto)).replace(".", ","));
        props.onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
        props.onKeyDown?.(e);
      }}
      className={cn(BASE_CAMPO, "text-right tabular-nums", className)}
    />
  );
}

export function Aviso({ children, tipo = "erro" }: { children: React.ReactNode; tipo?: "erro" | "atencao" }) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        tipo === "erro"
          ? "border-perigo-linha bg-perigo-fraco text-perigo"
          : "border-atencao-linha bg-atencao-fraco text-atencao"
      )}
    >
      {children}
    </p>
  );
}
