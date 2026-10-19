import { exigirPecaPeca } from "@/lib/peca-peca";
import { ListaCotacoes } from "@/components/peca-peca/ListaCotacoes";

export default async function PecaPecaPage() {
  await exigirPecaPeca();
  return <ListaCotacoes />;
}
