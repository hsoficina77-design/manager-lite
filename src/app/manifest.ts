import type { MetadataRoute } from "next";
import { produtoDaRequisicao } from "@/lib/produto-servidor";
import { AZUL_PECA_PECA } from "@/components/marca/LogoPecaPeca";

// "Adicionar à tela inicial" instala o app com nome e ícone do produto do endereço —
// boxOS ou Peça Peça —, nunca os de uma oficina: o mesmo endereço atende todas.
//
// Lê o host (o proxy não passa no manifesto), e por isso deixa de ser estático: cada
// endereço recebe o seu.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  if ((await produtoDaRequisicao()) === "peca-peca") {
    return {
      id: "/",
      name: "Peça Peça",
      short_name: "Peça Peça",
      description: "Cotação de peças nas autopeças da região.",
      start_url: "/",
      display: "standalone",
      background_color: AZUL_PECA_PECA,
      theme_color: AZUL_PECA_PECA,
      lang: "pt-BR",
      icons: [
        { src: "/brand-pecapeca/favicon_180.png", sizes: "180x180", type: "image/png" },
        { src: "/brand-pecapeca/favicon_192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/brand-pecapeca/favicon_512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/brand-pecapeca/pecapeca_icone_app.svg", sizes: "any", type: "image/svg+xml" },
      ],
    };
  }

  return {
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
}
