import { exigirPecaPeca, nomeDaOficina } from "@/lib/peca-peca";
import { ResponderCotacao } from "@/components/peca-peca/PainelLoja";
import { LOJAS, ehLoja } from "@/components/peca-peca/dados";

export default async function ResponderCotacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ l?: string }>;
}) {
  const usuario = await exigirPecaPeca();
  const [{ id }, { l }] = await Promise.all([params, searchParams]);
  return <ResponderCotacao id={id} loja={ehLoja(l) ? l : LOJAS[0].id} oficina={await nomeDaOficina(usuario)} />;
}
