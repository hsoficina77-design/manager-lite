import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { getContaLojaAtual } from "@/lib/conta-loja";
import { cadastroPecaPecaAberto } from "@/lib/sistema";
import { linkWhatsappBoxOS } from "@/lib/plano";
import { urlPecaPeca } from "@/lib/produto";
import { LogoPecaPeca } from "@/components/marca/LogoPecaPeca";

// A porta de entrada do Peça Peça: o "/" do endereço dele para quem ainda não entrou
// (o proxy reescreve para cá). Pública e curta — o que é, como funciona, criar conta.
//
// No endereço do boxOS é também onde abre o Peça Peça instalado (pecapeca.webmanifest):
// quem já entrou segue direto para a sua tela, como no "/" do endereço próprio.

export const dynamic = "force-dynamic";

const TITULO = "Cote peças em várias autopeças de uma vez";
const DESCRICAO =
  "Mande a lista de peças do carro. As autopeças da sua região respondem marca, preço e prazo. Você escolhe e faz o pedido.";

const enderecoPublico = urlPecaPeca();

export const metadata: Metadata = {
  title: "Peça Peça · cotação de peças nas autopeças da região",
  description: DESCRICAO,
  ...(enderecoPublico ? { metadataBase: new URL(enderecoPublico) } : {}),
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    siteName: "Peça Peça",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand-pecapeca/favicon_512.png", width: 512, height: 512, alt: "Peça Peça" }],
  },
};

const PASSOS = [
  { titulo: "Mande a lista", texto: "Carro e peças, do celular. Vai para todas as lojas da região de uma vez." },
  { titulo: "As lojas respondem", texto: "Cada balconista manda marca, preço e prazo. Você vê tudo lado a lado." },
  { titulo: "Escolha e peça", texto: "Pode misturar lojas. O pedido sai daqui e você acompanha a entrega." },
];

export default async function BemVindoPage() {
  if (await getUsuarioAtual()) redirect("/peca-peca");
  if (await getContaLojaAtual()) redirect("/loja");

  const contato = linkWhatsappBoxOS("Olá! Tenho uma autopeça e quero receber cotações pelo Peça Peça.");

  return (
    <div className="min-h-[100dvh] bg-fundo px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-md">
        <div className="flex justify-center text-tinta">
          <LogoPecaPeca className="text-3xl" />
        </div>

        <h1 className="mt-8 text-center text-2xl font-bold text-tinta">{TITULO}</h1>
        <p className="mt-2 text-center text-sm text-tinta-2">Grátis para a sua oficina.</p>

        <ol className="mt-8 space-y-3">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="flex gap-3 rounded-xl border border-linha bg-superficie p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-brand-fg">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-tinta">{p.titulo}</p>
                <p className="mt-0.5 text-sm text-tinta-2">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-2">
          {cadastroPecaPecaAberto() && (
            <Link
              href="/cadastro?origem=bem-vindo"
              className="block w-full rounded-lg bg-brand-600 py-3 text-center text-base font-semibold text-brand-fg hover:bg-brand-700"
            >
              Criar conta grátis
            </Link>
          )}
          <Link
            href="/login"
            className="block w-full rounded-lg border border-linha-forte bg-superficie py-3 text-center text-base font-medium text-tinta hover:bg-superficie-2"
          >
            Já tenho conta
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-tinta-3">
          É de autopeça e quer receber as cotações?{" "}
          {contato ? (
            <a href={contato} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-texto underline">
              Fale com a gente
            </a>
          ) : (
            "Fale com a gente."
          )}
        </p>
      </div>
    </div>
  );
}
