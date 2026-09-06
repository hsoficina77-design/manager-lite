"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { anoVeiculo } from "@/lib/constants";
import { useDraft, formatDraftAge } from "@/lib/useDraft";
import ClienteSelect from "./ClienteSelect";
import { CampoDinheiro, CampoQuantidade } from "@/components/ui/Campos";
import { Fechar } from "@/components/ui/Icones";
import { useEhDono } from "@/components/UsuarioProvider";

type Cliente = { id: string; nome: string; telefone: string | null };
type Mecanico = { id: string; nome: string; especialidade: string | null };
type Veiculo = {
  id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
  anoFabricacao: number | null; anoModelo: number | null; combustivel: string | null;
};
export type ItemForm = {
  /** Item que já existe no banco. O operador não enxerga custo, então é por este id
   *  que o servidor sabe qual custo preservar ao salvar. Item novo não tem. */
  id?: string;
  tipo: string; descricao: string; quantidade: string;
  valorUnit: string; custoUnit: string;
};

export type OSFormInitial = {
  clienteId: string;
  veiculoId: string;
  descricao: string;
  defeitoRelatado: string;
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
  // Custo e lucro só existem na tela do dono — a API nem manda esses campos ao operador.
  const ehDono = useEhDono();
  const preClienteId = initial?.clienteId ?? searchParams.get("clienteId") ?? "";
  const preVeiculoId = initial?.veiculoId ?? searchParams.get("veiculoId") ?? "";

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [clienteId, setClienteId] = useState(preClienteId);
  const [veiculoId, setVeiculoId] = useState(preVeiculoId);
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [defeitoRelatado, setDefeitoRelatado] = useState(initial?.defeitoRelatado ?? "");
  const [kmEntrada, setKmEntrada] = useState(initial?.kmEntrada ?? "");
  const [obs, setObs] = useState(initial?.obs ?? "");
  const [mecanicoId, setMecanicoId] = useState(initial?.mecanicoId ?? "");
  const [nivelCombustivel, setNivelCombustivel] = useState(initial?.nivelCombustivel ?? "");
  const [combustivelEmUso, setCombustivelEmUso] = useState(initial?.combustivelEmUso ?? "");
  const [itens, setItens] = useState<ItemForm[]>(initial?.itens ?? []);
  const [itemForm, setItemForm] = useState<ItemForm>({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [itemError, setItemError] = useState("");
  // Último item removido, guardado para o "Desfazer". A remoção é de um toque só,
  // então é o desfazer que segura o toque errado — some só quando o usuário decide.
  const [removido, setRemovido] = useState<{ item: ItemForm; idx: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const itemFormRef = useRef<HTMLDivElement>(null);

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

  // Autosave local: sobrevive a troca de app/aba reiniciando no celular sem depender do servidor.
  const draftKey = mode === "edit" ? `os-draft:edit:${osId}` : "os-draft:create";
  const draftData = {
    clienteId, veiculoId, descricao, defeitoRelatado, kmEntrada, obs,
    mecanicoId, nivelCombustivel, combustivelEmUso, itens,
  };
  const { pendingDraft, pendingSavedAt, discardPending, clear: clearDraft } = useDraft(
    draftKey,
    draftData,
    (d) =>
      !d.clienteId && !d.veiculoId && !d.descricao.trim() && !d.defeitoRelatado.trim() &&
      !d.kmEntrada.trim() && !d.obs.trim() && !d.mecanicoId && d.itens.length === 0
  );

  function restoreDraft() {
    if (!pendingDraft) return;
    setClienteId(pendingDraft.clienteId);
    setVeiculoId(pendingDraft.veiculoId);
    setDescricao(pendingDraft.descricao);
    setDefeitoRelatado(pendingDraft.defeitoRelatado);
    setKmEntrada(pendingDraft.kmEntrada);
    setObs(pendingDraft.obs);
    setMecanicoId(pendingDraft.mecanicoId);
    setNivelCombustivel(pendingDraft.nivelCombustivel);
    setCombustivelEmUso(pendingDraft.combustivelEmUso);
    setItens(pendingDraft.itens);
    discardPending();
  }

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
    setRemovido({ item: itens[idx], idx });
    setItens(itens.filter((_, i) => i !== idx));
  }

  function desfazerRemocao() {
    if (!removido) return;
    // Volta na posição de origem; se a lista encolheu depois, entra no fim.
    const at = Math.min(removido.idx, itens.length);
    setItens([...itens.slice(0, at), removido.item, ...itens.slice(at)]);
    if (editingIdx !== null && at <= editingIdx) setEditingIdx(editingIdx + 1);
    setRemovido(null);
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
    if (!clienteId || !veiculoId || !descricao.trim()) {
      setError("Cliente, veículo e descrição são obrigatórios.");
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
        const res = await fetch(`/api/os/${osId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId, veiculoId, descricao,
            defeitoRelatado,
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
        clearDraft();
        router.push(`/os/${osId}`);
        return;
      }

      const res = await fetch("/api/os", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId, veiculoId, descricao,
          defeitoRelatado: defeitoRelatado || undefined,
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
      clearDraft();
      router.push(`/os/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const isEdit = mode === "edit";

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={isEdit && osId ? `/os/${osId}` : "/os"}
          aria-label="Voltar"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div className="leading-tight">
          <h1 className="text-xl font-bold text-tinta">{isEdit ? "Editar OS" : "Nova OS"}</h1>
                  </div>
      </div>

      {pendingDraft && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-atencao-linha bg-atencao-fraco px-4 py-3">
          <p className="text-sm text-atencao">
            Você tinha um rascunho não salvo{pendingSavedAt ? ` de ${formatDraftAge(pendingSavedAt)}` : ""}.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={discardPending} className="rounded-lg border border-atencao-linha px-3 py-1.5 text-xs font-medium text-atencao hover:bg-atencao-fraco">Descartar</button>
            <button type="button" onClick={restoreDraft} className="rounded-lg bg-atencao px-3 py-1.5 text-xs font-bold text-white hover:bg-atencao">Restaurar rascunho</button>
          </div>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-5">
            {/* Cliente e Veículo */}
            <div className="bg-superficie rounded-xl border border-linha p-5 space-y-4">
              <h2 className="font-semibold text-tinta">Cliente e Veículo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-tinta-2 mb-1">Cliente *</label>
                  <ClienteSelect
                    clientes={clientes}
                    value={clienteId}
                    onChange={setClienteId}
                    placeholder="Selecionar cliente..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-tinta-2 mb-1">Veículo *</label>
                  <select value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} required disabled={!clienteId || veiculos.length === 0} className={inputCls + " disabled:bg-superficie-2 disabled:text-tinta-3"}>
                    <option value="">{!clienteId ? "Selecione um cliente primeiro" : veiculos.length === 0 ? "Nenhum veículo cadastrado" : "Selecionar veículo..."}</option>
                    {veiculos.map((v) => (
                      <option key={v.id} value={v.id}>{v.marca} {v.modelo}{v.placa ? ` · ${v.placa}` : ""}{anoVeiculo(v) ? ` (${anoVeiculo(v)})` : ""}</option>
                    ))}
                  </select>
                  {clienteId && veiculos.length === 0 && (
                    <p className="text-xs text-perigo mt-1">
                      Cliente sem veículo.{" "}
                      <Link href={`/clientes/${clienteId}`} className="underline">Adicionar veículo</Link>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-tinta-2 mb-1">Defeito relatado pelo cliente</label>
                <textarea value={defeitoRelatado} onChange={(e) => setDefeitoRelatado(e.target.value)} rows={2} placeholder="Ex: cliente relata barulho ao frear e luz da injeção acesa..." className="w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y" />
                <p className="mt-1 text-xs text-tinta-3">A queixa/sintoma como o cliente descreveu — separado do serviço que será executado.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-tinta-2 mb-1">Descrição do serviço *</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} required rows={3} placeholder="Ex: Revisão geral, troca de óleo e filtros..." className="w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y" />
              </div>

              <div>
                <label className="block text-sm font-medium text-tinta-2 mb-1">Mecânico responsável</label>
                {mecanicos.length > 0 ? (
                  <select value={mecanicoId} onChange={(e) => setMecanicoId(e.target.value)} className={inputCls}>
                    <option value="">— Não atribuído</option>
                    {mecanicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome}{m.especialidade ? ` · ${m.especialidade}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-tinta-3">
                    Nenhum mecânico cadastrado.{" "}
                    <Link href="/mecanicos" className="text-brand-600 underline">Cadastrar mecânico</Link>
                  </p>
                )}
              </div>
            </div>

            {/* Recepção do veículo */}
            <div className="bg-superficie rounded-xl border border-linha p-5 space-y-3">
              <h2 className="font-semibold text-tinta">Recepção do veículo</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-tinta-2 mb-1">Nível de combustível</label>
                  <select value={nivelCombustivel} onChange={(e) => setNivelCombustivel(e.target.value)} className={inputCls}>
                    <option value="">Selecione...</option>
                    <option value="CHEIO">Cheio</option>
                    <option value="MEIO">Meio</option>
                    <option value="VAZIO">Vazio</option>
                  </select>
                </div>
                {showCombUso && (
                  <div>
                    <label className="block text-sm font-medium text-tinta-2 mb-1">Combustível em uso</label>
                    <select value={combustivelEmUso} onChange={(e) => setCombustivelEmUso(e.target.value)} className={inputCls}>
                      <option value="">Selecione...</option>
                      <option value="GASOLINA">Gasolina</option>
                      <option value="ETANOL">Etanol</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-tinta-2 mb-1">KM de Entrada</label>
                  <input type="number" inputMode="numeric" value={kmEntrada} onChange={(e) => setKmEntrada(e.target.value)} placeholder="Ex: 52000" className={inputCls} />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label className="block text-sm font-medium text-tinta-2 mb-1">Observação de entrada</label>
                  <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: avarias na lataria, riscos, itens no veículo..." className={inputCls} />
                </div>
              </div>
            </div>

            {/* Itens */}
            <div ref={itemFormRef} className="bg-superficie rounded-xl border border-linha p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-tinta">Itens</h2>
                {editingIdx !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-atencao-fraco px-2.5 py-1 text-xs font-medium text-atencao">
                    Editando item {editingIdx + 1}
                  </span>
                )}
              </div>

              <div className={`grid grid-cols-2 sm:grid-cols-12 gap-2 items-end rounded-lg transition-colors ${editingIdx !== null ? "ring-2 ring-atencao-linha bg-atencao-fraco/40 p-2 -m-2" : ""}`}>
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-xs text-tinta-3 mb-1">Tipo</label>
              <select value={itemForm.tipo} onChange={(e) => setItemForm({ ...itemForm, tipo: e.target.value })} className="w-full rounded-lg border border-linha-forte px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="PECA">Peça</option>
                <option value="MAO_DE_OBRA">M.O.</option>
                <option value="SERVICO">Serviço</option>
              </select>
            </div>
            <div className={itemForm.tipo === "PECA" ? "col-span-2 sm:col-span-3" : "col-span-2 sm:col-span-5"}>
              <label className="block text-xs text-tinta-3 mb-1">Descrição</label>
              <input value={itemForm.descricao} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} placeholder="Ex: Filtro de óleo" className="w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveItem())} />
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs text-tinta-3 mb-1">Qtd</label>
              <CampoQuantidade
                valor={itemForm.quantidade}
                onChange={(v) => setItemForm({ ...itemForm, quantidade: v })}
                onEnter={saveItem}
              />
            </div>
            {ehDono && itemForm.tipo === "PECA" && (
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs text-tinta-3 mb-1">Custo unit. (R$)</label>
                <CampoDinheiro
                  valor={itemForm.custoUnit}
                  onChange={(v) => setItemForm({ ...itemForm, custoUnit: v })}
                  placeholder="0,00"
                  onEnter={saveItem}
                />
              </div>
            )}
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs text-tinta-3 mb-1">
                Venda unit. (R$)
                {ehDono && itemMargem !== null && (
                  <span className={`ml-1 font-medium ${itemMargem >= 0 ? "text-ok" : "text-perigo"}`}>
                    ({itemMargem.toFixed(0)}%)
                  </span>
                )}
              </label>
              <CampoDinheiro
                valor={itemForm.valorUnit}
                onChange={(v) => setItemForm({ ...itemForm, valorUnit: v })}
                placeholder="0,00"
                onEnter={saveItem}
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              {editingIdx !== null ? (
                <div className="flex gap-2">
                  <button type="button" onClick={saveItem} className="flex-1 rounded-lg bg-atencao py-2.5 text-sm font-bold text-white hover:bg-atencao">Salvar</button>
                  <button
                    type="button"
                    onClick={resetItemForm}
                    aria-label="Cancelar edição"
                    title="Cancelar"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-linha-forte text-tinta-2 hover:bg-superficie-2"
                  >
                    <Fechar tamanho={16} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={saveItem} className="w-full rounded-lg bg-contraste py-2.5 text-sm font-bold text-white hover:opacity-90">+ Adicionar</button>
              )}
            </div>
          </div>

          {ehDono && Number(itemForm.valorUnit) > 0 && (
            <p className="text-xs text-tinta-3">
              Ganho deste item:{" "}
              <span className={`font-semibold ${itemGanho >= 0 ? "text-ok" : "text-perigo"}`}>
                {formatCurrency(itemGanho)}
              </span>
            </p>
          )}

          {itemError && <p className="text-xs text-perigo">{itemError}</p>}

          {itens.length > 0 && (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[28rem]">
              <thead>
                <tr className="text-xs text-tinta-3 border-b border-linha">
                  <th className="text-left pb-2 font-medium">Tipo</th>
                  <th className="text-left pb-2 font-medium">Descrição</th>
                  <th className="text-right pb-2 font-medium">Qtd</th>
                  <th className="text-right pb-2 font-medium">Venda</th>
                  <th className="text-right pb-2 font-medium">Total</th>
                  {ehDono && <th className="text-right pb-2 font-medium">Ganho</th>}
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {itens.map((item, idx) => (
                  <tr key={idx} className={editingIdx === idx ? "bg-atencao-fraco" : "group"}>
                    <td className="py-1.5 text-tinta-3 text-xs">{item.tipo === "PECA" ? "Peça" : item.tipo === "MAO_DE_OBRA" ? "M.O." : "Serviço"}</td>
                    <td className="py-1.5 text-tinta">{item.descricao}</td>
                    <td className="py-1.5 text-right text-tinta-2">{item.quantidade}</td>
                    <td className="py-1.5 text-right text-tinta-2">{formatCurrency(Number(item.valorUnit))}</td>
                    <td className="py-1.5 text-right font-medium text-tinta">{formatCurrency(Number(item.quantidade) * Number(item.valorUnit))}</td>
                    {ehDono && <td className={`py-1.5 text-right font-medium ${ganhoItem(item) >= 0 ? "text-ok" : "text-perigo"}`}>{formatCurrency(ganhoItem(item))}</td>}
                    <td className="py-1 pl-2">
                      {/* Alvos de 36px e afastados: o dedo errava o lápis e acertava a lixeira. */}
                      <div className="flex items-center justify-end gap-2 sm:gap-1.5">
                        <button type="button" onClick={() => startEdit(idx)} aria-label={`Editar ${item.descricao}`} title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-tinta-3 hover:bg-superficie-3 hover:text-tinta-2 sm:h-8 sm:w-8">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                        <button type="button" onClick={() => removeItem(idx)} aria-label={`Remover ${item.descricao}`} title="Remover" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-perigo hover:bg-perigo-fraco hover:text-perigo sm:h-8 sm:w-8">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          {removido && (
            <div role="status" aria-live="polite" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-atencao-linha bg-atencao-fraco px-3 py-2">
              <p className="min-w-0 text-sm text-atencao">
                <span className="font-medium">{removido.item.descricao}</span> foi removido da lista.
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={desfazerRemocao} className="inline-flex items-center gap-1.5 rounded-lg bg-atencao px-3 py-1.5 text-xs font-bold text-white hover:bg-atencao">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
                  Desfazer
                </button>
                <button
                  type="button"
                  onClick={() => setRemovido(null)}
                  aria-label="Dispensar aviso"
                  title="Dispensar"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-atencao hover:bg-atencao-fraco sm:h-9 sm:w-9"
                >
                  <Fechar tamanho={16} />
                </button>
              </div>
            </div>
          )}

            </div>
          </div>

          {/* Resumo */}
          <aside className="lg:sticky lg:top-6 space-y-4">
              <div className="bg-superficie rounded-xl border border-linha p-5 space-y-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-semibold text-tinta">Resumo</h2>
                  <span className="text-xs text-tinta-3">{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-tinta-3"><span>Peças</span><span>{formatCurrency(totalPecas)}</span></div>
                  <div className="flex justify-between text-tinta-3"><span>Mão de obra / Serviços</span><span>{formatCurrency(totalMO)}</span></div>
                  <div className="flex justify-between font-bold text-tinta text-lg pt-2 mt-1 border-t border-linha">
                    <span>Total</span><span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {ehDono && (
                  <div className="space-y-1 text-sm rounded-lg bg-superficie-2 p-3">
                    <div className="flex justify-between text-tinta-3"><span>Custo das peças</span><span>{formatCurrency(custoTotalPecas)}</span></div>
                    <div className="flex justify-between font-semibold text-ok">
                      <span>Lucro estimado</span>
                      <span>{formatCurrency(lucroTotal)}{total > 0 ? ` (${margemTotal.toFixed(0)}%)` : ""}</span>
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-perigo bg-perigo-fraco rounded-lg px-3 py-2">{error}</p>}

                <button type="submit" disabled={saving} className="w-full rounded-lg bg-brand-600 py-3 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50 transition-colors">
                  {saving ? (isEdit ? "Salvando..." : "Criando OS...") : (isEdit ? "Salvar alterações" : "Criar OS")}
                </button>
              </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
