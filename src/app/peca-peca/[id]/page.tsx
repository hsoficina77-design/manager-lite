import { exigirPecaPeca } from "@/lib/peca-peca";
import { DetalheCotacao } from "@/components/peca-peca/DetalheCotacao";

export default async function CotacaoPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirPecaPeca();
  const { id } = await params;
  return <DetalheCotacao id={id} />;
}
