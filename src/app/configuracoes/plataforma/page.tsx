import { redirect } from "next/navigation";
import { exigirDono } from "@/lib/auth";
import AbasConfiguracoes from "@/components/AbasConfiguracoes";
import PlataformaPainel from "@/components/PlataformaPainel";

export const dynamic = "force-dynamic";

export default async function PlataformaPage() {
  const usuario = await exigirDono();
  // Ser dono de uma oficina não basta: esta tela é de quem administra o sistema.
  if (!usuario.administraPlataforma) redirect("/configuracoes");

  return (
    <div className="p-4 pt-6 sm:p-6">
      <AbasConfiguracoes />
      <PlataformaPainel oficinaAtual={usuario.oficinaId} />
    </div>
  );
}
