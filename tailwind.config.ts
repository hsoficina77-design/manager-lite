import type { Config } from "tailwindcss";

const marca = (passo: string) => `rgb(var(--brand-${passo}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
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
          DEFAULT: "rgb(var(--menu-bg) / <alpha-value>)",
          fg: "rgb(var(--menu-fg) / <alpha-value>)",
          texto: "rgb(var(--menu-texto) / <alpha-value>)",
          borda: "rgb(var(--menu-borda) / <alpha-value>)",
          hover: "rgb(var(--menu-hover) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
