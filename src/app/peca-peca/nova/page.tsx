import { exigirPecaPeca } from "@/lib/peca-peca";
import { NovaCotacao } from "@/components/peca-peca/NovaCotacao";

export default async function NovaCotacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; devolucao?: string }>;
}) {
  await exigirPecaPeca();
  // Vindo de uma devolução sem troca: a cotação nova nasce com o mesmo carro e a peça.
  const { de, devolucao } = await searchParams;
  return <NovaCotacao recotar={de && devolucao ? { cotacaoId: de, devolucaoId: devolucao } : null} />;
}
