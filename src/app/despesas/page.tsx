"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const CATEGORIAS = ["ALUGUEL", "SALARIO", "FORNECEDOR", "ENERGIA", "AGUA", "INTERNET", "IMPOSTO", "MANUTENCAO", "OUTROS"];
const CATEGORIA_LABEL: Record<string, string> = {
  ALUGUEL: "Aluguel", SALARIO: "Salário", FORNECEDOR: "Fornecedor", ENERGIA: "Energia",
  AGUA: "Água", INTERNET: "Internet", IMPOSTO: "Imposto", MANUTENCAO: "Manutenção", OUTROS: "Outros",
};

type Despesa = {
  id: string; categoria: string; descricao: string; valor: number;
  vencimento: string; pago: boolean; pagoEm: string | null; recorrente: boolean;
};

type Situacao = "vencida" | "breve" | "aVencer" | "paga";

function situacaoDe(d: Despesa): Situacao {
  if (d.pago) return "paga";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(d.vencimento);
  const dias = Math.floor((venc.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0) return "vencida";
  if (dias <= 7) return "breve";
  return "aVencer";
}

const SITUACAO_STYLE: Record<Situacao, { label: string; badge: string }> = {
  vencida: { label: "Vencida", badge: "bg-red-100 text-red-700" },
  breve: { label: "Vence em breve", badge: "bg-orange-100 text-orange-700" },
  aVencer: { label: "A vencer", badge: "bg-zinc-100 text-zinc-600" },
  paga: { label: "Paga", badge: "bg-green-100 text-green-700" },
};

const FORM_VAZIO = { categoria: "ALUGUEL", descricao: "", valor: "", vencimento: "", recorrente: false };

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPagas, setMostrarPagas] = useState(false);
  const [modalNova, setModalNova] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [saving, setSaving] = useState(false);
  const [processando, setProcessando] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/despesas");
      setDespesas(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resumo = useMemo(() => {
    const pendentes = despesas.filter((d) => !d.pago);
    const vencidas = pendentes.filter((d) => situacaoDe(d) === "vencida");
    const totalAPagar = pendentes.reduce((s, d) => s + d.valor, 0);
    const hoje = new Date();
    const pagasNoMes = despesas.filter(
      (d) => d.pago && d.pagoEm && new Date(d.pagoEm).getMonth() === hoje.getMonth() && new Date(d.pagoEm).getFullYear() === hoje.getFullYear()
    );
    return {
      totalAPagar,
      pendentes: pendentes.length,
      totalVencido: vencidas.reduce((s, d) => s + d.valor, 0),
      vencidas: vencidas.length,
      pagoNoMes: pagasNoMes.reduce((s, d) => s + d.valor, 0),
    };
  }, [despesas]);

  const listadas = useMemo(() => {
    const base = mostrarPagas ? despesas : despesas.filter((d) => !d.pago);
    return [...base].sort((a, b) => {
      if (a.pago !== b.pago) return a.pago ? 1 : -1;
      return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime();
    });
  }, [despesas, mostrarPagas]);

  async function marcarPaga(id: string, pago: boolean) {
    setProcessando(id);
    try {
      await fetch(`/api/despesas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pago }),
      });
      await load();
    } finally {
      setProcessando(null);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta despesa?")) return;
    setProcessando(id);
    try {
      await fetch(`/api/despesas/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setProcessando(null);
    }
  }

  async function submitNova(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setModalNova(false);
        setForm(FORM_VAZIO);
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {modalNova && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-zinc-900">Nova despesa</h3>
            <form onSubmit={submitNova} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Categoria</label>
                <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Descrição *</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Valor (R$) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Vencimento *</label>
                  <input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                <input type="checkbox" checked={form.recorrente} onChange={(e) => setForm({ ...form, recorrente: e.target.checked })} className="rounded" />
                Recorrente (gera a próxima automaticamente ao pagar)
              </label>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  {saving ? "Criando..." : "Criar"}
                </button>
                <button type="button" onClick={() => setModalNova(false)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Contas a Pagar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Despesas fixas e recorrentes da oficina</p>
        </div>
        <button onClick={() => setModalNova(true)} className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          + Nova despesa
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total a pagar" value={formatCurrency(resumo.totalAPagar)} sub={`${resumo.pendentes} pendente${resumo.pendentes !== 1 ? "s" : ""}`} highlight />
        <SummaryCard label="Vencidas" value={formatCurrency(resumo.totalVencido)} sub={`${resumo.vencidas} conta${resumo.vencidas !== 1 ? "s" : ""}`} danger={resumo.vencidas > 0} />
        <SummaryCard label="Pago no mês" value={formatCurrency(resumo.pagoNoMes)} />
        <SummaryCard label="Total de contas" value={String(despesas.length)} />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer w-fit">
        <input type="checkbox" checked={mostrarPagas} onChange={(e) => setMostrarPagas(e.target.checked)} className="rounded" />
        Mostrar contas já pagas
      </label>

      {loading ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : listadas.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          Nenhuma conta a pagar. Tudo em dia!
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 overflow-hidden">
          {listadas.map((d) => {
            const sit = situacaoDe(d);
            return (
              <div key={d.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-zinc-900">{d.descricao}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{CATEGORIA_LABEL[d.categoria] || d.categoria}</span>
                    {d.recorrente && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">Recorrente</span>}
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SITUACAO_STYLE[sit].badge)}>{SITUACAO_STYLE[sit].label}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {d.pago && d.pagoEm ? `Pago em ${formatDate(d.pagoEm)}` : `Vence em ${formatDate(d.vencimento)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-zinc-900 w-24 text-right">{formatCurrency(d.valor)}</span>
                  {!d.pago ? (
                    <button
                      onClick={() => marcarPaga(d.id, true)}
                      disabled={processando === d.id}
                      className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Marcar como paga
                    </button>
                  ) : (
                    <button
                      onClick={() => marcarPaga(d.id, false)}
                      disabled={processando === d.id}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Desfazer
                    </button>
                  )}
                  <button
                    onClick={() => excluir(d.id)}
                    disabled={processando === d.id}
                    className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, highlight, danger }: { label: string; value: string; sub?: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", danger ? "border-red-200 bg-red-50" : highlight ? "border-zinc-300 bg-zinc-50" : "border-zinc-200 bg-white")}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", danger ? "text-red-600" : "text-zinc-900")}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}
