import { exigirPlataforma } from "@/lib/auth";
import { listarConvites } from "@/lib/sistema";
import { Convites } from "@/components/admin/Convites";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";

export const dynamic = "force-dynamic";

export default async function AdminConvitesPage() {
  await exigirPlataforma();
  const convites = await listarConvites();

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin titulo="Convites" texto="Oficinas que entram por convite não passam pelo teste: já nascem sem prazo." />
      <Convites convites={convites} />
    </div>
  );
}
