"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { Aviso, Campo, CampoDinheiro, Entrada } from "@/components/ui/Campos";
import { Painel } from "@/components/ui/Dados";
import { cn, formatCurrency, paraNumero } from "@/lib/utils";
import {
  TIPOS_DE_FRETE,
  precoNoCredito,
  type EntregaEPagamento as Regra,
  type TipoDeFrete,
} from "./regras";

// O quadro da tela "Loja" em que o dono diz como cobra a entrega e quanto o crédito
// custa a mais. Nada disso é cobrado pelo app: é o que vem preenchido no balcão — o
// vendedor muda em cada resposta — e o que a oficina vê para comparar as lojas.

const valorDoCampo = (n: number | null | undefined) => (n ? String(n) : "");

export function EntregaEPagamento({
  regra,
  atende,
  salvando,
  erro,
  onSalvar,
}: {
  regra: Regra;
  /** As cidades da região da loja como estão salvas — a primeira é a da loja. */
  atende: string[];
  salvando: boolean;
  erro: string | null;
  onSalvar: (regra: Regra) => void;
}) {
  const [tipo, setTipo] = useState<TipoDeFrete>(regra.freteTipo);
  const [fixo, setFixo] = useState(regra.freteTipo === "FIXO" ? valorDoCampo(regra.freteValor) : "");
  const [porCidade, setPorCidade] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      atende.map((c) => [c, valorDoCampo(regra.fretePorCidade[c] ?? (regra.freteTipo === "POR_CIDADE" ? regra.freteValor : 0))])
    )
  );
  const [gratisAcima, setGratisAcima] = useState(valorDoCampo(regra.freteGratisAcima));
  const [acrescimo, setAcrescimo] = useState(regra.acrescimoCredito ? String(regra.acrescimoCredito).replace(".", ",") : "");
  const [debitoAVista, setDebitoAVista] = useState(regra.debitoAVista);
  const [faltaFixo, setFaltaFixo] = useState(false);

  const acrescimoNum = Math.min(100, Math.max(0, paraNumero(acrescimo) || 0));

  function salvar() {
    const valorFixo = paraNumero(fixo) || 0;
    if (tipo === "FIXO" && valorFixo <= 0) return setFaltaFixo(true);
    setFaltaFixo(false);
    const taxas = Object.fromEntries(atende.map((c) => [c, paraNumero(porCidade[c] ?? "") || 0]));
    onSalvar({
      freteTipo: tipo,
      // Pela distância, o valor de reserva é o da cidade da loja: só vale para a oficina
      // sem cidade, que vê todas as lojas.
      freteValor: tipo === "FIXO" ? valorFixo : tipo === "POR_CIDADE" ? (taxas[atende[0]] ?? 0) : 0,
      fretePorCidade: tipo === "POR_CIDADE" ? taxas : {},
      freteGratisAcima: tipo === "GRATIS" ? null : paraNumero(gratisAcima) || null,
      acrescimoCredito: acrescimoNum,
      debitoAVista,
    });
  }

  return (
    <Painel
      titulo="Entrega e pagamento"
      ajuda="O que você configurar aqui vem preenchido no balcão. Em cada cotação o vendedor pode mudar."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
        className="space-y-5"
      >
        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-tinta-2">Como a loja cobra a entrega</legend>
          {(Object.keys(TIPOS_DE_FRETE) as TipoDeFrete[]).map((chave) => (
            <label
              key={chave}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5",
                tipo === chave ? "border-brand-500 bg-brand-50" : "border-linha"
              )}
            >
              <input
                type="radio"
                name="freteTipo"
                checked={tipo === chave}
                onChange={() => setTipo(chave)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
              />
              <span>
                <span className="block text-sm font-semibold text-tinta">{TIPOS_DE_FRETE[chave].rotulo}</span>
                <span className="block text-xs text-tinta-3">{TIPOS_DE_FRETE[chave].explicacao}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {tipo === "FIXO" && (
          <Campo rotulo="Taxa de entrega" erro={faltaFixo ? "Informe o valor da taxa" : undefined} obrigatorio>
            <CampoDinheiro valor={fixo} onChange={setFixo} className="max-w-[10rem]" />
          </Campo>
        )}

        {tipo === "POR_CIDADE" && (
          <div>
            <p className="mb-2 text-xs font-medium text-tinta-2">Taxa para cada cidade</p>
            <ul className="space-y-2">
              {atende.map((c) => (
                <li key={c} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm text-tinta">{c}</span>
                  <div className="w-36 shrink-0">
                    <CampoDinheiro
                      valor={porCidade[c] ?? ""}
                      onChange={(v) => setPorCidade((atual) => ({ ...atual, [c]: v }))}
                      placeholder="0,00"
                      aria-label={`Taxa para ${c}`}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-tinta-3">
              Em branco: entrega grátis nessa cidade. Para pôr ou tirar cidade, use &quot;Cidades atendidas&quot;.
            </p>
          </div>
        )}

        {tipo !== "GRATIS" && (
          <Campo rotulo="Entrega grátis acima de" ajuda="Opcional. Em branco: a entrega é cobrada em todo pedido.">
            <CampoDinheiro valor={gratisAcima} onChange={setGratisAcima} className="max-w-[10rem]" />
          </Campo>
        )}

        <div className="space-y-4 border-t border-linha pt-4">
          <Campo
            rotulo="No crédito, quanto a mais que à vista (%)"
            ajuda={
              acrescimoNum > 0
                ? `Peça de ${formatCurrency(100)} à vista sai ${formatCurrency(precoNoCredito(100, acrescimoNum))} no crédito.`
                : "Zero: o crédito tem o mesmo preço do à vista."
            }
          >
            <Entrada
              value={acrescimo}
              onChange={(e) => setAcrescimo(e.target.value.replace(/[^\d,]/g, ""))}
              inputMode="decimal"
              maxLength={5}
              placeholder="0"
              className="max-w-[6rem] tabular-nums"
            />
          </Campo>

          <label className="flex min-h-9 w-fit cursor-pointer items-start gap-2.5 text-sm text-tinta">
            <input
              type="checkbox"
              checked={debitoAVista}
              onChange={(e) => setDebitoAVista(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
            />
            <span>
              <span className="block font-medium">Débito paga o preço à vista</span>
              <span className="block text-xs text-tinta-3">Desmarque se na sua loja o débito paga o preço do crédito.</span>
            </span>
          </label>
        </div>

        {erro && <Aviso>{erro}</Aviso>}
        <Botao type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar entrega e pagamento"}
        </Botao>
      </form>
    </Painel>
  );
}
