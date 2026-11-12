import { exigirPlataforma } from "@/lib/auth";
import { carregarProspeccao } from "@/lib/prospeccao-banco";
import { etapaDoLead } from "@/lib/prospeccao";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { ListaLeads, type LeadDaTela } from "@/components/admin/prospeccao/ListaLeads";
import { BotaoLink } from "@/components/ui/Botao";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  await exigirPlataforma();
  const { leads, contas, lotes } = await carregarProspeccao();

  const daTela: LeadDaTela[] = leads.map((l) => ({
    id: l.id,
    loteId: l.loteId,
    publico: l.publico,
    nome: l.nome,
    categoria: l.categoria,
    telefone: l.telefone,
    tipoTelefone: l.tipoTelefone,
    temWhatsapp: l.temWhatsapp,
    bairro: l.bairro,
    cidade: l.cidade,
    nota: l.nota,
    avaliacoes: l.avaliacoes,
    pctNegativas: l.pctNegativas,
    sinaisDeDor: l.sinaisDeDor,
    createdAt: l.createdAt.toISOString(),
    etapa: etapaDoLead(l, contas.get(l.id)),
  }));

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin
        titulo="Leads"
        texto="Todas as oficinas importadas. Toque no nome para abrir a ficha, anotar e mandar mensagem."
        voltar={{ href: "/admin/prospeccao", rotulo: "Prospecção" }}
        acao={<BotaoLink href="/admin/prospeccao/importar">Importar CSV</BotaoLink>}
      />
      <ListaLeads leads={daTela} lotes={lotes.map((l) => ({ id: l.id, nome: l.nome }))} />
    </div>
  );
}
