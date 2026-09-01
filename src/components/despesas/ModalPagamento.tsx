"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { chaveDia, diaDaChave } from "@/lib/periodo";
import { FORMAS_PAGAMENTO_DESPESA } from "@/lib/despesas-comum";
import { Aviso, Botao, Campo, Entrada, EntradaValor, Modal, Selecao } from "./campos";
import { enviar, mensagemDoErro } from "./api";
import type { Lancamento } from "./tipos";

/**
 * Baixa do pagamento.
 *
 * Já abre preenchido com o previsto e a data de hoje: no caso comum é só confirmar. O
 * campo de valor existe porque conta de luz e água quase nunca vêm pelo previsto — e
 * era exatamente isso que a tela antiga não deixava registrar, marcando tudo como
 * pago pelo valor estimado e desalinhando o DRE do extrato.
 */
export function ModalPagamento({
  gasto,
  onFechar,
  onSalvo,
}: {
  gasto: Lancamento;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [valor, setValor] = useState(String(gasto.valorPago ?? gasto.valor));
  const [data, setData] = useState(chaveDia(gasto.pagoEm ?? new Date()));
  const [forma, setForma] = useState(gasto.formaPagamento ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const diferenca = Number(valor) - gasto.valor;

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await enviar(`/api/despesas/${gasto.id}/pagamento`, "PUT", {
        pago: true,
        valorPago: valor,
        pagoEm: diaDaChave(data).toISOString(),
        formaPagamento: forma,
      });
      onSalvo();
    } catch (err) {
      setErro(mensagemDoErro(err));
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Registrar pagamento"
      descricao={gasto.descricao}
      largura="max-w-sm"
      onFechar={onFechar}
    >
      <form onSubmit={confirmar} className="space-y-3">
        <Campo rotulo="Valor pago *" ajuda={`Previsto: ${formatCurrency(gasto.valor)}`}>
          <EntradaValor value={valor} onChange={(e) => setValor(e.target.value)} required />
        </Campo>

        {Number.isFinite(diferenca) && Math.abs(diferenca) >= 0.01 && (
          <p className={`text-xs ${diferenca > 0 ? "text-red-600" : "text-green-600"}`}>
            Veio <strong>{formatCurrency(Math.abs(diferenca))}</strong>
            {diferenca > 0 ? " acima do previsto." : " abaixo do previsto."}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data do pagamento">
            <Entrada type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </Campo>
          <Campo rotulo="Forma">
            <Selecao value={forma} onChange={(e) => setForma(e.target.value)}>
              <option value="">Não informar</option>
              {FORMAS_PAGAMENTO_DESPESA.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>

        <Aviso>{erro}</Aviso>

        <div className="flex gap-2 pt-1">
          <Botao type="submit" variante="sucesso" disabled={salvando} className="flex-1" autoFocus>
            {salvando ? "Registrando..." : "Confirmar pagamento"}
          </Botao>
          <Botao type="button" variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
