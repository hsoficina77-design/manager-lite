"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Botão do sistema.
 *
 * Duas regras que a interface não seguia:
 *
 * 1. Alvo de toque. Trinta e quatro botões usavam `px-2.5 py-1.5 text-xs`, que dá
 *    cerca de 30 px — e eram justamente os de dinheiro: Receber, Pagar, Estornar,
 *    Excluir. Aqui o mínimo é 44 px no celular; o tamanho `denso` encolhe só a
 *    partir de `sm`, onde existe mouse.
 *
 * 2. Ação destrutiva nunca é sólida. Numa oficina de identidade vermelha, um
 *    "Excluir" preenchido fica igual a "Nova OS". Perigo é sempre contornado.
 */

const VARIANTES = {
  primario: "border-transparent bg-brand-600 text-brand-fg hover:bg-brand-700",
  secundario: "border-linha-forte bg-superficie text-tinta-2 hover:bg-superficie-2",
  contraste: "border-transparent bg-contraste text-contraste-fg hover:opacity-90",
  sucesso: "border-transparent bg-ok text-ok-fg hover:opacity-90",
  perigo: "border-perigo-linha bg-superficie text-perigo hover:bg-perigo-fraco",
  fantasma: "border-transparent bg-transparent text-tinta-2 hover:bg-superficie-2",
} as const;

const TAMANHOS = {
  // Padrão: confortável no dedo em qualquer tela.
  normal: "min-h-11 px-4 py-2 text-sm",
  // Denso: 44 px no celular, 36 px onde há mouse. Para linhas de lista.
  denso: "min-h-11 px-3 py-2 text-sm sm:min-h-9 sm:px-2.5 sm:py-1.5 sm:text-xs",
  // Ícone quadrado.
  icone: "h-11 w-11 p-0 sm:h-9 sm:w-9",
} as const;

export type VarianteBotao = keyof typeof VARIANTES;
export type TamanhoBotao = keyof typeof TAMANHOS;

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

export function classesBotao(
  variante: VarianteBotao = "primario",
  tamanho: TamanhoBotao = "normal",
  className?: string
) {
  return cn(BASE, VARIANTES[variante], TAMANHOS[tamanho], className);
}

export function Botao({
  variante = "primario",
  tamanho = "normal",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
}) {
  return <button {...props} className={classesBotao(variante, tamanho, className)} />;
}

/** Mesma aparência do botão, para quando a ação é navegar. */
export function BotaoLink({
  variante = "primario",
  tamanho = "normal",
  className,
  ...props
}: React.ComponentProps<typeof Link> & {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
}) {
  return <Link {...props} className={classesBotao(variante, tamanho, className)} />;
}
