"use client";

import { useEffect, useState } from "react";
import { MOVIMENTO_TIPOS, formatQuantidade, labelMovimento } from "@/lib/constants";
import { cn, formatDatetime } from "@/lib/utils";
import { usePodeFinanceiro } from "@/components/UsuarioProvider";
import { Botao } from "@/components/ui/Botao";
import { Aviso, Campo, CampoDinheiro, CampoQuantidade, Entrada } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";

type Movimento = {
  id: string;
  tipo: string;
  quantidade: number;
  saldoDepois: number;
  motivo: string | null;
  ordemNumero: number | null;
  usuarioNome: string | null;
  createdAt: string;
};

/**
 * Movimento de prateleira feito à mão: a compra que chegou, a perda, o acerto de
 * contagem. A baixa da OS não passa por aqui — ela acontece sozinha na entrega.
 *
 * O histórico fica na mesma tela de propósito: o valor de guardar cada movimento é
 * poder conferir o saldo, e conferir exige ver a lista ao lado do número.
 */
export function MovimentoModal({
  produto,
  onFechar,
  onSalvo,
}: {
  produto: { id: string; nome: string; unidade: string; quantidade: number };
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const podeFinanceiro = usePodeFinanceiro();

  const [tipo, setTipo] = useState<string>("ENTRADA");
  const [quantidade, setQuantidade] = useState("");
  const [custoUnit, setCustoUnit] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [historico, setHistorico] = useState<Movimento[]>([]);

  useEffect(() => {
    fetch(`/api/produtos/${produto.id}/movimentos`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setHistorico)
      .catch(() => setHistorico([]));
  }, [produto.id]);

  // O saldo que a peça vai ficar, mostrado antes de confirmar: no ajuste o número
  // digitado É o saldo final, e sem esta linha a diferença entre "tirar 3" e "ficar
  // com 3" só apareceria depois de gravado.
  const n = Number(quantidade || 0);
  const saldoPrevisto =
    tipo === "AJUSTE"
      ? n
      : tipo === "ENTRADA"
        ? produto.quantidade + n
        : produto.quantidade - n;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (tipo !== "AJUSTE" && n <= 0) {
      setErro("Informe uma quantidade maior que zero.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch(`/api/produtos/${produto.id}/movimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, quantidade: quantidade || 0, custoUnit, motivo }),
      });
      const dados = await res.json();
      if (!res.ok) {
        setErro(dados.error || "Erro ao movimentar o estoque");
        return;
      }
      onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  const ajuda = MOVIMENTO_TIPOS.find((t) => t.value === tipo)?.ajuda;

  return (
    <Modal
      titulo={produto.nome}
      descricao={`Saldo atual: ${formatQuantidade(produto.quantidade, produto.unidade)}`}
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <Botao form="form-movimento" type="submit" disabled={salvando} className="w-full">
          {salvando ? "Registrando..." : "Registrar movimento"}
        </Botao>
      }
    >
      <form id="form-movimento" onSubmit={salvar} className="space-y-3">
        <div>
          <span className="mb-1 block text-xs font-medium text-tinta-2">Movimento</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-superficie-3 p-1">
            {MOVIMENTO_TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={cn(
                  "min-h-11 rounded-md px-2 text-sm font-medium transition-colors sm:min-h-9",
                  tipo === t.value
                    ? "bg-superficie text-tinta shadow-sm"
                    : "text-tinta-3 hover:text-tinta-2"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {ajuda && <p className="mt-1 text-xs text-tinta-3">{ajuda}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo
            rotulo={tipo === "AJUSTE" ? "Quantidade contada" : "Quantidade"}
            obrigatorio
            ajuda={`Fica com ${formatQuantidade(saldoPrevisto, produto.unidade)}`}
          >
            <CampoQuantidade valor={quantidade} onChange={setQuantidade} data-foco-inicial />
          </Campo>

          {podeFinanceiro && tipo === "ENTRADA" && (
            <Campo rotulo="Custo desta compra (R$)" ajuda="Em branco mantém o custo atual">
              <CampoDinheiro valor={custoUnit} onChange={setCustoUnit} placeholder="0,00" />
            </Campo>
          )}
        </div>

        <Campo rotulo="Motivo">
          <Entrada
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={
              tipo === "ENTRADA"
                ? "Ex: compra NF 1234"
                : tipo === "SAIDA"
                  ? "Ex: usada na manutenção da elevador"
                  : "Ex: contagem de fim de mês"
            }
          />
        </Campo>

        {saldoPrevisto < 0 && (
          <Aviso tipo="atencao">
            O saldo vai ficar negativo. Dá para registrar assim mesmo — mas é sinal de peça
            que saiu sem ter entrado.
          </Aviso>
        )}

        <Aviso>{erro}</Aviso>
      </form>

      <div className="mt-5 border-t border-linha pt-4">
        <h3 className="mb-2 text-xs font-semibold text-tinta-2">Histórico</h3>
        {historico.length === 0 ? (
          <p className="text-xs text-tinta-3">Nenhum movimento ainda.</p>
        ) : (
          <ul className="divide-y divide-linha text-xs">
            {historico.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-tinta-2">
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        m.quantidade >= 0 ? "text-ok" : "text-perigo"
                      )}
                    >
                      {m.quantidade >= 0 ? "+" : ""}
                      {formatQuantidade(m.quantidade, produto.unidade)}
                    </span>{" "}
                    · {labelMovimento(m.tipo)}
                    {m.ordemNumero != null && ` · OS #${m.ordemNumero}`}
                  </p>
                  {m.motivo && <p className="truncate text-tinta-3">{m.motivo}</p>}
                  <p className="text-tinta-3">
                    {formatDatetime(m.createdAt)}
                    {m.usuarioNome ? ` · ${m.usuarioNome}` : ""}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-tinta-3">
                  saldo {formatQuantidade(m.saldoDepois, produto.unidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
