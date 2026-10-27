// Marca do Peça Peça — o produto de cotação nas autopeças, irmão do boxOS.
//
// Desenho copiado do pacote de identidade ("Peça Peça Identidade", símbolo E, "duas
// porcas conversando"): a porca-balão azul é o pedido, a porca verde atrás é a resposta.
// O respiro entre as duas e o furo da porca são recortes (máscara), não tinta da cor do
// fundo: assim o símbolo serve no menu claro, no escuro e sobre o azul do ícone sem
// escolher entre arquivos. Arquivos estáticos em `public/brand-pecapeca/`; a paleta na
// tela, no bloco `data-produto="peca-peca"` de globals.css.

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Azul Peça: principal — símbolo, botões, ícone do app, barra do navegador. */
export const AZUL_PECA_PECA = "#2563EB";
/** Verde Chegou: destaque — resposta, oferta aceita, peça a caminho. Nunca texto no branco. */
export const VERDE_PECA_PECA = "#A3E635";
/** Azul Noite: textos, nome da marca e fundos escuros. */
export const AZUL_NOITE_PECA_PECA = "#0B1F4D";

// Coordenadas do pacote (viewBox 120 × 120).
const PORCA_VERDE = "M44 42L60 14.3L92 14.3L108 42L92 69.7L104 82L76 69.7L60 69.7Z";
const PORCA_BALAO = "M10 66L29 33.1L67 33.1L86 66L67 98.9L48 98.9L18 113L29 98.9Z";
// O furo vai no mesmo caminho da porca (evenodd). O traço de 6 que arredonda os cantos
// também passa no furo, então o raio aqui é 17 para o furo aparecer com os 14 do pacote.
const FURO = "M65 66a17 17 0 1 0-34 0a17 17 0 1 0 34 0Z";

function Desenho({ azul, verde }: { azul: string; verde: string }) {
  // Um id por desenho: com o mesmo id, um símbolo escondido (display: none) levaria a
  // máscara dos outros junto.
  const recorte = `recorte-pp-${useId()}`;
  return (
    <>
      <mask id={recorte} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
        <rect width="120" height="120" fill="#FFFFFF" />
        {/* O contorno de 16 da porca-balão: o respiro que a separa da verde. */}
        <path d={PORCA_BALAO} fill="#000000" stroke="#000000" strokeWidth="16" strokeLinejoin="round" />
      </mask>
      <g strokeLinejoin="round" strokeWidth="6">
        <path d={PORCA_VERDE} fill={verde} stroke={verde} mask={`url(#${recorte})`} />
        <path d={PORCA_BALAO + FURO} fillRule="evenodd" fill={azul} stroke={azul} />
      </g>
    </>
  );
}

/**
 * Só o símbolo, nas cores da marca. `mono` pinta as duas porcas com `currentColor` — as
 * versões em uma cor do pacote (preto no branco, branco no azul).
 */
export function SimboloPecaPeca({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    // viewBox justo no desenho (o do pacote tem respiro), para alinhar com o texto ao lado.
    <svg viewBox="7 11 104 105" aria-hidden className={cn("shrink-0", className)}>
      <Desenho azul={mono ? "currentColor" : AZUL_PECA_PECA} verde={mono ? "currentColor" : VERDE_PECA_PECA} />
    </svg>
  );
}

/** Ícone de app: a porca-balão branca e a verde sobre o quadrado azul arredondado. */
export function IconePecaPeca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Peça Peça" className={cn("shrink-0", className)}>
      <rect width="64" height="64" rx="14" fill={AZUL_PECA_PECA} />
      {/* O símbolo ocupa 70% do lado, como no pacote. */}
      <g transform="translate(9.6 9.6) scale(0.37333) translate(1 -3.5)">
        <Desenho azul="#FFFFFF" verde={VERDE_PECA_PECA} />
      </g>
    </svg>
  );
}

/**
 * Símbolo + "Peça Peça" em Baloo 2 ExtraBold. O primeiro "Peça" é azul (um tom mais claro
 * no tema escuro, `--pp-nome`); o segundo segue `currentColor`, que é o Azul Noite na tela
 * do Peça Peça e vira claro no escuro. Tudo em `em`, como a logo do boxOS: o tamanho do
 * texto no `className` define o tamanho da logo inteira.
 */
export function LogoPecaPeca({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Peça Peça"
      className={cn("inline-flex shrink-0 items-center gap-[0.36em] leading-none", className)}
    >
      {/* Largura explícita (104/105 da altura): `w-auto` em SVG inline cai em 300px em
          alguns navegadores. */}
      <SimboloPecaPeca className="h-[1.3em] w-[1.29em]" />
      <span aria-hidden className="whitespace-nowrap font-pecapeca font-extrabold tracking-[-0.02em]">
        <span className="text-pp-nome">Peça</span> Peça
      </span>
    </span>
  );
}
