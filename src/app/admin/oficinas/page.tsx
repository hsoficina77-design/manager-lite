import { exigirPlataforma } from "@/lib/auth";
import { listarOficinas } from "@/lib/sistema";
import { ListaOficinas } from "@/components/admin/ListaOficinas";
import { ehFiltro } from "@/lib/admin";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { BotaoLink } from "@/components/ui/Botao";

export const dynamic = "force-dynamic";

export default async function AdminOficinasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  await exigirPlataforma();
  const [{ filtro }, oficinas] = await Promise.all([searchParams, listarOficinas()]);

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin
        titulo="Oficinas"
        texto="Situação e volume de uso de cada uma. Toque no nome para abrir a ficha."
        acao={
          <BotaoLink href="/admin/convites" variante="secundario">
            Convidar oficina
          </BotaoLink>
        }
      />
      <ListaOficinas oficinas={oficinas} filtroInicial={ehFiltro(filtro) ? filtro : "todas"} />
    </div>
  );
}
