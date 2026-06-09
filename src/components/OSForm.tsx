"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type Cliente = { id: string; nome: string; telefone: string | null };
type Mecanico = { id: string; nome: string; especialidade: string | null };
type Veiculo = {
  id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
  combustivel: string | null;
};
export type ItemForm = {
  tipo: string; descricao: string; quantidade: string;
  valorUnit: string; custoUnit: string;
};

export type OSFormInitial = {
  clienteId: string;
  veiculoId: string;
  descricao: string;
  kmEntrada: string;
  obs: string;
  mecanicoId: string;
  nivelCombustivel: string;
  combustivelEmUso: string;
  itens: ItemForm[];
};

export default function OSForm({
  mode,
  osId,
  initial,
}: {
  mode: "create" | "edit";
  osId?: string;
  initial?: OSFormInitial;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preClienteId = initial?.clienteId ?? searchParams.get("clienteId") ?? "";
  const preVeiculoId = initial?.veiculoId ?? searchParams.get("veiculoId") ?? "";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [clienteId, setClienteId] = useState(preClienteId);
  const [veiculoId, setVeiculoId] = useState(preVeiculoId);
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [kmEntrada, setKmEntrada] = useState(initial?.kmEntrada ?? "");
  const [obs, setObs] = useState(initial?.obs ?? "");
  const [mecanicoId, setMecanicoId] = useState(initial?.mecanicoId ?? "");
  const [nivelCombustivel, setNivelCombustivel] = useState(initial?.nivelCombustivel ?? "");
  const [combustivelEmUso, setCombustivelEmUso] = useState(initial?.combustivelEmUso ?? "");
  const [itens, setItens] = useState<ItemForm[]>(initial?.itens ?? []);
  const [itemForm, setItemForm] = useState<ItemForm>({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
  const [itemError, setItemError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then(setClientes);
    fetch("/api/mecanicos?ativo=true").then((r) => r.json()).then(setMecanicos);
  }, []);

  useEffect(() => {
    if (!clienteId) { setVeiculos([]); setVeiculoId(""); return; }
    fetch(`/api/veiculos?clienteId=${clienteId}`)
      .then((r) => r.json())
      .then((data) => {
        setVeiculos(data);
        if (preVeiculoId && data.some((v: Veiculo) => v.id === preVeiculoId)) {
          setVeiculoId(preVeiculoId);
        } else if (data.length === 1) {
          setVeiculoId(data[0].id);
        } else {
          setVeiculoId("");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const selectedVeiculo = veiculos.find((v) => v.id === veiculoId);
  const showCombUso = ["FLEX", "HIBRIDO"].includes(selectedVeiculo?.combustivel || "");

  function addItem() {
    if (!itemForm.descricao.trim()) { setItemError("Informe a descrição do item."); return; }
    if (!itemForm.valorUnit) { setItemError("Informe o valor unitário."); return; }
    setItemError("");
    setItens([...itens, { ...itemForm }]);
    setItemForm({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
  }

  function removeItem(idx: number) {
    setItens(itens.filter((_, i) => i !== idx));
  }

  const totalPecas = itens.filter((i) => i.tipo === "PECA").reduce((s, i) => s + Number(i.quantidade) * Number(i.valorUnit), 0);
  const totalMO = itens.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + Number(i.quantidade) * Number(i.valorUnit), 0);
  const total = totalPecas + totalMO;

  const itemMargem =
    itemForm.tipo === "PECA" && Number(itemForm.valorUnit) > 0 && Number(itemForm.custoUnit) > 0
      ? ((Number(itemForm.valorUnit) - Number(itemForm.custoUnit)) / Number(itemForm.valorUnit)) * 100
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId || !veiculoId || !descricao.trim()) {
      setError("Cliente, veículo e descrição são obrigatórios.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const itensPayload = itens.map((i) => ({
        tipo: i.tipo,
        descricao: i.descricao,
        quantidade: Number(i.quantidade),
        valorUnit: Number(i.valorUnit),
        valorTotal: Number(i.quantidade) * Number(i.valorUnit),
        custoUnit: i.custoUnit ? Number(i.custoUnit) : undefined,
      }));

      if (mode === "edit") {
        const res = await fetch(`/api/os/${osId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId, veiculoId, descricao,
            kmEntrada,
            obs,
            mecanicoId,
            nivelCombustivel,
            combustivelEmUso,
            itens: itensPayload,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Erro ao salvar OS"); return; }
        router.push(`/os/${osId}`);
        return;
      }

      const res = await fetch("/api/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId, veiculoId, descricao,
          kmEntrada: kmEntrada || undefined,
          obs: obs || undefined,
          mecanicoId: mecanicoId || undefined,
          nivelCombustivel: nivelCombustivel || undefined,
          combustivelEmUso: combustivelEmUso || undefined,
          itens: itensPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao criar OS"); return; }
      router.push(`/os/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500";
  const isEdit = mode === "edit";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={isEdit && osId ? `/os/${osId}` : "/os"} className="text-sm text-zinc-500 hover:text-zinc-700">← Voltar</Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">{isEdit ? "Editar OS" : "Nova OS"}</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Cliente e Veículo */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <h2 className="font-semibold text-zinc-800">Cliente e Veículo</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Cliente *</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required className={inputCls}>
              <option value="">Selecionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}{c.telefone ? ` · ${c.telefone}` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Veículo *</label>
            <select value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} required disabled={!clienteId || veiculos.length === 0} className={inputCls + " disabled:bg-zinc-50 disabled:text-zinc-400"}>
              <option value="">{!clienteId ? "Selecione um cliente primeiro" : veiculos.length === 0 ? "Nenhum veículo cadastrado" : "Selecionar veículo..."}</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.marca} {v.modelo}{v.placa ? ` · ${v.placa}` : ""}{v.ano ? ` (${v.ano})` : ""}</option>
              ))}
            </select>
            {clienteId && veiculos.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Cliente sem veículo.{" "}
                <Link href={`/clientes/${clienteId}`} className="underline">Adicionar veículo</Link>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição do serviço *</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} required rows={3} placeholder="Ex: Revisão geral, troca de óleo e filtros..." className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">KM de Entrada</label>
              <input type="number" value={kmEntrada} onChange={(e) => setKmEntrada(e.target.value)} placeholder="Ex: 52000" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Observações</label>
              <input value={obs} onChange={(e) => setObs(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Mecânico */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
          <h2 className="font-semibold text-zinc-800">Mecânico</h2>
          {mecanicos.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Responsável</label>
              <select value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)} className={inputCls}>
                <option value="">— Não atribuído</option>
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}{m.especialidade ? ` · ${m.especialidade}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Nenhum mecânico cadastrado.{" "}
              <Link href="/mecanicos" className="text-red-600 underline">Cadastrar mecânico</Link>
            </p>
          )}
        </div>

        {/* Recepção do veículo */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
          <h2 className="font-semibold text-zinc-800">Recepção do veículo</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nível de combustível</label>
              <select value={nivelCombustivel} onChange={(e) => setNivelCombustivel(e.target.value)} className={inputCls}>
                <option value="">Selecione...</option>
                <option value="CHEIO">Cheio</option>
                <option value="MEIO">Meio</option>
                <option value="VAZIO">Vazio</option>
              </select>
            </div>
            {showCombUso && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Combustível em uso</label>
                <select value={combustivelEmUso} onChange={(e) => setCombustivelEmUso(e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  <option value="GASOLINA">Gasolina</option>
                  <option value="ETANOL">Etanol</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <h2 className="font-semibold text-zinc-800">Itens</h2>

          <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Tipo</label>
              <select value={itemForm.tipo} onChange={(e) => setItemForm({ ...itemForm, tipo: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="PECA">Peça</option>
                <option value="MAO_DE_OBRA">M.O.</option>
                <option value="SERVICO">Serviço</option>
              </select>
            </div>
            <div className={itemForm.tipo === "PECA" ? "col-span-2 sm:col-span-3" : "col-span-2 sm:col-span-5"}>
              <label className="block text-xs text-zinc-500 mb-1">Descrição</label>
              <input value={itemForm.descricao} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} placeholder="Ex: Filtro de óleo" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())} />
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs text-zinc-500 mb-1">Qtd</label>
              <input type="number" min="0.01" step="0.01" value={itemForm.quantidade} onChange={(e) => setItemForm({ ...itemForm, quantidade: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">V. Unit (R$)</label>
              <input type="number" min="0" step="0.01" value={itemForm.valorUnit} onChange={(e) => setItemForm({ ...itemForm, valorUnit: e.target.value })} placeholder="0,00" className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())} />
            </div>
            {itemForm.tipo === "PECA" && (
              <div className="col-span-2 sm:col-span-2">
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
            <div className="col-span-2 sm:col-span-2">
              <button type="button" onClick={addItem} className="w-full rounded-lg bg-zinc-800 py-2.5 text-sm font-bold text-white hover:bg-zinc-700">+ Adicionar</button>
            </div>
          </div>

          {itemError && <p className="text-xs text-red-500">{itemError}</p>}

          {itens.length > 0 && (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[28rem]">
              <thead>
                <tr className="text-xs text-zinc-400 border-b border-zinc-100">
                  <th className="text-left pb-2 font-medium">Tipo</th>
                  <th className="text-left pb-2 font-medium">Descrição</th>
                  <th className="text-right pb-2 font-medium">Qtd</th>
                  <th className="text-right pb-2 font-medium">Unit</th>
                  <th className="text-right pb-2 font-medium">Total</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {itens.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 text-zinc-500 text-xs">{item.tipo === "PECA" ? "Peça" : item.tipo === "MAO_DE_OBRA" ? "M.O." : "Serviço"}</td>
                    <td className="py-1.5 text-zinc-800">{item.descricao}</td>
                    <td className="py-1.5 text-right text-zinc-600">{item.quantidade}</td>
                    <td className="py-1.5 text-right text-zinc-600">{formatCurrency(Number(item.valorUnit))}</td>
                    <td className="py-1.5 text-right font-medium text-zinc-900">{formatCurrency(Number(item.quantidade) * Number(item.valorUnit))}</td>
                    <td className="py-1.5 pl-2">
                      <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {itens.length > 0 && (
            <div className="border-t border-zinc-100 pt-3 space-y-1 text-sm text-right">
              {totalPecas > 0 && <div className="flex justify-between text-zinc-500"><span>Peças</span><span>{formatCurrency(totalPecas)}</span></div>}
              {totalMO > 0 && <div className="flex justify-between text-zinc-500"><span>Mão de obra / Serviços</span><span>{formatCurrency(totalMO)}</span></div>}
              <div className="flex justify-between font-bold text-zinc-900 text-base pt-1 border-t border-zinc-100">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-lg bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
          {saving ? (isEdit ? "Salvando..." : "Criando OS...") : (isEdit ? "Salvar alterações" : "Criar OS")}
        </button>
      </form>
    </div>
  );
}
