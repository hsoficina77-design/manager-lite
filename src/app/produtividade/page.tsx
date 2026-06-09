"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";

type Linha = {
  mecanicoId: string;
  nome: string;
  especialidade: string | null;
  nOS: number;
  faturamento: number;
  maoDeObra: number;
  ticketMedio: number;
  meta: number;
  progresso: number | null;
};

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function ProdutividadePage() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/produtividade?ano=${ano}&mes=${mes}`)
      .then((r) => r.json())
      .then((d) => setLinhas(d.mecanicos ?? []))
      .finally(() => setLoading(false));
  }, [ano, mes]);

  const anos = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const totalFat = linhas.reduce((s, l) => s + l.faturamento, 0);
  const totalMO = linhas.reduce((s, l) => s + l.maoDeObra, 0);
  const totalOS = linhas.reduce((s, l) => s + l.nOS, 0);

  // Maior faturamento primeiro
  const ordenadas = [...linhas].sort((a, b) => b.faturamento - a.faturamento);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Produtividade</h1>
        <div className="flex items-center gap-2">
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
          </select>
          <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Totais da oficina */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Faturamento total" value={formatCurrency(totalFat)} />
        <Metric label="Mão de obra" value={formatCurrency(totalMO)} />
        <Metric label="OS no mês" value={String(totalOS)} />
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : ordenadas.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          Nenhum mecânico ativo. <Link href="/mecanicos" className="text-red-600 underline">Cadastrar mecânico</Link>
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
                <p className="text-right font-bold text-zinc-900 shrink-0">{formatCurrency(l.faturamento)}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <Mini label="Mão de obra" value={formatCurrency(l.maoDeObra)} />
                <Mini label="Ticket médio" value={formatCurrency(l.ticketMedio)} />
                <Mini label="OS" value={String(l.nOS)} />
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
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-base sm:text-lg font-bold text-zinc-900 mt-1">{value}</p>
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
