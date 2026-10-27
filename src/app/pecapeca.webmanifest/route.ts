import type { MetadataRoute } from "next";
import { produtoDaRequisicao } from "@/lib/produto-servidor";
import { AZUL_PECA_PECA } from "@/components/marca/LogoPecaPeca";

// "Adicionar à tela inicial" nas telas do Peça Peça instala o Peça Peça: outro nome,
// outro ícone, outro app no celular — também enquanto ele mora no endereço do boxOS.
//
// No endereço próprio, é o app "/" de lá. No do boxOS, o "/" já é o boxOS, e o
// navegador reconhece o app pelo `id`: o do Peça Peça precisa ser outro, senão o
// navegador o tomaria pelo boxOS já instalado (e trocaria o ícone de quem tem o boxOS).
// Abre pelas boas-vindas, que levam cada um à sua tela: oficina às cotações, loja ao
// balcão, quem não entrou à apresentação.
//
// Lê o host (o proxy não passa nos manifestos): cada endereço recebe o seu.
export async function GET() {
  const inicio = (await produtoDaRequisicao()) === "peca-peca" ? "/" : "/bem-vindo";
  const manifesto: MetadataRoute.Manifest = {
    id: inicio,
    name: "Peça Peça",
    short_name: "Peça Peça",
    description: "Cotação de peças nas autopeças da região.",
    start_url: inicio,
    // O endereço inteiro: login, balcão e cotações abrem dentro do app, sem barra.
    scope: "/",
    display: "standalone",
    background_color: AZUL_PECA_PECA,
    theme_color: AZUL_PECA_PECA,
    lang: "pt-BR",
    icons: [
      { src: "/brand-pecapeca/favicon_180.png", sizes: "180x180", type: "image/png" },
      { src: "/brand-pecapeca/favicon_192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand-pecapeca/favicon_512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android recorta o ícone no formato do aparelho (círculo, gota...): este é o
      // quadrado azul cheio, com o símbolo dentro da área que nenhum recorte alcança.
      // Sem ele, o quadrado arredondado iria encolhido sobre um círculo branco.
      { src: "/brand-pecapeca/icone_maskable_512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand-pecapeca/pecapeca_icone_app.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
  return Response.json(manifesto, { headers: { "Content-Type": "application/manifest+json" } });
}
