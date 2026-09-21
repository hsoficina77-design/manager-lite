"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { formatQuantidade, situacaoEstoque } from "@/lib/constants";
import { usePodeFinanceiro } from "@/components/UsuarioProvider";
import { ProdutoModal, type ProdutoEdicao } from "@/components/estoque/ProdutoModal";
import { MovimentoModal } from "@/components/estoque/MovimentoModal";
import { ResumoEstoque } from "@/components/estoque/ResumoEstoque";
import { Botao } from "@/components/ui/Botao";
import { BASE_CAMPO } from "@/components/ui/Campos";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import { Busca, Caixa, Mais } from "@/components/ui/Icones";

type Produto = ProdutoEdicao;

type Filtro = "todos" | "baixo" | "inativos";

const FILTROS: { value: Filtro; label: string }[] = [
  { value: "todos", label: "Ativas" },
  { value: "baixo", label: "Precisa repor" },
  { value: "inativos", label: "Desativadas" },
];

/**
 * O estoque da oficina.
 *
 * A tela responde, de cima para baixo, as três perguntas que se faz aqui: quanto a
 * prateleira rendeu (o resumo, só para quem vê financeiro), o que está acabando (o
 * filtro "precisa repor") e quanto tem de determinada peça (a busca).
 *
 * Nada nesta tela dá baixa: a peça sai da prateleira sozinha, quando a OS que a usa é
 * entregue. O que se faz aqui é o outro lado — cadastrar, repor e acertar contagem.
 */
export default function EstoquePage() {
  const podeFinanceiro = usePodeFinanceiro();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const [editando, setEditando] = useState<Produto | null>(null);
  const [criando, setCriando] = useState(false);
  const [movimentando, setMovimentando] = useState<Produto | null>(null);

  // A busca vai para o servidor com pausa — é a mesma rota que a OS usa, e o catálogo
  // de peças só cresce.
  useEffect(() => {
    const t = setTimeout(() => setTermo(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(() => {
    setCarregando(true);
    const p = new URLSearchParams();
    if (termo) p.set("q", termo);
    p.set("ativo", filtro === "inativos" ? "false" : "true");
    if (filtro === "baixo") p.set("baixo", "true");
    fetch(`/api/produtos?${p}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setProdutos)
      .catch(() => setProdutos([]))
      .finally(() => setCarregando(false));
  }, [termo, filtro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function aoSalvar() {
    setCriando(false);
    setEditando(null);
    setMovimentando(null);
    carregar();
  }

  const totalParado = useMemo(
    () => produtos.reduce((s, p) => s + Math.max(0, p.quantidade) * (p.custoUnit ?? 0), 0),
    [produtos]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-tinta sm:text-2xl">Estoque</h1>
          <p className="text-xs text-tinta-3">
            A peça sai da prateleira quando a OS que a usa é entregue.
          </p>
        </div>
        <Botao onClick={() => setCriando(true)} className="sm:w-auto">
          <Mais tamanho={16} /> Nova peça
        </Botao>
      </div>

      {podeFinanceiro && <ResumoEstoque />}

      {/* Busca e filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Busca
            tamanho={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3"
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código ou fornecedor..."
            aria-label="Buscar peça no estoque"
            className={cn(BASE_CAMPO, "pl-9 [&::-webkit-search-cancel-button]:hidden")}
          />
        </div>
        <div className="-mx-4 flex gap-1 overflow-x-auto rounded-lg bg-superficie-3 p-1 px-4 sm:mx-0 sm:px-1">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filtro === f.value
                  ? "bg-superficie text-tinta shadow-sm"
                  : "text-tinta-3 hover:text-tinta-2"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <EsqueletoLista linhas={4} />
      ) : produtos.length === 0 ? (
        <Vazio
          titulo={
            termo
              ? `Nenhuma peça para “${termo}”`
              : filtro === "baixo"
                ? "Nada para repor"
                : filtro === "inativos"
                  ? "Nenhuma peça desativada"
                  : "Estoque vazio"
          }
          texto={
            filtro === "todos" && !termo
              ? "Cadastre o que fica na prateleira — óleo, filtro, água desmineralizada. Depois é só digitar o nome no campo de peça da OS."
              : undefined
          }
          acao={
            filtro === "todos" && !termo ? (
              <Botao onClick={() => setCriando(true)}>
                <Mais tamanho={16} /> Cadastrar peça
              </Botao>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
            {produtos.map((p) => (
              <LinhaProduto
                key={p.id}
                produto={p}
                podeFinanceiro={podeFinanceiro}
                onEditar={() => setEditando(p)}
                onMovimentar={() => setMovimentando(p)}
              />
            ))}
          </div>
          {podeFinanceiro && (
            <p className="text-right text-xs text-tinta-3">
              {produtos.length} {produtos.length === 1 ? "peça" : "peças"} nesta lista ·{" "}
              {formatCurrency(totalParado)} em custo parado
            </p>
          )}
        </div>
      )}

      {criando && <ProdutoModal onFechar={() => setCriando(false)} onSalvo={aoSalvar} />}
      {editando && (
        <ProdutoModal produto={editando} onFechar={() => setEditando(null)} onSalvo={aoSalvar} />
      )}
      {movimentando && (
        <MovimentoModal
          produto={movimentando}
          onFechar={() => setMovimentando(null)}
          onSalvo={aoSalvar}
        />
      )}
    </div>
  );
}

function LinhaProduto({
  produto: p,
  podeFinanceiro,
  onEditar,
  onMovimentar,
}: {
  produto: Produto;
  podeFinanceiro: boolean;
  onEditar: () => void;
  onMovimentar: () => void;
}) {
  const situacao = situacaoEstoque(p);
  const margem =
    p.valorVenda > 0 && p.custoUnit != null ? ((p.valorVenda - p.custoUnit) / p.valorVenda) * 100 : null;

  // O saldo é o dado que se vem buscar aqui, então ele é o que tem cor: vermelho
  // quando acabou (ou ficou negativo), âmbar quando está na hora de comprar.
  const corSaldo =
    situacao === "SEM"
      ? "bg-perigo-fraco text-perigo"
      : situacao === "BAIXO"
        ? "bg-atencao-fraco text-atencao"
        : "bg-superficie-3 text-tinta-2";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <Caixa tamanho={16} className="hidden shrink-0 text-tinta-3 sm:block" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-tinta">
          {p.nome}
          {!p.ativo && (
            <span className="ml-2 rounded-full bg-superficie-3 px-2 py-0.5 text-xs font-normal text-tinta-3">
              Desativada
            </span>
          )}
        </p>
        <p className="truncate text-xs text-tinta-3">
          {[p.codigo, p.fornecedor].filter(Boolean).join(" · ") || "Sem código"}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-tinta tabular-nums">
          {formatCurrency(p.valorVenda)}
        </p>
        {podeFinanceiro && (
          <p className="text-xs text-tinta-3 tabular-nums">
            custo {formatCurrency(p.custoUnit ?? 0)}
            {margem != null ? ` · ${margem.toFixed(0)}%` : ""}
          </p>
        )}
      </div>

      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
          corSaldo
        )}
        title={
          situacao === "BAIXO"
            ? `Mínimo: ${formatQuantidade(p.estoqueMinimo, p.unidade)}`
            : undefined
        }
      >
        {formatQuantidade(p.quantidade, p.unidade)}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        <Botao variante="secundario" tamanho="denso" onClick={onMovimentar}>
          Movimentar
        </Botao>
        <Botao variante="fantasma" tamanho="denso" onClick={onEditar}>
          Editar
        </Botao>
      </div>
    </div>
  );
}
