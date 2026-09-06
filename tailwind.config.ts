import type { Config } from "tailwindcss";

const marca = (passo: string) => `rgb(var(--brand-${passo}) / <alpha-value>)`;
const cor = (nome: string) => `rgb(var(--${nome}) / <alpha-value>)`;

const config: Config = {
  // O tema escuro é resolvido por variáveis CSS em globals.css, não pela variante
  // `dark:` do Tailwind — assim nenhum componente precisa declarar duas cores.
  // O seletor fica aqui só para plugins que perguntem por ele.
  darkMode: ["class", '[data-tema="escuro"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // `src/lib` também: é lá que ficam as tabelas de domínio que devolvem classe
    // pronta — `corStatus` e `corMargem`, por exemplo. Sem esta linha o Tailwind
    // não enxerga `status-peca` em lugar nenhum e remove a pílula do CSS, e o
    // status da OS sai sem cor de fundo.
    "./src/lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Cor da oficina, escolhida no painel de configurações. As variáveis são
        // escritas pelo layout raiz a partir do banco (ver src/lib/tema.ts) — o
        // fallback em globals.css mantém o vermelho original se nada for definido.
        brand: {
          50: marca("50"),
          100: marca("100"),
          200: marca("200"),
          300: marca("300"),
          400: marca("400"),
          500: marca("500"),
          600: marca("600"),
          700: marca("700"),
          800: marca("800"),
          900: marca("900"),
          950: marca("950"),
          DEFAULT: marca("600"),
          // Texto legível sobre a cor da marca (branco ou tinta escura).
          fg: "rgb(var(--brand-fg) / <alpha-value>)",
        },
        // Menu lateral — cor de fundo própria, também configurável.
        menu: {
          DEFAULT: cor("menu-bg"),
          fg: cor("menu-fg"),
          texto: cor("menu-texto"),
          borda: cor("menu-borda"),
          hover: cor("menu-hover"),
        },

        // --- neutros semânticos ------------------------------------------------
        // Trocam de valor no tema escuro sem que o componente saiba disso.
        fundo: cor("fundo"),
        superficie: {
          DEFAULT: cor("superficie"),
          2: cor("superficie-2"),
          3: cor("superficie-3"),
        },
        tinta: {
          DEFAULT: cor("tinta"),
          2: cor("tinta-2"),
          3: cor("tinta-3"),
        },
        linha: {
          DEFAULT: cor("linha"),
          forte: cor("linha-forte"),
        },
        contraste: {
          DEFAULT: cor("contraste"),
          fg: cor("contraste-fg"),
        },

        // --- semáforo ----------------------------------------------------------
        // Independentes da marca de propósito: uma oficina de identidade vermelha
        // não pode ter "Excluir" com a mesma cor de "Nova OS".
        ok: {
          DEFAULT: cor("ok"),
          fraco: cor("ok-fraco"),
          linha: cor("ok-linha"),
          fg: cor("ok-fg"),
        },
        atencao: {
          DEFAULT: cor("atencao"),
          fraco: cor("atencao-fraco"),
          linha: cor("atencao-linha"),
          fg: cor("atencao-fg"),
        },
        perigo: {
          DEFAULT: cor("perigo"),
          fraco: cor("perigo-fraco"),
          linha: cor("perigo-linha"),
          fg: cor("perigo-fg"),
        },
      },
      spacing: {
        // Altura da barra de navegação inferior do celular, usada pelo respiro
        // que as telas reservam para não terminar embaixo dela.
        "barra-inferior": "3.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
