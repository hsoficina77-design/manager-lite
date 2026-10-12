import { notFound } from "next/navigation";
import { exigirPlataforma } from "@/lib/auth";
import { fichaDaOficina } from "@/lib/sistema";
import { FichaOficina } from "@/components/admin/FichaOficina";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";

export const dynamic = "force-dynamic";

export default async function AdminFichaPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirPlataforma();
  const { id } = await params;
  const oficina = await fichaDaOficina(id);
  if (!oficina) notFound();

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin titulo={oficina.nome} voltar={{ href: "/admin/oficinas", rotulo: "Oficinas" }} />
      <FichaOficina oficina={oficina} />
    </div>
  );
}
