"use client";

import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { formatQuantidade } from "@/lib/constants";
import { PERIODOS, type PeriodoKey } from "@/lib/periodo";
import { EsqueletoFaixa, FaixaMetricas, Metrica, Painel } from "@/components/ui/Dados";
import { Avancar, Voltar } from "@/components/ui/Icones";

type Linha = {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
  receita: number;
  custo: number;
  lucro: number;
};

type Resumo = {
  periodo: { label: string; atual: boolean };
  vendido: {
    pecas: number;
    unidades: number;
    receita: number;
    custo: number;
    lucro: number;
    margem: number | null;
  };
  prateleira: {
    produtos: number;
    unidades: number;
    valorDeCusto: number;
    valorDeVenda: number;
    lucroPotencial: number;
    semEstoque: number;
    abaixoDoMinimo: number;
    negativos: number;
  };
  ranking: Linha[];
};

/**
 * O resultado do estoque.
 *
 * Duas perguntas, nesta ordem, porque é nesta ordem que o dono pergunta:
 *
 *   1. Quanto as peças me deram de lucro? — conta pelas peças baixadas, ou seja,
 *      pelas OS entregues no período. A mesma régua do Dashboard e da Produtividade.
 *   2. Quanto ainda está parado na prateleira? — o dinheiro que já saiu do caixa e
 *      ainda não voltou.
 *
 * O ranking embaixo é o que transforma o total em decisão: qual peça sustenta o
 * resultado, e qual ocupa espaço sem pagar por ele.
 */
export function ResumoEstoque() {
  const [periodo, setPeriodo] = useState<PeriodoKey>("mes");
  const [offset, setOffset] = useState(0);
  const [dados, setDados] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    fetch(`/api/produtos/resumo?periodo=${periodo}&offset=${offset}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Resumo) => !cancelado && (setDados(d), setErro(false)))
      .catch(() => !cancelado && setErro(true))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [periodo, offset]);

  if (erro) return null;

  const v = dados?.vendido;
  const p = dados?.prateleira;
  // O maior lucro da lista é a régua das barras — comparação entre as peças, não com
  // um valor absoluto que não significaria nada aqui.
  const maiorLucro = Math.max(1, ...(dados?.ranking ?? []).map((l) => Math.abs(l.lucro)));

  return (
    <div className="space-y-4">
      {/* Navegação do período — mesma gramática do Dashboard. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Período anterior"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
          >
            <Voltar tamanho={16} />
          </button>
          <span className="min-w-36 text-center text-sm font-semibold text-tinta">
            {dados?.periodo.label ?? "—"}
          </span>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset >= 0}
            aria-label="Próximo período"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 disabled:opacity-40 sm:h-9 sm:w-9"
          >
            <Avancar tamanho={16} />
          </button>
        </div>

        {/* Trocar de período volta para o atual: "3 meses atrás" de uma semana não é
            equivalente a "3 meses atrás" de um mês. */}
        <div className="-mx-4 flex gap-1 overflow-x-auto rounded-lg bg-superficie-3 px-4 p-1 sm:mx-0 sm:px-1">
          {PERIODOS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPeriodo(opt.value);
                setOffset(0);
              }}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                periodo === opt.value
                  ? "bg-superficie text-tinta shadow-sm"
                  : "text-tinta-3 hover:text-tinta-2"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {carregando && !dados ? (
        <EsqueletoFaixa colunas={4} />
      ) : (
        v &&
        p && (
          <>
            <FaixaMetricas colunas={4}>
              <Metrica
                rotulo="Lucro nas peças"
                valor={formatCurrency(v.lucro)}
                sub={v.margem != null ? `${v.margem.toFixed(0)}% de margem` : "Nenhuma peça baixada"}
                tom={v.lucro > 0 ? "ok" : v.lucro < 0 ? "perigo" : "neutro"}
                tamanho="grande"
                title="Venda menos custo das peças de estoque baixadas nas OS entregues no período"
              />
              <Metrica
                rotulo="Vendido em peças"
                valor={formatCurrency(v.receita)}
                sub={`${v.pecas} ${v.pecas === 1 ? "peça" : "peças"} · ${formatQuantidade(v.unidades)} un.`}
              />
              <Metrica
                rotulo="Custo das peças"
                valor={formatCurrency(v.custo)}
                sub="O que essas peças custaram"
              />
              <Metrica
                rotulo="Parado na prateleira"
                valor={formatCurrency(p.valorDeCusto)}
                sub={`${p.produtos} ${p.produtos === 1 ? "produto" : "produtos"} · venderia por ${formatCurrency(p.valorDeVenda)}`}
                tom="neutro"
                title="Dinheiro que já saiu do caixa e ainda não voltou"
              />
            </FaixaMetricas>

            {(p.semEstoque > 0 || p.abaixoDoMinimo > 0 || p.negativos > 0) && (
              <p className="text-xs text-tinta-3">
                {p.abaixoDoMinimo > 0 && (
                  <span className="text-atencao">
                    {p.abaixoDoMinimo} {p.abaixoDoMinimo === 1 ? "peça" : "peças"} abaixo do mínimo
                  </span>
                )}
                {p.abaixoDoMinimo > 0 && (p.semEstoque > 0 || p.negativos > 0) && " · "}
                {p.semEstoque > 0 && <span>{p.semEstoque} zerada(s)</span>}
                {p.negativos > 0 && (
                  <>
                    {" · "}
                    <span className="text-perigo">
                      {p.negativos} com saldo negativo — precisa de acerto
                    </span>
                  </>
                )}
              </p>
            )}

            <Painel
              titulo="Peças que mais deram lucro"
              ajuda={`Baixadas em OS entregues em ${dados.periodo.label.toLowerCase()}`}
            >
              {dados.ranking.length === 0 ? (
                <p className="py-6 text-center text-sm text-tinta-3">
                  Nenhuma peça de estoque foi baixada neste período. A baixa acontece quando
                  a OS é entregue.
                </p>
              ) : (
                <ul className="divide-y divide-linha">
                  {dados.ranking.map((l) => {
                    const margem = l.receita > 0 ? (l.lucro / l.receita) * 100 : null;
                    return (
                      <li key={l.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 truncate text-sm text-tinta">{l.nome}</span>
                          <span
                            className={cn(
                              "shrink-0 text-sm font-semibold tabular-nums",
                              l.lucro >= 0 ? "text-ok" : "text-perigo"
                            )}
                          >
                            {formatCurrency(l.lucro)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {/* Barra comparativa: a régua é a peça que mais rendeu. */}
                          <span
                            aria-hidden="true"
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-superficie-3"
                          >
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                l.lucro >= 0 ? "bg-ok" : "bg-perigo"
                              )}
                              style={{ width: `${(Math.abs(l.lucro) / maiorLucro) * 100}%` }}
                            />
                          </span>
                          <span className="shrink-0 text-xs text-tinta-3 tabular-nums">
                            {formatQuantidade(l.quantidade, l.unidade)} ·{" "}
                            {formatCurrency(l.receita)}
                            {margem != null ? ` · ${margem.toFixed(0)}%` : ""}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Painel>
          </>
        )
      )}
    </div>
  );
}
