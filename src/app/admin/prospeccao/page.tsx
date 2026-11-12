import { exigirPlataforma } from "@/lib/auth";
import { carregarProspeccao, urlsDoBoxOS } from "@/lib/prospeccao-banco";
import { PRIMEIRAS_POR_DIA, etapaDoLead, funilDaProspeccao, tarefasDoDia, type Etapa } from "@/lib/prospeccao";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";
import { TarefasDoDia, type TarefaComLead } from "@/components/admin/prospeccao/TarefasDoDia";
import { BotaoLink } from "@/components/ui/Botao";
import { FaixaMetricas, Metrica, Secao, Vazio } from "@/components/ui/Dados";

export const dynamic = "force-dynamic";

// `dia()` de admin/comum é de componente de cliente: aqui, no servidor, a data sai daqui.
const dia = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);

export default async function ProspeccaoPage() {
  await exigirPlataforma();
  const { leads, contas, cumpridas, lotes } = await carregarProspeccao();

  const acoes = (
    <div className="flex flex-wrap gap-2">
      <BotaoLink href="/admin/prospeccao/leads" variante="secundario">
        Ver todos os leads
      </BotaoLink>
      <BotaoLink href="/admin/prospeccao/importar">Importar CSV</BotaoLink>
    </div>
  );

  if (leads.length === 0) {
    return (
      <div className="space-y-6 p-4 pt-6 sm:p-6">
        <CabecalhoAdmin titulo="Prospecção" texto="Oficinas do Google Maps abordadas pelo WhatsApp." />
        <Vazio
          titulo="Nenhum lead ainda"
          texto="Importe o CSV do scraper de Google Maps. Os duplicados, os telefones e as categorias são tratados na hora, e você confere tudo antes de gravar."
          acao={<BotaoLink href="/admin/prospeccao/importar">Importar CSV</BotaoLink>}
        />
      </div>
    );
  }

  const etapaPorLead = new Map<string, Etapa>(leads.map((l) => [l.id, etapaDoLead(l, contas.get(l.id))]));
  const funil = funilDaProspeccao(leads.filter((l) => l.publico === "OFICINA").map((l) => etapaPorLead.get(l.id)!));

  const { tarefas, primeirasHoje, primeirasNaFila } = tarefasDoDia(leads, contas, cumpridas, urlsDoBoxOS());
  const porId = new Map(leads.map((l) => [l.id, l]));
  const comLead: TarefaComLead[] = tarefas.map((t) => {
    const l = porId.get(t.leadId)!;
    return {
      ...t,
      lead: {
        nome: l.nome,
        bairro: l.bairro,
        cidade: l.cidade,
        telefone: l.telefone,
        tipoTelefone: l.tipoTelefone,
        temWhatsapp: l.temWhatsapp,
        abreSeg: l.abreSeg,
      },
    };
  });

  // Por lote: quantos viraram conversa e cadastro — é o que diz qual busca rende.
  const porLote = lotes.map((lote) => {
    const doLote = leads.filter((l) => l.loteId === lote.id);
    const etapas = doLote.map((l) => etapaPorLead.get(l.id)!);
    return {
      ...lote,
      leads: doLote.length,
      abordados: etapas.filter((e) => !["NOVO", "NAO_CONTATAR", "JA_CLIENTE"].includes(e)).length,
      cadastraram: etapas.filter((e) => ["CADASTROU", "ATIVOU", "VENCEU", "ASSINOU"].includes(e)).length,
    };
  });

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin
        titulo="Prospecção"
        texto="O que mandar hoje, e para quem. Toque em Abrir no WhatsApp, envie e marque Enviei."
        acao={acoes}
      />

      <FaixaMetricas colunas={6}>
        {funil.map((f, i) => (
          <Metrica
            key={f.rotulo}
            rotulo={f.rotulo}
            valor={String(f.valor)}
            sub={i > 0 && funil[i - 1].valor > 0 ? `${Math.round((f.valor / funil[i - 1].valor) * 100)}% da etapa anterior` : undefined}
          />
        ))}
      </FaixaMetricas>

      <TarefasDoDia
        tarefas={comLead}
        primeirasHoje={primeirasHoje}
        primeirasNaFila={primeirasNaFila}
        limite={PRIMEIRAS_POR_DIA}
      />

      {porLote.length > 0 && (
        <Secao titulo="Lotes importados" ajuda="Cada CSV é um lote: compare qual busca e qual cidade rendem mais cadastro.">
          <div className="overflow-x-auto rounded-xl border border-linha bg-superficie">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-xs text-tinta-3">
                <tr className="border-b border-linha">
                  <th className="px-4 py-2 font-medium">Lote</th>
                  <th className="px-4 py-2 font-medium">Importado em</th>
                  <th className="px-4 py-2 text-right font-medium">Leads</th>
                  <th className="px-4 py-2 text-right font-medium">Abordados</th>
                  <th className="px-4 py-2 text-right font-medium">Cadastraram</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {porLote.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5 font-medium text-tinta">{l.nome}</td>
                    <td className="px-4 py-2.5 text-tinta-3">{dia(l.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{l.leads}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{l.abordados}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{l.cadastraram}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}
    </div>
  );
}
