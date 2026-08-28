import { redirect } from "next/navigation";
import { getConfiguracao } from "@/lib/configuracao-db";
import { getUsuarioAtual, precisaPrimeiroAcesso } from "@/lib/auth";
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
  const config = await getConfiguracao();

  // Só caminho interno: um `next` apontando para fora viraria redirecionamento aberto,
  // que é como se monta phishing com o domínio da oficina.
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <TelaDeEntrada
      nome={config.nome}
      logoUrl={config.logoUrl}
      titulo="Entrar"
      descricao="Use o e-mail e a senha do seu acesso."
      rodape="Esqueceu a senha? Peça ao dono da oficina para definir uma nova."
    >
      <LoginForm destino={destino} />
    </TelaDeEntrada>
  );
}
