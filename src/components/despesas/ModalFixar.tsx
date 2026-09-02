"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { chaveDia, janelaDaChave, rotuloMes } from "@/lib/periodo";
import { PERIODICIDADES, mesNoPasso } from "@/lib/despesas-comum";
import { Aviso, Botao, Campo, Entrada, EntradaValor, Modal, Selecao } from "./campos";
import { enviar, mensagemDoErro } from "./api";
import type { Lancamento } from "./tipos";

/** Como a rota devolve os avulsos iguais dos meses seguintes (datas viram texto no JSON). */
type Semelhante = { id: string; competencia: string; valor: number };

/**
 * Transforma um gasto avulso em despesa fixa.
 *
 * O que a regra precisa e o lançamento não tem: de quanto em quanto tempo a conta volta,
 * em que dia vence e até quando. Categoria, descrição e fornecedor vêm do próprio gasto.
 *
 * O mês de início não é escolha — é o mês do gasto. Deixar escolher um mês anterior faria
 * meses já fechados ganharem a conta na próxima vez que fossem abertos, e o resultado de
 * um mês passado mudaria sozinho.
 */
export function ModalFixar({
  gasto,
  onFechar,
  onSalvo,
}: {
  gasto: Lancamento;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [form, setForm] = useState({
    valor: String(gasto.valor),
    // O dia em que esta conta venceu é o melhor palpite para os próximos meses.
    diaVencimento: chaveDia(gasto.vencimento).slice(-2).replace(/^0/, ""),
    periodicidade: "MENSAL",
    fim: "",
  });
  const [semelhantes, setSemelhantes] = useState<Semelhante[]>([]);
  const [adotar, setAdotar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Os avulsos iguais dos meses seguintes. Sem adotá-los, cada um deles ganharia ao lado
  // o lançamento novo da regra — o mesmo aluguel duas vezes no mês.
  useEffect(() => {
    let vivo = true;
    fetch(`/api/despesas/${gasto.id}/fixar`)
      .then((r) => (r.ok ? r.json() : { semelhantes: [] }))
      .then((d: { semelhantes?: Semelhante[] }) => {
        if (vivo) setSemelhantes(d.semelhantes ?? []);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [gasto.id]);

  // Quais deles a regra realmente cobre depende da periodicidade e do fim que a pessoa
  // está escolhendo agora — por isso a conta é refeita a cada mudança, e não no servidor.
  const cobertos = useMemo(() => {
    const fim = form.fim ? janelaDaChave(form.fim).inicio : null;
    const meses = new Set<number>();
    return semelhantes.filter((s) => {
      const competencia = new Date(s.competencia);
      if (!mesNoPasso(gasto.competencia, form.periodicidade, competencia)) return false;
      if (fim && competencia > fim) return false;
      // Dois avulsos iguais no mesmo mês: a regra só absorve um deles.
      const mes = competencia.getTime();
      if (meses.has(mes)) return false;
      meses.add(mes);
      return true;
    });
  }, [semelhantes, form.periodicidade, form.fim, gasto.competencia]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await enviar(`/api/despesas/${gasto.id}/fixar`, "POST", {
        valor: form.valor,
        diaVencimento: form.diaVencimento,
        periodicidade: form.periodicidade,
        fim: form.fim || null,
        adotarSemelhantes: adotar,
      });
      onSalvo();
    } catch (err) {
      setErro(mensagemDoErro(err));
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Transformar em despesa fixa"
      descricao={gasto.descricao}
      onFechar={onFechar}
    >
      <form onSubmit={salvar} className="space-y-3">
        <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-800">
          A partir de <strong>{rotuloMes(gasto.competencia)}</strong> esta conta passa a se
          lançar sozinha todo mês. O lançamento que já existe continua sendo o deste mês —
          não vira uma cobrança a mais.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Valor previsto *" ajuda="O que se espera pagar nos próximos meses.">
            <EntradaValor
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
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

        <Campo rotulo="Até" ajuda="Em branco = sem fim previsto.">
          <Entrada
            type="month"
            value={form.fim}
            onChange={(e) => setForm({ ...form, fim: e.target.value })}
          />
        </Campo>

        {cobertos.length > 0 && (
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={adotar}
              onChange={(e) => setAdotar(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded"
            />
            <span>
              Aproveitar {cobertos.length === 1 ? "o lançamento igual" : "os lançamentos iguais"}{" "}
              de {listarMeses(cobertos)}.
              <span className="mt-0.5 block text-xs text-amber-700">
                {adotar
                  ? "Eles passam a ser desta despesa fixa, em vez de virar cobrança repetida."
                  : `Sem isso, ${cobertos.length === 1 ? "esse mês vai ficar" : "esses meses vão ficar"} com a conta lançada duas vezes.`}
              </span>
            </span>
          </label>
        )}

        <Aviso>{erro}</Aviso>

        <div className="flex gap-2 pt-1">
          <Botao type="submit" disabled={salvando} className="flex-1">
            {salvando ? "Transformando..." : "Transformar em fixa"}
          </Botao>
          <Botao type="button" variante="secundario" onClick={onFechar} className="flex-1">
            Cancelar
          </Botao>
        </div>

        <p className="text-xs text-zinc-400">
          Depois dá para ajustar tudo em <strong>Despesas fixas</strong> — inclusive o valor,
          o dia e até quando ela vale.
        </p>
      </form>
    </Modal>
  );
}

/** "Setembro/2026 e Outubro/2026" — lista curta, com "e" antes do último. */
function listarMeses(lista: { competencia: string }[]): string {
  const meses = lista.map((s) => rotuloMes(new Date(s.competencia)));
  if (meses.length <= 2) return meses.join(" e ");
  return `${meses.slice(0, -1).join(", ")} e ${meses[meses.length - 1]}`;
}
