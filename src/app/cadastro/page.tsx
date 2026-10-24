import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { cadastroPecaPecaAberto } from "@/lib/sistema";
import { urlPecaPeca } from "@/lib/produto";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import CadastroOficinaForm from "@/components/CadastroOficinaForm";

// Conta grátis do Peça Peça — pública: quem chega ainda não tem conta. O `?origem=`
// vai junto no cadastro, para o painel da plataforma mostrar de onde cada oficina veio.

export const dynamic = "force-dynamic";

const TITULO = "Cote peças em várias autopeças de uma vez";
const DESCRICAO = "Grátis para a sua oficina: mande a lista, as lojas da região respondem preço e prazo, você escolhe.";

const enderecoPublico = urlPecaPeca();

export const metadata: Metadata = {
  title: "Criar conta · Peça Peça",
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

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ origem?: string }>;
}) {
  if (await getUsuarioAtual()) redirect("/peca-peca");

  if (!cadastroPecaPecaAberto()) {
    return (
      <TelaDeEntrada
        produto="peca-peca"
        titulo="Cadastros pausados"
        descricao="No momento não estamos abrindo contas novas. Tente de novo em breve."
      >
        <Link
          href="/login"
          className="block w-full rounded-lg bg-brand-600 py-2.5 text-center text-sm font-medium text-brand-fg hover:bg-brand-700"
        >
          Já tenho conta
        </Link>
      </TelaDeEntrada>
    );
  }

  const { origem } = await searchParams;

  return (
    <TelaDeEntrada
      produto="peca-peca"
      titulo="Crie a conta da sua oficina"
      descricao="Grátis. Em seguida você já manda a primeira cotação."
      rodape={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-brand-texto hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <CadastroOficinaForm pecaPeca={{ origem: origem?.slice(0, 40) ?? null }} />
    </TelaDeEntrada>
  );
}
