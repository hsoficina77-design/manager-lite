import type { Metadata } from "next";
import { exigirPecaPeca } from "@/lib/peca-peca";
import { CaixaDeConversas } from "@/components/peca-peca/CaixaDeConversas";

export const metadata: Metadata = { title: "Conversas · Peça Peça" };

export default async function ConversasDaOficinaPage() {
  await exigirPecaPeca();
  return <CaixaDeConversas api="/api/peca-peca/conversas" pushApi="/api/peca-peca/push" eu="OFICINA" />;
}
