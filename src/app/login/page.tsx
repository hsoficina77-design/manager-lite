import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual, precisaPrimeiroAcesso } from "@/lib/auth";
import { getContaLojaAtual } from "@/lib/conta-loja";
import { cadastroPecaPecaAberto, cadastroTesteAberto } from "@/lib/sistema";
import { DIAS_TESTE } from "@/lib/plano";
import { produtoDaRequisicao } from "@/lib/produto-servidor";
import { loginDoPecaPeca } from "@/lib/produto";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

const linkSecundario =
  "mt-2 block w-full rounded-lg border border-brand-600 py-2.5 text-center text-sm font-medium text-brand-texto hover:bg-superficie-2";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // No endereço do boxOS o login é um só: quem vem de uma tela do Peça Peça vê o dele.
  const pecaPeca = (await produtoDaRequisicao()) === "peca-peca" || loginDoPecaPeca(next);

  // Sistema recém-instalado não tem ninguém para logar — manda criar o dono.
  if (await precisaPrimeiroAcesso()) redirect("/primeiro-acesso");
  if (await getUsuarioAtual()) redirect(pecaPeca ? "/bem-vindo" : "/");
  if (await getContaLojaAtual()) redirect("/loja");

  // Só caminho interno: um `next` apontando para fora viraria redirecionamento aberto,
  // que é como se monta phishing com o domínio da oficina.
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (pecaPeca) {
    return (
      <TelaDeEntrada
        produto="peca-peca"
        titulo="Entrar"
        descricao="Oficina ou autopeça: use o e-mail e a senha do seu acesso."
        rodape="Esqueceu a senha? Na autopeça, quem cuida da equipe gera um novo acesso para você."
      >
        <LoginForm destino={destino} />
        {cadastroPecaPecaAberto() && (
          <div className="mt-5 border-t border-linha pt-5 text-center">
            <p className="text-sm text-tinta-2">Tem oficina e ainda não tem conta?</p>
            <Link href="/cadastro?origem=login" className={linkSecundario}>
              Criar conta grátis
            </Link>
          </div>
        )}
      </TelaDeEntrada>
    );
  }

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
          <Link href="/teste?origem=login" className={linkSecundario}>
            Testar grátis por {DIAS_TESTE} dias
          </Link>
        </div>
      )}
    </TelaDeEntrada>
  );
}
