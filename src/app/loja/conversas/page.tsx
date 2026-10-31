import type { Metadata } from "next";
import { exigirContaLoja } from "@/lib/conta-loja";
import { CaixaDeConversas } from "@/components/peca-peca/CaixaDeConversas";

export const metadata: Metadata = { title: "Conversas · Peça Peça" };

// As conversas da loja com as oficinas. Ler é de todo mundo do balcão, como as cotações.
export default async function ConversasDaLojaPage() {
  await exigirContaLoja();
  return <CaixaDeConversas api="/api/loja/conversas" pushApi="/api/loja/push" eu="LOJA" />;
}
