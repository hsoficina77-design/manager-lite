import type { Metadata } from "next";
import { exigirContaLoja } from "@/lib/conta-loja";
import { EnvioDoBalcaoTela } from "@/components/peca-peca/Balcao";
import { CAMINHOS_DO_PAINEL } from "@/components/peca-peca/caminhos";

export const metadata: Metadata = { title: "Balcão · Peça Peça" };

export default async function EnvioNoPainelPage({ params }: { params: Promise<{ envioId: string }> }) {
  const { loja, permissoes } = await exigirContaLoja();
  const { envioId } = await params;
  return (
    <EnvioDoBalcaoTela
      caminhos={CAMINHOS_DO_PAINEL}
      envioId={envioId}
      loja={loja}
      // A tela esconde o que a pessoa não pode; quem barra de verdade é a rota.
      pode={{ responder: permissoes.includes("balcao.responder"), entrega: permissoes.includes("balcao.entrega") }}
    />
  );
}
