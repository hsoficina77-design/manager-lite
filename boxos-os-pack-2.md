# boxOS — pacote da Ordem de Serviço para o vídeo · parte 2 de 2

Continuação de `boxos-os-pack-1.md`, que traz o índice, o mapa de funcionalidades, os pontos fortes e a tela da OS. Aqui: o resto da **Parte 3 (código visual)**, a **Parte 4 (dados fictícios)** e as **Observações**. Gerado em 12/10/2026, só por leitura; nenhum arquivo do projeto foi alterado.

As dependências de base (tokens, `Botao`, `Campos`, `Dados`, `Modal`, `Icones`, `utils`, `configuracao`, `cor-documento`) estão listadas em "3.0 Dependências", na parte 1.

---

# Parte 3 · Código visual (continuação)

## 3.4 Formulário da OS (peças, mão de obra, custo e lucro)

Mesmo formulário para **Nova OS** (`/os/nova`) e **Editar OS** (`/os/[id]/editar`). Coluna principal com três cartões (Cliente e Veículo · Recepção do veículo · Itens) e, à direita, o **Resumo**, fixo ao rolar em telas largas. As partes só do dono são a coluna "Custo unit.", a margem % no rótulo "Venda unit.", o texto "Ganho deste item", a coluna "Ganho" e o quadro "Custo das peças / Lucro estimado".

### src/components/OSForm.tsx

_Lógica de dados removida (`// [removido: …]`); JSX, classes e estrutura intactos. Para o vídeo, use `formularioOS` da Parte 4 como `initial` e `listas` para clientes, veículos e mecânicos._

```tsx
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { anoVeiculo } from "@/lib/constants";
import ClienteSelect from "./ClienteSelect";
import ProdutoBusca, {
  VinculoEstoque,
  type ProdutoBuscado,
  type ProdutoResumo,
} from "./ProdutoBusca";
import { CampoDinheiro, CampoQuantidade } from "@/components/ui/Campos";
import { Caixa, Fechar } from "@/components/ui/Icones";
import { usePodeFinanceiro } from "@/components/UsuarioProvider";
import { EditorDescricao } from "@/components/EditorDescricao";

const DESCRICAO_SERVICO_MAX = 5000;

type Cliente = { id: string; nome: string; telefone: string | null };
type Mecanico = { id: string; nome: string; especialidade: string | null };
type Veiculo = {
  id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
  anoFabricacao: number | null; anoModelo: number | null; combustivel: string | null;
};
export type ItemForm = {
  /** Item que já existe no banco (o servidor usa para preservar o custo). */
  id?: string;
  /** Peça que saiu da prateleira. É este vínculo que dá a baixa no estoque na entrega. */
  produtoId?: string;
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
  /** Nome e saldo dos produtos já usados pela OS, para o selo do vínculo. */
  produtos?: Record<string, ProdutoResumo>;
  /** A OS já foi entregue (e portanto já baixou as peças)? */
  seguraEstoque?: boolean;
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
  // Custo e lucro só existem na tela do dono — a API nem manda esses campos ao operador.
  const podeFinanceiro = usePodeFinanceiro();

  // [removido: busca de dados — clientes, mecânicos ativos e veículos do cliente escolhido]
  const [clientes] = useState<Cliente[]>([]);
  const [veiculos] = useState<Veiculo[]>([]);
  const [mecanicos] = useState<Mecanico[]>([]);
  const [clienteId, setClienteId] = useState(initial?.clienteId ?? "");
  const [veiculoId, setVeiculoId] = useState(initial?.veiculoId ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [defeitoRelatado, setDefeitoRelatado] = useState(initial?.defeitoRelatado ?? "");
  const [kmEntrada, setKmEntrada] = useState(initial?.kmEntrada ?? "");
  const [obs, setObs] = useState(initial?.obs ?? "");
  const [mecanicoId, setMecanicoId] = useState(initial?.mecanicoId ?? "");
  const [nivelCombustivel, setNivelCombustivel] = useState(initial?.nivelCombustivel ?? "");
  const [combustivelEmUso, setCombustivelEmUso] = useState(initial?.combustivelEmUso ?? "");
  const [itens, setItens] = useState<ItemForm[]>(initial?.itens ?? []);
  const [itemForm, setItemForm] = useState<ItemForm>({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
  const [produtos, setProdutos] = useState<Record<string, ProdutoResumo>>(initial?.produtos ?? {});
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [itemError, setItemError] = useState("");
  // Último item removido, guardado para o "Desfazer".
  const [removido, setRemovido] = useState<{ item: ItemForm; idx: number } | null>(null);
  const [saving] = useState(false);
  const [error] = useState("");
  const itemFormRef = useRef<HTMLDivElement>(null);

  const selectedVeiculo = veiculos.find((v) => v.id === veiculoId);
  const showCombUso = ["FLEX", "HIBRIDO"].includes(selectedVeiculo?.combustivel || "");

  // [removido: rascunho automático no aparelho (localStorage) e aviso de saída sem salvar.
  //  No app, `pendingDraft` vira não-nulo quando há rascunho guardado e a faixa âmbar aparece.]
  const pendingDraft = null as null | object;
  const pendingSavedAt = null as null | number;
  const formatDraftAge = (_t: number) => "há 5 min";
  function discardPending() {}
  function restoreDraft() {}

  function resetItemForm() {
    setItemForm({ tipo: "PECA", descricao: "", quantidade: "1", valorUnit: "", custoUnit: "" });
    setEditingIdx(null);
  }

  /** Peça escolhida na busca do estoque: preenche a linha inteira e amarra o vínculo. */
  function escolherProduto(p: ProdutoBuscado) {
    setProdutos((mapa) => ({
      ...mapa,
      [p.id]: { nome: p.nome, unidade: p.unidade, quantidade: p.quantidade },
    }));
    setItemForm((f) => ({
      ...f,
      produtoId: p.id,
      descricao: p.nome,
      valorUnit: String(p.valorVenda),
      custoUnit: p.custoUnit != null ? String(p.custoUnit) : f.custoUnit,
    }));
  }

  // Numa OS já entregue, o saldo da prateleira veio descontado dela: soma de volta.
  const seguradoPelaOS = initial?.seguraEstoque
    ? (initial.itens ?? []).reduce<Record<string, number>>((acc, i) => {
        if (i.produtoId) acc[i.produtoId] = (acc[i.produtoId] ?? 0) + Number(i.quantidade);
        return acc;
      }, {})
    : {};

  const disponivelDe = (produtoId: string) =>
    produtos[produtoId]
      ? produtos[produtoId].quantidade + (seguradoPelaOS[produtoId] ?? 0)
      : undefined;

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // [removido: validação (cliente, veículo e descrição obrigatórios) e gravação — POST/PUT /api/os]
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
                <EditorDescricao value={descricao} onChange={setDescricao} maxLength={DESCRICAO_SERVICO_MAX} required placeholder="Ex: Revisão geral, troca de óleo e filtros..." />
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
                    <Link href="/mecanicos" className="text-brand-texto underline">Cadastrar mecânico</Link>
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
              <select
                value={itemForm.tipo}
                onChange={(e) => {
                  const tipo = e.target.value;
                  // Virar mão de obra solta o vínculo com o estoque.
                  setItemForm({
                    ...itemForm,
                    tipo,
                    produtoId: tipo === "PECA" ? itemForm.produtoId : undefined,
                  });
                }}
                className="w-full rounded-lg border border-linha-forte px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="PECA">Peça</option>
                <option value="MAO_DE_OBRA">M.O.</option>
                <option value="SERVICO">Serviço</option>
              </select>
            </div>
            <div className={itemForm.tipo === "PECA" ? "col-span-2 sm:col-span-3" : "col-span-2 sm:col-span-5"}>
              <label className="block text-xs text-tinta-3 mb-1">Descrição</label>
              {itemForm.tipo === "PECA" ? (
                <ProdutoBusca
                  valor={itemForm.descricao}
                  onTexto={(t) => setItemForm({ ...itemForm, descricao: t })}
                  onEscolher={escolherProduto}
                  onEnter={saveItem}
                />
              ) : (
              <input value={itemForm.descricao} onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} placeholder="Ex: Alinhamento e balanceamento" className="w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveItem())} />
              )}
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs text-tinta-3 mb-1">Qtd</label>
              <CampoQuantidade
                valor={itemForm.quantidade}
                onChange={(v) => setItemForm({ ...itemForm, quantidade: v })}
                onEnter={saveItem}
              />
            </div>
            {podeFinanceiro && itemForm.tipo === "PECA" && (
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
                {podeFinanceiro && itemMargem !== null && (
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

          {itemForm.produtoId && (
            <VinculoEstoque
              nome={produtos[itemForm.produtoId]?.nome ?? itemForm.descricao}
              unidade={produtos[itemForm.produtoId]?.unidade ?? ""}
              disponivel={disponivelDe(itemForm.produtoId)}
              pedido={Number(itemForm.quantidade)}
              onDesvincular={() => setItemForm({ ...itemForm, produtoId: undefined })}
            />
          )}

          {podeFinanceiro && Number(itemForm.valorUnit) > 0 && (
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
                  {podeFinanceiro && <th className="text-right pb-2 font-medium">Ganho</th>}
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {itens.map((item, idx) => (
                  <tr key={idx} className={editingIdx === idx ? "bg-atencao-fraco" : "group"}>
                    <td className="py-1.5 text-tinta-3 text-xs">{item.tipo === "PECA" ? "Peça" : item.tipo === "MAO_DE_OBRA" ? "M.O." : "Serviço"}</td>
                    <td className="py-1.5 text-tinta">
                      <span className="flex items-center gap-1.5">
                        {/* A caixinha diz que esta linha vai baixar do estoque. */}
                        {item.produtoId && (
                          <Caixa
                            tamanho={13}
                            className="shrink-0 text-tinta-3"
                            aria-label="Baixa do estoque"
                          />
                        )}
                        <span className="min-w-0">{item.descricao}</span>
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-tinta-2">{item.quantidade}</td>
                    <td className="py-1.5 text-right text-tinta-2">{formatCurrency(Number(item.valorUnit))}</td>
                    <td className="py-1.5 text-right font-medium text-tinta">{formatCurrency(Number(item.quantidade) * Number(item.valorUnit))}</td>
                    {podeFinanceiro && <td className={`py-1.5 text-right font-medium ${ganhoItem(item) >= 0 ? "text-ok" : "text-perigo"}`}>{formatCurrency(ganhoItem(item))}</td>}
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

                {podeFinanceiro && (
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
```

## 3.5 Busca da peça no estoque

Campo de descrição que, no tipo Peça, abre uma lista com o que está na prateleira. `VinculoEstoque` é o selo que aparece embaixo depois da escolha.

### src/components/ProdutoBusca.tsx

_Lógica de dados removida (busca no servidor com pausa de 400 ms, memória de respostas, cancelamento). Visual intacto. Para o vídeo, preencha `resultados` com `buscaEstoque` da Parte 4._

```tsx
"use client";

import { useId, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { formatQuantidade } from "@/lib/constants";
import { BASE_CAMPO } from "@/components/ui/Campos";
import { Caixa, Fechar } from "@/components/ui/Icones";

/** O mínimo que o formulário precisa saber de um produto para desenhar o selo. */
export type ProdutoResumo = { nome: string; unidade: string; quantidade: number };

/** O que a busca do estoque devolve. `custoUnit` some para quem não vê financeiro. */
export type ProdutoBuscado = {
  id: string;
  nome: string;
  codigo: string | null;
  unidade: string;
  valorVenda: number;
  custoUnit?: number;
  quantidade: number;
};

/**
 * Selo de "esta peça saiu da prateleira", logo abaixo do campo de descrição.
 * O "x" desfaz o vínculo ("lançar sem tirar do estoque").
 */
export function VinculoEstoque({
  nome,
  unidade,
  disponivel,
  pedido,
  onDesvincular,
}: {
  nome: string;
  unidade: string;
  disponivel?: number;
  pedido?: number;
  onDesvincular: () => void;
}) {
  const falta = disponivel != null && pedido != null && pedido > disponivel;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie-3 py-0.5 pl-2 pr-0.5 text-tinta-2">
        <Caixa tamanho={13} className="shrink-0 text-tinta-3" />
        <span className="max-w-[16rem] truncate font-medium">{nome}</span>
        {disponivel != null && (
          <span className="text-tinta-3">· {formatQuantidade(disponivel, unidade)}</span>
        )}
        <button
          type="button"
          onClick={onDesvincular}
          aria-label={`Desvincular ${nome} do estoque`}
          title="Lançar sem tirar do estoque"
          className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-tinta-3 hover:bg-superficie hover:text-tinta"
        >
          <Fechar tamanho={12} />
        </button>
      </span>
      {falta && (
        <span className="text-atencao">
          Só há {formatQuantidade(disponivel!, unidade)} na prateleira — o saldo vai ficar
          negativo.
        </span>
      )}
    </div>
  );
}

/** Abaixo disto não vai ao servidor: a resposta seria quase o catálogo inteiro. */
const MIN_LETRAS = 3;

/**
 * Campo de descrição da peça que também procura no estoque. Continua sendo um campo
 * de texto comum — dá para digitar "parafuso M8" e seguir, sem vínculo.
 */
export default function ProdutoBusca({
  valor,
  onTexto,
  onEscolher,
  onEnter,
  placeholder = "Ex: Filtro de óleo",
  className,
}: {
  valor: string;
  onTexto: (texto: string) => void;
  onEscolher: (produto: ProdutoBuscado) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  // [removido: busca no servidor — GET /api/produtos?ativo=true&limite=8&q=…]
  const [resultados, setResultados] = useState<ProdutoBuscado[]>([]);
  const [buscando] = useState(false);
  // -1 = ninguém destacado: o Enter salva o item como texto livre.
  const [destaque, setDestaque] = useState(-1);
  const [termoBuscado] = useState("");
  const listaId = useId();

  // [removido: fechar ao tocar fora]

  function escolher(produto: ProdutoBuscado) {
    onEscolher(produto);
    setAberto(false);
    setResultados([]);
    setDestaque(-1);
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "Escape") setAberto(false);
    if (e.key === "Enter") {
      e.preventDefault();
      const alvo = resultados[destaque];
      if (alvo) escolher(alvo);
      else onEnter?.();
    }
    // [removido: setas ↑/↓ movem o destaque]
  }

  const mostrarLista = aberto && valor.trim().length >= MIN_LETRAS;
  const semResultado =
    mostrarLista && !buscando && resultados.length === 0 && termoBuscado === valor.trim();

  return (
    <div className="relative">
      <input
        value={valor}
        onChange={(e) => {
          onTexto(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={aoTeclar}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={listaId}
        aria-autocomplete="list"
        className={cn(BASE_CAMPO, className)}
      />

      {mostrarLista && (resultados.length > 0 || buscando || semResultado) && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto overscroll-contain rounded-xl border border-linha bg-superficie shadow-lg"
        >
          {resultados.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === destaque}
                onMouseEnter={() => setDestaque(i)}
                onClick={() => escolher(p)}
                className={cn(
                  "flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                  i === destaque && "bg-brand-50"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-tinta">{p.nome}</span>
                  <span className="block truncate text-xs text-tinta-3">
                    {p.codigo ? `${p.codigo} · ` : ""}
                    {formatCurrency(p.valorVenda)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                    p.quantidade <= 0
                      ? "bg-perigo-fraco text-perigo"
                      : "bg-superficie-3 text-tinta-2"
                  )}
                >
                  {formatQuantidade(p.quantidade, p.unidade)}
                </span>
              </button>
            </li>
          ))}

          {buscando && resultados.length === 0 && (
            <li className="px-3 py-3 text-sm text-tinta-3">Procurando no estoque...</li>
          )}

          {semResultado && (
            <li className="px-3 py-3 text-sm text-tinta-3">
              Nada no estoque com “{valor.trim()}”. Pode seguir digitando: a peça entra
              na OS sem vínculo.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
```

## 3.6 Campo "Descrição do serviço"

### src/components/EditorDescricao.tsx

_Lógica de edição removida (aplicar negrito, título e listas; continuar lista no Enter; converter texto colado). Visual intacto. O valor é texto simples com marcas: `**negrito**`, `## Título`, `- item`, `1. item`._

```tsx
"use client";

import { useState } from "react";
import { TextoFormatado } from "@/components/ui/TextoFormatado";
import { Negrito, Titulo, ListaMarcadores, ListaNumerada } from "@/components/ui/Icones";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
  rows?: number;
};

export function EditorDescricao({ value, onChange, maxLength, required, placeholder, rows = 6 }: Props) {
  const [previa, setPrevia] = useState(false);

  // [removido: negrito() e prefixa("titulo" | "marcador" | "numerado") escrevem as marcas no texto]
  function negrito() {}
  function prefixa(_tipo: "titulo" | "marcador" | "numerado") {}

  const botao =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md px-2 text-tinta-2 hover:bg-superficie-3 hover:text-tinta disabled:opacity-40 disabled:hover:bg-transparent sm:h-8 sm:min-w-8";
  const restante = maxLength - value.length;

  return (
    <div className="rounded-lg border border-linha-forte focus-within:ring-2 focus-within:ring-brand-500">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-linha-forte px-1.5 py-1">
        <button type="button" onClick={negrito} disabled={previa} className={botao} title="Negrito (Ctrl+B)" aria-label="Negrito">
          <Negrito />
        </button>
        <button type="button" onClick={() => prefixa("titulo")} disabled={previa} className={botao} title="Título de seção" aria-label="Título de seção">
          <Titulo />
        </button>
        <button type="button" onClick={() => prefixa("marcador")} disabled={previa} className={botao} title="Lista com marcadores" aria-label="Lista com marcadores">
          <ListaMarcadores />
        </button>
        <button type="button" onClick={() => prefixa("numerado")} disabled={previa} className={botao} title="Lista numerada" aria-label="Lista numerada">
          <ListaNumerada />
        </button>
        <button
          type="button"
          onClick={() => setPrevia((p) => !p)}
          aria-pressed={previa}
          className={`ml-auto rounded-md px-2.5 py-1.5 text-xs font-medium ${previa ? "bg-brand-50 text-brand-texto" : "text-tinta-2 hover:bg-superficie-3"}`}
        >
          {previa ? "Voltar a editar" : "Ver como fica"}
        </button>
      </div>

      {previa ? (
        <div className="min-h-24 px-3 py-2">
          {value.trim() ? <TextoFormatado texto={value} /> : <p className="text-sm text-tinta-3">Nada escrito ainda.</p>}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          className="block w-full resize-y rounded-b-lg bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
      )}

      <p className={`border-t border-linha-forte px-3 py-1 text-right text-xs ${restante < 200 ? "text-perigo" : "text-tinta-3"}`}>
        {value.length.toLocaleString("pt-BR")} / {maxLength.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
```

## 3.7 Galeria e captura de fotos

Cartão **Fotos** da coluna da direita da OS: uma seção por momento (Entrada, Serviço, Saída), miniaturas quadradas, modo **Descrever fotos** e **visor em tela cheia**. Estados visuais que vale mostrar no vídeo: seção vazia (tracejada, com "Tirar foto"), miniatura **Enviando** (com spinner sobre a prévia apagada), miniatura com **erro** (borda vermelha, "Tentar novamente") e seção com **arrastar e soltar** ativo (fundo avermelhado).

### src/components/Fotos.tsx

_Lógica de dados removida (compressão no aparelho, envio com 3 tentativas, gravação de descrição e momento, exclusão). Visual intacto._

```tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  FOTO_LEGENDA_MAX,
  FOTO_TIPOS,
  FOTO_TIPO_ORCAMENTO,
  FOTO_TIPO_PADRAO,
  tipoDaFoto,
  type FotoTipo,
} from "@/lib/constants";
import { Avancar, Fechar, Voltar } from "@/components/ui/Icones";

export type Foto = {
  id: string;
  url: string;
  legenda: string | null;
  tipo: string;
  createdAt: string;
};

type Enviando = { tempId: string; preview: string; tipo: FotoTipo; file: File; erro?: string };

// Uma seção só, sem título próprio: é o que o orçamento usa.
const SECAO_UNICA = [
  { value: FOTO_TIPO_ORCAMENTO, label: "Fotos", ajuda: "" },
] as const;

export default function Fotos({
  apiBase: _apiBase,
  fotos,
  onChange,
  podeEditar,
  porMomento = true,
  documento = "OS",
}: {
  /** Rota das fotos deste documento, ex.: `/api/os/<id>/fotos`. */
  apiBase: string;
  fotos: Foto[];
  onChange: (atualizar: (atuais: Foto[]) => Foto[]) => void;
  podeEditar: boolean;
  /** Separa por entrada/serviço/saída (OS) ou mostra uma galeria só (orçamento). */
  porMomento?: boolean;
  documento?: "OS" | "orçamento";
}) {
  const secoes = porMomento ? FOTO_TIPOS : SECAO_UNICA;
  // Fotos ainda subindo (prévia local). Para o vídeo, dá para simular uma com `erro`.
  const [enviando] = useState<Enviando[]>([]);
  // O visor guarda o id, não o índice.
  const [visor, setVisor] = useState<string | null>(null);
  // "Descrever fotos": campo de texto embaixo de cada miniatura.
  const [descrevendo, setDescrevendo] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);

  const fotosDaSecao = (valor: FotoTipo) =>
    porMomento ? fotos.filter((f) => tipoDaFoto(f.tipo) === valor) : fotos;

  // Ordem de navegação do visor: seções na ordem definida, cronológico dentro de cada uma.
  const ordenadas = useMemo(
    () =>
      porMomento
        ? FOTO_TIPOS.flatMap((t) => fotos.filter((f) => tipoDaFoto(f.tipo) === t.value))
        : fotos,
    [fotos, porMomento]
  );
  const indice = visor === null ? -1 : ordenadas.findIndex((f) => f.id === visor);
  const fotoAtual = indice >= 0 ? ordenadas[indice] : null;

  // [removido: enviarArquivos / enviarPendente — comprime no aparelho e envia uma por vez]
  function enviarArquivos(_files: FileList | File[] | null, _tipo: FotoTipo) {}
  function enviarPendente(_pendente: Enviando) {}
  function removerPendente(_tempId: string) {}
  function escolher(origem: "camera" | "galeria", _tipo: FotoTipo) {
    (origem === "camera" ? cameraRef : galeriaRef).current?.click();
  }
  // [removido: excluir (com confirmação "Excluir esta foto?"), salvarLegenda, salvarTipo]
  function excluir(_id: string) {}
  function salvarLegenda(id: string, legenda: string) {
    onChange((atuais) => atuais.map((f) => (f.id === id ? { ...f, legenda: legenda.trim() || null } : f)));
  }
  function salvarTipo(id: string, tipo: FotoTipo) {
    onChange((atuais) => atuais.map((f) => (f.id === id ? { ...f, tipo } : f)));
  }
  // [removido: setas do teclado no visor e trava de rolagem do fundo]

  const total = fotos.length;

  return (
    <div className="no-print rounded-xl border border-linha bg-superficie p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-tinta">Fotos</h2>
          <p className="text-xs text-tinta-3">
            {descrevendo && total > 0
              ? "Escreva embaixo de cada foto o que ela mostra — a descrição sai no PDF do cliente"
              : total > 0
                ? `${total} foto${total > 1 ? "s" : ""} — ${
                    porMomento
                      ? "aparecem no fim do PDF do cliente, separadas por momento"
                      : `aparecem no fim do PDF do ${documento}`
                  }`
                : porMomento
                  ? "Registre o veículo na entrada, o serviço e a entrega"
                  : "Mostre o defeito e o estado do veículo — a foto segue junto na conversão em OS"}
          </p>
        </div>
        {podeEditar && total > 0 && (
          <button
            onClick={() => setDescrevendo((v) => !v)}
            aria-pressed={descrevendo}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              descrevendo
                ? "border-brand-600 bg-brand-600 text-brand-fg hover:bg-brand-700"
                : "border-linha-forte text-tinta-2 hover:bg-superficie-2"
            )}
          >
            {descrevendo ? "Concluir" : "Descrever fotos"}
          </button>
        )}
      </div>

      {podeEditar && (
        <>
          {/* Câmera traseira no celular; várias fotos de uma vez. */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="hidden" />
          <input ref={galeriaRef} type="file" accept="image/*" multiple className="hidden" />
        </>
      )}

      {secoes.map((t) => (
        <Secao
          key={t.value}
          label={t.label}
          ajuda={t.ajuda}
          comTitulo={porMomento}
          fotos={fotosDaSecao(t.value)}
          enviando={porMomento ? enviando.filter((e) => e.tipo === t.value) : enviando}
          podeEditar={podeEditar}
          descrevendo={descrevendo}
          onSoltar={(files) => enviarArquivos(files, t.value)}
          onEscolher={(origem) => escolher(origem, t.value)}
          onAbrir={setVisor}
          onLegenda={salvarLegenda}
          onTentarNovamente={(e) => enviarPendente(e)}
          onRemoverPendente={removerPendente}
        />
      ))}

      {/* Visor em tela cheia */}
      {fotoAtual && (
        <Visor
          foto={fotoAtual}
          indice={indice}
          total={ordenadas.length}
          podeEditar={podeEditar}
          comMomento={porMomento}
          onFechar={() => setVisor(null)}
          onAnterior={() => indice > 0 && setVisor(ordenadas[indice - 1].id)}
          onProxima={() => indice < ordenadas.length - 1 && setVisor(ordenadas[indice + 1].id)}
          onExcluir={() => excluir(fotoAtual.id)}
          onLegenda={(texto) => salvarLegenda(fotoAtual.id, texto)}
          onTipo={(tipo) => salvarTipo(fotoAtual.id, tipo)}
        />
      )}
    </div>
  );
}

/** Um momento do serviço (entrada, serviço, saída) — cada um é seu próprio alvo de envio. */
function Secao({
  label,
  ajuda,
  comTitulo,
  fotos,
  enviando,
  podeEditar,
  descrevendo,
  onSoltar,
  onEscolher,
  onAbrir,
  onLegenda,
  onTentarNovamente,
  onRemoverPendente,
}: {
  label: string;
  ajuda: string;
  comTitulo: boolean;
  fotos: Foto[];
  enviando: Enviando[];
  podeEditar: boolean;
  descrevendo: boolean;
  onSoltar: (files: FileList) => void;
  onEscolher: (origem: "camera" | "galeria") => void;
  onAbrir: (id: string) => void;
  onLegenda: (id: string, texto: string) => void;
  onTentarNovamente: (item: Enviando) => void;
  onRemoverPendente: (tempId: string) => void;
}) {
  const [arrastando, setArrastando] = useState(false);
  const vazio = fotos.length === 0 && enviando.length === 0;

  return (
    <section
      onDragOver={
        podeEditar
          ? (e) => {
              e.preventDefault();
              setArrastando(true);
            }
          : undefined
      }
      onDragLeave={() => setArrastando(false)}
      onDrop={
        podeEditar
          ? (e) => {
              e.preventDefault();
              setArrastando(false);
              onSoltar(e.dataTransfer.files);
            }
          : undefined
      }
      className={cn(
        "rounded-xl transition-colors",
        comTitulo && "border p-3",
        arrastando
          ? comTitulo
            ? "border-perigo-linha bg-perigo-fraco"
            : "bg-perigo-fraco"
          : comTitulo && "border-linha"
      )}
    >
      {comTitulo && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-tinta">
            {label}
            {fotos.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-tinta-3">{fotos.length}</span>
            )}
          </h3>
          <span className="truncate text-xs text-tinta-3">{ajuda}</span>
        </div>
      )}

      {vazio ? (
        podeEditar ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-linha px-3 py-4 sm:flex-row sm:justify-center">
            <span className="text-xs text-tinta-3">
              <span className="hidden sm:inline">Arraste as fotos aqui ou</span>
              <span className="sm:hidden">Nenhuma foto ainda</span>
            </span>
            <button
              onClick={() => onEscolher("camera")}
              className="rounded-lg bg-contraste px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 sm:hidden"
            >
              Tirar foto
            </button>
            <button
              onClick={() => onEscolher("galeria")}
              className="rounded-lg border border-linha-forte px-3 py-1.5 text-xs font-medium text-tinta-2 hover:bg-superficie-2"
            >
              <span className="sm:hidden">Escolher da galeria</span>
              <span className="hidden sm:inline">escolha os arquivos</span>
            </button>
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-tinta-3">Nenhuma foto.</p>
        )
      ) : (
        <div
          className={cn(
            "grid gap-2",
            descrevendo
              ? "grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
          )}
        >
          {fotos.map((foto) => {
            const miniatura = (
              <button
                key={foto.id}
                onClick={() => onAbrir(foto.id)}
                className="group relative aspect-square w-full overflow-hidden rounded-lg border border-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.legenda ?? `Foto — ${label}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {/* No modo descrever o texto aparece no campo abaixo, sem cobrir a foto. */}
                {foto.legenda && !descrevendo && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-left text-xs text-white">
                    {foto.legenda}
                  </span>
                )}
              </button>
            );

            if (!descrevendo) return miniatura;
            return (
              <div key={foto.id} className="space-y-1.5">
                {miniatura}
                <CampoDescricao
                  legenda={foto.legenda}
                  onSalvar={(texto) => onLegenda(foto.id, texto)}
                />
              </div>
            );
          })}

          {enviando.map((e) =>
            e.erro ? (
              <button
                key={e.tempId}
                onClick={() => onTentarNovamente(e)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-perigo-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.preview} alt="" className="h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
                  <span className="text-xs font-medium text-perigo">{e.erro}</span>
                  <span className="text-xs font-semibold text-tinta-2 underline">
                    Tentar novamente
                  </span>
                </div>
                <span
                  role="button"
                  aria-label="Remover"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onRemoverPendente(e.tempId);
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Fechar tamanho={12} />
                </span>
              </button>
            ) : (
              <div
                key={e.tempId}
                className="relative aspect-square overflow-hidden rounded-lg border border-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.preview} alt="" className="h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
                  <Spinner />
                  <span className="text-xs text-tinta-2">Enviando</span>
                </div>
              </div>
            )
          )}

          {podeEditar && (
            <>
              <button
                onClick={() => onEscolher("camera")}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-linha text-tinta-3 hover:border-linha-forte hover:text-tinta-2 sm:hidden"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">Tirar foto</span>
              </button>
              <button
                onClick={() => onEscolher("galeria")}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-linha text-tinta-3 hover:border-linha-forte hover:text-tinta-2"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">
                  <span className="sm:hidden">Galeria</span>
                  <span className="hidden sm:inline">Adicionar</span>
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Visor({
  foto,
  indice,
  total,
  podeEditar,
  comMomento,
  onFechar,
  onAnterior,
  onProxima,
  onExcluir,
  onLegenda,
  onTipo,
}: {
  foto: Foto;
  indice: number;
  total: number;
  podeEditar: boolean;
  comMomento: boolean;
  onFechar: () => void;
  onAnterior: () => void;
  onProxima: () => void;
  onExcluir: () => void;
  onLegenda: (texto: string) => void;
  onTipo: (tipo: FotoTipo) => void;
}) {
  const [legenda, setLegenda] = useState(foto.legenda ?? "");
  const tipoAtual = tipoDaFoto(foto.tipo);
  // [removido: deslizar o dedo para o lado troca de foto]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onFechar}
    >
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/70">
          {indice + 1} de {total} · {formatDate(foto.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          {podeEditar && (
            <button
              onClick={onExcluir}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm text-red-300 hover:bg-white/10"
            >
              Excluir
            </button>
          )}
          <button
            onClick={onFechar}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
      >
        {indice > 0 && (
          <button
            onClick={onAnterior}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Foto anterior"
          >
            <Voltar tamanho={20} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt={foto.legenda ?? "Foto do serviço"}
          className="max-h-full max-w-full object-contain"
        />
        {indice < total - 1 && (
          <button
            onClick={onProxima}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Próxima foto"
          >
            <Avancar tamanho={20} />
          </button>
        )}
      </div>

      <div className="space-y-3 px-4 py-4" onClick={(e) => e.stopPropagation()}>
        {podeEditar ? (
          <>
            {comMomento && (
            <div className="flex items-center justify-center gap-1.5">
              {FOTO_TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => t.value !== tipoAtual && onTipo(t.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    t.value === tipoAtual
                      ? "border-white bg-white text-black"
                      : "border-white/25 text-white/70 hover:bg-white/10"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            )}
            <input
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              onBlur={() => legenda !== (foto.legenda ?? "") && onLegenda(legenda)}
              placeholder="Descrição (ex: Pastilha desgastada, Painel na entrega)"
              maxLength={FOTO_LEGENDA_MAX}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </>
        ) : (
          <p className="text-center text-sm text-white/80">
            {[comMomento ? FOTO_TIPOS.find((t) => t.value === tipoAtual)?.label : null, foto.legenda]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

/** Campo de descrição embaixo da miniatura (modo "Descrever fotos"). */
function CampoDescricao({
  legenda,
  onSalvar,
}: {
  legenda: string | null;
  onSalvar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState(legenda ?? "");

  return (
    <input
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto.trim() !== (legenda ?? "") && onSalvar(texto)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      placeholder="Descreva a foto"
      maxLength={FOTO_LEGENDA_MAX}
      aria-label="Descrição da foto"
      className="w-full rounded-lg border border-linha px-2 py-1.5 text-xs text-tinta-2 placeholder:text-tinta-3 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
    />
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-tinta-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
```

## 3.8 Topo do documento

### src/components/CabecalhoDocumento.tsx

_No repositório, a configuração vem de `useConfiguracao()` (busca de dados). Aqui ela chega por prop: passe `configuracao` da Parte 4._

```tsx
"use client";

import { linhasDoCabecalho, type Configuracao } from "@/lib/configuracao";

/**
 * Topo do documento que o cliente recebe (OS e orçamento, na tela e na impressão).
 * É o único lugar do sistema onde a oficina aparece com nome, logo e contato próprios.
 */
export default function CabecalhoDocumento({ config }: { config?: Configuracao | null }) {
  // [removido: busca de dados — useConfiguracao()]

  if (!config) {
    // Esqueleto do mesmo tamanho do cabeçalho pronto — a folha não "pula" ao carregar.
    return (
      <div className="flex items-center gap-3 sm:gap-5 border-b border-linha px-5 sm:px-8 py-5 sm:py-6">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded bg-superficie-3 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="mx-auto h-6 w-2/3 animate-pulse rounded bg-superficie-3" />
          <div className="mx-auto h-3 w-1/2 animate-pulse rounded bg-superficie-3" />
        </div>
        <div aria-hidden className="h-14 w-14 shrink-0 sm:h-20 sm:w-20" />
      </div>
    );
  }

  const linhas = linhasDoCabecalho(config);

  return (
    <div className="flex items-center gap-3 sm:gap-5 border-b border-linha px-5 sm:px-8 py-5 sm:py-6">
      {config.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.logoUrl}
          alt={config.nome}
          width={80}
          height={80}
          className="h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20"
        />
      )}
      <div className="min-w-0 flex-1 text-center">
        <h1 className="font-sans text-lg font-black uppercase tracking-wider sm:text-2xl">{config.nome}</h1>
        {linhas.map((linha) => (
          <p key={linha} className="mt-0.5 text-xs text-tinta-3">
            {linha}
          </p>
        ))}
      </div>
      {/* Espelha a largura da logo para o título centralizar no card. */}
      {config.logoUrl && <div aria-hidden className="h-14 w-14 shrink-0 sm:h-20 sm:w-20" />}
    </div>
  );
}
```

## 3.9 Baixar em PDF ou imagem

Na tela da OS, este botão aparece **dentro do menu "⋯"** (`comoItem`), como duas linhas: "Baixar PDF" e "Baixar Imagem". A versão de botão dividido (com seta e menu "Baixar como") é a usada no orçamento.

### src/components/BaixarOS.tsx

_Geração do arquivo removida; fica a composição._

```tsx
"use client";

import BaixarDocumento from "./BaixarDocumento";
import type { OSForPdf } from "./OSPdfDocument";

/** Ex.: "OS 1312 - Camila Torres Andrade - Volkswagen Polo RXK4F72" */
function nomeArquivo(os: OSForPdf) {
  const { marca, modelo, placa } = os.veiculo;
  const veiculo = [marca, modelo, placa].filter(Boolean).join(" ");
  return [`OS ${os.numero}`, os.cliente.nome, veiculo].filter(Boolean).join(" - ");
}

export default function BaixarOS({ os, comoItem = false }: { os: OSForPdf; comoItem?: boolean }) {
  // [removido: gerarPdf — busca a configuração e a logo, converte as fotos em miniaturas
  //  e monta <OSPdfDocument os={os} logoSrc={logo} fotos={fotos} config={config} />]
  const gerarPdf = async () => new Blob();

  return (
    <BaixarDocumento
      gerarPdf={gerarPdf}
      nomeBase={nomeArquivo(os)}
      descricao="a OS"
      comoItem={comoItem}
    />
  );
}
```

### src/components/BaixarDocumento.tsx

_Lógica removida (gerar o PDF, converter em PNG página a página, salvar os arquivos, lembrar o formato, fechar o menu ao tocar fora). Visual intacto, inclusive os estados "Gerando imagem 1/2..." e "Tentar de novo"._

```tsx
"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FORMATOS, type FormatoDownload } from "@/lib/formato-download";

export default function BaixarDocumento({
  gerarPdf: _gerarPdf,
  nomeBase: _nomeBase,
  descricao,
  comoItem = false,
}: {
  gerarPdf: () => Promise<Blob>;
  /** Nome do arquivo sem extensão. */
  nomeBase: string;
  /** Como o documento se chama nas dicas. Ex.: "a OS", "o orçamento". */
  descricao: string;
  /** Dentro de um menu de ações: vira uma linha por formato, sem botão dividido. */
  comoItem?: boolean;
}) {
  const [formato, setFormato] = useState<FormatoDownload>("pdf");
  const [menuAberto, setMenuAberto] = useState(false);
  const [gerando] = useState<FormatoDownload | null>(null);
  const [progresso] = useState<string | null>(null);
  const [erro] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // [removido: baixar(alvo) — gera o arquivo e salva; documento de 2 páginas vira 2 PNGs]
  function baixar(_alvo: FormatoDownload) {}

  function escolher(alvo: FormatoDownload) {
    setFormato(alvo);
    setMenuAberto(false);
    baixar(alvo);
  }

  const atual = FORMATOS.find((f) => f.valor === formato)!;
  const ocupado = gerando !== null;

  const rotulo = ocupado
    ? `Gerando ${gerando === "imagem" ? "imagem" : "PDF"}${progresso ? ` ${progresso}` : ""}...`
    : erro
      ? "Tentar de novo"
      : `Baixar ${atual.label}`;

  if (comoItem) {
    return (
      <div className="w-full">
        {FORMATOS.map((f) => {
          const gerandoEste = gerando === f.valor;
          return (
            <button
              key={f.valor}
              onClick={() => escolher(f.valor)}
              disabled={ocupado}
              title={`Salvar ${descricao} em ${f.label}`}
              className={cn(
                "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-superficie-2 disabled:opacity-60",
                erro && gerandoEste ? "text-perigo" : "text-tinta-2"
              )}
            >
              <IconeDownload className="h-4 w-4 shrink-0" />
              <span>
                {gerandoEste
                  ? `Gerando ${f.label}${progresso ? ` ${progresso}` : ""}...`
                  : `Baixar ${f.label}`}
              </span>
            </button>
          );
        })}
        {erro && (
          <p role="alert" className="px-3 pb-1 text-xs leading-snug text-perigo">
            {erro}
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={caixa} className="relative">
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-lg border",
          erro ? "border-perigo-linha" : "border-linha-forte"
        )}
      >
        <button
          onClick={() => baixar(formato)}
          disabled={ocupado}
          title={erro ? `Não foi possível gerar o arquivo: ${erro}` : `Salvar ${descricao} em ${atual.label}`}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-superficie-2 disabled:opacity-60",
            erro ? "text-perigo" : "text-tinta-2"
          )}
        >
          <IconeDownload className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">{rotulo}</span>
        </button>

        <button
          onClick={() => setMenuAberto((v) => !v)}
          disabled={ocupado}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          aria-label="Escolher o formato do download"
          title="Escolher o formato: PDF ou imagem"
          className={cn(
            "border-l px-2 text-tinta-3 hover:bg-superficie-2 disabled:opacity-60",
            erro ? "border-perigo-linha" : "border-linha-forte",
            menuAberto && "bg-superficie-3"
          )}
        >
          <IconeSeta className={cn("h-4 w-4 transition-transform", menuAberto && "rotate-180")} />
        </button>
      </div>

      {erro && (
        <p role="alert" className="mt-1 max-w-[16rem] text-right text-xs leading-snug text-perigo">
          {erro}
        </p>
      )}

      {menuAberto && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-linha bg-superficie shadow-lg"
        >
          <p className="border-b border-linha px-3 py-2 text-xs font-medium uppercase tracking-wide text-tinta-3">
            Baixar como
          </p>
          {FORMATOS.map((f) => {
            const selecionado = f.valor === formato;
            return (
              <button
                key={f.valor}
                role="menuitemradio"
                aria-checked={selecionado}
                onClick={() => escolher(f.valor)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-superficie-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selecionado ? "border-brand-500 bg-brand-500" : "border-linha-forte"
                  )}
                >
                  {selecionado && <span className="h-1.5 w-1.5 rounded-full bg-superficie" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-tinta">
                    {f.label}
                    <span className="ml-1 font-normal text-tinta-3">.{f.extensao}</span>
                  </span>
                  <span className="block text-xs leading-snug text-tinta-3">{f.descricao}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconeDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" />
      <path d="M3.5 13.5v1.75A1.75 1.75 0 0 0 5.25 17h9.5a1.75 1.75 0 0 0 1.75-1.75V13.5" />
    </svg>
  );
}

function IconeSeta({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5.5 8 4.5 4.5L14.5 8" />
    </svg>
  );
}
```

## 3.10 O PDF da OS (a imagem sai dele)

É um componente `@react-pdf/renderer`, e não HTML. A **imagem PNG** que vai para o WhatsApp é este mesmo PDF rasterizado em 3x. Página 1: o documento. Página 2: "Fotos do Serviço", em grade de 3 colunas por momento. As cores fixas são cinzas (`C`); só o filete e o "Nº 1312" usam a cor da oficina (`config.corDocumento`, que `corDeTextoNoPapel` escurece se for clara demais para papel branco).

### src/components/OSPdfDocument.tsx

_Íntegro._

```tsx
import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";
import { FOTO_TIPOS, tipoDaFoto, labelStatus, anoVeiculo } from "@/lib/constants";
import type { FotoPdf } from "@/lib/foto-pdf";
import { TextoFormatadoPdf } from "@/components/TextoFormatadoPdf";
import { corDeTextoNoPapel } from "@/lib/cor-documento";
import {
  CONFIG_PADRAO,
  linhasDoCabecalho,
  rodapeDoDocumento,
  EMITIDO_COM,
  type Configuracao,
} from "@/lib/configuracao";

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number;
};
type Pagamento = {
  id: string; valor: number; formaPagamento: string; data: string; obs: string | null;
};
export type OSForPdf = {
  numero: number; status: string; descricao: string;
  defeitoRelatado?: string | null;
  kmEntrada: number | null; kmSaida: number | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  pago: boolean; valorPago: number; obs: string | null;
  mecanico: string | null; nivelCombustivel: string | null; combustivelEmUso: string | null;
  abertura: string; fechamento: string | null;
  cliente: {
    nome: string; telefone: string | null; cpfCnpj: string | null; email: string | null;
    endereco: string | null; cidade: string | null; estado: string | null;
  };
  veiculo: {
    marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
  };
  itens: Item[];
  pagamentos: Pagamento[];
  fotos?: { id: string; url: string; legenda: string | null; tipo: string; createdAt: string }[];
};

// Rótulos próprios do impresso: no papel cabe o nome por extenso, enquanto o badge
// da tela usa a forma curta de `labelStatus`.
const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta", EM_ANDAMENTO: "Em Andamento", AGUARDANDO_PECA: "Aguardando Peça",
  ENTREGUE: "Entregue", CANCELADA: "Cancelada",
};
const NIVEL_LABEL: Record<string, string> = { CHEIO: "Cheio", MEIO: "Meio", VAZIO: "Vazio" };
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function dia(d: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

const C = {
  ink: "#18181b", sub: "#52525b", mute: "#a1a1aa", line: "#e4e4e7",
  soft: "#f4f4f5", red: "#dc2626",
};

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40, fontSize: 9, color: C.ink, fontFamily: "Helvetica" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: -6 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  brandText: { justifyContent: "center" },
  logo: { width: 88, height: 88, objectFit: "contain" },
  brandName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, letterSpacing: 0.5 },
  brandLine: { fontSize: 8.5, color: C.sub, marginTop: 1.5 },
  osLabel: { fontSize: 8, color: C.mute, letterSpacing: 1, textTransform: "uppercase", textAlign: "right" },
  osNum: { fontSize: 26, fontFamily: "Helvetica-Bold", color: C.red, textAlign: "right", marginTop: 1 },
  osDate: { fontSize: 8.5, color: C.sub, textAlign: "right", marginTop: 1 },
  osStatus: { fontSize: 8.5, color: C.sub, textAlign: "right", marginTop: 1, fontFamily: "Helvetica-Bold" },

  rule: { height: 2, backgroundColor: C.ink, marginBottom: 14 },

  // Cliente + Veículo (box único, duas colunas)
  infoBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12, marginBottom: 12 },
  infoCol: { flex: 1 },
  infoDivider: { width: 1, alignSelf: "stretch", backgroundColor: C.line, marginHorizontal: 12 },
  boxTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  boxName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  boxLine: { fontSize: 8.5, color: C.sub, marginBottom: 1.5, lineHeight: 1.3 },

  // Section
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  desc: { fontSize: 9.5, color: C.ink, lineHeight: 1.45 },
  descObs: { fontSize: 8.5, color: C.sub, marginTop: 4, fontFamily: "Helvetica-Oblique" },

  // Items table
  itensHead: { marginBottom: 0 },
  thead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingBottom: 4, marginBottom: 2 },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.soft, paddingVertical: 5, alignItems: "flex-start" },
  cTipo: { width: "16%", fontSize: 8, color: C.sub },
  cDesc: { width: "44%", fontSize: 9, color: C.ink, paddingRight: 6 },
  cQtd: { width: "10%", fontSize: 9, color: C.sub, textAlign: "right" },
  cUnit: { width: "15%", fontSize: 9, color: C.sub, textAlign: "right" },
  cTotal: { width: "15%", fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "right" },

  // Totals
  totals: { marginTop: 8, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 220, paddingVertical: 1.5 },
  totalLabel: { fontSize: 9, color: C.sub },
  totalValue: { fontSize: 9, color: C.sub },
  totalDescLabel: { fontSize: 9, color: C.red },
  totalDescValue: { fontSize: 9, color: C.red },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between", width: 220,
    borderTopWidth: 1.5, borderTopColor: C.ink, paddingTop: 4, marginTop: 3,
  },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },
  grandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },

  // Footer
  footer: {
    position: "absolute", bottom: 24, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.mute },

  // Assinatura
  signature: { marginTop: 36, alignItems: "center" },
  signatureLine: { width: 220, borderTopWidth: 1, borderTopColor: C.mute, paddingTop: 4 },
  signatureLabel: { fontSize: 8, color: C.mute, textAlign: "center" },

  // Recado da oficina (garantia, termos) — configurável no painel
  aviso: {
    marginTop: 14, borderWidth: 1, borderColor: C.line, borderRadius: 6,
    backgroundColor: C.soft, padding: 10,
  },
  avisoTexto: { fontSize: 8, color: C.sub, lineHeight: 1.45 },

  // Fotos
  fotosTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 2 },
  fotosSub: { fontSize: 8.5, color: C.sub, marginBottom: 2 },
  fotosDica: { fontSize: 7.5, color: C.mute, marginBottom: 12, fontFamily: "Helvetica-Oblique" },
  fotosSecao: { marginBottom: 4 },
  fotosSecaoTitulo: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.sub, textTransform: "uppercase",
    letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 3, marginBottom: 8,
  },
  // Margem negativa + padding simétrico: as colunas ficam com respiro igual dos dois
  // lados e a grade encosta certinho nas duas margens da página.
  fotosGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  fotoCell: { width: "33.33%", paddingHorizontal: 4, marginBottom: 12 },
  // "contain" em vez de "cover": foto de celular na vertical aparece inteira,
  // centralizada na moldura, em vez de ter as bordas cortadas.
  fotoBox: {
    backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderRadius: 4,
    textDecoration: "none",
  },
  fotoImg: { width: "100%", height: 120, objectFit: "contain" },
  fotoLegenda: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 3 },
  fotoData: { fontSize: 7.5, color: C.mute, marginTop: 1 },
});

export function OSPdfDocument({
  os,
  logoSrc,
  fotos = [],
  config = CONFIG_PADRAO,
}: {
  os: OSForPdf;
  logoSrc?: string;
  fotos?: FotoPdf[];
  config?: Configuracao;
}) {
  // Identidade da oficina — nome, contatos, rodapé e cor saem do painel.
  const cabecalho = linhasDoCabecalho(config);
  const rodape = rodapeDoDocumento(config);
  const marca = config.corDocumento;

  const veicLinha2: string[] = [];
  if (os.veiculo.cor) veicLinha2.push(`Cor: ${os.veiculo.cor}`);
  if (os.veiculo.motorizacao) veicLinha2.push(`Motor: ${os.veiculo.motorizacao}`);
  if (os.kmEntrada != null) veicLinha2.push(`KM entrada: ${os.kmEntrada.toLocaleString("pt-BR")}`);
  if (os.kmSaida != null) veicLinha2.push(`KM saída: ${os.kmSaida.toLocaleString("pt-BR")}`);
  if (os.nivelCombustivel) veicLinha2.push(`Combustível: ${NIVEL_LABEL[os.nivelCombustivel] ?? os.nivelCombustivel}`);
  if (os.combustivelEmUso) veicLinha2.push(`Em uso: ${os.combustivelEmUso}`);

  return (
    <Document title={`OS ${os.numero} - ${config.nome}`} author={config.nome}>
      <Page size="A4" style={s.page}>
        {/* Cabeçalho */}
        <View style={s.header}>
          <View style={s.brandRow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logoSrc ? <Image style={s.logo} src={logoSrc} /> : null}
            <View style={s.brandText}>
              <Text style={s.brandName}>{config.nome.toUpperCase()}</Text>
              {cabecalho.map((linha) => (
                <Text key={linha} style={s.brandLine}>{linha}</Text>
              ))}
            </View>
          </View>
          <View>
            <Text style={s.osLabel}>Ordem de Serviço</Text>
            <Text style={[s.osNum, { color: corDeTextoNoPapel(marca) }]}>Nº {os.numero}</Text>
            <Text style={s.osDate}>Abertura: {dia(os.abertura)}</Text>
            {os.fechamento ? <Text style={s.osDate}>Fechamento: {dia(os.fechamento)}</Text> : null}
            <Text style={s.osStatus}>Status: {STATUS_LABEL[os.status] ?? labelStatus(os.status)}</Text>
          </View>
        </View>

        <View style={[s.rule, { backgroundColor: marca }]} />

        {/* Cliente e Veículo */}
        <View style={s.infoBox}>
          <View style={s.infoCol}>
            <Text style={s.boxTitle}>Cliente</Text>
            <Text style={s.boxName}>{os.cliente.nome}</Text>
            {os.cliente.cpfCnpj ? <Text style={s.boxLine}>CPF/CNPJ: {os.cliente.cpfCnpj}</Text> : null}
            {os.cliente.telefone ? <Text style={s.boxLine}>Telefone: {os.cliente.telefone}</Text> : null}
            {os.cliente.email ? <Text style={s.boxLine}>E-mail: {os.cliente.email}</Text> : null}
            {os.cliente.endereco ? (
              <Text style={s.boxLine}>
                {os.cliente.endereco}
                {os.cliente.cidade ? `, ${os.cliente.cidade}` : ""}
                {os.cliente.estado ? ` - ${os.cliente.estado}` : ""}
              </Text>
            ) : null}
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoCol}>
            <Text style={s.boxTitle}>Veículo</Text>
            <Text style={s.boxName}>
              {os.veiculo.marca} {os.veiculo.modelo}{anoVeiculo(os.veiculo) ? ` (${anoVeiculo(os.veiculo)})` : ""}
            </Text>
            {os.veiculo.placa ? <Text style={s.boxLine}>Placa: {os.veiculo.placa}</Text> : null}
            {veicLinha2.length > 0 ? <Text style={s.boxLine}>{veicLinha2.join("  ·  ")}</Text> : null}
            {os.mecanico ? <Text style={s.boxLine}>Mecânico responsável: {os.mecanico}</Text> : null}
          </View>
        </View>

        {/* Defeito relatado */}
        {os.defeitoRelatado ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Defeito Relatado pelo Cliente</Text>
            <Text style={s.desc}>{os.defeitoRelatado}</Text>
          </View>
        ) : null}

        {/* Descrição */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Descrição do Serviço</Text>
          <TextoFormatadoPdf texto={os.descricao} />
          {os.obs ? <Text style={s.descObs}>Observações: {os.obs}</Text> : null}
        </View>

        {/* Itens */}
        {os.itens.length > 0 ? (
          <>
            <View style={s.itensHead} wrap={false}>
              <Text style={s.sectionTitle}>Itens e Serviços</Text>
              <View style={s.thead}>
                <Text style={[s.th, s.cTipo]}>Tipo</Text>
                <Text style={[s.th, s.cDesc]}>Descrição</Text>
                <Text style={[s.th, s.cQtd]}>Qtd</Text>
                <Text style={[s.th, s.cUnit]}>Vlr. Unit.</Text>
                <Text style={[s.th, s.cTotal]}>Total</Text>
              </View>
            </View>
            {os.itens.map((item) => (
              <View key={item.id} style={s.row} wrap={false}>
                <Text style={s.cTipo}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
                <Text style={s.cDesc}>{item.descricao}</Text>
                <Text style={s.cQtd}>{item.quantidade}</Text>
                <Text style={s.cUnit}>{brl(item.valorUnit)}</Text>
                <Text style={s.cTotal}>{brl(item.valorTotal)}</Text>
              </View>
            ))}

            {/* Totais */}
            <View style={s.totals} wrap={false}>
              {os.totalPecas > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Peças</Text>
                  <Text style={s.totalValue}>{brl(os.totalPecas)}</Text>
                </View>
              ) : null}
              {os.totalMO > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Mão de obra / Serviços</Text>
                  <Text style={s.totalValue}>{brl(os.totalMO)}</Text>
                </View>
              ) : null}
              {os.desconto > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalDescLabel}>Desconto</Text>
                  <Text style={s.totalDescValue}>- {brl(os.desconto)}</Text>
                </View>
              ) : null}
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>TOTAL</Text>
                <Text style={s.grandValue}>{brl(os.total)}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Recado da oficina (garantia, termos) */}
        {config.mensagemDocumento ? (
          <View style={s.aviso} wrap={false}>
            <Text style={s.avisoTexto}>{config.mensagemDocumento}</Text>
          </View>
        ) : null}

        {/* Assinatura */}
        {config.mostrarAssinatura ? (
          <View style={s.signature} wrap={false}>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Assinatura do Cliente</Text>
            </View>
          </View>
        ) : null}

        {/* Rodapé fixo */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{rodape}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${EMITIDO_COM}  ·  Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>

      {/* Fotos — páginas próprias, após o documento */}
      {fotos.length > 0 ? (
        <Page size="A4" style={s.page}>
          <Text style={s.fotosTitle}>Fotos do Serviço</Text>
          <Text style={s.fotosSub}>
            OS Nº {os.numero} · {os.veiculo.marca} {os.veiculo.modelo}
            {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
          </Text>
          <Text style={s.fotosDica}>Toque em uma foto para abri-la em alta resolução.</Text>

          {FOTO_TIPOS.map((t) => {
            const doMomento = fotos.filter((f) => tipoDaFoto(f.tipo) === t.value);
            if (doMomento.length === 0) return null;
            return (
              <View key={t.value} style={s.fotosSecao}>
                <Text style={s.fotosSecaoTitulo}>{t.label}</Text>
                <View style={s.fotosGrid}>
                  {doMomento.map((foto) => (
                    <View key={foto.id} style={s.fotoCell} wrap={false}>
                      <Link src={foto.url} style={s.fotoBox}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image style={s.fotoImg} src={foto.src} />
                      </Link>
                      {foto.legenda ? <Text style={s.fotoLegenda}>{foto.legenda}</Text> : null}
                      <Text style={s.fotoData}>{dia(foto.createdAt)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={s.footer} fixed>
            <Text style={s.footerText}>{rodape}</Text>
            <Text
              style={s.footerText}
              render={({ pageNumber, totalPages }) => `${EMITIDO_COM}  ·  Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ) : null}
    </Document>
  );
}
```

`FotoPdf` (de `src/lib/foto-pdf.ts`): `{ id: string; src: string; url: string; legenda: string | null; tipo: string; createdAt: string }`. `src` é uma miniatura em data URL, e `url` é a original usada como link.

## 3.11 Comprovante e extrato de pagamento

O comprovante é uma **imagem PNG** gerada a partir de um PDF de **380 pt de largura e altura livre**, no formato de um recibo de balcão. Com uma OS só, o título é "Comprovante de Pagamento"; com várias, "Extrato de Pagamentos", com a lista de serviços (quitado ou com saldo) e o histórico indicando a origem de cada pagamento.

### src/components/BaixarComprovante.tsx

_Geração da imagem removida; visual intacto._

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import type { ComprovanteDados } from "./ComprovantePagamentoPdfDocument";

/** Botão que gera direto uma imagem do histórico de pagamento. Sai só em PNG. */
export default function BaixarComprovante({
  dados: _dados,
  rotulo = "Baixar comprovante",
  titulo = "Baixar uma imagem com o histórico de pagamento",
}: {
  dados: ComprovanteDados;
  rotulo?: string;
  titulo?: string;
}) {
  const [gerando] = useState(false);
  const [erro] = useState<string | null>(null);

  // [removido: baixar — monta <ComprovantePagamentoPdfDocument />, converte em PNG e salva
  //  como "Comprovante - OS 1312 - Camila Torres Andrade.png" (ou "Extrato - Nome.png")]
  function baixar() {}

  return (
    <div className="relative">
      <Botao
        type="button"
        variante="secundario"
        tamanho="denso"
        onClick={baixar}
        disabled={gerando}
        title={erro ? `Não foi possível gerar o comprovante: ${erro}` : titulo}
        className={cn(erro && "border-perigo-linha text-perigo hover:bg-perigo-fraco")}
      >
        <IconeDownload className="h-3.5 w-3.5 shrink-0" />
        {gerando ? "Gerando..." : erro ? "Tentar de novo" : rotulo}
      </Botao>

      {erro && (
        <p role="alert" className="absolute right-0 top-full z-10 mt-1 w-56 text-right text-xs leading-snug text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}

function IconeDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" />
      <path d="M3.5 13.5v1.75A1.75 1.75 0 0 0 5.25 17h9.5a1.75 1.75 0 0 0 1.75-1.75V13.5" />
    </svg>
  );
}
```

### src/components/ComprovantePagamentoPdfDocument.tsx

_Íntegro._

```tsx
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { labelFormaPagamento } from "@/lib/constants";
import { CONFIG_PADRAO, EMITIDO_COM, rodapeDoDocumento, type Configuracao } from "@/lib/configuracao";

type Pagamento = {
  id: string | number; valor: number; formaPagamento: string; data: string; obs: string | null;
};
/**
 * Um débito do cliente: uma OS ou uma dívida avulsa.
 *
 * Uma OS tem `numero` e `veiculo`; uma dívida avulsa não tem nenhum dos dois — usa
 * `descricao` no lugar. Nunca os dois ao mesmo tempo.
 */
export type ComprovanteItem = {
  numero?: number;
  descricao?: string;
  veiculo?: { marca: string; modelo: string; placa: string | null };
  /** Desconto já abatido de `total`. Dívida avulsa não tem desconto. */
  desconto?: number;
  /** Entrega da OS (ou abertura, enquanto não sai) / criação da dívida. Só aparece no extrato. */
  data?: string;
  total: number;
  valorPago: number;
  pago: boolean;
  pagamentos: Pagamento[];
};

/**
 * Um comprovante por cliente, não por OS: com um débito só ele sai como o recibo
 * de sempre; com vários, vira extrato.
 */
export type ComprovanteDados = {
  cliente: { nome: string };
  itens: ComprovanteItem[];
};

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function dataCurta(d: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}
function dataHora(d: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export function identificacaoDoItem(item: ComprovanteItem) {
  return item.numero != null ? `OS Nº ${item.numero}` : (item.descricao ?? "Dívida avulsa");
}
export function saldoDoItem(item: ComprovanteItem) {
  // Centavo de arredondamento do Float não pode deixar um serviço quitado "em aberto".
  return item.pago ? 0 : Math.max(0, Math.round((item.total - item.valorPago) * 100) / 100);
}
function veiculoDoItem(item: ComprovanteItem) {
  if (!item.veiculo) return "";
  const nome = [item.veiculo.marca, item.veiculo.modelo].filter(Boolean).join(" ");
  return item.veiculo.placa ? `${nome} · ${item.veiculo.placa}` : nome;
}

const C = {
  ink: "#18181b", sub: "#52525b", mute: "#a1a1aa", line: "#e4e4e7",
  soft: "#f4f4f5", green: "#16a34a", red: "#dc2626",
};

// Largura fixa e sem altura: o react-pdf estica a página até caber tudo, do
// jeito de um recibo de balcão — sem paginação, que aqui só atrapalharia o
// recorte para o WhatsApp.
const LARGURA_PAGINA = 380;

const s = StyleSheet.create({
  page: { padding: 26, fontFamily: "Helvetica", fontSize: 9, color: C.ink },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  logo: { width: 36, height: 36, objectFit: "contain" },
  brandName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },
  brandLine: { fontSize: 8, color: C.sub, marginTop: 1 },

  rule: { height: 2, marginBottom: 16 },

  title: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  subtitle: { fontSize: 9, color: C.sub, marginBottom: 16, lineHeight: 1.4 },

  secTitle: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },

  debitos: { marginBottom: 16 },
  debRow: {
    flexDirection: "row", justifyContent: "space-between", gap: 10,
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.soft,
  },
  debInfo: { flex: 1 },
  debLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink },
  debSub: { fontSize: 7.5, color: C.mute, marginTop: 1.5 },
  debDireita: { alignItems: "flex-end" },
  debSaldo: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  debSituacao: { fontSize: 7, marginTop: 1.5, textTransform: "uppercase", letterSpacing: 0.5 },

  grid: {
    flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 16,
  },
  gridCol: { flex: 1, paddingVertical: 12, alignItems: "center" },
  gridDivider: { width: 1, backgroundColor: C.line },
  gridLabel: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  gridValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },

  desconto: {
    borderWidth: 1, borderColor: C.line, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10,
  },
  descontoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  descontoLabel: { fontSize: 8.5, color: C.sub },
  descontoValor: { fontSize: 8.5, color: C.sub },

  quitado: {
    flexDirection: "row", alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: C.green, borderRadius: 8, backgroundColor: "#f0fdf4",
    paddingVertical: 8, paddingHorizontal: 10,
  },
  quitadoTexto: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.green },

  histRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.soft },
  histLinha1: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" },
  histValor: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink },
  histForma: { fontSize: 8.5, color: C.sub, marginLeft: 6 },
  histObs: { fontSize: 8, color: C.sub, marginTop: 2, lineHeight: 1.35 },
  histData: { fontSize: 8, color: C.mute, marginTop: 2 },

  footer: { marginTop: 18, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 },
  footerText: { fontSize: 7.5, color: C.mute },
  footerGerado: { fontSize: 7.5, color: C.mute, marginTop: 2 },
});

export function ComprovantePagamentoPdfDocument({
  dados,
  logoSrc,
  geradoEm,
  config = CONFIG_PADRAO,
}: {
  dados: ComprovanteDados;
  logoSrc?: string;
  /** Fixado no momento em que o download começa, para bater com o nome do arquivo. */
  geradoEm: Date;
  config?: Configuracao;
}) {
  const { cliente, itens } = dados;
  const varios = itens.length > 1;

  const total = itens.reduce((acc, i) => acc + i.total, 0);
  const valorPago = itens.reduce((acc, i) => acc + i.valorPago, 0);
  const saldo = itens.reduce((acc, i) => acc + saldoDoItem(i), 0);
  // `total` já vem líquido; o bruto só existe aqui, para o cliente enxergar o abatimento.
  const desconto = itens.reduce((acc, i) => acc + (i.desconto ?? 0), 0);
  const emAberto = itens.filter((i) => saldoDoItem(i) > 0).length;
  const quitados = itens.length - emAberto;
  const quitado = itens.length > 0 && emAberto === 0;

  const unico = varios ? null : itens[0];
  const veiculoUnico = unico ? veiculoDoItem(unico) : "";

  // Um histórico só, em ordem de data, com a origem de cada pagamento à mão.
  const historico = itens
    .flatMap((item, idx) =>
      item.pagamentos.map((p) => ({ ...p, chave: `${idx}-${p.id}`, origem: identificacaoDoItem(item) }))
    )
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const tituloDoc = unico
    ? `Comprovante - ${identificacaoDoItem(unico)} - ${cliente.nome}`
    : `Extrato - ${cliente.nome}`;
  const resumoContagem = [
    emAberto > 0 ? `${emAberto} em aberto` : "",
    quitados > 0 ? `${quitados} ${quitados === 1 ? "quitado" : "quitados"}` : "",
  ].filter(Boolean).join(" · ");

  return (
    <Document title={tituloDoc} author={config.nome}>
      <Page size={{ width: LARGURA_PAGINA }} style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoSrc ? <Image style={s.logo} src={logoSrc} /> : null}
          <View>
            <Text style={s.brandName}>{config.nome}</Text>
            {config.telefone ? <Text style={s.brandLine}>{config.telefone}</Text> : null}
          </View>
        </View>

        <View style={[s.rule, { backgroundColor: config.corDocumento }]} />

        <Text style={s.title}>{varios ? "Extrato de Pagamentos" : "Comprovante de Pagamento"}</Text>
        {unico ? (
          <Text style={s.subtitle}>
            {identificacaoDoItem(unico)} · {cliente.nome}
            {veiculoUnico ? `\n${veiculoUnico}` : ""}
          </Text>
        ) : (
          <Text style={s.subtitle}>
            {cliente.nome}
            {`\n${resumoContagem}`}
          </Text>
        )}

        {varios ? (
          <View style={s.debitos}>
            <Text style={s.secTitle}>{quitados > 0 ? "Serviços" : "Débitos"}</Text>
            {itens.map((item, idx) => {
              const saldoItem = saldoDoItem(item);
              const contexto = [veiculoDoItem(item), item.data ? dataCurta(item.data) : ""]
                .filter(Boolean)
                .join(" · ");
              return (
                <View key={idx} style={s.debRow}>
                  <View style={s.debInfo}>
                    <Text style={s.debLabel}>{identificacaoDoItem(item)}</Text>
                    {contexto ? <Text style={s.debSub}>{contexto}</Text> : null}
                    <Text style={s.debSub}>
                      Total {brl(item.total)}
                      {item.valorPago > 0 ? ` · Pago ${brl(item.valorPago)}` : ""}
                    </Text>
                  </View>
                  {saldoItem > 0 ? (
                    <View style={s.debDireita}>
                      <Text style={[s.debSaldo, { color: C.red }]}>{brl(saldoItem)}</Text>
                      <Text style={[s.debSituacao, { color: C.red }]}>Em aberto</Text>
                    </View>
                  ) : (
                    <View style={s.debDireita}>
                      <Text style={[s.debSaldo, { color: C.green }]}>Quitado</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {desconto > 0 ? (
          <View style={s.desconto}>
            <View style={s.descontoRow}>
              <Text style={s.descontoLabel}>Valor sem desconto</Text>
              <Text style={s.descontoValor}>{brl(total + desconto)}</Text>
            </View>
            <View style={s.descontoRow}>
              <Text style={[s.descontoLabel, { color: C.green }]}>
                {varios ? "Descontos aplicados" : "Desconto aplicado"}
              </Text>
              <Text style={[s.descontoValor, { color: C.green }]}>- {brl(desconto)}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.grid}>
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Total</Text>
            <Text style={s.gridValue}>{brl(total)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Pago</Text>
            <Text style={[s.gridValue, { color: C.green }]}>{brl(valorPago)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Saldo</Text>
            <Text style={[s.gridValue, { color: saldo > 0 ? C.red : C.green }]}>{brl(saldo)}</Text>
          </View>
        </View>

        {quitado ? (
          <View style={s.quitado}>
            <Text style={s.quitadoTexto}>Pagamento quitado</Text>
          </View>
        ) : null}

        {historico.length > 0 ? (
          <View>
            <Text style={s.secTitle}>Histórico</Text>
            {historico.map((p) => (
              <View key={p.chave} style={s.histRow}>
                <View style={s.histLinha1}>
                  <Text style={s.histValor}>{brl(p.valor)}</Text>
                  <Text style={s.histForma}>{labelFormaPagamento(p.formaPagamento)}</Text>
                </View>
                {/* Linha própria: na mesma linha do valor, uma observação longa
                    quebrava recuada debaixo da forma de pagamento. */}
                {p.obs ? <Text style={s.histObs}>{p.obs}</Text> : null}
                <Text style={s.histData}>
                  {dataHora(p.data)}
                  {varios ? ` · ${p.origem}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={s.footer}>
          <Text style={s.footerText}>{rodapeDoDocumento(config)}</Text>
          <Text style={s.footerGerado}>
            {varios ? "Extrato" : "Comprovante"} gerado em {dataHora(geradoEm)}  ·  {EMITIDO_COM}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
```

## 3.12 Extrato do cliente

Janela aberta pelo botão **Extrato de pagamentos** da ficha do cliente. Já abre com o que está em aberto e o que foi quitado nos últimos 30 dias marcados.

### src/components/ExtratoCliente.tsx

_Busca de dados removida (`GET /api/clientes/[id]/extrato`); visual intacto._

```tsx
"use client";

import { useMemo, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { labelStatus } from "@/lib/constants";
import { Botao } from "@/components/ui/Botao";
import { Modal } from "@/components/ui/Modal";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import BaixarComprovante from "@/components/BaixarComprovante";
import {
  identificacaoDoItem,
  saldoDoItem,
  type ComprovanteItem,
} from "@/components/ComprovantePagamentoPdfDocument";

/** Uma linha da seleção: o item do comprovante mais o que a tela precisa para decidir e ordenar. */
type Linha = {
  chave: string;
  item: ComprovanteItem;
  /** Status da OS quando ainda não foi entregue — o cliente pode estar pagando sinal. */
  statusPendente: string | null;
  ultimoPagamento: number;
};

const QUITADOS_VISIVEIS = 8;

export default function ExtratoCliente({ clienteId: _clienteId, onFechar }: { clienteId: string; onFechar: () => void }) {
  // [removido: busca de dados — monta as linhas a partir das OS e dívidas do cliente
  //  e marca de início o que está em aberto e o que foi quitado há até 30 dias]
  const [cliente] = useState<{ nome: string } | null>(null);
  const [linhas] = useState<Linha[]>([]);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [carregando] = useState(false);
  const [erro] = useState(false);
  const [todosQuitados, setTodosQuitados] = useState(false);

  const abertas = useMemo(
    () =>
      linhas
        .filter((l) => saldoDoItem(l.item) > 0)
        .sort((a, b) => new Date(b.item.data!).getTime() - new Date(a.item.data!).getTime()),
    [linhas]
  );
  const quitadas = useMemo(
    () => linhas.filter((l) => saldoDoItem(l.item) === 0).sort((a, b) => b.ultimoPagamento - a.ultimoPagamento),
    [linhas]
  );

  // Na imagem, o que está em aberto vem primeiro: é a parte que pede ação do cliente.
  const itens = [...abertas, ...quitadas].filter((l) => marcadas.has(l.chave)).map((l) => l.item);
  const total = itens.reduce((acc, i) => acc + i.total, 0);
  const pago = itens.reduce((acc, i) => acc + i.valorPago, 0);
  const saldo = itens.reduce((acc, i) => acc + saldoDoItem(i), 0);

  function alternar(chave: string) {
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(chave)) nova.delete(chave);
      else nova.add(chave);
      return nova;
    });
  }
  function marcarGrupo(grupo: Linha[], marcar: boolean) {
    setMarcadas((atual) => {
      const nova = new Set(atual);
      for (const l of grupo) {
        if (marcar) nova.add(l.chave);
        else nova.delete(l.chave);
      }
      return nova;
    });
  }

  const quitadasVisiveis = todosQuitados ? quitadas : quitadas.slice(0, QUITADOS_VISIVEIS);

  return (
    <Modal
      titulo="Extrato para o cliente"
      descricao="Marque o que entra na imagem. Sai com o que foi quitado, o que está em aberto e o histórico de pagamentos."
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-tinta-3">Total</p>
              <p className="font-semibold tabular-nums text-tinta">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-tinta-3">Pago</p>
              <p className="font-semibold tabular-nums text-ok">{formatCurrency(pago)}</p>
            </div>
            <div>
              <p className="text-tinta-3">Em aberto</p>
              <p className={cn("font-semibold tabular-nums", saldo > 0 ? "text-perigo" : "text-ok")}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Botao variante="secundario" tamanho="denso" onClick={onFechar}>
              Fechar
            </Botao>
            {cliente && itens.length > 0 ? (
              <BaixarComprovante
                dados={{ cliente, itens }}
                rotulo={itens.length > 1 ? "Baixar extrato" : "Baixar comprovante"}
                titulo="Baixar uma imagem com o que foi pago e o que está em aberto"
              />
            ) : (
              <Botao variante="secundario" tamanho="denso" disabled>
                Baixar extrato
              </Botao>
            )}
          </div>
        </div>
      }
    >
      {carregando ? (
        <EsqueletoLista linhas={3} />
      ) : erro ? (
        <p className="text-sm text-perigo">Não foi possível carregar os pagamentos deste cliente.</p>
      ) : linhas.length === 0 ? (
        <Vazio titulo="Nada para mostrar" texto="Este cliente ainda não tem OS com valor nem dívidas registradas." compacto />
      ) : (
        <div className="space-y-5">
          {abertas.length > 0 && (
            <Grupo
              titulo="Em aberto"
              linhas={abertas}
              marcadas={marcadas}
              onAlternar={alternar}
              onMarcarGrupo={(m) => marcarGrupo(abertas, m)}
            />
          )}
          {quitadas.length > 0 && (
            <Grupo
              titulo="Quitados"
              linhas={quitadasVisiveis}
              marcadas={marcadas}
              onAlternar={alternar}
              onMarcarGrupo={(m) => marcarGrupo(quitadas, m)}
              rodape={
                quitadas.length > QUITADOS_VISIVEIS && (
                  <button
                    type="button"
                    onClick={() => setTodosQuitados(!todosQuitados)}
                    className="min-h-11 text-sm text-brand-texto hover:underline sm:min-h-0"
                  >
                    {todosQuitados ? "Mostrar só os mais recentes" : `Mostrar mais ${quitadas.length - QUITADOS_VISIVEIS}`}
                  </button>
                )
              }
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function Grupo({
  titulo,
  linhas,
  marcadas,
  onAlternar,
  onMarcarGrupo,
  rodape,
}: {
  titulo: string;
  linhas: Linha[];
  marcadas: Set<string>;
  onAlternar: (chave: string) => void;
  onMarcarGrupo: (marcar: boolean) => void;
  rodape?: React.ReactNode;
}) {
  const todasMarcadas = linhas.every((l) => marcadas.has(l.chave));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-tinta-3">{titulo}</p>
        <button
          type="button"
          onClick={() => onMarcarGrupo(!todasMarcadas)}
          className="min-h-11 text-xs text-brand-texto hover:underline sm:min-h-0"
        >
          {todasMarcadas ? "Desmarcar todos" : "Marcar todos"}
        </button>
      </div>
      <div className="divide-y divide-linha rounded-xl border border-linha">
        {linhas.map((l) => {
          const saldo = saldoDoItem(l.item);
          const veiculo = l.item.veiculo
            ? `${l.item.veiculo.marca} ${l.item.veiculo.modelo}${l.item.veiculo.placa ? ` · ${l.item.veiculo.placa}` : ""}`
            : "";
          const quando =
            saldo > 0
              ? l.statusPendente
                ? labelStatus(l.statusPendente)
                : l.item.data
                  ? formatDate(l.item.data)
                  : ""
              : l.ultimoPagamento > 0
                ? `Quitado em ${formatDate(new Date(l.ultimoPagamento))}`
                : "";
          return (
            <label key={l.chave} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-superficie-2">
              <input
                type="checkbox"
                checked={marcadas.has(l.chave)}
                onChange={() => onAlternar(l.chave)}
                className="h-4 w-4 shrink-0 rounded border-linha-forte accent-brand-600"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-tinta">{identificacaoDoItem(l.item)}</p>
                <p className="truncate text-xs text-tinta-3">
                  {[veiculo, quando].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                {saldo > 0 ? (
                  <>
                    <p className="font-semibold tabular-nums text-perigo">{formatCurrency(saldo)}</p>
                    <p className="tabular-nums text-tinta-3">de {formatCurrency(l.item.total)}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-ok">Quitado</p>
                    <p className="tabular-nums text-tinta-3">{formatCurrency(l.item.total)}</p>
                  </>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {rodape}
    </div>
  );
}
```

## 3.13 Indicador de lucro e margem por OS (lista de OS)

Na lista `/os`, cada linha mostra **lucro real e margem %** numa coluna estreita que só aparece a partir de `lg` e só para o dono. A cor segue `corMargem`: verde a partir de 40%, âmbar de 20% a 39% e vermelho abaixo de 20%. A lista inteira já foi enviada no pacote 2 de 07/10; aqui vai só a linha.

### src/app/os/page.tsx

_Trecho: o componente `OSRow`._

```tsx
import Link from "next/link";
import { cn, formatCurrency, formatDate, situacaoRecebimento } from "@/lib/utils";
import { corMargem, corStatus, labelStatus, margemOS } from "@/lib/constants";
import { resumoDoTexto } from "@/lib/texto-formatado";

type OS = {
  id: string; numero: number; status: string; descricao: string;
  total: number; valorPago: number; pago: boolean; abertura: string; mecanico: string | null;
  lucroReal?: number; // ausente para o operador
  cliente: { id: string; nome: string; apelido: string | null };
  veiculo: { marca: string; modelo: string; placa: string | null };
};

function OSRow({ os, podeFinanceiro }: { os: OS; podeFinanceiro: boolean }) {
  const margem = margemOS({ ...os, lucroReal: os.lucroReal ?? 0 });
  const mostrarLucro = podeFinanceiro && os.status !== "CANCELADA" && os.total > 0;
  const recebimento = situacaoRecebimento(os);
  return (
    <Link
      href={`/os/${os.id}`}
      className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex items-center gap-3 sm:contents">
        <div className="w-10 shrink-0 text-center sm:w-12">
          <p className="text-xs text-tinta-3">OS</p>
          <p className="font-bold tabular-nums text-tinta">#{os.numero}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-tinta">{os.cliente.nome}</p>
            {os.cliente.apelido && (
              <span className="shrink-0 rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">
                {os.cliente.apelido}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-tinta-3">
            {os.veiculo.marca} {os.veiculo.modelo}
            {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
            {" · "}
            {resumoDoTexto(os.descricao)}
          </p>
        </div>
        <span className={cn("shrink-0 sm:hidden", corStatus(os.status))}>
          {labelStatus(os.status)}
        </span>
      </div>
      <div className="hidden shrink-0 text-sm text-tinta-3 md:block">{os.mecanico || "—"}</div>
      {mostrarLucro && (
        <div
          className="hidden w-20 shrink-0 text-right text-xs tabular-nums lg:block"
          title="Lucro real (após custo de peças)"
        >
          <p className={cn("font-semibold", corMargem(margem))}>
            {formatCurrency(os.lucroReal ?? 0)}
          </p>
          <p className={corMargem(margem)}>{margem === null ? "—" : `${margem.toFixed(0)}%`}</p>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-3">
        <span className={cn("hidden sm:inline-flex", corStatus(os.status))}>
          {labelStatus(os.status)}
        </span>
        <div className="w-28 text-right text-xs tabular-nums">
          <p className="font-semibold text-tinta">{formatCurrency(os.total)}</p>
          <p className={recebimento.cor}>{recebimento.texto}</p>
        </div>
        <p className="hidden text-xs tabular-nums text-tinta-3 sm:block">{formatDate(os.abertura)}</p>
      </div>
    </Link>
  );
}
```

---

# Parte 4 · Dados fictícios

Tudo é **inventado**: oficina, cliente, CPF, telefone, placa, valores e fotos. Nada saiu do banco. A oficina é a mesma "Box 47 Mecânica" do pacote de 07/10, para os dois vídeos combinarem. Referência de "hoje": **12/10/2026**.

**A OS #1312 fecha nas contas:**

| | Valor |
|---|---|
| Peças (4 itens) | R$ 1.049,40 |
| Mão de obra / serviços (2 itens) | R$ 370,00 |
| Subtotal | R$ 1.419,40 |
| Desconto | − R$ 19,40 |
| **TOTAL** | **R$ 1.400,00** |
| Custo das peças | R$ 750,50 |
| **Lucro real** | **R$ 649,50** |
| **Margem da OS** (lucro ÷ total) | **46%** (verde) |
| Margem em peças | R$ 298,90 · 28% sobre as peças |
| Guardar (10%) | R$ 64,95 |
| Pago (sinal PIX + débito na entrega) | R$ 1.100,00 |
| **Saldo** (vai para Contas a receber) | **R$ 300,00** |
| Lucro estimado no formulário (sem o desconto) | R$ 668,90 (47%) |

| Chave | Alimenta |
|---|---|
| `configuracao` | `CabecalhoDocumento`, `estiloDoDocumento()`, `OSPdfDocument`, comprovante, "Guardar (10%)" |
| `permissoes` | `usePodeFinanceiro` / `usePodeExcluir` (substituto da seção 3.2) |
| `osAberta` | `src/app/os/[id]/page.tsx` (tipo `OS`) e `OSPdfDocument` (tipo `OSForPdf`) |
| `osAbertaVisaoOperador` | o que muda na mesma OS quando quem vê é um operador |
| `fotosPdf` | prop `fotos` do `OSPdfDocument` (tipo `FotoPdf`) |
| `formularioOS` | prop `initial` do `OSForm` (tipo `OSFormInitial`) |
| `listas` | clientes, veículos e mecânicos do `OSForm` |
| `buscaEstoque` | lista aberta do `ProdutoBusca` ao digitar "past" |
| `comprovante` | prop `dados` do `BaixarComprovante` / `ComprovantePagamentoPdfDocument` |
| `linhaListaOS` | `OSRow` (indicador de lucro e margem) |
| `resumoCalculado` | não é lido por nenhum componente; serve para conferir o que a tela deve mostrar |

**Fotos:** as URLs são caminhos de exemplo (`/video/...`). Troque pelas imagens que o vídeo for usar: um painel com hodômetro, um disco de freio gasto e a roda com disco novo. **Atenção:** as telas e o PDF mostram só a **data** da foto (12/10/2026), não a hora. O horário está no `createdAt` caso o vídeo queira exibi-lo como legenda própria.

### dados-os-1312.json (não existe no repositório)

```json
{
  "referencia": {
    "hoje": "2026-10-12T10:00:00-03:00",
    "observacao": "Oficina, cliente, CPF, telefone, placa, valores e fotos são inventados."
  },
  "configuracao": {
    "nome": "Box 47 Mecânica",
    "nomeCurto": "Box 47",
    "cnpj": "12.345.678/0001-90",
    "telefone": "(11) 3000-0047",
    "whatsapp": "(11) 90000-0047",
    "email": "contato@box47mecanica.example",
    "site": "box47mecanica.example",
    "cep": "01000-000",
    "endereco": "Rua das Engrenagens, 47",
    "cidade": "São Paulo",
    "estado": "SP",
    "logoUrl": null,
    "corDocumento": "#f2a900",
    "rodapeDocumento": null,
    "mensagemDocumento": "Garantia de 90 dias para serviços e peças fornecidas pela oficina. Peças trazidas pelo cliente não têm garantia da oficina.",
    "mostrarAssinatura": true,
    "validadeOrcamentoDias": 7,
    "reservaLucroAtiva": true,
    "reservaLucroPercentual": 10
  },
  "permissoes": { "podeFinanceiro": true, "podeExcluir": true },

  "osAberta": {
    "id": "os-1312",
    "numero": 1312,
    "status": "ENTREGUE",
    "descricao": "## Freios\n- Troca das pastilhas e dos discos dianteiros\n- Sangria do sistema e teste de rodagem\n\n## Revisão\n- Troca de óleo **5W30 sintético** e filtro de óleo\n- Conferência dos níveis de arrefecimento e freio",
    "defeitoRelatado": "Barulho metálico ao frear e pedal vibrando em descida. Pediu também a troca de óleo, que já passou da quilometragem.",
    "kmEntrada": 48215,
    "kmSaida": null,
    "totalPecas": 1049.4,
    "totalMO": 370,
    "desconto": 19.4,
    "total": 1400,
    "pago": false,
    "valorPago": 1100,
    "formaPagamento": "CARTAO_DEBITO",
    "obs": "Risco leve na porta traseira direita, já existente na entrada.",
    "mecanico": "Diego",
    "nivelCombustivel": "MEIO",
    "combustivelEmUso": "GASOLINA",
    "custoTotalPecas": 750.5,
    "lucroReal": 649.5,
    "margemPecas": 28.483,
    "abertura": "2026-10-08T08:40:00-03:00",
    "fechamento": "2026-10-10T17:46:00-03:00",
    "cliente": {
      "id": "cli-camila",
      "nome": "Camila Torres Andrade",
      "telefone": "(11) 90000-1312",
      "cpfCnpj": "111.222.333-44",
      "email": "camila.andrade@email.example",
      "endereco": "Av. dos Pistões, 1200, ap. 34",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "veiculo": {
      "id": "vei-polo",
      "marca": "Volkswagen",
      "modelo": "Polo",
      "placa": "RXK4F72",
      "ano": null,
      "cor": "Prata",
      "motorizacao": "1.0 TSI",
      "anoFabricacao": 2021,
      "anoModelo": 2022,
      "valvulas": "12V",
      "combustivel": "FLEX",
      "km": 48215
    },
    "itens": [
      { "id": "it-1", "tipo": "PECA", "descricao": "Pastilha de freio dianteira (jogo)", "quantidade": 1, "valorUnit": 289.9, "valorTotal": 289.9, "custoUnit": 198, "produtoId": "prod-pastilha" },
      { "id": "it-2", "tipo": "PECA", "descricao": "Disco de freio dianteiro ventilado", "quantidade": 2, "valorUnit": 245, "valorTotal": 490, "custoUnit": 182, "produtoId": null },
      { "id": "it-3", "tipo": "PECA", "descricao": "Óleo 5W30 sintético 1L", "quantidade": 4, "valorUnit": 54.9, "valorTotal": 219.6, "custoUnit": 39.9, "produtoId": "prod-oleo" },
      { "id": "it-4", "tipo": "PECA", "descricao": "Filtro de óleo", "quantidade": 1, "valorUnit": 49.9, "valorTotal": 49.9, "custoUnit": 28.9, "produtoId": "prod-filtro" },
      { "id": "it-5", "tipo": "MAO_DE_OBRA", "descricao": "Troca de pastilhas e discos dianteiros", "quantidade": 1, "valorUnit": 280, "valorTotal": 280, "custoUnit": null, "produtoId": null },
      { "id": "it-6", "tipo": "SERVICO", "descricao": "Troca de óleo e filtro", "quantidade": 1, "valorUnit": 90, "valorTotal": 90, "custoUnit": null, "produtoId": null }
    ],
    "pagamentos": [
      { "id": "pg-2", "valor": 600, "formaPagamento": "CARTAO_DEBITO", "data": "2026-10-10T17:45:00-03:00", "obs": "Na entrega" },
      { "id": "pg-1", "valor": 500, "formaPagamento": "PIX", "data": "2026-10-08T09:20:00-03:00", "obs": "Sinal" }
    ],
    "fotos": [
      { "id": "foto-1", "url": "/video/os-1312-entrada-painel.jpg", "legenda": "Painel na chegada — 48.215 km", "tipo": "ENTRADA", "createdAt": "2026-10-08T08:47:00-03:00" },
      { "id": "foto-2", "url": "/video/os-1312-servico-disco.jpg", "legenda": "Disco dianteiro gasto, com sulco", "tipo": "SERVICO", "createdAt": "2026-10-09T10:12:00-03:00" },
      { "id": "foto-3", "url": "/video/os-1312-saida-roda.jpg", "legenda": "Discos e pastilhas novos instalados", "tipo": "SAIDA", "createdAt": "2026-10-10T16:58:00-03:00" }
    ]
  },

  "osAbertaVisaoOperador": {
    "observacao": "Mesma OS, sem estes campos (o servidor nem os envia): custoTotalPecas, lucroReal, margemPecas e custoUnit de cada item. Na tela somem o cartão Visão interna e, com podeExcluir=false, o item Excluir OS do menu.",
    "camposAusentes": ["custoTotalPecas", "lucroReal", "margemPecas", "itens[].custoUnit"]
  },

  "fotosPdf": [
    { "id": "foto-1", "src": "/video/os-1312-entrada-painel.jpg", "url": "/video/os-1312-entrada-painel.jpg", "legenda": "Painel na chegada — 48.215 km", "tipo": "ENTRADA", "createdAt": "2026-10-08T08:47:00-03:00" },
    { "id": "foto-2", "src": "/video/os-1312-servico-disco.jpg", "url": "/video/os-1312-servico-disco.jpg", "legenda": "Disco dianteiro gasto, com sulco", "tipo": "SERVICO", "createdAt": "2026-10-09T10:12:00-03:00" },
    { "id": "foto-3", "src": "/video/os-1312-saida-roda.jpg", "url": "/video/os-1312-saida-roda.jpg", "legenda": "Discos e pastilhas novos instalados", "tipo": "SAIDA", "createdAt": "2026-10-10T16:58:00-03:00" }
  ],

  "formularioOS": {
    "clienteId": "cli-camila",
    "veiculoId": "vei-polo",
    "descricao": "## Freios\n- Troca das pastilhas e dos discos dianteiros\n- Sangria do sistema e teste de rodagem\n\n## Revisão\n- Troca de óleo **5W30 sintético** e filtro de óleo\n- Conferência dos níveis de arrefecimento e freio",
    "defeitoRelatado": "Barulho metálico ao frear e pedal vibrando em descida. Pediu também a troca de óleo, que já passou da quilometragem.",
    "kmEntrada": "48215",
    "obs": "Risco leve na porta traseira direita, já existente na entrada.",
    "mecanicoId": "mec-diego",
    "nivelCombustivel": "MEIO",
    "combustivelEmUso": "GASOLINA",
    "itens": [
      { "id": "it-1", "produtoId": "prod-pastilha", "tipo": "PECA", "descricao": "Pastilha de freio dianteira (jogo)", "quantidade": "1", "valorUnit": "289.9", "custoUnit": "198" },
      { "id": "it-2", "tipo": "PECA", "descricao": "Disco de freio dianteiro ventilado", "quantidade": "2", "valorUnit": "245", "custoUnit": "182" },
      { "id": "it-3", "produtoId": "prod-oleo", "tipo": "PECA", "descricao": "Óleo 5W30 sintético 1L", "quantidade": "4", "valorUnit": "54.9", "custoUnit": "39.9" },
      { "id": "it-4", "produtoId": "prod-filtro", "tipo": "PECA", "descricao": "Filtro de óleo", "quantidade": "1", "valorUnit": "49.9", "custoUnit": "28.9" },
      { "id": "it-5", "tipo": "MAO_DE_OBRA", "descricao": "Troca de pastilhas e discos dianteiros", "quantidade": "1", "valorUnit": "280", "custoUnit": "" },
      { "id": "it-6", "tipo": "SERVICO", "descricao": "Troca de óleo e filtro", "quantidade": "1", "valorUnit": "90", "custoUnit": "" }
    ],
    "produtos": {
      "prod-pastilha": { "nome": "Pastilha de freio dianteira (jogo)", "unidade": "JG", "quantidade": 3 },
      "prod-oleo": { "nome": "Óleo 5W30 sintético 1L", "unidade": "L", "quantidade": 18 },
      "prod-filtro": { "nome": "Filtro de óleo", "unidade": "UN", "quantidade": 6 }
    },
    "seguraEstoque": true,
    "itemEmDigitacao": {
      "observacao": "Opcional, para mostrar o selo do estoque e a margem no rótulo enquanto se lança a 1ª peça.",
      "tipo": "PECA", "produtoId": "prod-pastilha", "descricao": "Pastilha de freio dianteira (jogo)", "quantidade": "1", "valorUnit": "289.9", "custoUnit": "198",
      "telaMostra": { "rotuloVenda": "Venda unit. (R$) (32%)", "ganhoDesteItem": "R$ 91,90", "selo": "Pastilha de freio dianteira (jogo) · 4 JG" }
    }
  },

  "listas": {
    "clientes": [
      { "id": "cli-camila", "nome": "Camila Torres Andrade", "telefone": "(11) 90000-1312" },
      { "id": "cli-ricardo", "nome": "Ricardo Nogueira", "telefone": "(11) 90000-2201" }
    ],
    "veiculos": [
      { "id": "vei-polo", "marca": "Volkswagen", "modelo": "Polo", "placa": "RXK4F72", "ano": null, "anoFabricacao": 2021, "anoModelo": 2022, "combustivel": "FLEX" }
    ],
    "mecanicos": [
      { "id": "mec-diego", "nome": "Diego", "especialidade": "Freios e suspensão" },
      { "id": "mec-bruno", "nome": "Bruno", "especialidade": "Injeção eletrônica" },
      { "id": "mec-alex", "nome": "Alex", "especialidade": null }
    ]
  },

  "buscaEstoque": {
    "digitado": "past",
    "resultados": [
      { "id": "prod-pastilha", "nome": "Pastilha de freio dianteira (jogo)", "codigo": "PF-1120", "unidade": "JG", "valorVenda": 289.9, "custoUnit": 198, "quantidade": 4 },
      { "id": "prod-pastilha-tras", "nome": "Pastilha de freio traseira (jogo)", "codigo": "PF-1185", "unidade": "JG", "valorVenda": 239.9, "custoUnit": 161, "quantidade": 0 }
    ]
  },

  "comprovante": {
    "cliente": { "nome": "Camila Torres Andrade" },
    "itens": [
      {
        "numero": 1312,
        "veiculo": { "marca": "Volkswagen", "modelo": "Polo", "placa": "RXK4F72" },
        "desconto": 19.4,
        "total": 1400,
        "valorPago": 1100,
        "pago": false,
        "pagamentos": [
          { "id": "pg-2", "valor": 600, "formaPagamento": "CARTAO_DEBITO", "data": "2026-10-10T17:45:00-03:00", "obs": "Na entrega" },
          { "id": "pg-1", "valor": 500, "formaPagamento": "PIX", "data": "2026-10-08T09:20:00-03:00", "obs": "Sinal" }
        ]
      }
    ],
    "geradoEm": "2026-10-12T10:00:00-03:00"
  },

  "linhaListaOS": {
    "id": "os-1312", "numero": 1312, "status": "ENTREGUE",
    "descricao": "## Freios\n- Troca das pastilhas e dos discos dianteiros",
    "total": 1400, "valorPago": 1100, "pago": false, "abertura": "2026-10-08T08:40:00-03:00", "mecanico": "Diego",
    "lucroReal": 649.5,
    "cliente": { "id": "cli-camila", "nome": "Camila Torres Andrade", "apelido": null },
    "veiculo": { "marca": "Volkswagen", "modelo": "Polo", "placa": "RXK4F72" }
  },

  "resumoCalculado": {
    "totalPecas": 1049.4,
    "totalMO": 370,
    "subtotal": 1419.4,
    "desconto": 19.4,
    "total": 1400,
    "custoTotalPecas": 750.5,
    "lucroReal": 649.5,
    "margemOSPercentual": 46.39,
    "corDaMargem": "text-ok (verde, >= 40%)",
    "margemPecasValor": 298.9,
    "margemPecasPercentual": 28.48,
    "guardar10": 64.95,
    "valorPago": 1100,
    "saldo": 300,
    "ganhoPorItem": { "it-1": 91.9, "it-2": 126, "it-3": 60, "it-4": 21, "it-5": 280, "it-6": 90 },
    "lucroEstimadoFormulario": 668.9,
    "margemEstimadaFormulario": 47.13,
    "pecasQueSairamDoEstoqueNaEntrega": "3 itens com vínculo (pastilha, óleo, filtro); o disco foi comprado na hora, sem vínculo",
    "avisoNaEntrega": "Recebimento de R$ 600,00 registrado. 3 peças baixadas do estoque.",
    "modalAposEntrega": "OS entregue com saldo pendente — Ficou um saldo de R$ 300,00. Ele já consta em Contas a receber.",
    "etiquetaNoTopo": "A receber — R$ 300,00"
  }
}
```

**Variações úteis para o vídeo:**
- **OS ainda no pátio** (para mostrar o cartão Desconto e a entrega acontecendo): `status: "EM_ANDAMENTO"`, `fechamento: null`, `formaPagamento: null`, só o pagamento `pg-1` (sinal de R$ 500) e `valorPago: 500`. Ao escolher "Entregue", abre "Confirmar entrega" com saldo em aberto de R$ 900,00. Escolhendo "Parcial" com R$ 600,00, a tela mostra "Restante a receber: R$ 300,00 — vai para Contas a receber".
- **Cliente que pagou tudo**: some com o saldo (`valorPago: 1400`, `pago: true`). O cartão Pagamento mostra "Pagamento quitado", e o comprovante ganha o selo verde.

---

# Observações

## O que está incompleto ou inativo
- **KM de saída** e **NPS**: os campos existem no banco e aparecem quando têm valor (KM saída no documento; médias de NPS na ficha do cliente, na página do mecânico e em Produtividade), mas **nenhuma tela permite preenchê-los**. Hoje ficam sempre vazios.
- **Não existem**: previsão de entrega, diagnóstico técnico separado, checklist de entrada, plano de parcelamento, desconto por item ou em %, envio direto pelo WhatsApp, link público da OS para o cliente, página de histórico por veículo e histórico de alterações da OS.

## Limitações e diferenças entre telas
- **O PDF não mostra pagamentos.** O documento na tela mostra "Pago" e "Saldo", mas o PDF e a imagem da OS mostram só o TOTAL. Para o cliente ver o que pagou, o caminho é o comprovante.
- **Mensagem do documento e assinatura**: o PDF respeita as configurações ("mensagem do documento" e "mostrar assinatura"). O documento na tela **não mostra** a mensagem de garantia e **sempre** mostra a linha de assinatura.
- **Cor do documento na tela**: a configuração é carregada só para quem vê o financeiro. Para o operador, o documento na tela usa a cor padrão; o PDF dele sai com a cor certa.
- **Fotos**: a hora é gravada, mas as telas e o PDF exibem só a data. O link de alta resolução dentro do PDF é temporário (**1 hora**): depois disso, a miniatura dentro do PDF continua visível, mas tocar nela não abre mais a foto original.
- **Excluir foto e estornar pagamento** exigem a permissão "Excluir" no servidor, mas **os botões aparecem para todos**. O operador sem essa permissão clica e recebe a mensagem de erro.
- **Lucro estimado (formulário) × Lucro real (tela da OS)**: o primeiro ignora o desconto, e o segundo considera.
- **Custo vazio conta como zero** e infla a margem, sem aviso.
- **Página do mecânico** conta as OS pelo mês de **abertura**; o Dashboard conta pela data de **entrega**.
- **Registrar pagamento** fora da entrega não impede valor acima do saldo.
- **Estoque pode ficar negativo**: o sistema avisa, mas não impede.

## Dependências visuais
- **Tailwind** com os tokens do boxOS (`globals.css` + `tailwind.config.ts`, pacote 1 de 07/10). As classes `.status-aberta`, `.status-andamento`, `.status-peca`, `.status-entregue` e `.status-inerte` estão lá. A cor `text-doc-texto` e o `estiloDoDocumento()` pintam o número da OS na cor da oficina.
- **`@react-pdf/renderer`** para `OSPdfDocument` e `ComprovantePagamentoPdfDocument`. Fonte Helvetica (embutida no react-pdf). Se o vídeo não for usar react-pdf, os estilos estão em pontos (pt), num A4 de 595 × 842 pt.
- **pdf.js** converte o PDF em PNG (`pdf-para-imagem.ts`, pacote 3), em escala 3x.
- **Ícones** de `Icones.tsx` (pacote 1); alguns botões usam SVG inline, que já está no código acima.
- **Poppins** só no logo e no h1 do sistema. O documento usa a fonte padrão (`font-sans`), e o PDF usa Helvetica.
- O documento é **sempre branco**, também no tema escuro (`.documento`, pacote 1).

## Segurança
- Nenhum `.env`, chave, token, URL de banco, migration nem rota de API foi incluído. Os trechos de servidor foram lidos só para descrever o comportamento, e nenhuma linha deles está no pacote.
- Nenhum arquivo incluído continha segredo; não foi preciso omitir linhas por esse motivo.
- Todos os dados da Parte 4 são fictícios. O CPF `111.222.333-44` é propositalmente inválido, e os domínios `.example` não existem.
