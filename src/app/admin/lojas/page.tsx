import { exigirPlataforma } from "@/lib/auth";
import { lojasDoPainel } from "@/lib/balcao";
import { urlPecaPeca } from "@/lib/produto";
import { Lojas } from "@/components/admin/Lojas";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";

export const dynamic = "force-dynamic";

export default async function AdminLojasPage() {
  await exigirPlataforma();
  const lojas = await lojasDoPainel();

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin
        titulo="Lojas do Peça Peça"
        texto="As autopeças que recebem cotação. Cada oficina vê as lojas que atendem a cidade dela."
      />
      <Lojas lojas={lojas} enderecoPecaPeca={urlPecaPeca() || null} />
    </div>
  );
}
