import { redirect } from "next/navigation";
import { getConfiguracao } from "@/lib/configuracao-db";
import { precisaPrimeiroAcesso } from "@/lib/auth";
import TelaDeEntrada from "@/components/TelaDeEntrada";
import PrimeiroAcessoForm from "@/components/PrimeiroAcessoForm";

export const dynamic = "force-dynamic";

export default async function PrimeiroAcessoPage() {
  // Existindo qualquer usuário, esta tela some para sempre — é o que impede alguém de
  // chegar aqui num sistema em uso e criar um acesso de dono para si.
  if (!(await precisaPrimeiroAcesso())) redirect("/login");

  const config = await getConfiguracao();

  return (
    <TelaDeEntrada
      nome={config.nome}
      logoUrl={config.logoUrl}
      titulo="Primeiro acesso"
      descricao="Crie o acesso de dono. Depois você cadastra a equipe por dentro do sistema."
      rodape="Guarde bem esta senha: sem outro dono cadastrado, não há como redefini-la pela tela."
    >
      <PrimeiroAcessoForm />
    </TelaDeEntrada>
  );
}
