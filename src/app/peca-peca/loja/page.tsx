import { exigirPecaPeca, nomeDaOficina } from "@/lib/peca-peca";
import { PainelLoja } from "@/components/peca-peca/PainelLoja";
import { LOJAS, ehLoja } from "@/components/peca-peca/dados";

export default async function PainelLojaPage({ searchParams }: { searchParams: Promise<{ l?: string }> }) {
  const usuario = await exigirPecaPeca();
  const { l } = await searchParams;
  return <PainelLoja loja={ehLoja(l) ? l : LOJAS[0].id} oficina={await nomeDaOficina(usuario)} />;
}
