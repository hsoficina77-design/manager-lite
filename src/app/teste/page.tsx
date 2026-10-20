import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth";
import { cadastroTesteAberto } from "@/lib/sistema";
import { DIAS_TESTE } from "@/lib/plano";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import CadastroOficinaForm from "@/components/CadastroOficinaForm";

// Teste grátis — o destino do link da bio do Instagram. Pública: quem chega ainda
// não tem conta. O `?origem=` do link vai junto no cadastro, para o painel da
// plataforma mostrar de onde cada oficina veio.

export const dynamic = "force-dynamic";

const TITULO = `Teste o boxOS grátis por ${DIAS_TESTE} dias`;
const DESCRICAO = "OS, orçamentos e caixa da sua oficina mecânica, direto do celular. Sem cartão de crédito.";

// Prévia do link no WhatsApp e no Instagram. Sem `APP_URL` a imagem sairia com
// endereço relativo, que os apps de mensagem não abrem.
export const metadata: Metadata = {
  title: `${TITULO} · boxOS`,
  description: DESCRICAO,
  ...(process.env.APP_URL ? { metadataBase: new URL(process.env.APP_URL) } : {}),
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    siteName: "boxOS",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/brand/favicon_512.png", width: 512, height: 512, alt: "boxOS" }],
  },
};

const BENEFICIOS = [
  "Ordem de serviço e orçamento com PDF na sua marca",
  "Clientes, veículos e histórico em um lugar só",
  "Caixa, contas a receber e controle de gastos",
];

export default async function TestePage({
  searchParams,
}: {
  searchParams: Promise<{ origem?: string }>;
}) {
  if (await getUsuarioAtual()) redirect("/");

  if (!cadastroTesteAberto()) {
    return (
      <TelaDeEntrada
        titulo="Cadastros pausados"
        descricao="No momento não estamos abrindo novos testes. Tente de novo em breve."
      >
        <Link
          href="/login"
          className="block w-full rounded-lg bg-brand-600 py-2.5 text-center text-sm font-medium text-brand-fg hover:bg-brand-700"
        >
          Já tenho acesso
        </Link>
      </TelaDeEntrada>
    );
  }

  const { origem } = await searchParams;

  return (
    <TelaDeEntrada
      titulo={TITULO}
      descricao="Sem cartão de crédito. Crie o acesso da sua oficina e comece agora."
      rodape={
        <>
          Já tem acesso?{" "}
          <Link href="/login" className="font-medium text-brand-texto hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <ul className="mb-5 space-y-1.5 text-sm text-tinta-2">
        {BENEFICIOS.map((b) => (
          <li key={b} className="flex gap-2">
            <span aria-hidden="true" className="text-brand-texto">
              ✓
            </span>
            {b}
          </li>
        ))}
      </ul>
      <p className="mb-5 rounded-lg bg-superficie-2 px-3 py-2 text-xs text-tinta-3">
        Depois dos {DIAS_TESTE} dias, nada é apagado: você continua vendo tudo o que registrou e decide se quer assinar.
      </p>
      <CadastroOficinaForm teste={{ origem: origem?.slice(0, 40) ?? null }} />
    </TelaDeEntrada>
  );
}
