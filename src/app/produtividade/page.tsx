"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { labelStatus, OS_EM_ABERTO } from "@/lib/constants";
import { Selecao } from "@/components/ui/Campos";
import { EsqueletoFaixa, EsqueletoLista, FaixaMetricas, Metrica, Vazio } from "@/components/ui/Dados";
import { BotaoLink } from "@/components/ui/Botao";
import { SetaDireita } from "@/components/ui/Icones";

type Linha = {
  mecanicoId: string;
  nome: string;
  especialidade: string | null;
  nOS: number;
  faturamento: number;
  maoDeObra: number;
  lucroReal: number;
  margem: number | null;
  npsMedio: number | null;
  tempoMedioDias: number | null;
  ticketMedio: number;
  meta: number;
  progresso: number | null;
};
type Oficina = {
  nOS: number; faturamento: number; maoDeObra: number; lucroReal: number;
  margem: number | null; npsMedio: number | null; tempoMedioDias: number | null;
  patio: Record<string, number>;
};
type EvolucaoItem = { ano: number; mes: number; faturamento: number; lucroReal: number };

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
// O pátio é sempre o de agora, não o do mês selecionado: OS em aberto não tem data de
// entrega, então não pertence a mês nenhum.
const PATIO_STATUS = OS_EM_ABERTO;

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(0)}%`;
}
function fmtDias(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(1)}d`;
}
function fmtNps(v: number | null): string {
  return v === null ? "—" : v.toFixed(1);
}

export default function ProdutividadePage() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [oficina, setOficina] = useState<Oficina | null>(null);
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/produtividade?ano=${ano}&mes=${mes}`)
      .then((r) => r.json())
      .then((d) => {
        setLinhas(d.mecanicos ?? []);
        setOficina(d.oficina ?? null);
        setEvolucaoMensal(d.evolucaoMensal ?? []);
      })
      .finally(() => setLoading(false));
  }, [ano, mes]);

  const anos = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  // Maior faturamento primeiro
  const ordenadas = [...linhas].sort((a, b) => b.faturamento - a.faturamento);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-tinta">Produtividade</h1>
        <div className="flex items-center gap-2">
          <Selecao value={mes} onChange={(e) => setMes(Number(e.target.value))} aria-label="Mês" className="w-auto">
            {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
          </Selecao>
          <Selecao value={ano} onChange={(e) => setAno(Number(e.target.value))} aria-label="Ano" className="w-auto">
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </Selecao>
        </div>
      </div>

      {loading || !oficina ? (
        <>
          <EsqueletoFaixa colunas={4} />
          <EsqueletoLista linhas={3} />
        </>
      ) : (
        <>
          {/* Totais da oficina */}
          <FaixaMetricas colunas={4}>
            <Metrica rotulo="Faturamento total" valor={formatCurrency(oficina.faturamento)} />
            <Metrica rotulo="Lucro real" valor={formatCurrency(oficina.lucroReal)} tom="ok" />
            <Metrica rotulo="Margem" valor={fmtPct(oficina.margem)} />
            <Metrica rotulo="Mão de obra" valor={formatCurrency(oficina.maoDeObra)} />
            <Metrica rotulo="OS entregues no mês" valor={String(oficina.nOS)} />
            <Metrica rotulo="NPS médio" valor={fmtNps(oficina.npsMedio)} />
            <Metrica rotulo="Tempo médio de execução" valor={fmtDias(oficina.tempoMedioDias)} />
          </FaixaMetricas>

          {/* Evolução e pátio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EvolucaoChart dados={evolucaoMensal} />
            <Patio patio={oficina.patio} />
          </div>

          {/* Ranking de mecânicos */}
          {ordenadas.length === 0 ? (
            <Vazio
              titulo="Nenhum mecânico ativo"
              texto="A produtividade compara o trabalho por mecânico — sem cadastro não há o que comparar."
              acao={<BotaoLink href="/mecanicos">Cadastrar mecânico</BotaoLink>}
            />
          ) : (
            <div className="space-y-3">
              {ordenadas.map((l) => (
                <Link
                  key={l.mecanicoId}
                  href={`/mecanicos/${l.mecanicoId}`}
                  className="block rounded-xl border border-linha bg-superficie p-4 hover:border-perigo-linha hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-tinta truncate">{l.nome}</p>
                      {l.especialidade && <p className="text-sm text-tinta-3 truncate">{l.especialidade}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-tinta">{formatCurrency(l.faturamento)}</p>
                      <p className="text-xs text-ok font-medium">{formatCurrency(l.lucroReal)} lucro</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                    <MetricaMini rotulo="Margem" value={fmtPct(l.margem)} />
                    <MetricaMini rotulo="Ticket médio" value={formatCurrency(l.ticketMedio)} />
                    <MetricaMini rotulo="OS" value={String(l.nOS)} />
                    <MetricaMini rotulo="NPS / SLA" value={`${fmtNps(l.npsMedio)} · ${fmtDias(l.tempoMedioDias)}`} />
                  </div>

                  {l.progresso !== null ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-tinta-3">
                        <span>Meta: {formatCurrency(l.meta)}</span>
                        <span className={cn("font-semibold", l.progresso >= 100 ? "text-ok" : "text-tinta-2")}>{l.progresso.toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-superficie-3 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", l.progresso >= 100 ? "bg-ok" : "bg-perigo")}
                          style={{ width: `${Math.min(l.progresso, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-tinta-3">Sem meta definida</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricaMini({ rotulo, value }: { rotulo: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-tinta-3">{rotulo}</p>
      <p className="font-medium tabular-nums text-tinta-2">{value}</p>
    </div>
  );
}

function EvolucaoChart({ dados }: { dados: EvolucaoItem[] }) {
  const max = Math.max(1, ...dados.flatMap((d) => [d.faturamento, d.lucroReal]));
  return (
    <div className="rounded-xl border border-linha bg-superficie p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold text-tinta">Evolução — últimos 6 meses</h2>
        <div className="flex items-center gap-3 text-xs text-tinta-3">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-tinta-3" /> Faturamento</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ok" /> Lucro real</span>
        </div>
      </div>
      {dados.length === 0 ? (
        <p className="text-sm text-tinta-3">Sem dados no período.</p>
      ) : (
        <div className="flex items-end justify-between gap-1 h-36">
          {dados.map((d) => (
            <div key={`${d.ano}-${d.mes}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="flex items-end justify-center gap-1 flex-1 w-full">
                <div
                  className="w-3 rounded-t bg-tinta-3"
                  style={{ height: `${Math.max(2, (d.faturamento / max) * 100)}%` }}
                  title={`Faturamento: ${formatCurrency(d.faturamento)}`}
                />
                <div
                  className="w-3 rounded-t bg-ok"
                  style={{ height: `${Math.max(2, (d.lucroReal / max) * 100)}%` }}
                  title={`Lucro real: ${formatCurrency(d.lucroReal)}`}
                />
              </div>
              <span className="text-xs text-tinta-3">{MESES[d.mes - 1]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Patio({ patio }: { patio: Record<string, number> }) {
  const max = Math.max(1, ...PATIO_STATUS.map((s) => patio[s] ?? 0));
  const total = PATIO_STATUS.reduce((s, k) => s + (patio[k] ?? 0), 0);
  return (
    <div className="rounded-xl border border-linha bg-superficie p-5 space-y-2.5">
      <div className="mb-1">
        <h2 className="font-semibold text-tinta">Pátio agora</h2>
        <p className="text-xs text-tinta-3">Estado atual, independente do mês selecionado</p>
      </div>
      {PATIO_STATUS.map((s) => {
        const n = patio[s] ?? 0;
        return (
          <div key={s} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-xs text-tinta-3">{labelStatus(s)}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-superficie-3">
              <div className="h-full rounded-full bg-contraste" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right font-medium text-tinta-2">{n}</span>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-tinta-3">
        {total} OS em aberto ·{" "}
        <Link href="/" className="inline-flex items-center gap-1 hover:underline">
          ver no dashboard <SetaDireita tamanho={12} />
        </Link>
      </p>
    </div>
  );
}
