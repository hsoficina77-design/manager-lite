import { exigirDono } from "@/lib/auth";
import AbasConfiguracoes from "@/components/AbasConfiguracoes";
import ConfiguracoesPainel from "@/components/ConfiguracoesPainel";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  // O proxy já barra o operador aqui; conferir de novo no servidor é barato e
  // garante a trava mesmo se um dia a rota sair da lista.
  await exigirDono();

  // O painel não leva padding em volta: ele controla o próprio espaçamento para a
  // barra de título poder grudar no topo de ponta a ponta. Só as abas recebem o seu.
  return (
    <>
      <div className="px-4 pt-4 sm:px-6">
        <AbasConfiguracoes />
      </div>
      <ConfiguracoesPainel />
    </>
  );
}
