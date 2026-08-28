"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDatetime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { labelStatus } from "@/lib/constants";

const FORMAS_PGTO = ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA"];
const FORMAS_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro", PIX: "PIX",
  CARTAO_CREDITO: "Cartão Crédito", CARTAO_DEBITO: "Cartão Débito", TRANSFERENCIA: "Transferência",
};


type Faixa = "0-15" | "16-30" | "31-60" | "60+";

const FAIXA_STYLE: Record<Faixa, { label: string; active: string; text: string; dot: string }> = {
  "0-15": { label: "0-15 dias", active: "border-green-300 bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "16-30": { label: "16-30 dias", active: "border-yellow-300 bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  "31-60": { label: "31-60 dias", active: "border-orange-300 bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  "60+": { label: "60+ dias", active: "border-red-300 bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};
const FAIXAS: Faixa[] = ["0-15", "16-30", "31-60", "60+"];

type OSPendente = {
  id: string; numero: number; status: string; total: number; valorPago: number; abertura: string;
  veiculo: { marca: string; modelo: string; placa: string | null };
};
type DividaAvulsa = {
  id: number; descricao: string; valor: number; valorPago: number; createdAt: string;
};
type VeiculoInfo = { marca: string; modelo: string; placa: string | null };
type ClienteDevedor = {
  id: string; nome: string; apelido: string | null; telefone: string | null;
  veiculos: VeiculoInfo[];
  ordens: OSPendente[];
  dividasAvulsas: DividaAvulsa[];
  totalSaldo: number;
  diasEmAberto: number;
  faixa: Faixa;
};
type Resumo = {
  totalAReceber: number; totalDevedores: number; totalOSPendentes: number; totalDividasAvulsas: number;
  porFaixa: Record<Faixa, { clientes: number; valor: number }>;
};

type ModalPgto = { type: "os" | "divida"; id: string | number; saldo: number } | null;
type HistoricoModal = { type: "os" | "divida"; id: string | number; pagamentos: { id: string | number; valor: number; formaPagamento: string; obs: string | null; data: string }[] } | null;
type NovaDividaModal = boolean;
type Ordenacao = "saldo" | "dias";

const RESUMO_VAZIO: Resumo = {
  totalAReceber: 0, totalDevedores: 0, totalOSPendentes: 0, totalDividasAvulsas: 0,
  porFaixa: { "0-15": { clientes: 0, valor: 0 }, "16-30": { clientes: 0, valor: 0 }, "31-60": { clientes: 0, valor: 0 }, "60+": { clientes: 0, valor: 0 } },
};

function csvEscape(v: string) {
  if (v.includes(";") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function whatsappLink(telefone: string, nome: string, saldo: number) {
  const digits = telefone.replace(/\D/g, "");
  const numero = digits.startsWith("55") ? digits : `55${digits}`;
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const msg = `Olá ${primeiroNome}, tudo bem? Aqui é da oficina. Identificamos um saldo em aberto de ${formatCurrency(saldo)}. Poderia verificar a possibilidade de acerto? Qualquer dúvida, estou à disposição!`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}

export default function ContasReceberPage() {
  const [clientes, setClientes] = useState<ClienteDevedor[]>([]);
  const [resumo, setResumo] = useState<Resumo>(RESUMO_VAZIO);
  const [allClientes, setAllClientes] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [faixaFiltro, setFaixaFiltro] = useState<Faixa | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("saldo");
  const [modalPgto, setModalPgto] = useState<ModalPgto>(null);
  const [historicoModal, setHistoricoModal] = useState<HistoricoModal>(null);
  const [novaDividaModal, setNovaDividaModal] = useState<NovaDividaModal>(false);
  const [pgtoForm, setPgtoForm] = useState({ valor: "", formaPagamento: "DINHEIRO", obs: "" });
  const [savingPgto, setSavingPgto] = useState(false);
  const [novaDividaForm, setNovaDividaForm] = useState({ clienteId: "", descricao: "", valor: "" });
  const [savingDivida, setSavingDivida] = useState(false);
  const [estornandoId, setEstornandoId] = useState<string | number | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contas-receber");
      const data: { clientes: ClienteDevedor[]; resumo: Resumo } = await res.json();
      setClientes(data.clientes);
      setResumo(data.resumo);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then((data: { id: string; nome: string }[]) => setAllClientes(data));
  }, []);

  const filtered = useMemo(() => {
    const porFaixaEBusca = clientes.filter((c) => {
      if (faixaFiltro && c.faixa !== faixaFiltro) return false;
      if (!q) return true;
      const t = q.toLowerCase();
      return (
        c.nome.toLowerCase().includes(t) ||
        (c.apelido?.toLowerCase().includes(t)) ||
        c.ordens.some((o) => o.veiculo.placa?.toLowerCase().includes(t) || String(o.numero).includes(t))
      );
    });
    return [...porFaixaEBusca].sort((a, b) =>
      ordenacao === "dias" ? b.diasEmAberto - a.diasEmAberto : b.totalSaldo - a.totalSaldo
    );
  }, [clientes, faixaFiltro, q, ordenacao]);

  async function openPgto(type: "os" | "divida", id: string | number, saldo: number) {
    setModalPgto({ type, id, saldo });
    setPgtoForm({ valor: saldo.toFixed(2), formaPagamento: "DINHEIRO", obs: "" });
  }

  async function submitPgto(e: React.FormEvent) {
    e.preventDefault();
    if (!modalPgto) return;
    setSavingPgto(true);
    try {
      const url = modalPgto.type === "os"
        ? `/api/os/${modalPgto.id}/pagamentos`
        : `/api/dividas/${modalPgto.id}/pagamentos`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pgtoForm),
      });
      if (res.ok) {
        setModalPgto(null);
        load();
      }
    } finally {
      setSavingPgto(false);
    }
  }

  async function deleteDivida(id: number) {
    if (!confirm("Excluir esta dívida?")) return;
    const res = await fetch(`/api/dividas/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const d = await res.json();
      alert(d.error || "Não foi possível excluir.");
    }
  }

  async function openHistorico(type: "os" | "divida", id: string | number) {
    const url = type === "os" ? `/api/os/${id}` : `/api/dividas/${id}/pagamentos`;
    const res = await fetch(url);
    const data = await res.json();
    const pagamentos = type === "os" ? data.pagamentos : data;
    setHistoricoModal({ type, id, pagamentos });
  }

  // Estorna um pagamento do histórico — o valor volta para o saldo em aberto.
  async function estornarPagamento(pagamentoId: string | number) {
    if (!historicoModal) return;
    if (!confirm("Estornar este pagamento? O valor volta para o saldo em aberto.")) return;
    const { type, id } = historicoModal;
    setEstornandoId(pagamentoId);
    try {
      const base = type === "os" ? `/api/os/${id}` : `/api/dividas/${id}`;
      const res = await fetch(`${base}/pagamentos/${pagamentoId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Não foi possível estornar.");
        return;
      }
      setHistoricoModal({
        ...historicoModal,
        pagamentos: historicoModal.pagamentos.filter((p) => p.id !== pagamentoId),
      });
      showToast("Pagamento estornado!");
      load();
    } finally {
      setEstornandoId(null);
    }
  }

  async function submitNovaDivida(e: React.FormEvent) {
    e.preventDefault();
    setSavingDivida(true);
    try {
      const res = await fetch("/api/dividas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDividaForm),
      });
      if (res.ok) {
        setNovaDividaModal(false);
        setNovaDividaForm({ clienteId: "", descricao: "", valor: "" });
        load();
      }
    } finally {
      setSavingDivida(false);
    }
  }

  function copyTelefone(tel: string) {
    navigator.clipboard.writeText(tel).then(() => showToast("Telefone copiado!"));
  }

  function exportarCSV() {
    const header = ["Cliente", "Telefone", "Total em aberto", "Dias em aberto", "Faixa", "OS pendentes", "Dívidas avulsas"];
    const linhas = filtered.map((c) => [
      c.nome,
      c.telefone ?? "",
      c.totalSaldo.toFixed(2).replace(".", ","),
      String(c.diasEmAberto),
      c.faixa,
      String(c.ordens.length),
      String(c.dividasAvulsas.length),
    ]);
    const csv = [header, ...linhas].map((linha) => linha.map(csvEscape).join(";")).join("\r\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inadimplencia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Modais */}
      {modalPgto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div className="my-auto bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-zinc-900">Registrar recebimento</h3>
            <form onSubmit={submitPgto} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor (R$) *</label>
                <input type="number" inputMode="decimal" min="0.01" step="0.01" value={pgtoForm.valor} onChange={(e) => setPgtoForm({ ...pgtoForm, valor: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Forma de pagamento</label>
                <select value={pgtoForm.formaPagamento} onChange={(e) => setPgtoForm({ ...pgtoForm, formaPagamento: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {FORMAS_PGTO.map((f) => <option key={f} value={f}>{FORMAS_LABEL[f]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Observação</label>
                <input value={pgtoForm.obs} onChange={(e) => setPgtoForm({ ...pgtoForm, obs: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingPgto} className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {savingPgto ? "Confirmando..." : "Confirmar"}
                </button>
                <button type="button" onClick={() => setModalPgto(null)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historicoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div className="my-auto bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-zinc-900">Histórico de pagamentos</h3>
            {historicoModal.pagamentos.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhum pagamento registrado.</p>
            ) : (
              <div className="space-y-2">
                {historicoModal.pagamentos.map((p) => (
                  <div key={p.id} className="flex justify-between gap-2 text-sm border-b border-zinc-100 pb-2">
                    <div className="min-w-0">
                      <span className="font-medium text-zinc-900">{formatCurrency(p.valor)}</span>
                      <span className="text-zinc-400 ml-2">{FORMAS_LABEL[p.formaPagamento] || p.formaPagamento}</span>
                      {p.obs && <span className="text-zinc-400 ml-1">· {p.obs}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-zinc-400">{formatDatetime(p.data)}</span>
                      <button
                        onClick={() => estornarPagamento(p.id)}
                        disabled={estornandoId === p.id}
                        className="text-xs text-zinc-400 underline hover:text-red-600 disabled:opacity-50"
                      >
                        Estornar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setHistoricoModal(null)} className="w-full rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              Fechar
            </button>
          </div>
        </div>
      )}

      {novaDividaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <div className="my-auto bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-zinc-900">Nova dívida avulsa</h3>
            <form onSubmit={submitNovaDivida} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Cliente *</label>
                <select value={novaDividaForm.clienteId} onChange={(e) => setNovaDividaForm({ ...novaDividaForm, clienteId: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Selecionar...</option>
                  {allClientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Descrição *</label>
                <input value={novaDividaForm.descricao} onChange={(e) => setNovaDividaForm({ ...novaDividaForm, descricao: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor (R$) *</label>
                <input type="number" inputMode="decimal" min="0.01" step="0.01" value={novaDividaForm.valor} onChange={(e) => setNovaDividaForm({ ...novaDividaForm, valor: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingDivida} className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50">
                  {savingDivida ? "Criando..." : "Criar"}
                </button>
                <button type="button" onClick={() => setNovaDividaModal(false)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Contas a Receber</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Pendências agrupadas por cliente</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} disabled={filtered.length === 0} className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">
            Exportar CSV
          </button>
          <button onClick={() => setNovaDividaModal(true)} className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700">
            + Nova dívida avulsa
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SummaryCard label="Total a receber" value={formatCurrency(resumo.totalAReceber)} highlight />
        <SummaryCard label="Clientes devedores" value={String(resumo.totalDevedores)} />
        <SummaryCard label="OSs pendentes" value={String(resumo.totalOSPendentes)} />
        <SummaryCard label="Dívidas avulsas" value={String(resumo.totalDividasAvulsas)} />
      </div>

      {/* Aging de inadimplência */}
      <div className="mb-6">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">Tempo em aberto</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FAIXAS.map((f) => (
            <FaixaCard
              key={f}
              faixa={f}
              dados={resumo.porFaixa[f]}
              ativo={faixaFiltro === f}
              onClick={() => setFaixaFiltro(faixaFiltro === f ? null : f)}
            />
          ))}
        </div>
      </div>

      {/* Busca e ordenação */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, apelido, placa, #OS..."
          className="w-full sm:flex-1 sm:max-w-sm rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="saldo">Ordenar: maior saldo</option>
          <option value="dias">Ordenar: mais atrasado</option>
        </select>
        {faixaFiltro && (
          <button onClick={() => setFaixaFiltro(null)} className="text-xs text-zinc-500 hover:text-zinc-700 underline">
            Limpar filtro de faixa
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          {clientes.length === 0 ? "Nenhuma conta a receber. Tudo quitado!" : "Nenhum devedor encontrado para este filtro."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const veicolosDesc = c.veiculos
              .slice(0, 2)
              .map((v) => `${v.marca} ${v.modelo}${v.placa ? ` · ${v.placa}` : ""}`)
              .join("  ");
            const extrasVeiculos = c.veiculos.length > 2 ? ` +${c.veiculos.length - 2}` : "";

            return (
              <div key={c.id} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                {/* Header do cliente */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-700 font-bold text-sm flex items-center justify-center shrink-0">
                      {c.nome[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/clientes/${c.id}`} className="font-semibold text-zinc-900 hover:underline">{c.nome}</Link>
                        {c.apelido && <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600">{c.apelido}</span>}
                        <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", FAIXA_STYLE[c.faixa].active, FAIXA_STYLE[c.faixa].text)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", FAIXA_STYLE[c.faixa].dot)} />
                          {c.diasEmAberto}d
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {veicolosDesc}{extrasVeiculos}
                        {c.telefone && (
                          <>
                            {" · "}
                            <button
                              onClick={() => copyTelefone(c.telefone!)}
                              className="hover:underline text-zinc-600"
                            >
                              {c.telefone}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.telefone && (
                      <a
                        href={whatsappLink(c.telefone, c.nome, c.totalSaldo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                      >
                        Cobrar via WhatsApp
                      </a>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Total</p>
                      <p className="font-bold text-red-600">{formatCurrency(c.totalSaldo)}</p>
                    </div>
                  </div>
                </div>

                {/* OSs pendentes */}
                {c.ordens.length > 0 && (
                  <div className="px-4 py-2 space-y-1.5">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide pt-1">OSs pendentes</p>
                    {c.ordens.map((os) => {
                      const saldo = os.total - os.valorPago;
                      const diasOS = Math.floor((Date.now() - new Date(os.abertura).getTime()) / 86400000);
                      const atrasada = diasOS > 30;
                      return (
                        <div key={os.id} className="flex flex-col gap-1.5 py-1.5 border-b border-zinc-50 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <Link href={`/os/${os.id}`} className="font-medium text-brand-600 hover:underline shrink-0">#{os.numero}</Link>
                              <span className="text-zinc-500 truncate">
                                {os.veiculo.marca} {os.veiculo.modelo}
                                {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
                              </span>
                              <span className="text-zinc-400 shrink-0 text-xs">
                                {labelStatus(os.status)} · {diasOS}d
                                {atrasada && <span className="text-red-600 ml-1">⚠</span>}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 sm:ml-3">
                            <span className="font-semibold text-red-600 text-sm">{formatCurrency(saldo)}</span>
                            <button
                              onClick={() => openHistorico("os", os.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                            >
                              Histórico
                            </button>
                            <button
                              onClick={() => openPgto("os", os.id, saldo)}
                              className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Receber
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dívidas avulsas */}
                {c.dividasAvulsas.length > 0 && (
                  <div className="px-4 py-2 space-y-1.5">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide pt-1">Dívidas avulsas</p>
                    {c.dividasAvulsas.map((div) => {
                      const saldo = div.valor - div.valorPago;
                      const dias = Math.floor((Date.now() - new Date(div.createdAt).getTime()) / 86400000);
                      return (
                        <div key={div.id} className="flex flex-col gap-1.5 py-1.5 border-b border-zinc-50 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-800 truncate">{div.descricao}</p>
                            <p className="text-xs text-zinc-400">Há {dias} dias · {formatDate(div.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 sm:ml-3">
                            <span className="font-semibold text-red-600 text-sm">{formatCurrency(saldo)}</span>
                            <button
                              onClick={() => openHistorico("divida", div.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                            >
                              Histórico
                            </button>
                            <button
                              onClick={() => openPgto("divida", div.id, saldo)}
                              className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Receber
                            </button>
                            <button
                              onClick={() => deleteDivida(div.id)}
                              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50"
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
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", highlight ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white")}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", highlight ? "text-red-600" : "text-zinc-900")}>{value}</p>
    </div>
  );
}

function FaixaCard({
  faixa, dados, ativo, onClick,
}: {
  faixa: Faixa; dados: { clientes: number; valor: number }; ativo: boolean; onClick: () => void;
}) {
  const s = FAIXA_STYLE[faixa];
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        ativo ? s.active : "border-zinc-200 bg-white hover:bg-zinc-50"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", s.dot)} />
        <p className="text-xs text-zinc-500">{s.label}</p>
      </div>
      <p className={cn("text-lg font-bold mt-1", ativo ? s.text : "text-zinc-900")}>{formatCurrency(dados.valor)}</p>
      <p className="text-xs text-zinc-400">{dados.clientes} cliente{dados.clientes !== 1 ? "s" : ""}</p>
    </button>
  );
}
