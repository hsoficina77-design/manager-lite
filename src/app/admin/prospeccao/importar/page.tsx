import { exigirPlataforma } from "@/lib/auth";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { ImportarCsv } from "@/components/admin/prospeccao/ImportarCsv";

export default async function ImportarProspeccaoPage() {
  await exigirPlataforma();
  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin
        titulo="Importar CSV"
        texto="Oficinas do scraper de Google Maps. Telefones, endereços e duplicatas são tratados na hora."
        voltar={{ href: "/admin/prospeccao", rotulo: "Prospecção" }}
      />
      <ImportarCsv />
    </div>
  );
}
