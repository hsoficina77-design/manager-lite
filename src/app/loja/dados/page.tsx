import type { Metadata } from "next";
import { exigirContaLoja } from "@/lib/conta-loja";
import { DadosDaLoja } from "@/components/peca-peca/DadosDaLoja";

export const metadata: Metadata = { title: "Loja · Peça Peça" };

export default async function DadosDaLojaPage() {
  const { loja } = await exigirContaLoja("loja.dados");
  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <DadosDaLoja
        inicial={{ telefone: loja.telefone, entregaMin: loja.entregaMin, entregaMax: loja.entregaMax }}
        loja={{ nome: loja.nome, cidade: loja.cidade, uf: loja.uf, atende: loja.atende }}
      />
    </div>
  );
}
