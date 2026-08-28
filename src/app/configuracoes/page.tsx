import { exigirDono } from "@/lib/auth";
import AbasConfiguracoes from "@/components/AbasConfiguracoes";
import ConfiguracoesPainel from "@/components/ConfiguracoesPainel";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  // O proxy já barra o operador aqui; conferir de novo no servidor é barato e
  // garante a trava mesmo se um dia a rota sair da lista.
  await exigirDono();

  return (
    <div className="p-4 pt-6 sm:p-6">
      <AbasConfiguracoes />
      <ConfiguracoesPainel />
    </div>
  );
}
