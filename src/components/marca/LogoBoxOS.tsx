// Marca do sistema (boxOS). A logo da oficina só aparece nos documentos que ela emite;
// menu, telas de entrada, aba do navegador e ícone do app são sempre boxOS.
//
// Desenho copiado do pacote de identidade (boxOS_logo_pacote_v3, pasta svg/). A moldura
// e o anel são sempre amarelos; as hastes e o "box" seguem `currentColor`. Assim a mesma
// logo vira a versão "fundo escuro" num menu escuro e a versão principal num menu claro,
// sem precisar escolher entre dois arquivos.

import { cn } from "@/lib/utils";

export const AMARELO_BOXOS = "#F2A900";
export const GRAFITE_BOXOS = "#1E2329";

/** O elevador de box, nas coordenadas originais do pacote (72 × 60). */
function Desenho({ corHastes }: { corHastes: string }) {
  return (
    <>
      <path
        d="M2 54 V11 Q2 3 10 3 H62 Q70 3 70 11 V54 L63 58 V10 H9 V58 Z"
        fill={AMARELO_BOXOS}
      />
      <g fill={corHastes}>
        <rect x="15" y="18" width="4.5" height="38" />
        <rect x="52.5" y="18" width="4.5" height="38" />
        <rect x="13.5" y="16" width="7.5" height="3.5" rx="1" />
        <rect x="51" y="16" width="7.5" height="3.5" rx="1" />
        <rect x="12.5" y="54.5" width="9.5" height="3.5" rx="1" />
        <rect x="50" y="54.5" width="9.5" height="3.5" rx="1" />
        <rect x="19" y="38" width="9" height="3.8" rx="1" />
        <rect x="44" y="38" width="9" height="3.8" rx="1" />
        <rect x="24.2" y="35" width="4" height="5.5" rx="0.8" />
        <rect x="43.8" y="35" width="4" height="5.5" rx="0.8" />
      </g>
      <circle cx="36" cy="27.3" r="8.5" fill="none" stroke={AMARELO_BOXOS} strokeWidth="6" />
    </>
  );
}

/** Só o símbolo. O tamanho vem do `className` (`h-8 w-8`, por exemplo). */
export function SimboloBoxOS({ className }: { className?: string }) {
  return (
    // viewBox justo no desenho — o do pacote tem respiro que desalinharia o símbolo
    // do texto ao lado.
    <svg viewBox="1 2 70 57" aria-hidden className={cn("shrink-0", className)}>
      <Desenho corHastes="currentColor" />
    </svg>
  );
}

/** Ícone de app: o símbolo sobre o quadrado grafite arredondado. */
export function IconeBoxOS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="boxOS" className={cn("shrink-0", className)}>
      <rect width="64" height="64" rx="14" fill={GRAFITE_BOXOS} />
      <g transform="translate(9.3 11.5) scale(0.63)">
        <Desenho corHastes="#FFFFFF" />
      </g>
    </svg>
  );
}

/**
 * Símbolo + "boxOS". Tudo em `em`: o tamanho do texto no `className` (`text-xl`,
 * `text-3xl`...) define o tamanho da logo inteira, mantendo a proporção do pacote.
 */
export function LogoBoxOS({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="boxOS"
      className={cn("inline-flex shrink-0 items-center gap-[0.25em] leading-none", className)}
    >
      {/* Largura explícita (70/57 da altura): `w-auto` em SVG inline cai em 300px
          em alguns navegadores. */}
      <SimboloBoxOS className="h-[1.15em] w-[1.41em]" />
      <span aria-hidden className="font-marca font-bold tracking-[-0.01em]">
        box<span style={{ color: AMARELO_BOXOS }}>OS</span>
      </span>
    </span>
  );
}
