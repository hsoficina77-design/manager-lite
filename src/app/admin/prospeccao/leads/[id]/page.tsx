import { notFound } from "next/navigation";
import { exigirPlataforma } from "@/lib/auth";
import { fichaDoLead, urlsDoBoxOS } from "@/lib/prospeccao-banco";
import { etapaDoLead, tarefasDoDia } from "@/lib/prospeccao";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { FichaLead } from "@/components/admin/prospeccao/FichaLead";

export const dynamic = "force-dynamic";

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);

export default async function FichaLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await exigirPlataforma();
  const { id } = await params;
  const ficha = await fichaDoLead(id);
  if (!ficha) notFound();
  const { lead, conta, cumpridas, paraVincular } = ficha;
  const { interacoes, lote, updatedAt: _atualizado, ...dados } = lead;

  // A tarefa de hoje para este lead, se houver — a mesma regra da lista do dia.
  const { tarefas } = tarefasDoDia(
    [lead],
    conta ? new Map([[lead.id, conta]]) : new Map(),
    new Map([[lead.id, cumpridas]]),
    urlsDoBoxOS()
  );

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin titulo={lead.nome} voltar={{ href: "/admin/prospeccao/leads", rotulo: "Leads" }} />
      <FichaLead
        lead={{
          ...dados,
          ultimoContato: iso(lead.ultimoContato),
          createdAt: lead.createdAt.toISOString(),
          lote: lote ? { nome: lote.nome } : null,
        }}
        etapa={etapaDoLead(lead, conta)}
        conta={
          conta
            ? {
                ...conta,
                criadaEm: iso(conta.criadaEm)!,
                testeAte: iso(conta.testeAte),
                pagoAte: iso(conta.pagoAte),
                ultimoAcesso: iso(conta.ultimoAcesso),
              }
            : null
        }
        tarefa={tarefas[0] ?? null}
        interacoes={interacoes.map((i) => ({
          id: i.id,
          tipo: i.tipo,
          regra: i.regra,
          texto: i.texto,
          createdAt: i.createdAt.toISOString(),
        }))}
        paraVincular={paraVincular}
      />
    </div>
  );
}
