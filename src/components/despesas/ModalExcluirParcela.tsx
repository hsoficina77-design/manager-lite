"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { valorEfetivo } from "@/lib/despesas-comum";
import { Aviso, Botao, Modal } from "./campos";
import { enviar, mensagemDoErro } from "./api";
import type { Lancamento } from "./tipos";

/**
 * Excluir uma parcela que ainda tem outras depois dela.
 *
 * São duas intenções diferentes e a confirmação de sempre só tem um botão: "esta"
 * (paguei esta de outro jeito, lancei só ela errado) e "esta e as próximas" (a compra
 * inteira estava errada, ou o resto foi quitado). Sem a segunda, desfazer um 12×
 * lançado errado era excluir doze linhas, mês a mês.
 */
export function ModalExcluirParcela({
  gasto,
  onFechar,
  onExcluido,
}: {
  gasto: Lancamento;
  onFechar: () => void;
  onExcluido: () => void;
}) {
  const [excluindo, setExcluindo] = useState<"esta" | "seguintes" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const parcela = gasto.parcela ?? 1;
  const parcelas = gasto.parcelas ?? 1;
  const restantes = parcelas - parcela + 1;

  async function excluir(escopo: "esta" | "seguintes") {
    setErro(null);
    setExcluindo(escopo);
    try {
      const sufixo = escopo === "seguintes" ? "?escopo=seguintes" : "";
      await enviar(`/api/despesas/${gasto.id}${sufixo}`, "DELETE");
      onExcluido();
    } catch (err) {
      setErro(mensagemDoErro(err));
      setExcluindo(null);
    }
  }

  return (
    <Modal
      titulo={`Excluir “${gasto.descricao}” (${parcela}/${parcelas})?`}
      largura="max-w-sm"
      onFechar={onFechar}
    >
      <div className="space-y-3">
        <p className="text-sm text-tinta-2">
          Esta parcela é de {formatCurrency(valorEfetivo(gasto))}. Não há como desfazer.
        </p>

        <div className="space-y-2">
          <Botao
            variante="perigo"
            className="w-full"
            disabled={excluindo !== null}
            onClick={() => excluir("seguintes")}
          >
            {excluindo === "seguintes"
              ? "Excluindo..."
              : `Esta e as próximas (${restantes} parcelas)`}
          </Botao>
          <Botao
            variante="secundario"
            className="w-full"
            disabled={excluindo !== null}
            onClick={() => excluir("esta")}
          >
            {excluindo === "esta" ? "Excluindo..." : "Só esta parcela"}
          </Botao>
          <Botao
            variante="secundario"
            className="w-full"
            disabled={excluindo !== null}
            onClick={onFechar}
          >
            Cancelar
          </Botao>
        </div>

        <Aviso>{erro}</Aviso>
      </div>
    </Modal>
  );
}
