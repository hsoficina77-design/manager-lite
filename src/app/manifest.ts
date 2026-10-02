import type { MetadataRoute } from "next";

// "Adicionar à tela inicial" instala o app com nome e ícone do boxOS — nunca os de uma
// oficina: o mesmo endereço atende todas, e o manifesto é o mesmo para qualquer uma.
export default function manifest(): MetadataRoute.Manifest {
  return {
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
      { src: "/brand/favicon_512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/boxOS_icone_app.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
