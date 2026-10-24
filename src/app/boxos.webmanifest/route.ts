import type { MetadataRoute } from "next";

// "Adicionar à tela inicial" nas telas do boxOS instala o boxOS — nunca com o nome e o
// ícone de uma oficina: o mesmo endereço atende todas. Qual manifesto cada tela aponta
// quem decide é o layout (`generateMetadata`); o do Peça Peça mora ao lado.
//
// Rota comum, e não o `app/manifest.ts` do Next: aquele entra em toda página e passa
// por cima do que o layout escolhe, e aqui são dois apps no mesmo endereço.

const BOXOS: MetadataRoute.Manifest = {
  // Fixo: é por ele que o navegador reconhece o app já instalado. Igual ao que ele
  // calculava sozinho a partir do start_url, para não duplicar quem já instalou.
  id: "/",
  name: "boxOS",
  short_name: "boxOS",
  description: "Gestão para oficinas mecânicas.",
  start_url: "/",
  display: "standalone",
  background_color: "#1E2329",
  theme_color: "#1E2329",
  lang: "pt-BR",
  icons: [
    { src: "/brand/favicon_180.png", sizes: "180x180", type: "image/png" },
    // O Chrome pede 192 e 512 para oferecer a instalação.
    { src: "/brand/favicon_192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/brand/favicon_512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/brand/boxOS_icone_app.svg", sizes: "any", type: "image/svg+xml" },
  ],
};

export function GET() {
  return Response.json(BOXOS, { headers: { "Content-Type": "application/manifest+json" } });
}
