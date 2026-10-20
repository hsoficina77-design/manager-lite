import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lojaPeloToken } from "@/lib/balcao";
import { EnvioDoBalcaoTela } from "@/components/peca-peca/Balcao";

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
  const { nome, cidade, entregaMin, entregaMax } = loja;
  return <EnvioDoBalcaoTela token={token} envioId={envioId} loja={{ nome, cidade, entregaMin, entregaMax }} />;
}
