"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { chaveMes, rotuloMes } from "@/lib/periodo";
import { PERIODICIDADES, custoOperacionalMensal, labelPeriodicidade } from "@/lib/despesas-comum";
import {
  Area,
  Aviso,
  Botao,
  Campo,
  ChipCategoria,
  Entrada,
  EntradaValor,
  Modal,
  Selecao,
} from "./campos";
import { SeletorCategoria } from "./SeletorCategoria";
import { enviar, mensagemDoErro } from "./api";
import type { Categoria, Regra } from "./tipos";

/**
 * As despesas fixas — o cadastro de onde sai o custo operacional.
 *
 * Cadastrar aqui é o que faz o mês inteiro aparecer sozinho: o lançamento de cada mês
 * nasce da regra quando o mês é aberto. Na versão anterior a próxima parcela só existia
 * depois que a anterior fosse paga, então "quanto custa manter a oficina aberta" não
 * tinha resposta enquanto as contas do mês não fossem quitadas.
 */
export function ModalFixas({
  regras,
  categorias,
  onFechar,
  onMudou,
}: {
  regras: Regra[];
  categorias: Categoria[];
  onFechar: () => void;
  onMudou: () => void;
}) {
  const [editando, setEditando] = useState<Regra | "nova" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const ativas = regras.filter((r) => r.ativa);
  const custo = custoOperacionalMensal(regras);

  async function acao(fn: () => Promise<unknown>) {
    setErro(null);
    setOcupado(true);
    try {
      await fn();
      onMudou();
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setOcupado(false);
    }
  }

  if (editando) {
    return (
      <FormularioFixa
        regra={editando === "nova" ? null : editando}
        categorias={categorias}
        onCancelar={() => setEditando(null)}
        onSalvo={() => {
          setEditando(null);
          onMudou();
        }}
      />
    );
  }

  return (
    <Modal
      titulo="Despesas fixas"
      descricao="As contas que voltam todo mês. Elas se lançam sozinhas quando o mês é aberto."
      largura="max-w-2xl"
      onFechar={onFechar}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div>
            <p className="text-xs text-zinc-500">Custo operacional</p>
            <p className="text-xl font-bold text-zinc-900">{formatCurrency(custo)}/mês</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {ativas.length === 1 ? "1 conta ativa" : `${ativas.length} contas ativas`} · o que
              não é mensal entra pela fatia do mês
            </p>
          </div>
          <Botao onClick={() => setEditando("nova")} className="shrink-0">
            + Nova despesa fixa
          </Botao>
        </div>

        <Aviso>{erro}</Aviso>

        {regras.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-10 text-center">
            <p className="text-sm text-zinc-500">Nenhuma despesa fixa cadastrada.</p>
            <p className="mt-1 text-xs text-zinc-400">
              Comece pelo aluguel, salários, energia, água e internet.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {regras.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-medium ${r.ativa ? "text-zinc-900" : "text-zinc-400 line-through"}`}
                    >
                      {r.descricao}
                    </span>
                    <ChipCategoria nome={r.categoria.nome} cor={r.categoria.cor} />
                    {!r.ativa && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                        Inativa
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Dia {r.diaVencimento} · {labelPeriodicidade(r.periodicidade)}
                    {r.fornecedor ? ` · ${r.fornecedor}` : ""}
                    {r.fim ? ` · até ${rotuloMes(r.fim)}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="w-24 text-right font-semibold text-zinc-900">
                    {formatCurrency(r.valor)}
                  </span>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => setEditando(r)}
                    className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() =>
                      acao(() =>
                        enviar(`/api/despesas/recorrentes/${r.id}`, "PUT", { ativa: !r.ativa })
                      )
                    }
                    className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
                  >
                    {r.ativa ? "Desativar" : "Reativar"}
                  </button>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => {
                      if (
                        !confirm(
                          `Excluir "${r.descricao}"?\n\nOs lançamentos deste mês em diante que ainda não foram pagos saem junto. O que já foi pago fica no histórico.`
                        )
                      )
                        return;
                      acao(() => enviar(`/api/despesas/recorrentes/${r.id}`, "DELETE"));
                    }}
                    className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-zinc-400">
          Desativar para de gerar lançamentos e mantém o histórico. Excluir só vale a pena
          quando a conta foi cadastrada por engano.
        </p>
      </div>
    </Modal>
  );
}

function FormularioFixa({
  regra,
  categorias,
  onCancelar,
  onSalvo,
}: {
  regra: Regra | null;
  categorias: Categoria[];
  onCancelar: () => void;
  onSalvo: () => void;
}) {
  const disponiveis = categorias.filter((c) => c.ativa || c.id === regra?.categoriaId);

  const [form, setForm] = useState({
    categoriaId: regra?.categoriaId ?? disponiveis[0]?.id ?? "",
    descricao: regra?.descricao ?? "",
    valor: regra ? String(regra.valor) : "",
    fornecedor: regra?.fornecedor ?? "",
    diaVencimento: String(regra?.diaVencimento ?? 5),
    periodicidade: regra?.periodicidade ?? "MENSAL",
    inicio: chaveMes(regra?.inicio ?? new Date()),
    fim: regra?.fim ? chaveMes(regra.fim) : "",
    observacao: regra?.observacao ?? "",
  });
  // Reajustou o aluguel? O normal é querer o preço novo já no mês aberto. Marcado por
  // padrão, e desmarcável para quando a correção é só do cadastro.
  const [propagar, setPropagar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const corpo = { ...form, fim: form.fim || null };
      if (regra) await enviar(`/api/despesas/recorrentes/${regra.id}`, "PUT", { ...corpo, propagar });
      else await enviar("/api/despesas/recorrentes", "POST", corpo);
      onSalvo();
    } catch (err) {
      setErro(mensagemDoErro(err));
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={regra ? "Editar despesa fixa" : "Nova despesa fixa"}
      descricao="O lançamento de cada mês nasce daqui — não precisa relançar todo mês."
      onFechar={onCancelar}
    >
      <form onSubmit={salvar} className="space-y-3">
        <SeletorCategoria
          categorias={categorias}
          valor={form.categoriaId}
          onMudar={(categoriaId) => setForm({ ...form, categoriaId })}
        />

        <Campo rotulo="Descrição *">
          <Entrada
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex.: Aluguel do galpão"
            required
            autoFocus
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor previsto *">
            <EntradaValor
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
              required
            />
          </Campo>
          <Campo rotulo="Vence todo dia *" ajuda="Mês curto cai no último dia.">
            <Entrada
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              value={form.diaVencimento}
              onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })}
              required
            />
          </Campo>
        </div>

        <Campo rotulo="Com que frequência">
          <Selecao
            value={form.periodicidade}
            onChange={(e) => setForm({ ...form, periodicidade: e.target.value })}
          >
            {PERIODICIDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Selecao>
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="A partir de *">
            <Entrada
              type="month"
              value={form.inicio}
              onChange={(e) => setForm({ ...form, inicio: e.target.value })}
              required
            />
          </Campo>
          <Campo rotulo="Até" ajuda="Em branco = sem fim previsto.">
            <Entrada
              type="month"
              value={form.fim}
              onChange={(e) => setForm({ ...form, fim: e.target.value })}
            />
          </Campo>
        </div>

        <Campo rotulo="Fornecedor">
          <Entrada
            value={form.fornecedor}
            onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
            placeholder="Opcional"
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

        {regra && (
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={propagar}
              onChange={(e) => setPropagar(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <span>
              Atualizar os lançamentos ainda não pagos deste mês em diante.
              <span className="mt-0.5 block text-xs text-zinc-400">
                Meses já fechados nunca mudam.
              </span>
            </span>
          </label>
        )}

        <Aviso>{erro}</Aviso>

        <div className="flex gap-2 pt-1">
          <Botao type="submit" disabled={salvando} className="flex-1">
            {salvando ? "Salvando..." : regra ? "Salvar" : "Cadastrar"}
          </Botao>
          <Botao type="button" variante="secundario" onClick={onCancelar} className="flex-1">
            Voltar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
