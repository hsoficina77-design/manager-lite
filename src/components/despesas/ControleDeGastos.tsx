"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { chaveMes, chaveMesDeslocada } from "@/lib/periodo";
import {
  custoOperacionalMensal,
  labelFormaPagamento,
  resumirMes,
  situacaoDe,
  valorEfetivo,
  type Situacao,
} from "@/lib/despesas-comum";
import { Botao, ChipCategoria } from "./campos";
import { enviar, mensagemDoErro } from "./api";
import { ModalCategorias } from "./ModalCategorias";
import { ModalFixas } from "./ModalFixas";
import { ModalGasto } from "./ModalGasto";
import { ModalPagamento } from "./ModalPagamento";
import type { Categoria, Equilibrio, Lancamento, Regra } from "./tipos";

const SITUACOES: Record<Situacao, { label: string; chip: string }> = {
  vencida: { label: "Vencida", chip: "bg-red-100 text-red-700" },
  "vence-breve": { label: "Vence em breve", chip: "bg-orange-100 text-orange-700" },
  "a-vencer": { label: "A vencer", chip: "bg-zinc-100 text-zinc-500" },
  paga: { label: "Paga", chip: "bg-green-100 text-green-700" },
};

type Filtro = "todos" | "aberto" | "pago";

/** Plural em uma expressão só. Quebrar a palavra em duas linhas de JSX insere um
 *  espaço no meio dela, e a tela mostrava "7 lançamento s". */
function plural(n: number, palavra: string): string {
  return n === 1 ? palavra : `${palavra}s`;
}

export function ControleDeGastos({
  mes,
  competencia,
  rotuloMes,
  ehMesAtual,
  lancamentos,
  cancelados,
  categorias,
  regras,
  equilibrio,
}: {
  mes: string;
  /** 1º dia do mês em tela — vira o vencimento sugerido ao lançar em mês passado. */
  competencia: Date;
  rotuloMes: string;
  ehMesAtual: boolean;
  lancamentos: Lancamento[];
  cancelados: Lancamento[];
  categorias: Categoria[];
  regras: Regra[];
  equilibrio: Equilibrio;
}) {
  const router = useRouter();

  const [modal, setModal] = useState<
    | { tipo: "gasto"; gasto: Lancamento | null }
    | { tipo: "pagamento"; gasto: Lancamento }
    | { tipo: "fixas" }
    | { tipo: "categorias" }
    | null
  >(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const resumo = useMemo(() => resumirMes(lancamentos), [lancamentos]);
  const custoOperacional = useMemo(() => custoOperacionalMensal(regras), [regras]);

  const listadas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lancamentos.filter((d) => {
      if (filtro === "aberto" && d.pago) return false;
      if (filtro === "pago" && !d.pago) return false;
      if (categoriaFiltro && d.categoriaId !== categoriaFiltro) return false;
      if (!termo) return true;
      return (
        d.descricao.toLowerCase().includes(termo) ||
        (d.fornecedor ?? "").toLowerCase().includes(termo) ||
        d.categoria.nome.toLowerCase().includes(termo)
      );
    });
  }, [lancamentos, filtro, busca, categoriaFiltro]);

  const totalListado = listadas.reduce((s, d) => s + valorEfetivo(d), 0);
  const emAberto = lancamentos.filter((d) => !d.pago).length;
  const fixasAtivas = regras.filter((r) => r.ativa).length;

  function fechar() {
    setModal(null);
    router.refresh();
  }

  async function comAcao(chave: string, fn: () => Promise<unknown>) {
    setErro(null);
    setOcupado(chave);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {modal?.tipo === "gasto" && (
        <ModalGasto
          gasto={modal.gasto}
          categorias={categorias}
          mesPadrao={ehMesAtual ? new Date() : competencia}
          onFechar={() => setModal(null)}
          onSalvo={fechar}
        />
      )}
      {modal?.tipo === "pagamento" && (
        <ModalPagamento gasto={modal.gasto} onFechar={() => setModal(null)} onSalvo={fechar} />
      )}
      {modal?.tipo === "fixas" && (
        <ModalFixas
          regras={regras}
          categorias={categorias}
          onFechar={() => setModal(null)}
          onMudou={() => router.refresh()}
        />
      )}
      {modal?.tipo === "categorias" && (
        <ModalCategorias
          categorias={categorias}
          onFechar={() => setModal(null)}
          onMudou={() => router.refresh()}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Controle de Gastos</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Tudo o que a oficina paga para funcionar, mês a mês
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" onClick={() => setModal({ tipo: "categorias" })}>
            Categorias
          </Botao>
          <Botao variante="secundario" onClick={() => setModal({ tipo: "fixas" })}>
            Despesas fixas
            {fixasAtivas > 0 && (
              <span className="ml-1 rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-500">
                {fixasAtivas}
              </span>
            )}
          </Botao>
          <Botao onClick={() => setModal({ tipo: "gasto", gasto: null })}>+ Lançar gasto</Botao>
        </div>
      </div>

      <NavegacaoMes mes={mes} rotulo={rotuloMes} ehMesAtual={ehMesAtual} />

      {erro && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      {/* Os quatro números do mês */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartao
          rotulo="Gastos do mês"
          valor={formatCurrency(resumo.total)}
          sub={`${resumo.quantidade} ${plural(resumo.quantidade, "lançamento")}`}
          destaque
        />
        <Cartao
          rotulo="Já pago"
          valor={formatCurrency(resumo.pago)}
          sub={
            resumo.total > 0
              ? `${Math.round((resumo.pago / resumo.total) * 100)}% do mês`
              : "nada lançado ainda"
          }
        />
        <Cartao
          rotulo="Em aberto"
          valor={formatCurrency(resumo.aberto)}
          sub={`${emAberto} ${plural(emAberto, "conta")} a pagar`}
        />
        <Cartao
          rotulo="Vencidas"
          valor={formatCurrency(resumo.vencido)}
          sub={`${resumo.vencidas} ${plural(resumo.vencidas, "conta")}`}
          perigo={resumo.vencidas > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PainelEquilibrio
          equilibrio={equilibrio}
          custoOperacional={custoOperacional}
          fixo={resumo.fixo}
          avulso={resumo.avulso}
        />
        <PorCategoria itens={resumo.porCategoria} total={resumo.total} />
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1 px-4 sm:mx-0 sm:px-1">
          {(
            [
              ["todos", "Todos"],
              ["aberto", "A pagar"],
              ["pago", "Pagos"],
            ] as const
          ).map(([valor, label]) => (
            <button
              key={valor}
              onClick={() => setFiltro(valor)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filtro === valor
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição ou fornecedor"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 sm:w-64 sm:flex-none"
          />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lançamentos */}
      {lancamentos.length === 0 ? (
        <Vazio
          titulo="Nenhum gasto neste mês"
          texto={
            regras.length === 0
              ? "Comece cadastrando as despesas fixas — aluguel, salários, energia. Elas passam a se lançar sozinhas todo mês."
              : "Lance um gasto avulso ou navegue para outro mês."
          }
          acao={
            regras.length === 0 ? (
              <Botao onClick={() => setModal({ tipo: "fixas" })}>Cadastrar despesas fixas</Botao>
            ) : (
              <Botao onClick={() => setModal({ tipo: "gasto", gasto: null })}>Lançar gasto</Botao>
            )
          }
        />
      ) : listadas.length === 0 ? (
        <Vazio titulo="Nada com esse filtro" texto="Ajuste a busca ou volte para “Todos”." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {listadas.map((d) => (
              <Linha
                key={d.id}
                gasto={d}
                ocupado={ocupado === d.id}
                onPagar={() => setModal({ tipo: "pagamento", gasto: d })}
                onEditar={() => setModal({ tipo: "gasto", gasto: d })}
                onEstornar={() =>
                  comAcao(d.id, () =>
                    enviar(`/api/despesas/${d.id}/pagamento`, "PUT", { pago: false })
                  )
                }
                onRemover={() => {
                  const pergunta = d.recorrenteId
                    ? `Marcar "${d.descricao}" como não cobrada em ${rotuloMes}?\n\nA despesa fixa continua valendo nos outros meses.`
                    : `Excluir "${d.descricao}"?`;
                  if (!confirm(pergunta)) return;
                  comAcao(d.id, () => enviar(`/api/despesas/${d.id}`, "DELETE"));
                }}
              />
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm">
            <span className="text-zinc-500">
              {`${listadas.length} de ${lancamentos.length} ${plural(lancamentos.length, "lançamento")}`}
            </span>
            <span className="font-semibold text-zinc-900">{formatCurrency(totalListado)}</span>
          </div>
        </div>
      )}

      {cancelados.length > 0 && (
        <details className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm text-zinc-500">
            {cancelados.length} despesa fixa marcada como “não teve” em {rotuloMes}
          </summary>
          <ul className="mt-3 space-y-2">
            {cancelados.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-zinc-500">
                  {d.descricao} · {formatCurrency(d.valor)}
                </span>
                <button
                  type="button"
                  disabled={ocupado === d.id}
                  onClick={() =>
                    comAcao(d.id, () =>
                      enviar(`/api/despesas/${d.id}`, "PUT", { cancelado: false })
                    )
                  }
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-brand-600 hover:bg-brand-50 disabled:opacity-50"
                >
                  Trazer de volta
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- pedaços */

function NavegacaoMes({
  mes,
  rotulo,
  ehMesAtual,
}: {
  mes: string;
  rotulo: string;
  ehMesAtual: boolean;
}) {
  const link = (passos: number) => `/despesas?mes=${chaveMesDeslocada(mes, passos)}`;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={link(-1)}
        aria-label="Mês anterior"
        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
      >
        ←
      </Link>
      <span className="min-w-36 text-center text-sm font-semibold text-zinc-800">{rotulo}</span>
      {/* Avançar é permitido de propósito: ver o que vem pela frente é metade do
          motivo de cadastrar despesa fixa. */}
      <Link
        href={link(1)}
        aria-label="Próximo mês"
        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
      >
        →
      </Link>
      {!ehMesAtual && (
        <Link
          href={`/despesas?mes=${chaveMes(new Date())}`}
          className="text-xs text-brand-600 hover:underline"
        >
          Mês atual
        </Link>
      )}
    </div>
  );
}

function Cartao({
  rotulo,
  valor,
  sub,
  destaque,
  perigo,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  destaque?: boolean;
  perigo?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        perigo
          ? "border-red-200 bg-red-50"
          : destaque
            ? "border-zinc-300 bg-zinc-50"
            : "border-zinc-200 bg-white"
      )}
    >
      <p className="text-sm text-zinc-500">{rotulo}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          perigo ? "text-red-600" : "text-zinc-900"
        )}
      >
        {valor}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

/**
 * Ponto de equilíbrio.
 *
 * O número que o dono realmente quer: com esta margem, quanto precisa sair da oficina
 * para pagar as contas do mês. Sem histórico de margem o painel não inventa um valor —
 * diz o que falta para poder calcular.
 */
function PainelEquilibrio({
  equilibrio: e,
  custoOperacional,
  fixo,
  avulso,
}: {
  equilibrio: Equilibrio;
  custoOperacional: number;
  fixo: number;
  avulso: number;
}) {
  const cobriu = e.necessario !== null && e.faturado >= e.necessario;
  const progresso =
    e.necessario && e.necessario > 0 ? Math.min(100, (e.faturado / e.necessario) * 100) : 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-zinc-800">Ponto de equilíbrio</h2>
          <p className="text-xs text-zinc-500">Quanto precisa faturar para cobrir os gastos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Custo operacional</p>
          <p className="font-semibold text-zinc-900">{formatCurrency(custoOperacional)}/mês</p>
        </div>
      </div>

      {e.necessario === null ? (
        <p className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          Ainda não dá para calcular: é preciso ter OS entregues nos últimos três meses para
          saber a margem média da oficina.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-600">
            Com margem de <strong>{Math.round((e.margem ?? 0) * 100)}%</strong>, a oficina precisa
            faturar{" "}
            <strong className="text-zinc-900">{formatCurrency(e.necessario)}</strong> neste mês.
          </p>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn("h-full rounded-full", cobriu ? "bg-green-500" : "bg-brand-600")}
              style={{ width: `${progresso}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
            <span className="text-zinc-500">
              {`Faturado ${formatCurrency(e.faturado)} · ${e.osNoMes} ${plural(e.osNoMes, "OS entregue")}`}
            </span>
            <span className={cn("font-medium", cobriu ? "text-green-600" : "text-red-600")}>
              {cobriu
                ? `Coberto — sobra ${formatCurrency(e.resultado)} de lucro`
                : `Faltam ${formatCurrency(e.falta ?? 0)}`}
            </span>
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3 text-sm sm:grid-cols-3">
        <Metrica rotulo="Gastos fixos" valor={formatCurrency(fixo)} />
        <Metrica rotulo="Gastos avulsos" valor={formatCurrency(avulso)} />
        <Metrica
          rotulo="Resultado do mês"
          valor={formatCurrency(e.resultado)}
          cor={e.resultado >= 0 ? "text-green-600" : "text-red-600"}
          ajuda="lucro bruto das OS − gastos"
        />
      </div>
    </div>
  );
}

function Metrica({
  rotulo,
  valor,
  cor,
  ajuda,
}: {
  rotulo: string;
  valor: string;
  cor?: string;
  ajuda?: string;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{rotulo}</p>
      <p className={cn("mt-0.5 font-semibold tabular-nums", cor ?? "text-zinc-900")}>{valor}</p>
      {ajuda && <p className="text-[11px] text-zinc-400">{ajuda}</p>}
    </div>
  );
}

function PorCategoria({
  itens,
  total,
}: {
  itens: { nome: string; cor: string; valor: number }[];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold text-zinc-800">Por categoria</h2>
      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">Nada lançado neste mês.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {itens.map((c) => (
            <li key={c.nome}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate text-zinc-600">{c.nome}</span>
                <span className="shrink-0 font-medium tabular-nums text-zinc-900">
                  {formatCurrency(c.valor)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${total > 0 ? (c.valor / total) * 100 : 0}%`,
                    backgroundColor: c.cor,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Linha({
  gasto: d,
  ocupado,
  onPagar,
  onEditar,
  onEstornar,
  onRemover,
}: {
  gasto: Lancamento;
  ocupado: boolean;
  onPagar: () => void;
  onEditar: () => void;
  onEstornar: () => void;
  onRemover: () => void;
}) {
  const situacao = situacaoDe(d);
  const diferenca = d.pago && d.valorPago !== null ? d.valorPago - d.valor : 0;

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900">{d.descricao}</span>
          <ChipCategoria nome={d.categoria.nome} cor={d.categoria.cor} />
          {d.recorrenteId && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Fixa</span>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              SITUACOES[situacao].chip
            )}
          >
            {SITUACOES[situacao].label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-400">
          {d.pago && d.pagoEm
            ? `Pago em ${formatDate(d.pagoEm)}${
                labelFormaPagamento(d.formaPagamento)
                  ? ` · ${labelFormaPagamento(d.formaPagamento)}`
                  : ""
              }`
            : `Vence em ${formatDate(d.vencimento)}`}
          {d.fornecedor ? ` · ${d.fornecedor}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="w-24 text-right font-semibold tabular-nums text-zinc-900">
          {formatCurrency(valorEfetivo(d))}
          {Math.abs(diferenca) >= 0.01 && (
            <span
              className={cn(
                "block text-[11px] font-normal",
                diferenca > 0 ? "text-red-500" : "text-green-600"
              )}
            >
              previsto {formatCurrency(d.valor)}
            </span>
          )}
        </span>

        {d.pago ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={onEstornar}
            className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
          >
            Desfazer
          </button>
        ) : (
          <button
            type="button"
            disabled={ocupado}
            onClick={onPagar}
            className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Pagar
          </button>
        )}
        <button
          type="button"
          disabled={ocupado}
          onClick={onEditar}
          className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
        >
          Editar
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={onRemover}
          title={d.recorrenteId ? "Não teve este mês" : "Excluir"}
          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
        >
          {d.recorrenteId ? "Não teve" : "Excluir"}
        </button>
      </div>
    </li>
  );
}

function Vazio({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
      <p className="font-medium text-zinc-700">{titulo}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-400">{texto}</p>
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}
