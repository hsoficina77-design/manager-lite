"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatCurrency, formatDate, formatDatetime } from "@/lib/utils";

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number; custoUnit: number | null;
};
type Pagamento = {
  id: string; valor: number; formaPagamento: string; data: string; obs: string | null;
};
type OS = {
  id: string; numero: number; status: string; descricao: string;
  kmEntrada: number | null; kmSaida: number | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  pago: boolean; valorPago: number; formaPagamento: string | null; obs: string | null;
  mecanico: string | null; nivelCombustivel: string | null; combustivelEmUso: string | null;
  custoTotalPecas: number; lucroReal: number; margemPecas: number;
  abertura: string; fechamento: string | null;
  cliente: { id: string; nome: string; telefone: string | null };
  veiculo: { id: string; marca: string; modelo: string; placa: string | null; ano: number | null };
  itens: Item[];
  pagamentos: Pagamento[];
};

const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta", EM_ANDAMENTO: "Em Andamento", AGUARDANDO_PECA: "Ag. Peça",
  PRONTA: "Pronta", FECHADA: "Fechada", ENTREGUE: "Entregue", CANCELADA: "Cancelada",
};
const STATUS_COLOR: Record<string, string> = {
  ABERTA: "bg-zinc-200 text-zinc-700",
  EM_ANDAMENTO: "bg-zinc-800 text-zinc-100",
  AGUARDANDO_PECA: "bg-zinc-300 text-zinc-800",
  PRONTA: "bg-zinc-900 text-white",
  FECHADA: "bg-zinc-600 text-white",
  ENTREGUE: "bg-zinc-100 text-zinc-500",
  CANCELADA: "bg-red-100 text-red-700",
};
const NEXT_STATUS: Record<string, { label: string; value: string; color: string }[]> = {
  ABERTA: [
    { label: "Iniciar", value: "EM_ANDAMENTO", color: "bg-zinc-800 hover:bg-zinc-900 text-white" },
    { label: "Cancelar", value: "CANCELADA", color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  EM_ANDAMENTO: [
    { label: "Ag. Peça", value: "AGUARDANDO_PECA", color: "bg-zinc-500 hover:bg-zinc-600 text-white" },
    { label: "Pronta", value: "PRONTA", color: "bg-zinc-700 hover:bg-zinc-800 text-white" },
    { label: "Cancelar", value: "CANCELADA", color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  AGUARDANDO_PECA: [
    { label: "Retomar", value: "EM_ANDAMENTO", color: "bg-zinc-600 hover:bg-zinc-700 text-white" },
    { label: "Pronta", value: "PRONTA", color: "bg-zinc-800 hover:bg-zinc-900 text-white" },
    { label: "Cancelar", value: "CANCELADA", color: "bg-red-100 hover:bg-red-200 text-red-700" },
  ],
  PRONTA: [
    { label: "Fechar", value: "FECHADA", color: "bg-zinc-700 hover:bg-zinc-800 text-white" },
    { label: "Entregar", value: "ENTREGUE", color: "bg-black hover:bg-zinc-900 text-white" },
  ],
  FECHADA: [
    { label: "Entregar", value: "ENTREGUE", color: "bg-black hover:bg-zinc-900 text-white" },
  ],
  ENTREGUE: [],
  CANCELADA: [],
};

const FORMAS_PGTO = ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA"];
const FORMAS_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro", PIX: "PIX",
  CARTAO_CREDITO: "Cartão Crédito", CARTAO_DEBITO: "Cartão Débito", TRANSFERENCIA: "Transferência",
};

export default function OSDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [os, setOs] = useState<OS | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemForm, setItemForm] = useState({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
  const [savingItem, setSavingItem] = useState(false);
  const [pgtoForm, setPgtoForm] = useState({ valor: "", formaPagamento: "DINHEIRO", obs: "" });
  const [savingPgto, setSavingPgto] = useState(false);
  const [showPgto, setShowPgto] = useState(false);
  const [deletingOS, setDeletingOS] = useState(false);

  const load = () =>
    fetch(`/api/os/${id}`)
      .then((r) => r.json())
      .then((data: OS) => {
        setOs(data);
        const saldo = data.total - data.valorPago;
        if (saldo > 0) setPgtoForm((f) => ({ ...f, valor: saldo.toFixed(2) }));
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  async function changeStatus(status: string) {
    await fetch(`/api/os/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const itemMargem =
    itemForm.tipo === "PECA" && Number(itemForm.valorUnit) > 0 && Number(itemForm.custoUnit) > 0
      ? ((Number(itemForm.valorUnit) - Number(itemForm.custoUnit)) / Number(itemForm.valorUnit)) * 100
      : null;

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemForm.descricao.trim() || !itemForm.valorUnit) return;
    setSavingItem(true);
    try {
      await fetch(`/api/os/${id}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: itemForm.tipo,
          descricao: itemForm.descricao,
          quantidade: Number(itemForm.quantidade),
          valorUnit: Number(itemForm.valorUnit),
          custoUnit: itemForm.custoUnit ? Number(itemForm.custoUnit) : undefined,
        }),
      });
      setItemForm({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
      load();
    } finally {
      setSavingItem(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!confirm("Remover este item?")) return;
    await fetch(`/api/os/${id}/itens?itemId=${itemId}`, { method: "DELETE" });
    load();
  }

  async function registerPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!pgtoForm.valor || Number(pgtoForm.valor) <= 0) return;
    setSavingPgto(true);
    try {
      await fetch(`/api/os/${id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pgtoForm),
      });
      setShowPgto(false);
      load();
    } finally {
      setSavingPgto(false);
    }
  }

  async function deleteOS() {
    if (!confirm("Excluir esta OS? Esta ação não pode ser desfeita.")) return;
    setDeletingOS(true);
    await fetch(`/api/os/${id}`, { method: "DELETE" });
    router.push("/os");
  }

  if (loading) return <div className="p-6 text-sm text-zinc-400">Carregando...</div>;
  if (!os) return <div className="p-6 text-sm text-zinc-400">OS não encontrada.</div>;

  const saldo = os.total - os.valorPago;
  const receitasMO = os.totalMO;
  const margemValor = os.totalPecas - os.custoTotalPecas;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <style>{`@media print { .no-print { display: none !important; } aside { display: none !important; } }`}</style>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/os" className="text-sm text-zinc-500 hover:text-zinc-700 no-print">← OS</Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-zinc-900">OS #{os.numero}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLOR[os.status])}>
              {STATUS_LABEL[os.status]}
            </span>
            {os.formaPagamento && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
                {FORMAS_LABEL[os.formaPagamento] || os.formaPagamento}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            <Link href={`/clientes/${os.cliente.id}`} className="hover:underline font-medium text-zinc-700">
              {os.cliente.nome}
            </Link>
            {" · "}{os.veiculo.marca} {os.veiculo.modelo}
            {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
            {os.mecanico ? ` · Mec: ${os.mecanico}` : ""}
            {" · "}{formatDate(os.abertura)}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Imprimir
          </button>
          <button onClick={deleteOS} disabled={deletingOS} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 shrink-0">
            Excluir
          </button>
        </div>
      </div>

      {/* Ações de status */}
      {(NEXT_STATUS[os.status]?.length ?? 0) > 0 && (
        <div className="flex gap-2 no-print">
          {NEXT_STATUS[os.status].map((btn) => (
            <button key={btn.value} onClick={() => changeStatus(btn.value)} className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-colors", btn.color)}>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Descrição */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-2">
        <p className="text-sm font-medium text-zinc-500">Descrição do serviço</p>
        <p className="text-zinc-900">{os.descricao}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-500">
          {os.kmEntrada && <span>KM entrada: {os.kmEntrada.toLocaleString("pt-BR")}</span>}
          {os.kmSaida && <span>KM saída: {os.kmSaida.toLocaleString("pt-BR")}</span>}
          {os.nivelCombustivel && <span>Combustível: {os.nivelCombustivel}</span>}
          {os.combustivelEmUso && <span>Em uso: {os.combustivelEmUso}</span>}
          {os.obs && <span>Obs: {os.obs}</span>}
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <h2 className="font-semibold text-zinc-800">Itens</h2>

        {os.itens.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-400 border-b border-zinc-100">
                <th className="text-left pb-2 font-medium">Tipo</th>
                <th className="text-left pb-2 font-medium">Descrição</th>
                <th className="text-right pb-2 font-medium">Qtd</th>
                <th className="text-right pb-2 font-medium">Unit</th>
                <th className="text-right pb-2 font-medium">Total</th>
                <th className="pb-2 no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {os.itens.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 text-xs text-zinc-500">{item.tipo === "PECA" ? "Peça" : item.tipo === "MAO_DE_OBRA" ? "M.O." : "Serviço"}</td>
                  <td className="py-2 text-zinc-800">{item.descricao}</td>
                  <td className="py-2 text-right text-zinc-600">{item.quantidade}</td>
                  <td className="py-2 text-right text-zinc-600">{formatCurrency(item.valorUnit)}</td>
                  <td className="py-2 text-right font-medium text-zinc-900">{formatCurrency(item.valorTotal)}</td>
                  <td className="py-2 pl-2 no-print">
                    <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Adicionar item */}
        {os.status !== "ENTREGUE" && os.status !== "CANCELADA" && (
          <form onSubmit={addItem} className="grid grid-cols-12 gap-2 items-end border-t border-zinc-100 pt-4 no-print">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Tipo</label>
              <select value={itemForm.tipo} onChange={(e) => setItemForm({ ...itemForm, tipo: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="PECA">Peça</option>
                <option value="MAO_DE_OBRA">M.O.</option>
                <option value="SERVICO">Serviço</option>
              </select>
            </div>
            <div className={itemForm.tipo === "PECA" ? "col-span-3" : "col-span-5"}>
              <label className="block text-xs text-zinc-500 mb-1">Descrição</label>
              <input value={itemForm.descricao} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} placeholder="Ex: Filtro de óleo" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="col-span-1">
              <label className="block text-xs text-zinc-500 mb-1">Qtd</label>
              <input type="number" min="0.01" step="0.01" value={itemForm.quantidade} onChange={(e) => setItemForm({ ...itemForm, quantidade: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">V. Unit (R$)</label>
              <input type="number" min="0" step="0.01" value={itemForm.valorUnit} onChange={(e) => setItemForm({ ...itemForm, valorUnit: e.target.value })} placeholder="0,00" className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            {itemForm.tipo === "PECA" && (
              <div className="col-span-2">
                <label className="block text-xs text-zinc-500 mb-1">
                  Custo unit.
                  {itemMargem !== null && (
                    <span className={`ml-1 font-medium ${itemMargem >= 0 ? "text-green-600" : "text-red-500"}`}>
                      ({itemMargem.toFixed(0)}%)
                    </span>
                  )}
                </label>
                <input type="number" min="0" step="0.01" value={itemForm.custoUnit} onChange={(e) => setItemForm({ ...itemForm, custoUnit: e.target.value })} placeholder="0,00" className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            )}
            <div className="col-span-2">
              <button type="submit" disabled={savingItem} className="w-full rounded-lg bg-zinc-800 py-2 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-50">+</button>
            </div>
          </form>
        )}

        {/* Totais de itens */}
        {(os.totalPecas > 0 || os.totalMO > 0) && (
          <div className="border-t border-zinc-100 pt-3 space-y-1 text-sm">
            {os.totalPecas > 0 && <div className="flex justify-between text-zinc-500"><span>Peças</span><span>{formatCurrency(os.totalPecas)}</span></div>}
            {os.totalMO > 0 && <div className="flex justify-between text-zinc-500"><span>Mão de obra / Serviços</span><span>{formatCurrency(os.totalMO)}</span></div>}
            {os.desconto > 0 && <div className="flex justify-between text-red-500"><span>Desconto</span><span>- {formatCurrency(os.desconto)}</span></div>}
            <div className="flex justify-between font-bold text-zinc-900 text-base pt-1 border-t border-zinc-100">
              <span>Total</span><span>{formatCurrency(os.total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Financeiro */}
      {(os.custoTotalPecas > 0 || os.totalPecas > 0) && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-2">
          <h2 className="font-semibold text-zinc-800">Financeiro</h2>
          <div className="space-y-1.5 text-sm">
            {os.custoTotalPecas > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Custo total das peças</span>
                <span>{formatCurrency(os.custoTotalPecas)}</span>
              </div>
            )}
            {os.totalPecas > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Margem em peças</span>
                <span>
                  {formatCurrency(margemValor)}
                  {os.totalPecas > 0 && (
                    <span className={cn("ml-1 text-xs", os.margemPecas >= 0 ? "text-green-600" : "text-red-500")}>
                      ({os.margemPecas.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            )}
            {os.totalMO > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Receita M.O. / Serviços</span>
                <span>{formatCurrency(receitasMO)}</span>
              </div>
            )}
            {os.desconto > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Desconto</span>
                <span>- {formatCurrency(os.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-green-700 pt-1 border-t border-zinc-100">
              <span>Lucro real</span>
              <span>{formatCurrency(os.lucroReal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pagamento */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">Pagamento</h2>
          {saldo > 0 && (
            <button onClick={() => setShowPgto(!showPgto)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 no-print">
              {showPgto ? "Cancelar" : "Registrar Pagamento"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-zinc-400">Total</p>
            <p className="text-lg font-bold text-zinc-900">{formatCurrency(os.total)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Pago</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(os.valorPago)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Saldo</p>
            <p className={cn("text-lg font-bold", saldo > 0 ? "text-red-600" : "text-green-600")}>
              {formatCurrency(saldo)}
            </p>
          </div>
        </div>

        {os.pago && <p className="text-sm text-green-600 font-medium">✓ Pagamento quitado</p>}

        {showPgto && (
          <form onSubmit={registerPayment} className="border-t border-zinc-100 pt-4 space-y-3 no-print">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Valor (R$) *</label>
                <input type="number" min="0.01" step="0.01" value={pgtoForm.valor} onChange={(e) => setPgtoForm({ ...pgtoForm, valor: e.target.value })} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Forma</label>
                <select value={pgtoForm.formaPagamento} onChange={(e) => setPgtoForm({ ...pgtoForm, formaPagamento: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {FORMAS_PGTO.map((f) => <option key={f} value={f}>{FORMAS_LABEL[f]}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Obs</label>
                <input value={pgtoForm.obs} onChange={(e) => setPgtoForm({ ...pgtoForm, obs: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
            <button type="submit" disabled={savingPgto} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
              {savingPgto ? "Registrando..." : "Confirmar Pagamento"}
            </button>
          </form>
        )}

        {os.pagamentos.length > 0 && (
          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium text-zinc-500 mb-2">Histórico</p>
            <div className="space-y-1.5">
              {os.pagamentos.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-zinc-700 font-medium">{formatCurrency(p.valor)}</span>
                    <span className="text-zinc-400 ml-2">{FORMAS_LABEL[p.formaPagamento] || p.formaPagamento}</span>
                    {p.obs && <span className="text-zinc-400 ml-2">· {p.obs}</span>}
                  </div>
                  <span className="text-xs text-zinc-400">{formatDatetime(p.data)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
