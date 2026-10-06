"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { chaveDia, diaDaChave } from "@/lib/periodo";
import {
  INTERVALOS_PARCELA,
  dividirEmParcelas,
  type IntervaloParcela,
} from "@/lib/despesas-comum";
import { Area, Aviso, Botao, Campo, Entrada, EntradaValor, Modal, Selecao } from "./campos";
import { SeletorCategoria } from "./SeletorCategoria";
import { enviar, mensagemDoErro } from "./api";
import { SetaDireita } from "@/components/ui/Icones";
import type { Categoria, Lancamento } from "./tipos";

const OPCOES_PARCELAS = Array.from({ length: 23 }, (_, i) => i + 2); // 2× a 24×

/** "sex 09/10" — o dia da semana é o que confirma o "pago toda sexta". */
const DIA_DA_PARCELA = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function rotuloDia(data: Date): string {
  return DIA_DA_PARCELA.format(data).replace(".,", "").replace(",", "");
}

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
  onFixar,
}: {
  gasto: Lancamento | null;
  categorias: Categoria[];
  /** Vencimento sugerido ao lançar: o dia de hoje, ou o dia 1 se o mês em tela é outro. */
  mesPadrao: Date;
  onFechar: () => void;
  onSalvo: () => void;
  /** Abre a transformação em despesa fixa. Só chega aqui para gasto avulso. */
  onFixar: (gasto: Lancamento) => void;
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
  // Parcelar só existe ao lançar: editar uma parcela mexe naquela parcela, como
  // editar o lançamento de uma despesa fixa mexe só naquele mês.
  const [parcelar, setParcelar] = useState(false);
  const [parcelas, setParcelas] = useState("3");
  const [intervalo, setIntervalo] = useState<IntervaloParcela>("SEMANAL");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const editando = gasto !== null;
  const deRegra = Boolean(gasto?.recorrenteId);
  const parcelado = Boolean(gasto?.parcelamentoId);

  const total = Number(form.valor);
  const previa =
    parcelar && total > 0 && form.vencimento
      ? dividirEmParcelas(total, Number(parcelas), diaDaChave(form.vencimento), intervalo)
      : null;

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
        ...(parcelar && !editando ? { parcelas: Number(parcelas), intervalo } : {}),
      };
      if (editando) await enviar(`/api/despesas/${gasto.id}`, "PUT", corpo);
      else await enviar("/api/despesas", "POST", corpo);
      onSalvo();
    } catch (err) {
      setErro(mensagemDoErro(err));
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? "Editar gasto" : "Lançar gasto"}
      descricao={
        editando
          ? undefined
          : "Um gasto que não se repete — ou uma compra parcelada. Contas que voltam todo mês ficam em Despesas fixas."
      }
      onFechar={onFechar}
    >
      <form onSubmit={salvar} className="space-y-3">
        {deRegra && (
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-texto">
            Este lançamento vem de uma despesa fixa. A alteração vale só para este mês — para
            mudar de vez, edite a despesa fixa.
          </p>
        )}
        {parcelado && (
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-texto">
            Esta é a parcela {gasto?.parcela} de {gasto?.parcelas}. A alteração vale só para
            ela — as outras parcelas continuam como estão.
          </p>
        )}

        <SeletorCategoria
          categorias={categorias}
          valor={form.categoriaId}
          onMudar={(categoriaId) => setForm({ ...form, categoriaId })}
        />

        <Campo rotulo="Descrição *">
          <Entrada
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Ex.: troca do compressor"
            required
            autoFocus
          />
        </Campo>

        {!editando && (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-linha bg-superficie-2 px-3 py-2">
            <input
              type="checkbox"
              checked={parcelar}
              onChange={(e) => setParcelar(e.target.checked)}
              className="h-5 w-5 shrink-0 rounded border-linha-forte accent-brand-600"
            />
            <span className="text-sm text-tinta">
              Dividir em parcelas
              <span className="block text-xs text-tinta-3">
                Compra parcelada — por semana ou por mês
              </span>
            </span>
          </label>
        )}

        {parcelar && (
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Parcelas">
              <Selecao value={parcelas} onChange={(e) => setParcelas(e.target.value)}>
                {OPCOES_PARCELAS.map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo rotulo="Repetir">
              <Selecao
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value as IntervaloParcela)}
              >
                {INTERVALOS_PARCELA.map((i) => (
                  <option key={i.value} value={i.value}>
                    {i.label}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo={parcelar ? "Valor total *" : "Valor *"}>
            <EntradaValor
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
              required
            />
          </Campo>
          <Campo rotulo={parcelar ? "1ª parcela vence *" : "Vencimento *"}>
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

        {previa ? (
          <PreviaParcelas partes={previa} />
        ) : (
          total > 0 && (
            <p className="text-xs text-tinta-3">
              Total do lançamento: <strong>{formatCurrency(total)}</strong>
            </p>
          )
        )}

        <Aviso>{erro}</Aviso>

        <div className="flex gap-2 pt-1">
          <Botao type="submit" disabled={salvando} className="flex-1">
            {salvando
              ? "Salvando..."
              : editando
                ? "Salvar"
                : parcelar
                  ? `Lançar ${parcelas} parcelas`
                  : "Lançar gasto"}
          </Botao>
          <Botao type="button" variante="secundario" onClick={onFechar} className="flex-1">
            Cancelar
          </Botao>
        </div>

        {/* "Isto na verdade é uma conta fixa" — a correção que antes exigia cadastrar a
            regra e apagar os lançamentos avulsos na mão, mês a mês. */}
        {editando && !deRegra && !parcelado && (
          <div className="border-t border-linha pt-3">
            <button
              type="button"
              onClick={() => onFixar(gasto)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-brand-texto hover:bg-brand-50"
            >
              <span>
                Esta conta se repete todo mês?
                <span className="mt-0.5 block text-xs text-tinta-3">
                  Transformar em despesa fixa — ela passa a se lançar sozinha.
                </span>
              </span>
              <SetaDireita tamanho={16} className="shrink-0 text-tinta-3" />
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}

/**
 * O que vai ser lançado, antes de lançar.
 *
 * Mostrar as datas é o que evita o erro mais provável: escolher a 1ª parcela numa
 * quinta quando o combinado era sexta. Com muitas parcelas, as do meio se resumem.
 */
function PreviaParcelas({
  partes,
}: {
  partes: { parcela: number; valor: number; vencimento: Date }[];
}) {
  const primeira = partes[0];
  const ultima = partes[partes.length - 1];
  const sobra = Math.abs(ultima.valor - primeira.valor) >= 0.005;
  const visiveis =
    partes.length <= 6 ? partes : [...partes.slice(0, 4), null, ultima];

  return (
    <div className="rounded-lg border border-linha bg-superficie-2 px-3 py-2 text-xs text-tinta-3">
      <p className="text-tinta-2">
        <strong className="text-tinta">
          {partes.length}× de {formatCurrency(primeira.valor)}
        </strong>
        {sobra && ` (a última ${formatCurrency(ultima.valor)})`}
      </p>
      <p className="mt-1 leading-relaxed">
        {visiveis.map((p, i) => (
          <span key={p ? p.parcela : "meio"}>
            {i > 0 && " · "}
            {p ? rotuloDia(p.vencimento) : "…"}
          </span>
        ))}
      </p>
    </div>
  );
}
