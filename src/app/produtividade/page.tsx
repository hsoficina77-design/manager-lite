"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { labelStatus, OS_EM_ABERTO } from "@/lib/constants";

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
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Produtividade</h1>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
          </select>
          <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading || !oficina ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : (
        <>
          {/* Totais da oficina */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <Metric label="Faturamento total" value={formatCurrency(oficina.faturamento)} />
            <Metric label="Lucro real" value={formatCurrency(oficina.lucroReal)} highlight />
            <Metric label="Margem" value={fmtPct(oficina.margem)} />
            <Metric label="Mão de obra" value={formatCurrency(oficina.maoDeObra)} />
            <Metric label="OS entregues no mês" value={String(oficina.nOS)} />
            <Metric label="NPS médio" value={fmtNps(oficina.npsMedio)} />
            <Metric label="Tempo médio de execução" value={fmtDias(oficina.tempoMedioDias)} />
          </div>

          {/* Evolução e pátio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EvolucaoChart dados={evolucaoMensal} />
            <Patio patio={oficina.patio} />
          </div>

          {/* Ranking de mecânicos */}
          {ordenadas.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
              Nenhum mecânico ativo. <Link href="/mecanicos" className="text-brand-600 underline">Cadastrar mecânico</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {ordenadas.map((l) => (
                <Link
                  key={l.mecanicoId}
                  href={`/mecanicos/${l.mecanicoId}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 hover:border-red-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">{l.nome}</p>
                      {l.especialidade && <p className="text-sm text-zinc-500 truncate">{l.especialidade}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-zinc-900">{formatCurrency(l.faturamento)}</p>
                      <p className="text-xs text-green-600 font-medium">{formatCurrency(l.lucroReal)} lucro</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
                    <Mini label="Margem" value={fmtPct(l.margem)} />
                    <Mini label="Ticket médio" value={formatCurrency(l.ticketMedio)} />
                    <Mini label="OS" value={String(l.nOS)} />
                    <Mini label="NPS / SLA" value={`${fmtNps(l.npsMedio)} · ${fmtDias(l.tempoMedioDias)}`} />
                  </div>

                  {l.progresso !== null ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Meta: {formatCurrency(l.meta)}</span>
                        <span className={cn("font-semibold", l.progresso >= 100 ? "text-green-600" : "text-zinc-700")}>{l.progresso.toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", l.progresso >= 100 ? "bg-green-500" : "bg-red-500")}
                          style={{ width: `${Math.min(l.progresso, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Sem meta definida</p>
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

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", highlight ? "border-green-200 bg-green-50" : "border-zinc-200 bg-white")}>
      <p className={cn("text-xs", highlight ? "text-green-700" : "text-zinc-500")}>{label}</p>
      <p className={cn("text-base sm:text-lg font-bold mt-1", highlight ? "text-green-700" : "text-zinc-900")}>{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="font-medium text-zinc-800">{value}</p>
    </div>
  );
}

function EvolucaoChart({ dados }: { dados: EvolucaoItem[] }) {
  const max = Math.max(1, ...dados.flatMap((d) => [d.faturamento, d.lucroReal]));
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="font-semibold text-zinc-800">Evolução — últimos 6 meses</h2>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-zinc-400" /> Faturamento</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Lucro real</span>
        </div>
      </div>
      {dados.length === 0 ? (
        <p className="text-sm text-zinc-400">Sem dados no período.</p>
      ) : (
        <div className="flex items-end justify-between gap-1 h-36">
          {dados.map((d) => (
            <div key={`${d.ano}-${d.mes}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="flex items-end justify-center gap-1 flex-1 w-full">
                <div
                  className="w-3 rounded-t bg-zinc-300"
                  style={{ height: `${Math.max(2, (d.faturamento / max) * 100)}%` }}
                  title={`Faturamento: ${formatCurrency(d.faturamento)}`}
                />
                <div
                  className="w-3 rounded-t bg-green-500"
                  style={{ height: `${Math.max(2, (d.lucroReal / max) * 100)}%` }}
                  title={`Lucro real: ${formatCurrency(d.lucroReal)}`}
                />
              </div>
              <span className="text-[10px] text-zinc-400">{MESES[d.mes - 1]}</span>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-2.5">
      <div className="mb-1">
        <h2 className="font-semibold text-zinc-800">Pátio agora</h2>
        <p className="text-xs text-zinc-500">Estado atual, independente do mês selecionado</p>
      </div>
      {PATIO_STATUS.map((s) => {
        const n = patio[s] ?? 0;
        return (
          <div key={s} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 text-xs text-zinc-500">{labelStatus(s)}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-zinc-700" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <span className="w-6 shrink-0 text-right font-medium text-zinc-700">{n}</span>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-zinc-400">
        {total} OS em aberto · <Link href="/" className="hover:underline">ver no dashboard →</Link>
      </p>
    </div>
  );
}
