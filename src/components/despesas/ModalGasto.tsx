"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { chaveDia, diaDaChave } from "@/lib/periodo";
import { Area, Aviso, Botao, Campo, Entrada, EntradaValor, Modal, Selecao } from "./campos";
import { enviar, mensagemDoErro } from "./api";
import type { Categoria, Lancamento } from "./tipos";

/**
 * Lançar ou editar um gasto do mês.
 *
 * Editar um lançamento que veio de despesa fixa mexe **só naquele mês** — é o caso da
 * conta de luz que veio mais alta. Quem muda o valor daí em diante é a regra, e o aviso
 * no topo diz isso, porque é a confusão natural de quem abre este formulário.
 */
export function ModalGasto({
  gasto,
  categorias,
  mesPadrao,
  onFechar,
  onSalvo,
}: {
  gasto: Lancamento | null;
  categorias: Categoria[];
  /** Vencimento sugerido ao lançar: o dia de hoje, ou o dia 1 se o mês em tela é outro. */
  mesPadrao: Date;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const disponiveis = categorias.filter((c) => c.ativa || c.id === gasto?.categoriaId);

  const [form, setForm] = useState({
    categoriaId: gasto?.categoriaId ?? disponiveis[0]?.id ?? "",
    descricao: gasto?.descricao ?? "",
    valor: gasto ? String(gasto.valor) : "",
    vencimento: chaveDia(gasto?.vencimento ?? mesPadrao),
    fornecedor: gasto?.fornecedor ?? "",
    observacao: gasto?.observacao ?? "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const editando = gasto !== null;
  const deRegra = Boolean(gasto?.recorrenteId);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const corpo = {
        categoriaId: form.categoriaId,
        descricao: form.descricao,
        valor: form.valor,
        vencimento: diaDaChave(form.vencimento).toISOString(),
        fornecedor: form.fornecedor,
        observacao: form.observacao,
      };
      if (editando) await enviar(`/api/despesas/${gasto.id}`, "PUT", corpo);
      else await enviar("/api/despesas", "POST", corpo);
      onSalvo();
    } catch (err) {
      setErro(mensagemDoErro(err));
      setSalvando(false);
    }
  }

  if (disponiveis.length === 0) {
    return (
      <Modal titulo="Nenhuma categoria ativa" onFechar={onFechar}>
        <p className="text-sm text-zinc-600">
          Crie ou reative uma categoria em <strong>Categorias</strong> antes de lançar um gasto.
        </p>
        <Botao variante="secundario" className="mt-4 w-full" onClick={onFechar}>
          Entendi
        </Botao>
      </Modal>
    );
  }

  return (
    <Modal
      titulo={editando ? "Editar gasto" : "Lançar gasto"}
      descricao={
        editando
          ? undefined
          : "Um gasto do mês que não se repete. Contas que voltam todo mês ficam em Despesas fixas."
      }
      onFechar={onFechar}
    >
      <form onSubmit={salvar} className="space-y-3">
        {deRegra && (
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800">
            Este lançamento vem de uma despesa fixa. A alteração vale só para este mês — para
            mudar de vez, edite a despesa fixa.
          </p>
        )}

        <Campo rotulo="Categoria">
          <Selecao
            value={form.categoriaId}
            onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
            required
          >
            {disponiveis.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.ativa ? "" : " (inativa)"}
              </option>
            ))}
          </Selecao>
        </Campo>

        <Campo rotulo="Descrição *">
          <Entrada
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex.: troca do compressor"
            required
            autoFocus
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor *">
            <EntradaValor
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
              required
            />
          </Campo>
          <Campo rotulo="Vencimento *">
            <Entrada
              type="date"
              value={form.vencimento}
              onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
              required
            />
          </Campo>
        </div>

        <Campo rotulo="Fornecedor" ajuda="Opcional — ajuda a achar o gasto depois.">
          <Entrada
            value={form.fornecedor}
            onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
            placeholder="Ex.: Auto Peças Central"
          />
        </Campo>

        <Campo rotulo="Observação">
          <Area
            rows={2}
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            placeholder="Opcional"
          />
        </Campo>

        {Number(form.valor) > 0 && (
          <p className="text-xs text-zinc-500">
            Total do lançamento: <strong>{formatCurrency(Number(form.valor))}</strong>
          </p>
        )}

        <Aviso>{erro}</Aviso>

        <div className="flex gap-2 pt-1">
          <Botao type="submit" disabled={salvando} className="flex-1">
            {salvando ? "Salvando..." : editando ? "Salvar" : "Lançar gasto"}
          </Botao>
          <Botao type="button" variante="secundario" onClick={onFechar} className="flex-1">
            Cancelar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
