import { exigirPlataforma } from "@/lib/auth";
import { listarOficinas } from "@/lib/sistema";
import { resumoDaPlataforma, DIAS_ATIVA } from "@/lib/admin";
import { FaixaMetricas, MetricaLink, Metrica, Painel } from "@/components/ui/Dados";
import { Barras } from "@/components/admin/Barras";
import { Atencao } from "@/components/admin/Atencao";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";
const diaMes = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit" }).format(new Date(iso));

function pct(parte: number, todo: number) {
  return todo ? `${Math.round((parte / todo) * 100)}%` : "—";
}

export default async function AdminPage() {
  await exigirPlataforma();
  const oficinas = await listarOficinas();
  const r = resumoDaPlataforma(oficinas);

  const barrasSemana = r.porSemana.map((s, i) => ({
    rotulo: diaMes(s.inicio),
    valor: s.valor,
    dica: `${i === r.porSemana.length - 1 ? "Esta semana" : `Semana de ${diaMes(s.inicio)}`}: ${s.valor} cadastro${s.valor === 1 ? "" : "s"}`,
  }));
  const topoFunil = r.funil[0].valor;

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin titulo="Visão geral" texto="Como as oficinas estão usando o boxOS. Só a casca — os dados de cada oficina são só dela." />

      <div className="space-y-3">
        <FaixaMetricas colunas={5}>
          <MetricaLink href="/admin/oficinas" rotulo="Oficinas" valor={String(r.total)} sub={r.suspensas ? `${r.suspensas} suspensa${r.suspensas === 1 ? "" : "s"}` : "nenhuma suspensa"} tamanho="grande" />
          <MetricaLink href="/admin/oficinas?filtro=teste" rotulo="Em teste" valor={String(r.porSituacao.TESTE)} tom="atencao" tamanho="grande" />
          <MetricaLink href="/admin/oficinas?filtro=assinantes" rotulo="Assinantes" valor={String(r.porSituacao.ASSINANTE)} tom="ok" tamanho="grande" />
          <MetricaLink href="/admin/oficinas?filtro=encerradas" rotulo="Só consulta" valor={String(r.porSituacao.SOMENTE_LEITURA)} tom={r.porSituacao.SOMENTE_LEITURA ? "perigo" : "neutro"} tamanho="grande" />
          <MetricaLink href="/admin/oficinas?filtro=sem-prazo" rotulo="Sem prazo" valor={String(r.porSituacao.LIBERADA)} sub="convite ou cortesia" tamanho="grande" />
        </FaixaMetricas>
        <FaixaMetricas colunas={4}>
          <Metrica rotulo="Novas em 7 dias" valor={String(r.novas7d)} />
          <Metrica rotulo="Novas em 30 dias" valor={String(r.novas30d)} />
          <Metrica rotulo={`Entraram em ${DIAS_ATIVA} dias`} valor={String(r.ativas7d)} sub={`de ${r.total - r.suspensas} ativas`} />
          <Metrica rotulo="Abriram OS em 30 dias" valor={String(r.usandoOs30d)} sub={`de ${r.total - r.suspensas} ativas`} />
        </FaixaMetricas>
      </div>

      <Painel titulo="Precisa de atenção" ajuda="Teste acabando, oficinas paradas e quem caiu em só consulta — bom momento para um contato.">
        <Atencao itens={r.atencao} />
      </Painel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Cadastros por semana" ajuda="Oficinas novas nas últimas 12 semanas, por link ou convite.">
          <Barras barras={barrasSemana} rotuloAcessivel="Cadastros de oficinas por semana" />
        </Painel>

        <Painel titulo="Funil do link da bio" ajuda="Só quem se cadastrou sozinho pelo teste grátis.">
          {topoFunil === 0 ? (
            <p className="text-sm text-tinta-3">Ninguém se cadastrou pelo link ainda.</p>
          ) : (
            <ol className="space-y-3">
              {r.funil.map((etapa, i) => (
                <li key={etapa.rotulo}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-tinta-2">{etapa.rotulo}</span>
                    <span className="tabular-nums font-semibold text-tinta">
                      {etapa.valor}
                      {i > 0 && <span className="ml-1.5 text-xs font-normal text-tinta-3">{pct(etapa.valor, topoFunil)}</span>}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-superficie-3">
                    <div
                      className="h-2 rounded-full bg-brand-600"
                      style={{ width: `${Math.max(etapa.valor ? 2 : 0, (etapa.valor / topoFunil) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}

          <h3 className="mb-2 mt-6 text-sm font-semibold text-tinta">De onde vieram</h3>
          {r.origens.length === 0 ? (
            <p className="text-sm text-tinta-3">Nenhuma oficina ainda.</p>
          ) : (
            <ul className="divide-y divide-linha text-sm">
              {r.origens.map((o) => (
                <li key={o.origem} className="flex justify-between gap-2 py-1.5">
                  <span className="truncate text-tinta-2">{o.origem}</span>
                  <span className="tabular-nums font-medium text-tinta">{o.valor}</span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </div>
  );
}
