import { exigirPecaPeca } from "@/lib/peca-peca";
import { NovaCotacao } from "@/components/peca-peca/NovaCotacao";

export default async function NovaCotacaoPage() {
  await exigirPecaPeca();
  return <NovaCotacao />;
}
