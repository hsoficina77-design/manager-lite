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
import { Aviso, Botao, ChipCategoria, Selecao } from "./campos";
import { FaixaMetricas, Metrica as MetricaUI, Vazio as VazioUI } from "@/components/ui/Dados";
import { useConfirmar } from "@/components/ui/Avisos";
import { Avancar, Mais, Voltar } from "@/components/ui/Icones";
import { enviar, mensagemDoErro } from "./api";
import { ModalCategorias } from "./ModalCategorias";
import { ModalFixar } from "./ModalFixar";
import { ModalFixas } from "./ModalFixas";
import { ModalGasto } from "./ModalGasto";
import { ModalPagamento } from "./ModalPagamento";
import type { Categoria, Equilibrio, Lancamento, Regra } from "./tipos";

const SITUACOES: Record<Situacao, { label: string; chip: string }> = {
  vencida: { label: "Vencida", chip: "bg-perigo-fraco text-perigo" },
  "vence-breve": { label: "Vence em breve", chip: "bg-atencao-fraco text-atencao" },
  "a-vencer": { label: "A vencer", chip: "bg-superficie-3 text-tinta-3" },
  paga: { label: "Paga", chip: "bg-ok-fraco text-ok" },
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
  const confirmar = useConfirmar();

  const [modal, setModal] = useState<
    | { tipo: "gasto"; gasto: Lancamento | null }
    | { tipo: "pagamento"; gasto: Lancamento }
    | { tipo: "fixar"; gasto: Lancamento }
    | { tipo: "fixas" }
    | { tipo: "categorias" }
    | null
  >(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Reclassificar é um modo, não o padrão: as caixas de seleção em toda linha deixariam
  // a lista mais pesada no celular para uma tarefa que se faz de vez em quando.
  const [reclassificando, setReclassificando] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);

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

  // A seleção sobrevive a mudar o filtro — dá para juntar o resultado de várias buscas.
  // O recorte para o mês em tela é o que importa: navegar de mês preserva o estado do
  // componente, e sem isto o "Mover" levaria junto o que ficou marcado no mês anterior,
  // sem ninguém ver. Tudo daqui para baixo usa `marcados`, nunca `selecionados`.
  const marcados = selecionados.filter((id) => lancamentos.some((d) => d.id === id));

  function alternarSelecao(id: string) {
    setSelecionados((atuais) =>
      atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id]
    );
  }

  function sairDaReclassificacao() {
    setReclassificando(false);
    setSelecionados([]);
  }

  /** Abre a reclassificação já filtrada por uma categoria — o caminho vindo do gráfico. */
  function reclassificarCategoria(categoriaId: string) {
    setCategoriaFiltro(categoriaId);
    setFiltro("todos");
    setSelecionados([]);
    setReclassificando(true);
  }

  /**
   * A lista sai em dois blocos, e não numa lista só com um chip "Fixa" no meio da linha.
   *
   * São duas naturezas de dinheiro e a decisão sobre cada uma é diferente: o fixo é o
   * custo de manter a oficina aberta (só muda renegociando ou cortando a conta), o
   * variável é o gasto daquele mês. Misturados, a única forma de saber quanto era de
   * cada tipo era somar linha a linha.
   */
  const grupos = [
    {
      chave: "fixos",
      label: "Gastos fixos",
      ajuda: "Voltam todo mês — é o custo de manter a oficina aberta",
      itens: listadas.filter((d) => d.recorrenteId),
    },
    {
      chave: "variaveis",
      label: "Gastos variáveis",
      ajuda: "Aconteceram só neste mês",
      itens: listadas.filter((d) => !d.recorrenteId),
    },
  ].filter((g) => g.itens.length > 0);

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
          onFixar={(gasto) => setModal({ tipo: "fixar", gasto })}
        />
      )}
      {modal?.tipo === "pagamento" && (
        <ModalPagamento gasto={modal.gasto} onFechar={() => setModal(null)} onSalvo={fechar} />
      )}
      {modal?.tipo === "fixar" && (
        <ModalFixar gasto={modal.gasto} onFechar={() => setModal(null)} onSalvo={fechar} />
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
          <h1 className="text-2xl font-bold text-tinta">Controle de gastos</h1>
          <p className="mt-0.5 text-sm text-tinta-3">
            Tudo o que a oficina paga para funcionar, mês a mês
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lancamentos.length > 0 && (
            <Botao
              variante="secundario"
              onClick={() => (reclassificando ? sairDaReclassificacao() : setReclassificando(true))}
              title="Trocar a categoria de vários gastos de uma vez"
            >
              {reclassificando ? "Sair da reclassificação" : "Reclassificar"}
            </Botao>
          )}
          <Botao variante="secundario" onClick={() => setModal({ tipo: "categorias" })}>
            Categorias
          </Botao>
          <Botao variante="secundario" onClick={() => setModal({ tipo: "fixas" })}>
            Despesas fixas
            {fixasAtivas > 0 && (
              <span className="ml-1 rounded-full bg-superficie-3 px-1.5 text-xs text-tinta-3">
                {fixasAtivas}
              </span>
            )}
          </Botao>
          <Botao onClick={() => setModal({ tipo: "gasto", gasto: null })}><Mais tamanho={16} /> Lançar gasto</Botao>
        </div>
      </div>

      <NavegacaoMes mes={mes} rotulo={rotuloMes} ehMesAtual={ehMesAtual} />

      {erro && (
        <p className="rounded-lg border border-perigo-linha bg-perigo-fraco px-3 py-2 text-sm text-perigo">
          {erro}
        </p>
      )}

      {/* Os quatro números do mês */}
      <FaixaMetricas colunas={4}>
        <MetricaUI
          rotulo="Gastos do mês"
          valor={formatCurrency(resumo.total)}
          sub={`${resumo.quantidade} ${plural(resumo.quantidade, "lançamento")}`}
          tamanho="grande"
        />
        <MetricaUI
          rotulo="Já pago"
          valor={formatCurrency(resumo.pago)}
          sub={
            resumo.total > 0
              ? `${Math.round((resumo.pago / resumo.total) * 100)}% do mês`
              : "nada lançado ainda"
          }
          tamanho="grande"
        />
        <MetricaUI
          rotulo="Em aberto"
          valor={formatCurrency(resumo.aberto)}
          sub={`${emAberto} ${plural(emAberto, "conta")} a pagar`}
          tamanho="grande"
        />
        <MetricaUI
          rotulo="Vencidas"
          valor={formatCurrency(resumo.vencido)}
          sub={`${resumo.vencidas} ${plural(resumo.vencidas, "conta")}`}
          tamanho="grande"
          tom={resumo.vencidas > 0 ? "perigo" : "neutro"}
        />
      </FaixaMetricas>

      <div className="grid gap-4 lg:grid-cols-3">
        <PainelEquilibrio
          equilibrio={equilibrio}
          custoOperacional={custoOperacional}
          fixo={resumo.fixo}
          avulso={resumo.avulso}
        />
        <PorCategoria
          itens={resumo.porCategoria}
          total={resumo.total}
          onReclassificar={reclassificarCategoria}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto rounded-lg bg-superficie-3 p-1 px-4 sm:mx-0 sm:px-1">
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
                  ? "bg-superficie text-tinta shadow-sm"
                  : "text-tinta-3 hover:text-tinta-2"
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
            className="min-w-0 flex-1 rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 sm:w-64 sm:flex-none"
          />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="shrink-0 rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        <VazioUI
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
        <VazioUI titulo="Nada com esse filtro" texto="Ajuste a busca ou volte para “Todos”." />
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <div key={grupo.chave}>
              <div className="flex items-start justify-between gap-3 rounded-t-xl border border-linha bg-superficie-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-tinta-2">
                    {grupo.label}
                    <span className="rounded-full bg-superficie/80 px-2 py-0.5 text-xs font-medium text-tinta-2">
                      {grupo.itens.length}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-tinta-3">{grupo.ajuda}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-tinta">
                  {formatCurrency(grupo.itens.reduce((s, d) => s + valorEfetivo(d), 0))}
                </span>
              </div>
              <ul className="divide-y divide-linha overflow-hidden rounded-b-xl border border-t-0 border-linha bg-superficie">
                {grupo.itens.map((d) => (
                  <Linha
                    key={d.id}
                    gasto={d}
                    ocupado={ocupado === d.id}
                    selecionavel={reclassificando}
                    selecionado={marcados.includes(d.id)}
                    onSelecionar={() => alternarSelecao(d.id)}
                    onPagar={() => setModal({ tipo: "pagamento", gasto: d })}
                    onEditar={() => setModal({ tipo: "gasto", gasto: d })}
                    onEstornar={() =>
                      comAcao(d.id, () =>
                        enviar(`/api/despesas/${d.id}/pagamento`, "PUT", { pago: false })
                      )
                    }
                    onRemover={async () => {
                      const ok = await confirmar(
                        d.recorrenteId
                          ? {
                              titulo: `Marcar “${d.descricao}” como não cobrada em ${rotuloMes}?`,
                              texto: "A despesa fixa continua valendo nos outros meses, e dá para trazer de volta depois.",
                              acao: "Não teve este mês",
                            }
                          : {
                              titulo: `Excluir “${d.descricao}”?`,
                              texto: `O lançamento de ${formatCurrency(valorEfetivo(d))} sai do mês. Não há como desfazer.`,
                              acao: "Excluir gasto",
                              perigo: true,
                            }
                      );
                      if (!ok) return;
                      comAcao(d.id, () => enviar(`/api/despesas/${d.id}`, "DELETE"));
                    }}
                  />
                ))}
              </ul>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-linha bg-superficie-2 px-4 py-2.5 text-sm">
            {reclassificando ? (
              <button
                type="button"
                onClick={() =>
                  setSelecionados(
                    listadas.every((d) => marcados.includes(d.id))
                      ? marcados.filter((id) => !listadas.some((d) => d.id === id))
                      : [...new Set([...marcados, ...listadas.map((d) => d.id)])]
                  )
                }
                className="min-h-11 text-brand-600 hover:underline"
              >
                {listadas.every((d) => marcados.includes(d.id))
                  ? "Desmarcar os da lista"
                  : "Selecionar os da lista"}
              </button>
            ) : (
              <span className="text-tinta-3">
                {`${listadas.length} de ${lancamentos.length} ${plural(lancamentos.length, "lançamento")}`}
              </span>
            )}
            <span className="font-semibold text-tinta">{formatCurrency(totalListado)}</span>
          </div>
        </div>
      )}

      {reclassificando && (
        <BarraReclassificar
          selecionados={marcados}
          lancamentos={lancamentos}
          categorias={categorias}
          onLimpar={() => setSelecionados([])}
          onSair={sairDaReclassificacao}
          onPronto={() => {
            setSelecionados([]);
            router.refresh();
          }}
        />
      )}

      {cancelados.length > 0 && (
        <details className="rounded-xl border border-linha bg-superficie px-4 py-3">
          <summary className="cursor-pointer text-sm text-tinta-3">
            {cancelados.length} despesa fixa marcada como “não teve” em {rotuloMes}
          </summary>
          <ul className="mt-3 space-y-2">
            {cancelados.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-tinta-3">
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
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
      >
        <Voltar tamanho={16} />
      </Link>
      <span className="min-w-36 text-center text-sm font-semibold text-tinta">{rotulo}</span>
      {/* Avançar é permitido de propósito: ver o que vem pela frente é metade do
          motivo de cadastrar despesa fixa. */}
      <Link
        href={link(1)}
        aria-label="Próximo mês"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
      >
        <Avancar tamanho={16} />
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
    <div className="rounded-xl border border-linha bg-superficie p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-tinta">Ponto de equilíbrio</h2>
          <p className="text-xs text-tinta-3">Quanto precisa faturar para cobrir os gastos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-tinta-3">Custo operacional</p>
          <p className="font-semibold text-tinta">{formatCurrency(custoOperacional)}/mês</p>
        </div>
      </div>

      {e.necessario === null ? (
        <p className="mt-4 rounded-lg border border-linha bg-superficie-2 px-3 py-3 text-sm text-tinta-3">
          Ainda não dá para calcular: é preciso ter OS entregues nos últimos três meses para
          saber a margem média da oficina.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-tinta-2">
            Com margem de <strong>{Math.round((e.margem ?? 0) * 100)}%</strong>, a oficina precisa
            faturar{" "}
            <strong className="text-tinta">{formatCurrency(e.necessario)}</strong> neste mês.
          </p>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-superficie-3">
            <div
              className={cn("h-full rounded-full", cobriu ? "bg-ok" : "bg-brand-600")}
              style={{ width: `${progresso}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
            <span className="text-tinta-3">
              {`Faturado ${formatCurrency(e.faturado)} · ${e.osNoMes} ${plural(e.osNoMes, "OS entregue")}`}
            </span>
            <span className={cn("font-medium", cobriu ? "text-ok" : "text-perigo")}>
              {cobriu
                ? `Coberto — sobra ${formatCurrency(e.resultado)} de lucro`
                : `Faltam ${formatCurrency(e.falta ?? 0)}`}
            </span>
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-linha pt-3 text-sm sm:grid-cols-3">
        {/* Mesmas palavras dos dois blocos da lista — "avulso" e "variável" para a mesma
            coisa faria parecer que são dois números diferentes. */}
        <Metrica rotulo="Gastos fixos" valor={formatCurrency(fixo)} />
        <Metrica rotulo="Gastos variáveis" valor={formatCurrency(avulso)} />
        <Metrica
          rotulo="Resultado do mês"
          valor={formatCurrency(e.resultado)}
          cor={e.resultado >= 0 ? "text-ok" : "text-perigo"}
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
      <p className="text-xs text-tinta-3">{rotulo}</p>
      <p className={cn("mt-0.5 font-semibold tabular-nums", cor ?? "text-tinta")}>{valor}</p>
      {ajuda && <p className="text-xs text-tinta-3">{ajuda}</p>}
    </div>
  );
}

/**
 * Gasto por categoria — e a porta de entrada para consertar a classificação.
 *
 * Quem olha isto e vê "Outros: R$ 3.200" já está fazendo a pergunta certa; tocar na
 * barra abre a lista filtrada por essa categoria, em modo de reclassificação.
 */
function PorCategoria({
  itens,
  total,
  onReclassificar,
}: {
  itens: { id: string; nome: string; cor: string; valor: number }[];
  total: number;
  onReclassificar: (categoriaId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-linha bg-superficie p-5">
      <h2 className="font-semibold text-tinta">Por categoria</h2>
      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-3">Nada lançado neste mês.</p>
      ) : (
        <>
          <ul className="mt-3 space-y-1">
            {itens.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onReclassificar(c.id)}
                  title={`Ver e reclassificar os gastos de ${c.nome}`}
                  className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-superficie-2"
                >
                  <span className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-tinta-2">{c.nome}</span>
                    <span className="shrink-0 font-medium tabular-nums text-tinta">
                      {formatCurrency(c.valor)}
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-superficie-3">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${total > 0 ? (c.valor / total) * 100 : 0}%`,
                        backgroundColor: c.cor,
                      }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-snug text-tinta-3">
            Toque numa categoria para ver o que caiu nela e trocar em lote — é o jeito de
            esvaziar o “Outros” sem abrir gasto por gasto.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * A barra do modo reclassificar.
 *
 * Fica grudada no rodapé: no celular a seleção acontece rolando a lista, e um botão de
 * aplicar lá no topo obrigaria a rolar de volta a cada lote.
 */
function BarraReclassificar({
  selecionados,
  lancamentos,
  categorias,
  onLimpar,
  onSair,
  onPronto,
}: {
  selecionados: string[];
  lancamentos: Lancamento[];
  categorias: Categoria[];
  onLimpar: () => void;
  onSair: () => void;
  onPronto: () => void;
}) {
  const [categoriaId, setCategoriaId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const escolhidos = lancamentos.filter((d) => selecionados.includes(d.id));
  const deRegra = escolhidos.filter((d) => d.recorrenteId).length;
  const ativas = categorias.filter((c) => c.ativa);

  async function mover() {
    if (!categoriaId || selecionados.length === 0) return;
    setErro(null);
    setSalvando(true);
    try {
      await enviar("/api/despesas/reclassificar", "PUT", { ids: selecionados, categoriaId });
      setCategoriaId("");
      onPronto();
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="sticky bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-4 border-t border-linha bg-superficie/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.07)] backdrop-blur sm:-mx-6 sm:px-6 md:bottom-0">
      {selecionados.length === 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-tinta-3">Marque os gastos que foram para a categoria errada.</span>
          <Botao variante="secundario" className="shrink-0" onClick={onSair}>
            Sair
          </Botao>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-tinta">
              {selecionados.length}{" "}
              {selecionados.length === 1 ? "gasto selecionado" : "gastos selecionados"}
            </span>
            <button
              type="button"
              onClick={onLimpar}
              className="text-xs text-tinta-3 hover:text-tinta-2"
            >
              Limpar seleção
            </button>
          </div>

          <div className="flex gap-2">
            <Selecao
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="min-w-0 flex-1"
              aria-label="Categoria de destino"
            >
              <option value="">Mover para...</option>
              {ativas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
            <Botao
              className="shrink-0"
              disabled={salvando || !categoriaId}
              onClick={mover}
            >
              {salvando ? "Movendo..." : "Mover"}
            </Botao>
          </div>

          {deRegra > 0 && (
            <p className="text-xs leading-snug text-atencao">
              {deRegra === 1
                ? "1 dos selecionados vem de despesa fixa: a troca vale só para este mês."
                : `${deRegra} dos selecionados vêm de despesa fixa: a troca vale só para este mês.`}{" "}
              Para mudar de vez, edite a despesa fixa.
            </p>
          )}

          <Aviso>{erro}</Aviso>
        </div>
      )}
    </div>
  );
}

function Linha({
  gasto: d,
  ocupado,
  selecionavel,
  selecionado,
  onSelecionar,
  onPagar,
  onEditar,
  onEstornar,
  onRemover,
}: {
  gasto: Lancamento;
  ocupado: boolean;
  /** Modo reclassificar: a linha vira caixa de seleção e as ações saem de cena. */
  selecionavel: boolean;
  selecionado: boolean;
  onSelecionar: () => void;
  onPagar: () => void;
  onEditar: () => void;
  onEstornar: () => void;
  onRemover: () => void;
}) {
  const situacao = situacaoDe(d);
  const diferenca = d.pago && d.valorPago !== null ? d.valorPago - d.valor : 0;

  const info = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-tinta">{d.descricao}</span>
        <ChipCategoria nome={d.categoria.nome} cor={d.categoria.cor} />
        {/* O antigo chip "Fixa" saiu daqui: agora quem diz isso é o bloco em que a
            linha está, e repetir em toda linha só engordava a lista no celular. */}
        <span
          className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SITUACOES[situacao].chip)}
        >
          {SITUACOES[situacao].label}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-tinta-3">
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
  );

  const valor = (
    <span className="w-24 text-right font-semibold tabular-nums text-tinta">
      {formatCurrency(valorEfetivo(d))}
      {Math.abs(diferenca) >= 0.01 && (
        <span
          className={cn(
            "block text-xs font-normal",
            diferenca > 0 ? "text-perigo" : "text-ok"
          )}
        >
          previsto {formatCurrency(d.valor)}
        </span>
      )}
    </span>
  );

  // A linha inteira é o alvo do toque — um <label> alterna a caixa uma vez só, e no
  // celular acertar 20 quadradinhos de 20px seguidos não seria reclassificar nada.
  if (selecionavel) {
    return (
      <li className={cn("transition-colors", selecionado && "bg-brand-50")}>
        <label className="flex cursor-pointer items-start gap-3 px-4 py-3">
          <input
            type="checkbox"
            checked={selecionado}
            onChange={onSelecionar}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-linha-forte accent-brand-600"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            {info}
            <div className="shrink-0">{valor}</div>
          </div>
        </label>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      {info}

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {valor}

        {d.pago ? (
          <Botao variante="secundario" tamanho="denso" disabled={ocupado} onClick={onEstornar}>
            Desfazer
          </Botao>
        ) : (
          <Botao variante="sucesso" tamanho="denso" disabled={ocupado} onClick={onPagar}>
            Pagar
          </Botao>
        )}
        <Botao variante="secundario" tamanho="denso" disabled={ocupado} onClick={onEditar}>
          Editar
        </Botao>
        <Botao
          variante="perigo"
          tamanho="denso"
          disabled={ocupado}
          onClick={onRemover}
          title={d.recorrenteId ? "Não teve este mês" : "Excluir"}
        >
          {d.recorrenteId ? "Não teve" : "Excluir"}
        </Botao>
      </div>
    </li>
  );
}
