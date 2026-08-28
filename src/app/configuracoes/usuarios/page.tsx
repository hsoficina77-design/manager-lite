import { exigirDono } from "@/lib/auth";
import AbasConfiguracoes from "@/components/AbasConfiguracoes";
import UsuariosPainel from "@/components/UsuariosPainel";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  await exigirDono();

  return (
    <div className="p-4 pt-6 sm:p-6">
      <AbasConfiguracoes />
      <UsuariosPainel />
    </div>
  );
}
