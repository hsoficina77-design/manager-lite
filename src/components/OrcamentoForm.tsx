"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { COMBUSTIVEIS, COMBUSTIVEIS_BICOMBUSTIVEL, COMBUSTIVEL_EM_USO } from "@/lib/constants";
import { useDraft, formatDraftAge } from "@/lib/useDraft";
import { useEhDono } from "@/components/UsuarioProvider";

type Cliente = { id: string; nome: string; telefone: string | null };
type Veiculo = {
  id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
};
export type ItemForm = {
  /** Item que já existe no banco. O operador não enxerga custo, então é por este id
   *  que o servidor sabe qual custo preservar ao salvar. Item novo não tem. */
  id?: string;
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
  // Custo e lucro só existem na tela do dono — a API nem manda esses campos ao operador.
  const ehDono = useEhDono();
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
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [itemError, setItemError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const itemFormRef = useRef<HTMLDivElement>(null);

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

  // Autosave local: sobrevive a troca de app/aba reiniciando no celular sem depender do servidor.
  const draftKey = mode === "edit" ? `orcamento-draft:edit:${orcamentoId}` : "orcamento-draft:create";
  const draftData = {
    clienteId, veiculoId, clienteNome, clienteTelefone, veiculoDesc,
    descricao, validade, obs, itens,
  };
  const { pendingDraft, pendingSavedAt, discardPending, clear: clearDraft } = useDraft(
    draftKey,
    draftData,
    (d) =>
      !d.clienteId && !d.clienteNome.trim() && !d.veiculoDesc.trim() &&
      !d.descricao.trim() && !d.obs.trim() && d.itens.length === 0
  );

  function restoreDraft() {
    if (!pendingDraft) return;
    setClienteId(pendingDraft.clienteId);
    setVeiculoId(pendingDraft.veiculoId);
    setClienteNome(pendingDraft.clienteNome);
    setClienteTelefone(pendingDraft.clienteTelefone);
    setVeiculoDesc(pendingDraft.veiculoDesc);
    setDescricao(pendingDraft.descricao);
    setValidade(pendingDraft.validade);
    setObs(pendingDraft.obs);
    setItens(pendingDraft.itens);
    discardPending();
  }

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

  function resetItemForm() {
    setItemForm({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
    setEditingIdx(null);
  }

  function saveItem() {
    setItemError("");
    if (!itemForm.descricao.trim()) { setItemError("Informe a descrição do item."); return; }
    if (editingIdx !== null) {
      setItens(itens.map((it, i) => (i === editingIdx ? { ...itemForm } : it)));
    } else {
      setItens([...itens, { ...itemForm }]);
    }
    resetItemForm();
  }

  function startEdit(idx: number) {
    setItemError("");
    setEditingIdx(idx);
    setItemForm({ ...itens[idx] });
    itemFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function removeItem(idx: number) {
    if (editingIdx === idx) resetItemForm();
    else if (editingIdx !== null && idx < editingIdx) setEditingIdx(editingIdx - 1);
    setItens(itens.filter((_, i) => i !== idx));
  }

  const totalPecas = itens.filter((i) => i.tipo === "PECA").reduce((s, i) => s + Number(i.quantidade) * Number(i.valorUnit), 0);
  const totalMO = itens.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + Number(i.quantidade) * Number(i.valorUnit), 0);
  const total = totalPecas + totalMO;
  // Ganho por item: venda - custo (custo só existe em peças; MO/serviço é ganho integral).
  const ganhoItem = (i: ItemForm) =>
    Number(i.quantidade) * (Number(i.valorUnit) - (i.tipo === "PECA" ? Number(i.custoUnit || 0) : 0));
  const custoTotalPecas = itens
    .filter((i) => i.tipo === "PECA")
    .reduce((s, i) => s + Number(i.quantidade) * Number(i.custoUnit || 0), 0);
  const lucroTotal = total - custoTotalPecas;
  const margemTotal = total > 0 ? (lucroTotal / total) * 100 : 0;

  const itemGanho = ganhoItem(itemForm);
  const itemMargem =
    itemForm.tipo === "PECA" && Number(itemForm.valorUnit) > 0 && itemForm.custoUnit !== ""
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
        id: i.id,
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
        clearDraft();
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
      clearDraft();
      router.push(`/orcamentos/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const isEdit = mode === "edit";

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={isEdit && orcamentoId ? `/orcamentos/${orcamentoId}` : "/orcamentos"}
          aria-label="Voltar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div className="leading-tight">
          <h1 className="text-xl font-bold text-zinc-900">{isEdit ? "Editar Orçamento" : "Novo Orçamento"}</h1>
          <p className="text-xs text-zinc-500">Monte a proposta e confira a margem antes de enviar</p>
        </div>
      </div>

      {pendingDraft && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            Você tinha um rascunho não salvo{pendingSavedAt ? ` de ${formatDraftAge(pendingSavedAt)}` : ""}.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={discardPending} className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">Descartar</button>
            <button type="button" onClick={restoreDraft} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600">Restaurar rascunho</button>
          </div>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-5">
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
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} placeholder="Ex: Revisão geral, troca de óleo e filtros..." className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y" />
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
        <div ref={itemFormRef} className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800">Itens</h2>
            {editingIdx !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Editando item {editingIdx + 1}
              </span>
            )}
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-12 gap-2 items-end rounded-lg transition-colors ${editingIdx !== null ? "ring-2 ring-amber-300 bg-amber-50/40 p-2 -m-2" : ""}`}>
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Tipo</label>
              <select value={itemForm.tipo} onChange={(e) => setItemForm({ ...itemForm, tipo: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="PECA">Peça</option>
                <option value="MAO_DE_OBRA">M.O.</option>
                <option value="SERVICO">Serviço</option>
              </select>
            </div>
            <div className={itemForm.tipo === "PECA" ? "col-span-2 sm:col-span-3" : "col-span-2 sm:col-span-5"}>
              <label className="block text-xs text-zinc-500 mb-1">Descrição</label>
              <input value={itemForm.descricao} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} placeholder="Ex: Filtro de óleo" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveItem())} />
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs text-zinc-500 mb-1">Qtd</label>
              <input type="number" inputMode="decimal" min="0.01" step="0.01" value={itemForm.quantidade} onChange={(e) => setItemForm({ ...itemForm, quantidade: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            {ehDono && itemForm.tipo === "PECA" && (
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs text-zinc-500 mb-1">Custo unit. (R$)</label>
                <input type="number" inputMode="decimal" min="0" step="0.01" value={itemForm.custoUnit} onChange={(e) => setItemForm({ ...itemForm, custoUnit: e.target.value })} placeholder="0,00" className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveItem())} />
              </div>
            )}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">
                Venda unit. (R$)
                {ehDono && itemMargem !== null && (
                  <span className={`ml-1 font-medium ${itemMargem >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ({itemMargem.toFixed(0)}%)
                  </span>
                )}
              </label>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={itemForm.valorUnit} onChange={(e) => setItemForm({ ...itemForm, valorUnit: e.target.value })} placeholder="0,00" className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveItem())} />
            </div>
            <div className="col-span-2 sm:col-span-2">
              {editingIdx !== null ? (
                <div className="flex gap-2">
                  <button type="button" onClick={saveItem} className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600">Salvar</button>
                  <button type="button" onClick={resetItemForm} aria-label="Cancelar edição" title="Cancelar" className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">✕</button>
                </div>
              ) : (
                <button type="button" onClick={saveItem} className="w-full rounded-lg bg-zinc-800 py-2.5 text-sm font-bold text-white hover:bg-zinc-700">+ Adicionar</button>
              )}
            </div>
          </div>

          {ehDono && Number(itemForm.valorUnit) > 0 && (
            <p className="text-xs text-zinc-500">
              Ganho deste item:{" "}
              <span className={`font-semibold ${itemGanho >= 0 ? "text-green-600" : "text-red-500"}`}>
                {formatCurrency(itemGanho)}
              </span>
            </p>
          )}

          {itemError && <p className="text-xs text-red-500">{itemError}</p>}

          {itens.length > 0 && (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[28rem]">
              <thead>
                <tr className="text-xs text-zinc-400 border-b border-zinc-100">
                  <th className="text-left pb-2 font-medium">Tipo</th>
                  <th className="text-left pb-2 font-medium">Descrição</th>
                  <th className="text-right pb-2 font-medium">Qtd</th>
                  <th className="text-right pb-2 font-medium">Venda</th>
                  <th className="text-right pb-2 font-medium">Total</th>
                  {ehDono && <th className="text-right pb-2 font-medium">Ganho</th>}
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {itens.map((item, idx) => (
                  <tr key={idx} className={editingIdx === idx ? "bg-amber-50" : "group"}>
                    <td className="py-1.5 text-zinc-500 text-xs">{item.tipo === "PECA" ? "Peça" : item.tipo === "MAO_DE_OBRA" ? "M.O." : "Serviço"}</td>
                    <td className="py-1.5 text-zinc-800">{item.descricao}</td>
                    <td className="py-1.5 text-right text-zinc-600">{item.quantidade}</td>
                    <td className="py-1.5 text-right text-zinc-600">{formatCurrency(Number(item.valorUnit))}</td>
                    <td className="py-1.5 text-right font-medium text-zinc-900">{formatCurrency(Number(item.quantidade) * Number(item.valorUnit))}</td>
                    {ehDono && <td className={`py-1.5 text-right font-medium ${ganhoItem(item) >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(ganhoItem(item))}</td>}
                    <td className="py-1.5 pl-2">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => startEdit(idx)} aria-label="Editar item" title="Editar" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                        <button type="button" onClick={() => removeItem(idx)} aria-label="Remover item" title="Remover" className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
          </div>

          {/* Resumo */}
          <aside className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-zinc-800">Resumo</h2>
                <span className="text-xs text-zinc-400">{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-zinc-500"><span>Peças</span><span>{formatCurrency(totalPecas)}</span></div>
                <div className="flex justify-between text-zinc-500"><span>Mão de obra / Serviços</span><span>{formatCurrency(totalMO)}</span></div>
                <div className="flex justify-between font-bold text-zinc-900 text-lg pt-2 mt-1 border-t border-zinc-100">
                  <span>Total</span><span>{formatCurrency(total)}</span>
                </div>
              </div>

              {ehDono && (
                <div className="space-y-1 text-sm rounded-lg bg-zinc-50 p-3">
                  <div className="flex justify-between text-zinc-500"><span>Custo das peças</span><span>{formatCurrency(custoTotalPecas)}</span></div>
                  <div className="flex justify-between font-semibold text-green-700">
                    <span>Lucro estimado</span>
                    <span>{formatCurrency(lucroTotal)}{total > 0 ? ` (${margemTotal.toFixed(0)}%)` : ""}</span>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" disabled={saving} className="w-full rounded-lg bg-brand-600 py-3 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {saving ? (isEdit ? "Salvando..." : "Criando orçamento...") : (isEdit ? "Salvar alterações" : "Criar Orçamento")}
              </button>
            </div>
          </aside>
        </div>
      </form>

      {/* Modal de cadastro rápido de cliente */}
      {showNovoCliente && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-40 p-4 sm:items-center">
          <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
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
                <button type="submit" disabled={savingCliente} className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50">
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
