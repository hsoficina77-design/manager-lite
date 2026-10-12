import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual, precisaPrimeiroAcesso } from "@/lib/auth";
import { cadastroTesteAberto } from "@/lib/sistema";
import { DIAS_TESTE } from "@/lib/plano";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Sistema recém-instalado não tem ninguém para logar — manda criar o dono.
  if (await precisaPrimeiroAcesso()) redirect("/primeiro-acesso");
  if (await getUsuarioAtual()) redirect("/");

  const { next } = await searchParams;
  // Só caminho interno: um `next` apontando para fora viraria redirecionamento aberto,
  // que é como se monta phishing com o domínio da oficina.
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <TelaDeEntrada
      titulo="Entrar"
      descricao="Use o e-mail e a senha do seu acesso."
      rodape="Esqueceu a senha? Peça ao dono da oficina para definir uma nova."
    >
      <LoginForm destino={destino} />
      {/* Quem cai aqui sem conta (link direto, Google) precisa de um caminho para o teste. */}
      {cadastroTesteAberto() && (
        <div className="mt-5 border-t border-linha pt-5 text-center">
          <p className="text-sm text-tinta-2">Ainda não tem acesso?</p>
          <Link
            href="/teste?origem=login"
            className="mt-2 block w-full rounded-lg border border-brand-600 py-2.5 text-center text-sm font-medium text-brand-texto hover:bg-superficie-2"
          >
            Testar grátis por {DIAS_TESTE} dias
          </Link>
        </div>
      )}
    </TelaDeEntrada>
  );
}
