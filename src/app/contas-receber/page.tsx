"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, formatDatetime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FORMAS_PGTO = ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA"];
const FORMAS_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro", PIX: "PIX",
  CARTAO_CREDITO: "Cartão Crédito", CARTAO_DEBITO: "Cartão Débito", TRANSFERENCIA: "Transferência",
};

const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta", EM_ANDAMENTO: "Em Andamento", AGUARDANDO_PECA: "Ag. Peça",
  PRONTA: "Pronta", FECHADA: "Fechada", ENTREGUE: "Entregue", CANCELADA: "Cancelada",
};

type OSPendente = {
  id: string; numero: number; status: string; total: number; valorPago: number; abertura: string;
  veiculo: { marca: string; modelo: string; placa: string | null };
};
type DividaAvulsa = {
  id: number; descricao: string; valor: number; valorPago: number; createdAt: string;
  pagamentos?: { id: number; valor: number; formaPagamento: string; obs: string | null; data: string }[];
};
type VeiculoInfo = { marca: string; modelo: string; placa: string | null };
type ClienteDevedor = {
  id: string; nome: string; apelido: string | null; telefone: string | null;
  veiculos: VeiculoInfo[];
  ordens: OSPendente[];
  dividasAvulsas: DividaAvulsa[];
  totalSaldo: number;
  diasEmAberto: number;
};

type ModalPgto = { type: "os" | "divida"; id: string | number; saldo: number } | null;
type HistoricoModal = { type: "os" | "divida"; id: string | number; pagamentos: { id: string | number; valor: number; formaPagamento: string; obs: string | null; data: string }[] } | null;
type NovaDividaModal = boolean;

export default function ContasReceberPage() {
  const [clientes, setClientes] = useState<ClienteDevedor[]>([]);
  const [allClientes, setAllClientes] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [mostrarQuitados, setMostrarQuitados] = useState(false);
  const [modalPgto, setModalPgto] = useState<ModalPgto>(null);
  const [historicoModal, setHistoricoModal] = useState<HistoricoModal>(null);
  const [novaDividaModal, setNovaDividaModal] = useState<NovaDividaModal>(false);
  const [pgtoForm, setPgtoForm] = useState({ valor: "", formaPagamento: "DINHEIRO", obs: "" });
  const [savingPgto, setSavingPgto] = useState(false);
  const [novaDividaForm, setNovaDividaForm] = useState({ clienteId: "", descricao: "", valor: "" });
  const [savingDivida, setSavingDivida] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [osRes, dividasRes] = await Promise.all([
        fetch("/api/os?pendente=true"),
        fetch("/api/dividas"),
      ]);
      type OSRaw = OSPendente & { clienteId: string; cliente: { id: string; nome: string; apelido: string | null; telefone: string | null } };
      type DividaRaw = DividaAvulsa & { clienteId: string; cliente: { id: string; nome: string; apelido: string | null; telefone: string | null } };
      const ordens: OSRaw[] = await osRes.json();
      const dividas: DividaRaw[] = await dividasRes.json();

      // Agrupar por cliente
      const map = new Map<string, ClienteDevedor>();

      for (const os of ordens) {
        const saldo = os.total - os.valorPago;
        if (saldo <= 0) continue;
        const c = os.cliente;
        if (!map.has(c.id)) {
          map.set(c.id, {
            id: c.id, nome: c.nome, apelido: c.apelido, telefone: c.telefone,
            veiculos: [],
            ordens: [], dividasAvulsas: [], totalSaldo: 0, diasEmAberto: 0,
          });
        }
        const entry = map.get(c.id)!;
        entry.ordens.push(os);
        entry.totalSaldo += saldo;
        // Acumular veículos únicos a partir das OSs
        const v = os.veiculo;
        if (!entry.veiculos.some((x) => x.placa === v.placa && x.marca === v.marca && x.modelo === v.modelo)) {
          entry.veiculos.push(v);
        }
      }

      for (const div of dividas) {
        const saldo = div.valor - div.valorPago;
        if (saldo <= 0) continue;
        const c = div.cliente;
        if (!map.has(c.id)) {
          map.set(c.id, {
            id: c.id, nome: c.nome, apelido: c.apelido, telefone: c.telefone,
            veiculos: [],
            ordens: [], dividasAvulsas: [], totalSaldo: 0, diasEmAberto: 0,
          });
        }
        const entry = map.get(c.id)!;
        entry.dividasAvulsas.push(div);
        entry.totalSaldo += saldo;
      }

      // Calcular dias em aberto
      const now = Date.now();
      for (const [, entry] of map) {
        const allDates = [
          ...entry.ordens.map((o) => new Date(o.abertura).getTime()),
          ...entry.dividasAvulsas.map((d) => new Date(d.createdAt).getTime()),
        ];
        if (allDates.length > 0) {
          const oldest = Math.min(...allDates);
          entry.diasEmAberto = Math.floor((now - oldest) / 86400000);
        }
      }

      const sorted = [...map.values()].sort((a, b) => b.totalSaldo - a.totalSaldo);
      setClientes(sorted);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then((data: { id: string; nome: string }[]) => setAllClientes(data));
  }, []);

  const filtered = clientes.filter((c) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      c.nome.toLowerCase().includes(t) ||
      (c.apelido?.toLowerCase().includes(t)) ||
      c.ordens.some((o) => o.veiculo.placa?.toLowerCase().includes(t) || String(o.numero).includes(t))
    );
  });

  const totalAReceber = clientes.reduce((s, c) => s + c.totalSaldo, 0);
  const totalDevedores = clientes.length;
  const totalOSPend = clientes.reduce((s, c) => s + c.ordens.length, 0);
  const totalDivAvulsas = clientes.reduce((s, c) => s + c.dividasAvulsas.length, 0);

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

  return (
    <div className="p-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm shadow-lg">
          {toastMsg}
        </div>
      )}

      {/* Modais */}
      {modalPgto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-zinc-900">Registrar recebimento</h3>
            <form onSubmit={submitPgto} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor (R$) *</label>
                <input type="number" min="0.01" step="0.01" value={pgtoForm.valor} onChange={(e) => setPgtoForm({ ...pgtoForm, valor: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Forma de pagamento</label>
                <select value={pgtoForm.formaPagamento} onChange={(e) => setPgtoForm({ ...pgtoForm, formaPagamento: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {FORMAS_PGTO.map((f) => <option key={f} value={f}>{FORMAS_LABEL[f]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Observação</label>
                <input value={pgtoForm.obs} onChange={(e) => setPgtoForm({ ...pgtoForm, obs: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
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
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-semibold text-zinc-900">Histórico de pagamentos</h3>
            {historicoModal.pagamentos.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhum pagamento registrado.</p>
            ) : (
              <div className="space-y-2">
                {historicoModal.pagamentos.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm border-b border-zinc-100 pb-2">
                    <div>
                      <span className="font-medium text-zinc-900">{formatCurrency(p.valor)}</span>
                      <span className="text-zinc-400 ml-2">{FORMAS_LABEL[p.formaPagamento] || p.formaPagamento}</span>
                      {p.obs && <span className="text-zinc-400 ml-1">· {p.obs}</span>}
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0 ml-2">{formatDatetime(p.data)}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-zinc-900">Nova dívida avulsa</h3>
            <form onSubmit={submitNovaDivida} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Cliente *</label>
                <select value={novaDividaForm.clienteId} onChange={(e) => setNovaDividaForm({ ...novaDividaForm, clienteId: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Selecionar...</option>
                  {allClientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Descrição *</label>
                <input value={novaDividaForm.descricao} onChange={(e) => setNovaDividaForm({ ...novaDividaForm, descricao: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor (R$) *</label>
                <input type="number" min="0.01" step="0.01" value={novaDividaForm.valor} onChange={(e) => setNovaDividaForm({ ...novaDividaForm, valor: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingDivida} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Contas a Receber</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Pendências agrupadas por cliente</p>
        </div>
        <button onClick={() => setNovaDividaModal(true)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          + Nova dívida avulsa
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total a receber" value={formatCurrency(totalAReceber)} highlight />
        <SummaryCard label="Clientes devedores" value={String(totalDevedores)} />
        <SummaryCard label="OSs pendentes" value={String(totalOSPend)} />
        <SummaryCard label="Dívidas avulsas" value={String(totalDivAvulsas)} />
      </div>

      {/* Busca e toggles */}
      <div className="flex gap-3 mb-4 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, apelido, placa, #OS..."
          className="flex-1 max-w-sm rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input type="checkbox" checked={mostrarQuitados} onChange={(e) => setMostrarQuitados(e.target.checked)} className="rounded" />
          Mostrar quitados recentemente
        </label>
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          Nenhuma conta a receber. Tudo quitado!
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
                        {c.diasEmAberto > 30 && (
                          <span className="text-xs text-red-600 font-medium">{c.diasEmAberto}d em aberto</span>
                        )}
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
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">Total</p>
                    <p className="font-bold text-red-600">{formatCurrency(c.totalSaldo)}</p>
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
                        <div key={os.id} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <Link href={`/os/${os.id}`} className="font-medium text-red-600 hover:underline shrink-0">#{os.numero}</Link>
                              <span className="text-zinc-500 truncate">
                                {os.veiculo.marca} {os.veiculo.modelo}
                                {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
                              </span>
                              <span className="text-zinc-400 shrink-0 text-xs">
                                {STATUS_LABEL[os.status] || os.status} · {diasOS}d
                                {atrasada && <span className="text-red-600 ml-1">⚠</span>}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="font-semibold text-red-600 text-sm">{formatCurrency(saldo)}</span>
                            <button
                              onClick={() => openHistorico("os", os.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                            >
                              Histórico
                            </button>
                            <button
                              onClick={() => openPgto("os", os.id, saldo)}
                              className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
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
                        <div key={div.id} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-800 truncate">{div.descricao}</p>
                            <p className="text-xs text-zinc-400">Há {dias} dias · {formatDate(div.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="font-semibold text-red-600 text-sm">{formatCurrency(saldo)}</span>
                            <button
                              onClick={() => openHistorico("divida", div.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                            >
                              Histórico
                            </button>
                            <button
                              onClick={() => openPgto("divida", div.id, saldo)}
                              className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                            >
                              Receber
                            </button>
                            <button
                              onClick={() => deleteDivida(div.id)}
                              className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"
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
