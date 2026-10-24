import type { Metadata } from "next";
import Link from "next/link";
import { lerConviteLoja } from "@/lib/conta-loja";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import { AcessoLojaForm } from "@/components/peca-peca/AcessoLojaForm";

// O link do convite (ou do "novo acesso") para o painel da loja. Público: quem chega
// ainda não tem conta, ou esqueceu a senha. O segredo é o próprio link.

export const dynamic = "force-dynamic";

// O link é um segredo: fora de buscadores e sem ir no Referer de nenhum pedido.
export const metadata: Metadata = {
  title: "Acesso à loja · Peça Peça",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const FORA_DO_AR = {
  usado: "Este link já foi usado. Se não foi você, avise quem cuida da equipe da loja.",
  vencido: "Este link venceu. Peça um novo a quem cuida da equipe da loja.",
  inexistente: "Este link não existe. Confira se ele chegou inteiro, ou peça um novo.",
} as const;

export default async function AcessoLojaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { situacao, convite } = await lerConviteLoja(token);

  if (situacao !== "valido" || !convite) {
    const motivo = situacao === "valido" ? "inexistente" : situacao;
    return (
      <TelaDeEntrada produto="peca-peca" titulo="Link indisponível" descricao={FORA_DO_AR[motivo]}>
        <Link
          href="/login"
          className="block w-full rounded-lg border border-linha-forte py-2.5 text-center text-sm font-medium text-tinta hover:bg-superficie-2"
        >
          Já tenho acesso
        </Link>
      </TelaDeEntrada>
    );
  }

  return (
    <TelaDeEntrada
      produto="peca-peca"
      titulo={convite.novoAcesso ? "Crie uma senha nova" : `Entrar na equipe da ${convite.loja}`}
      descricao={
        convite.novoAcesso
          ? `Para o seu acesso ao balcão da ${convite.loja}${convite.email ? ` (${convite.email})` : ""}.`
          : "Crie o seu acesso ao balcão da loja no Peça Peça. É com ele que você responde as cotações das oficinas."
      }
    >
      <AcessoLojaForm
        token={token}
        novoAcesso={convite.novoAcesso}
        nomeSugerido={convite.nome ?? ""}
        emailSugerido={convite.email ?? ""}
      />
    </TelaDeEntrada>
  );
}
