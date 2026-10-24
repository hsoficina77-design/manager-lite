// Marca do Peça Peça — o produto de cotação nas autopeças, irmão do boxOS.
//
// Identidade PROVISÓRIA: a porca sextavada (o ícone `PecaPeca` do menu) sobre um azul
// próprio, para não se confundir com o laranja do boxOS. Quando chegar o pacote de
// identidade, troca-se aqui, em `public/brand-pecapeca/` e na escala `--brand-*` do
// bloco `data-produto="peca-peca"` de globals.css.

import { cn } from "@/lib/utils";

/** Azul do Peça Peça (ícone, barra do navegador, manifesto). */
export const AZUL_PECA_PECA = "#2563EB";
/** O mesmo azul um tom acima, para o nome ler bem também sobre o fundo escuro. */
const AZUL_DO_NOME = "#3B82F6";

/** Ícone de app: a porca branca sobre o quadrado azul arredondado. */
export function IconePecaPeca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Peça Peça" className={cn("shrink-0", className)}>
      <rect width="64" height="64" rx="14" fill={AZUL_PECA_PECA} />
      <g
        transform="translate(8 8) scale(2)"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.1"
        strokeLinejoin="round"
      >
        <path d="M12 2.5 20.2 7.25v9.5L12 21.5l-8.2-4.75v-9.5Z" />
        <circle cx="12" cy="12" r="3.6" />
      </g>
    </svg>
  );
}

/**
 * Ícone + "PeçaPeça". Tudo em `em`, como a logo do boxOS: o tamanho do texto no
 * `className` define o tamanho da logo inteira.
 */
export function LogoPecaPeca({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Peça Peça"
      className={cn("inline-flex shrink-0 items-center gap-[0.3em] leading-none", className)}
    >
      <IconePecaPeca className="h-[1.25em] w-[1.25em]" />
      <span aria-hidden className="font-marca font-bold tracking-[-0.01em]">
        Peça<span style={{ color: AZUL_DO_NOME }}>Peça</span>
      </span>
    </span>
  );
}
