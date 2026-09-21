"use client";

import { useState } from "react";
import { UNIDADES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { usePodeExcluir, usePodeFinanceiro } from "@/components/UsuarioProvider";
import { Botao } from "@/components/ui/Botao";
import { Area, Aviso, Campo, CampoDinheiro, CampoQuantidade, Entrada, Selecao } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";

export type ProdutoEdicao = {
  id: string;
  nome: string;
  codigo: string | null;
  unidade: string;
  custoUnit?: number;
  valorVenda: number;
  quantidade: number;
  estoqueMinimo: number;
  fornecedor: string | null;
  obs: string | null;
  ativo: boolean;
};

type Formulario = {
  nome: string;
  codigo: string;
  unidade: string;
  custoUnit: string;
  valorVenda: string;
  quantidade: string;
  estoqueMinimo: string;
  fornecedor: string;
  obs: string;
  ativo: boolean;
};

function doProduto(p?: ProdutoEdicao): Formulario {
  return {
    nome: p?.nome ?? "",
    codigo: p?.codigo ?? "",
    unidade: p?.unidade ?? "UN",
    custoUnit: p?.custoUnit != null ? String(p.custoUnit) : "",
    valorVenda: p ? String(p.valorVenda) : "",
    quantidade: "",
    estoqueMinimo: p ? String(p.estoqueMinimo) : "",
    fornecedor: p?.fornecedor ?? "",
    obs: p?.obs ?? "",
    ativo: p?.ativo ?? true,
  };
}

/**
 * Cadastro da peça.
 *
 * A quantidade só é editável no cadastro, como saldo inicial. Depois dela, mexer no
 * saldo é sempre um movimento (o botão "Movimentar"): um campo de quantidade solto
 * aqui deixaria o histórico incapaz de explicar o número que está na tela, que é
 * justamente o que o estoque existe para responder.
 */
export function ProdutoModal({
  produto,
  onFechar,
  onSalvo,
}: {
  /** Ausente = cadastro novo. */
  produto?: ProdutoEdicao;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const podeFinanceiro = usePodeFinanceiro();
  const podeExcluir = usePodeExcluir();
  const editando = !!produto;

  const [f, setF] = useState<Formulario>(() => doProduto(produto));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const campo = <K extends keyof Formulario>(chave: K, valor: Formulario[K]) =>
    setF((atual) => ({ ...atual, [chave]: valor }));

  const custo = Number(f.custoUnit || 0);
  const venda = Number(f.valorVenda || 0);
  const margem = venda > 0 && f.custoUnit !== "" ? ((venda - custo) / venda) * 100 : null;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome.trim()) {
      setErro("Informe o nome da peça.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const corpo = {
        nome: f.nome,
        codigo: f.codigo,
        unidade: f.unidade,
        custoUnit: f.custoUnit || 0,
        valorVenda: f.valorVenda || 0,
        estoqueMinimo: f.estoqueMinimo || 0,
        fornecedor: f.fornecedor,
        obs: f.obs,
        ...(editando ? { ativo: f.ativo } : { quantidade: f.quantidade || 0 }),
      };
      const res = await fetch(editando ? `/api/produtos/${produto.id}` : "/api/produtos", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.error || "Erro ao salvar a peça");
        return;
      }
      onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    try {
      const res = await fetch(`/api/produtos/${produto!.id}`, { method: "DELETE" });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(dados.error || "Erro ao excluir a peça");
        return;
      }
      onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? "Editar peça" : "Nova peça no estoque"}
      descricao={
        editando
          ? "O preço já cobrado em OS antigas não muda — o que se altera aqui vale das próximas em diante."
          : "Cadastre a peça uma vez e ela passa a aparecer na busca de itens da OS."
      }
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="flex flex-wrap items-center justify-between gap-2">
          {editando && podeExcluir ? (
            confirmandoExclusao ? (
              <div className="flex items-center gap-2">
                <Botao variante="perigo" tamanho="denso" onClick={excluir} disabled={salvando}>
                  Confirmar exclusão
                </Botao>
                <Botao
                  variante="fantasma"
                  tamanho="denso"
                  onClick={() => setConfirmandoExclusao(false)}
                >
                  Cancelar
                </Botao>
              </div>
            ) : (
              <Botao
                variante="perigo"
                tamanho="denso"
                onClick={() => setConfirmandoExclusao(true)}
                disabled={salvando}
              >
                Excluir
              </Botao>
            )
          ) : (
            <span />
          )}
          <Botao form="form-produto" type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Botao>
        </div>
      }
    >
      <form id="form-produto" onSubmit={salvar} className="space-y-3">
        <Campo rotulo="Nome da peça" obrigatorio>
          <Entrada
            value={f.nome}
            onChange={(e) => campo("nome", e.target.value)}
            placeholder="Ex: Água desmineralizada 1L"
            data-foco-inicial
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Código" ajuda="Do fabricante ou do fornecedor">
            <Entrada
              value={f.codigo}
              onChange={(e) => campo("codigo", e.target.value)}
              placeholder="Ex: BOS-0451"
            />
          </Campo>
          <Campo rotulo="Unidade">
            <Selecao value={f.unidade} onChange={(e) => campo("unidade", e.target.value)}>
              {UNIDADES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {podeFinanceiro && (
            <Campo rotulo="Custo unitário (R$)" ajuda="O que você paga por unidade">
              <CampoDinheiro
                valor={f.custoUnit}
                onChange={(v) => campo("custoUnit", v)}
                placeholder="0,00"
              />
            </Campo>
          )}
          <Campo
            rotulo="Venda unitária (R$)"
            ajuda={margem != null ? `Margem de ${margem.toFixed(0)}%` : "Preço sugerido na OS"}
          >
            <CampoDinheiro
              valor={f.valorVenda}
              onChange={(v) => campo("valorVenda", v)}
              placeholder="0,00"
            />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!editando && (
            <Campo rotulo="Quantidade atual" ajuda="O que já está na prateleira hoje">
              <CampoQuantidade valor={f.quantidade} onChange={(v) => campo("quantidade", v)} />
            </Campo>
          )}
          <Campo rotulo="Estoque mínimo" ajuda="Abaixo disto a tela avisa. Zero desliga.">
            <CampoQuantidade
              valor={f.estoqueMinimo}
              onChange={(v) => campo("estoqueMinimo", v)}
            />
          </Campo>
        </div>

        <Campo rotulo="Fornecedor">
          <Entrada
            value={f.fornecedor}
            onChange={(e) => campo("fornecedor", e.target.value)}
            placeholder="Ex: Auto Peças Central"
          />
        </Campo>

        <Campo rotulo="Observações">
          <Area
            value={f.obs}
            onChange={(e) => campo("obs", e.target.value)}
            rows={2}
            placeholder="Aplicação, equivalências, onde fica guardada..."
          />
        </Campo>

        {editando && (
          <label className="flex items-center gap-2 text-sm text-tinta-2">
            <input
              type="checkbox"
              checked={f.ativo}
              onChange={(e) => campo("ativo", e.target.checked)}
              className="h-4 w-4 rounded border-linha-forte"
            />
            Ativa — aparece na busca de peça da OS
          </label>
        )}

        {editando && podeFinanceiro && (
          <p className="text-xs text-tinta-3">
            Saldo atual: <strong className="text-tinta-2">{produto.quantidade}</strong>{" "}
            {produto.unidade} ={" "}
            {formatCurrency(Math.max(0, produto.quantidade) * (produto.custoUnit ?? 0))} parados.
          </p>
        )}

        <Aviso>{erro}</Aviso>
      </form>
    </Modal>
  );
}
