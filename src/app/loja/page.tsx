import type { Metadata } from "next";
import { exigirContaLoja } from "@/lib/conta-loja";
import { CaixaDoBalcaoTela } from "@/components/peca-peca/Balcao";
import { CAMINHOS_DO_PAINEL } from "@/components/peca-peca/caminhos";

export const metadata: Metadata = { title: "Balcão · Peça Peça" };

// O balcão no painel da loja, com login: a caixa de entrada que todo mundo da loja vê.
export default async function BalcaoDaLojaPage() {
  const { loja } = await exigirContaLoja();
  return <CaixaDoBalcaoTela caminhos={CAMINHOS_DO_PAINEL} loja={loja} />;
}
