// Cor da oficina nos documentos que ela emite (OS, orçamento, comprovante).
//
// É o único lugar onde a oficina escolhe cor: o sistema em si é sempre laranja boxOS
// (globals.css). Nos documentos a cor marca o filete do cabeçalho e o número, ao lado
// da logo da oficina. Arquivo puro, sem Prisma — os PDFs e a tela usam os mesmos derivados.

import type { CSSProperties } from "react";

export const COR_DOCUMENTO_PADRAO = "#f2a900"; // laranja boxOS

/** Sugestões prontas para quem não tem a cor da marca na ponta da língua. */
export const PALETA_DOCUMENTO = [
  { nome: "boxOS", cor: "#f2a900" },
  { nome: "Vermelho", cor: "#dc2626" },
  { nome: "Laranja", cor: "#ea580c" },
  { nome: "Verde", cor: "#16a34a" },
  { nome: "Teal", cor: "#0d9488" },
  { nome: "Azul", cor: "#2563eb" },
  { nome: "Índigo", cor: "#4f46e5" },
  { nome: "Roxo", cor: "#7c3aed" },
  { nome: "Rosa", cor: "#db2777" },
  { nome: "Grafite", cor: "#3f3f46" },
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function corValida(valor: unknown): valor is string {
  return typeof valor === "string" && HEX.test(valor.trim());
}

/** Cor utilizável ou o padrão — nunca deixa texto solto virar CSS. */
export function normalizaCor(valor: unknown): string {
  return corValida(valor) ? valor.trim().toLowerCase() : COR_DOCUMENTO_PADRAO;
}

type RGB = { r: number; g: number; b: number }; // 0-255
type HSL = { h: number; s: number; l: number }; // h 0-360, s/l 0-100

function hexParaRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbParaHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function rgbParaHsl({ r, g, b }: RGB): HSL {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslParaRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0]
    : h < 120 ? [x, c, 0]
    : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c]
    : h < 300 ? [x, 0, c]
    : [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function luminancia({ r, g, b }: RGB): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: RGB, b: RGB): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

// O papel é branco; na tela, no tema escuro, a folha fica na `--superficie` escura.
const PAPEL: RGB = { r: 255, g: 255, b: 255 };
const FOLHA_ESCURA: RGB = { r: 22, g: 29, b: 36 };
// Um pouco acima do 4,5:1 do AA, para o número da OS ler bem em qualquer cor.
const CONTRASTE_TEXTO = 4.8;

/**
 * A cor no tom mais próximo que ainda se lê como texto sobre o fundo: escurece
 * (papel) ou clareia (folha escura) só o necessário. Vermelho e azul saem quase
 * iguais; o laranja boxOS vira um âmbar escuro — puro, ele dá 2:1 sobre branco.
 */
function comoTexto(hex: string, fundo: RGB, sentido: 1 | -1): RGB {
  const hsl = rgbParaHsl(hexParaRgb(hex));
  let cor = hexParaRgb(hex);
  for (let l = hsl.l; l >= 0 && l <= 100; l += sentido) {
    cor = hslParaRgb({ ...hsl, l });
    if (contraste(cor, fundo) >= CONTRASTE_TEXTO) break;
  }
  return cor;
}

/** A cor do documento como texto sobre o papel branco — o número da OS no PDF. */
export function corDeTextoNoPapel(hex: string): string {
  return rgbParaHex(comoTexto(normalizaCor(hex), PAPEL, -1));
}

const triplo = ({ r, g, b }: RGB) => `${r} ${g} ${b}`;

/**
 * Variáveis da folha do documento na tela, para o `style` do elemento com a classe
 * `documento`. Quem escolhe entre a versão clara e a noturna do texto é globals.css,
 * conforme o tema.
 */
export function estiloDoDocumento(hex: string | null | undefined): CSSProperties {
  const cor = normalizaCor(hex);
  return {
    "--doc-cor": triplo(hexParaRgb(cor)),
    "--doc-texto-claro": triplo(comoTexto(cor, PAPEL, -1)),
    "--doc-texto-noturno": triplo(comoTexto(cor, FOLHA_ESCURA, 1)),
  } as CSSProperties;
}
