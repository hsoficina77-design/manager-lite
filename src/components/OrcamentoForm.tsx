"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { COMBUSTIVEIS, COMBUSTIVEIS_BICOMBUSTIVEL, COMBUSTIVEL_EM_USO } from "@/lib/constants";

type Cliente = { id: string; nome: string; telefone: string | null };
type Veiculo = {
  id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
};
export type ItemForm = {
  tipo: string; descricao: string; quantidade: string;
  valorUnit: string; custoUnit: string;
};

export type OrcamentoFormInitial = {
  clienteId: string;
  veiculoId: string;
  clienteNome: string;
  clienteTelefone: string;
  veiculoDesc: string;
  descricao: string;
  validade: string;
  obs: string;
  itens: ItemForm[];
};

export default function OrcamentoForm({
  mode,
  orcamentoId,
  initial,
}: {
  mode: "create" | "edit";
  orcamentoId?: string;
  initial?: OrcamentoFormInitial;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preClienteId = initial?.clienteId ?? searchParams.get("clienteId") ?? "";
  const preVeiculoId = initial?.veiculoId ?? searchParams.get("veiculoId") ?? "";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clienteId, setClienteId] = useState(preClienteId);
  const [veiculoId, setVeiculoId] = useState(preVeiculoId);
  // Identificação livre do rascunho — só usada enquanto não há cliente cadastrado.
  const [clienteNome, setClienteNome] = useState(initial?.clienteNome ?? "");
  const [clienteTelefone, setClienteTelefone] = useState(initial?.clienteTelefone ?? "");
  const [veiculoDesc, setVeiculoDesc] = useState(initial?.veiculoDesc ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [validade, setValidade] = useState(initial?.validade ?? "");
  const [obs, setObs] = useState(initial?.obs ?? "");
  const [itens, setItens] = useState<ItemForm[]>(initial?.itens ?? []);
  const [itemForm, setItemForm] = useState<ItemForm>({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
  const [itemError, setItemError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Cadastro rápido de cliente (sem sair da tela)
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [savingCliente, setSavingCliente] = useState(false);
  const [clienteErro, setClienteErro] = useState("");
  const [novoCliente, setNovoCliente] = useState({
    nome: "", telefone: "", apelido: "",
  });
  const [novoVeiculo, setNovoVeiculo] = useState({
    marca: "", modelo: "", placa: "", cor: "", ano: "",
    cilindrada: "", combustivel: "", combustivelEmUso: "",
  });

  useEffect(() => {
    fetch("/api/clientes").then((r) => r.json()).then(setClientes);
  }, []);

  function abrirNovoCliente() {
    // Aproveita o que já foi anotado no rascunho para não redigitar.
    setNovoCliente({ nome: clienteNome.trim(), telefone: clienteTelefone.trim(), apelido: "" });
    setNovoVeiculo({ marca: "", modelo: "", placa: "", cor: "", ano: "", cilindrada: "", combustivel: "", combustivelEmUso: "" });
    setClienteErro("");
    setShowNovoCliente(true);
  }

  async function salvarNovoCliente(e: React.FormEvent) {
    e.preventDefault();
    if (!novoCliente.nome.trim()) { setClienteErro("Informe o nome do cliente."); return; }
    const temVeiculo = novoVeiculo.marca.trim() && novoVeiculo.modelo.trim();
    // Veículo é tudo-ou-nada: se começou a preencher, marca e modelo são obrigatórios.
    const veiculoIniciado = Object.values(novoVeiculo).some((v) => v.trim());
    if (veiculoIniciado && !temVeiculo) {
      setClienteErro("Para cadastrar o veículo, informe ao menos marca e modelo.");
      return;
    }
    setClienteErro("");
    setSavingCliente(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoCliente.nome,
          telefone: novoCliente.telefone || undefined,
          apelido: novoCliente.apelido || undefined,
          ...(temVeiculo ? { veiculo: novoVeiculo } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setClienteErro(data.error || "Erro ao criar cliente"); return; }
      // Adiciona à lista e seleciona; o veículo (se houver) é buscado pelo efeito de clienteId.
      setClientes((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setClienteId(data.id);
      setShowNovoCliente(false);
    } finally {
      setSavingCliente(false);
    }
  }

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

  function addItem() {
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
    if (!clienteId && !clienteNome.trim()) {
      setError("Selecione um cliente cadastrado ou escreva um nome de referência.");
      return;
    }
    if (!descricao.trim() && itens.length === 0) {
      setError("Descreva o serviço ou adicione ao menos um item.");
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
        const res = await fetch(`/api/orcamentos/${orcamentoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId: clienteId || null, veiculoId: veiculoId || null, descricao,
            clienteNome, clienteTelefone, veiculoDesc,
            validade: validade || null,
            obs,
            itens: itensPayload,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Erro ao salvar orçamento"); return; }
        router.push(`/orcamentos/${orcamentoId}`);
        return;
      }

      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clienteId || undefined, veiculoId: veiculoId || undefined, descricao,
          clienteNome, clienteTelefone, veiculoDesc,
          validade: validade || undefined,
          obs: obs || undefined,
          itens: itensPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao criar orçamento"); return; }
      router.push(`/orcamentos/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500";
  const isEdit = mode === "edit";

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={isEdit && orcamentoId ? `/orcamentos/${orcamentoId}` : "/orcamentos"} className="text-sm text-zinc-500 hover:text-zinc-700">← Voltar</Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">{isEdit ? "Editar Orçamento" : "Novo Orçamento"}</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Cliente e Veículo */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <h2 className="font-semibold text-zinc-800">Cliente e Veículo</h2>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-zinc-700">Cliente</label>
              <button
                type="button"
                onClick={abrirNovoCliente}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                + Novo cliente
              </button>
            </div>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputCls}>
              <option value="">Sem cadastro — anotar só o nome</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}{c.telefone ? ` · ${c.telefone}` : ""}</option>
              ))}
            </select>
          </div>

          {/* Rascunho: identificação livre enquanto o cliente não está cadastrado. */}
          {!clienteId && (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 space-y-3">
              <p className="text-xs text-zinc-500">
                Orçamento em rascunho — anote o que souber. O cadastro completo só é
                exigido na hora de converter em OS.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Nome ou referência *</label>
                  <input
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Ex: Nilcio do Fusca azul"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Telefone</label>
                  <input
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    placeholder="(11) 90000-0000"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Veículo</label>
            <select value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} disabled={!clienteId || veiculos.length === 0} className={inputCls + " disabled:bg-zinc-50 disabled:text-zinc-400"}>
              <option value="">{!clienteId ? "Sem cadastro — descrever abaixo" : veiculos.length === 0 ? "Nenhum veículo cadastrado" : "Sem veículo / a definir"}</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.marca} {v.modelo}{v.placa ? ` · ${v.placa}` : ""}{v.ano ? ` (${v.ano})` : ""}</option>
              ))}
            </select>
            {!veiculoId && (
              <input
                value={veiculoDesc}
                onChange={(e) => setVeiculoDesc(e.target.value)}
                placeholder="Descrição livre do veículo — ex: Gol G5 prata, a confirmar"
                className={inputCls + " mt-2"}
              />
            )}
            <p className="text-xs text-zinc-400 mt-1">Opcional — mas necessário para converter o orçamento em OS.</p>
            {clienteId && veiculos.length === 0 && (
              <p className="text-xs text-zinc-500 mt-1">
                Cliente sem veículo cadastrado.{" "}
                <Link href={`/clientes/${clienteId}`} className="underline">Adicionar veículo</Link>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição do serviço</label>
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Ex: Revisão geral, troca de óleo e filtros..." className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-y" />
              <p className="text-xs text-zinc-400 mt-1">Opcional se você já adicionar os itens abaixo.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Validade</label>
              <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Observações</label>
              <input value={obs} onChange={(e) => setObs(e.target.value)} className={inputCls} />
            </div>
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
          {saving ? (isEdit ? "Salvando..." : "Criando orçamento...") : (isEdit ? "Salvar alterações" : "Criar Orçamento")}
        </button>
      </form>

      {/* Modal de cadastro rápido de cliente */}
      {showNovoCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-semibold text-zinc-900">Novo cliente</h3>
              <button type="button" onClick={() => setShowNovoCliente(false)} className="rounded-md px-2 text-lg leading-none text-zinc-400 hover:text-zinc-700">×</button>
            </div>

            <form onSubmit={salvarNovoCliente} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nome *</label>
                <input
                  autoFocus
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Telefone</label>
                  <input value={novoCliente.telefone} onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })} placeholder="(11) 90000-0000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Apelido</label>
                  <input value={novoCliente.apelido} onChange={(e) => setNovoCliente({ ...novoCliente, apelido: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 space-y-3">
                <p className="text-xs font-medium text-zinc-500">Veículo (opcional — necessário para converter em OS)</p>
                {veiculoDesc.trim() && (
                  <p className="text-xs text-zinc-400">Anotado no rascunho: “{veiculoDesc.trim()}”</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Marca</label>
                    <input value={novoVeiculo.marca} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, marca: e.target.value })} placeholder="Ex: Chevrolet" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Modelo</label>
                    <input value={novoVeiculo.modelo} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })} placeholder="Ex: Onix" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Placa</label>
                    <input value={novoVeiculo.placa} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, placa: e.target.value.toUpperCase() })} placeholder="ABC1D23" maxLength={8} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Cor</label>
                    <input value={novoVeiculo.cor} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, cor: e.target.value })} placeholder="Ex: Prata" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Ano</label>
                    <input type="number" value={novoVeiculo.ano} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, ano: e.target.value })} placeholder="2020" min={1950} max={new Date().getFullYear() + 2} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Cilindrada</label>
                    <input value={novoVeiculo.cilindrada} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, cilindrada: e.target.value })} placeholder="Ex: 1.0" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Combustível</label>
                    <select value={novoVeiculo.combustivel} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, combustivel: e.target.value })} className={inputCls}>
                      <option value="">Selecione...</option>
                      {COMBUSTIVEIS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {COMBUSTIVEIS_BICOMBUSTIVEL.includes(novoVeiculo.combustivel) && (
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Combustível em uso</label>
                      <select value={novoVeiculo.combustivelEmUso} onChange={(e) => setNovoVeiculo({ ...novoVeiculo, combustivelEmUso: e.target.value })} className={inputCls}>
                        <option value="">Selecione...</option>
                        {COMBUSTIVEL_EM_USO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {clienteErro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{clienteErro}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingCliente} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  {savingCliente ? "Salvando..." : "Salvar cliente"}
                </button>
                <button type="button" onClick={() => setShowNovoCliente(false)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
