// Tema da marca: transforma as duas cores escolhidas no painel (primária e do menu)
// nas variáveis CSS que o Tailwind consome — `brand-*` e `menu-*`.
//
// A ideia é o administrador escolher UMA cor e o sistema derivar a escala inteira
// (50 a 950), do jeito que o Tailwind faz com as cores nativas. Assim um botão
// `bg-brand-600` com `hover:bg-brand-700` continua tendo hover mais escuro,
// qualquer que seja a cor da oficina.

// Oficina que não escolheu cor nasce nas cores do boxOS — e é nelas que ficam as telas
// de fora do sistema (login, convite), que não pertencem a oficina nenhuma.
export const COR_PRIMARIA_PADRAO = "#f2a900"; // amarelo boxOS
export const COR_MENU_PADRAO = "#1e2329"; // grafite boxOS

/** Sugestões prontas para quem não tem a cor da marca na ponta da língua. */
export const PALETA_SUGERIDA = [
  { nome: "boxOS", cor: "#f2a900" },
  { nome: "Vermelho", cor: "#dc2626" },
  { nome: "Laranja", cor: "#ea580c" },
  { nome: "Âmbar", cor: "#d97706" },
  { nome: "Verde", cor: "#16a34a" },
  { nome: "Teal", cor: "#0d9488" },
  { nome: "Azul", cor: "#2563eb" },
  { nome: "Índigo", cor: "#4f46e5" },
  { nome: "Roxo", cor: "#7c3aed" },
  { nome: "Rosa", cor: "#db2777" },
  { nome: "Grafite", cor: "#3f3f46" },
] as const;

export const MENUS_SUGERIDOS = [
  { nome: "boxOS", cor: "#1e2329" },
  { nome: "Preto", cor: "#09090b" },
  { nome: "Grafite", cor: "#27272a" },
  { nome: "Azul noite", cor: "#1e293b" },
  { nome: "Verde escuro", cor: "#14312a" },
  { nome: "Vinho", cor: "#3b0d14" },
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;

export function corValida(valor: unknown): valor is string {
  return typeof valor === "string" && HEX.test(valor.trim());
}

/** Cor utilizável ou o padrão — nunca deixa texto solto virar CSS. */
export function normalizaCor(valor: unknown, padrao: string): string {
  return corValida(valor) ? valor.trim().toLowerCase() : padrao;
}

type RGB = { r: number; g: number; b: number }; // 0-255
type HSL = { h: number; s: number; l: number }; // h 0-360, s/l 0-100

function hexParaRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbParaHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
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

const limita = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** "220 38 38" — formato que o Tailwind usa em `rgb(var(--x) / <alpha-value>)`. */
function triplo({ r, g, b }: RGB): string {
  return `${r} ${g} ${b}`;
}

// Escala do Tailwind tomada como referência: cada passo tem uma luminosidade
// canônica e um ajuste de saturação (os tons claros precisam de mais saturação
// para não lavarem em cinza; os escuros, de menos para não saturarem demais).
const ESCALA = [
  { passo: 50, l: 97, sat: 1.18 },
  { passo: 100, l: 94, sat: 1.14 },
  { passo: 200, l: 89, sat: 1.1 },
  { passo: 300, l: 82, sat: 1.05 },
  { passo: 400, l: 71, sat: 1.02 },
  { passo: 500, l: 60, sat: 1 },
  { passo: 600, l: 51, sat: 1 }, // âncora: exatamente a cor escolhida
  { passo: 700, l: 42, sat: 1 },
  { passo: 800, l: 35, sat: 0.96 },
  { passo: 900, l: 31, sat: 0.9 },
  { passo: 950, l: 18, sat: 0.84 },
] as const;

const L_ANCORA = 51;
const L_MAX = 97;
const L_MIN = 18;

// A cor escolhida vale como passo 600 mesmo que seja mais clara ou mais escura que
// o 600 canônico: os demais passos se esticam entre ela e as pontas da escala. Sem
// isso, escolher um azul escuro devolveria um azul médio no botão principal.
function luzDoPasso(lBase: number, lCanonico: number): number {
  if (lCanonico === L_ANCORA) return lBase;
  if (lCanonico > L_ANCORA) {
    const t = (lCanonico - L_ANCORA) / (L_MAX - L_ANCORA);
    return lBase + t * (Math.max(L_MAX, lBase) - lBase);
  }
  const t = (L_ANCORA - lCanonico) / (L_ANCORA - L_MIN);
  return lBase - t * (lBase - Math.min(L_MIN, lBase));
}

/** Escala completa da marca a partir de uma cor só. */
export function escalaMarca(hex: string): Record<number, string> {
  const base = rgbParaHsl(hexParaRgb(hex));
  const escala: Record<number, string> = {};
  for (const { passo, l, sat } of ESCALA) {
    escala[passo] = triplo(
      hslParaRgb({
        h: base.h,
        s: limita(base.s * sat, 0, 100),
        l: limita(luzDoPasso(base.l, l), 0, 100),
      })
    );
  }
  return escala;
}

function luminancia({ r, g, b }: RGB): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Cor de texto legível sobre a cor dada: tinta escura em fundo claro, branco no resto. */
export function corDeTexto(hex: string): string {
  return luminancia(hexParaRgb(hex)) > 0.42 ? "#18181b" : "#ffffff";
}

function contraste(a: RGB, b: RGB): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

// Superfícies contra as quais a cor da marca vira texto (link, número da OS, aba
// ativa). Precisam bater com `--superficie` em globals.css, nos dois temas.
const SUPERFICIE_CLARA: RGB = { r: 255, g: 255, b: 255 };
const SUPERFICIE_ESCURA: RGB = { r: 22, g: 29, b: 36 };
// Um pouco acima do 4,5:1 do AA: o mesmo texto também aparece sobre `brand-50`,
// que é quase — mas não exatamente — a superfície.
const CONTRASTE_TEXTO = 4.8;

/**
 * A cor da marca no tom mais próximo que ainda se lê como texto sobre a superfície:
 * escurece (tema claro) ou clareia (tema escuro) só o necessário. Vermelho e azul
 * saem quase iguais; o amarelo do boxOS vira um âmbar escuro no tema claro — como
 * texto, o amarelo puro dá 2:1 sobre branco.
 */
function corDeTextoDaMarca(hex: string, superficie: RGB, sentido: 1 | -1): RGB {
  const hsl = rgbParaHsl(hexParaRgb(hex));
  let cor = hexParaRgb(hex);
  for (let l = hsl.l; l >= 0 && l <= 100; l += sentido) {
    cor = hslParaRgb({ ...hsl, l });
    if (contraste(cor, superficie) >= CONTRASTE_TEXTO) break;
  }
  return cor;
}

function mistura(de: RGB, para: RGB, t: number): RGB {
  return {
    r: Math.round(de.r + (para.r - de.r) * t),
    g: Math.round(de.g + (para.g - de.g) * t),
    b: Math.round(de.b + (para.b - de.b) * t),
  };
}

function deslocaLuz(hex: string, delta: number): RGB {
  const hsl = rgbParaHsl(hexParaRgb(hex));
  return hslParaRgb({ ...hsl, l: limita(hsl.l + delta, 0, 100) });
}

export type CoresDoTema = { corPrimaria: string; corMenu: string };

/**
 * Variáveis CSS do tema. Devolvidas como objeto (e não string) porque o painel de
 * configurações aplica as mesmas variáveis direto no `documentElement` para a
 * pré-visualização ao vivo, antes de salvar.
 */
export function variaveisDoTema(cores: CoresDoTema): Record<string, string> {
  const primaria = normalizaCor(cores.corPrimaria, COR_PRIMARIA_PADRAO);
  const menu = normalizaCor(cores.corMenu, COR_MENU_PADRAO);

  const vars: Record<string, string> = {};
  for (const [passo, valor] of Object.entries(escalaMarca(primaria))) {
    vars[`--brand-${passo}`] = valor;
  }
  vars["--brand-fg"] = triplo(hexParaRgb(corDeTexto(primaria)));
  // As duas versões, e não `--brand-texto` direto: a prévia do painel aplica estas
  // variáveis como estilo inline, que venceria a troca de tema. Quem escolhe entre
  // as duas é globals.css, conforme o tema claro ou escuro.
  vars["--brand-texto-claro"] = triplo(corDeTextoDaMarca(primaria, SUPERFICIE_CLARA, -1));
  vars["--brand-texto-noturno"] = triplo(corDeTextoDaMarca(primaria, SUPERFICIE_ESCURA, 1));

  // O menu pode ser claro ou escuro; o contraste tem que andar para o lado certo.
  const menuRgb = hexParaRgb(menu);
  const menuEscuro = luminancia(menuRgb) <= 0.42;
  const sentido = menuEscuro ? 1 : -1;
  const menuFg = hexParaRgb(corDeTexto(menu));

  vars["--menu-bg"] = triplo(menuRgb);
  vars["--menu-fg"] = triplo(menuFg);
  vars["--menu-borda"] = triplo(deslocaLuz(menu, sentido * 12));
  vars["--menu-hover"] = triplo(deslocaLuz(menu, sentido * 16));
  vars["--menu-texto"] = triplo(mistura(menuRgb, menuFg, 0.62));

  return vars;
}

/** Bloco `:root { ... }` para injetar no `<head>`. */
export function cssDoTema(cores: CoresDoTema): string {
  const corpo = Object.entries(variaveisDoTema(cores))
    .map(([chave, valor]) => `${chave}:${valor}`)
    .join(";");
  return `:root{${corpo}}`;
}
