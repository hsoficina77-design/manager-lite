import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lojaPeloToken } from "@/lib/balcao";
import { EnvioDoBalcaoTela } from "@/components/peca-peca/Balcao";
import { BalcaoComLogin } from "@/components/peca-peca/BalcaoComLogin";

export const metadata: Metadata = {
  title: "Balcão · Peça Peça",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function EnvioDoBalcaoPage({
  params,
}: {
  params: Promise<{ token: string; envioId: string }>;
}) {
  const { token, envioId } = await params;
  const loja = await lojaPeloToken(token);
  if (!loja) notFound();
  if (loja.comLogin) return <BalcaoComLogin />;
  const { nome, cidade, entregaMedia } = loja;
  return (
    <EnvioDoBalcaoTela
      caminhos={{ inicio: `/balcao/${token}`, telas: `/balcao/${token}`, api: `/api/balcao/${token}`, comCabecalho: true }}
      envioId={envioId}
      loja={{ nome, cidade, entregaMedia }}
      // O link antigo era o balcão inteiro: responder e entregar.
      pode={{ responder: true, entrega: true }}
    />
  );
}
