import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lojaPeloToken } from "@/lib/balcao";
import { CaixaDoBalcaoTela } from "@/components/peca-peca/Balcao";
import { BalcaoComLogin } from "@/components/peca-peca/BalcaoComLogin";

// Balcão antigo, por link secreto — da época em que a loja não tinha conta. Vale até a
// loja ter a primeira pessoa com login; depois, manda entrar no painel da loja.

// O link é o segredo da loja: fora de buscadores e sem ir no Referer de nenhum pedido.
export const metadata: Metadata = {
  title: "Balcão · Peça Peça",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function BalcaoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const loja = await lojaPeloToken(token);
  if (!loja) notFound();
  if (loja.comLogin) return <BalcaoComLogin />;
  const { nome, cidade, entregaMin, entregaMax } = loja;
  return (
    <CaixaDoBalcaoTela
      caminhos={{ inicio: `/balcao/${token}`, telas: `/balcao/${token}`, api: `/api/balcao/${token}`, comCabecalho: true }}
      loja={{ nome, cidade, entregaMin, entregaMax }}
    />
  );
}
