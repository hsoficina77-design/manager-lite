"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Botao, BotaoLink } from "./Botao";
import { Interrogacao, SetaDireita } from "./Icones";
import { Modal } from "./Modal";

/**
 * O "?" que explica uma parte do sistema em poucas linhas.
 *
 * Existe para quem não lida bem com tecnologia: em vez de adivinhar o que é "Caixa" ou
 * "Contas a receber" entrando em cada tela, a pessoa toca no "?" e lê para que serve,
 * quando usar e — se fizer sentido — já sai dali para o lugar certo.
 *
 * Abre no `Modal` do sistema, e não num balão preso ao botão: no celular o balão
 * ficaria pequeno demais para ler e fácil de fechar sem querer, e o modal já resolve
 * foco, Escape e rolagem. Pode ser usado em qualquer tela, não só na inicial.
 */

export type TextoDeAjuda = {
  titulo: string;
  /** Para que serve, em uma ou duas frases. */
  texto: string;
  /** Passo a passo curto, quando ajuda. Quatro itens no máximo — mais que isso ninguém lê. */
  passos?: string[];
  /** Observação no fim: pré-requisito, atalho, cuidado. */
  dica?: string;
};

export function BotaoAjuda({
  ajuda,
  acao,
  sobreMarca = false,
  className,
}: {
  ajuda: TextoDeAjuda;
  /** Botão no pé da explicação que leva direto ao lugar explicado. */
  acao?: { href: string; rotulo: string };
  /** O botão está sobre o fundo laranja (o cartão de Nova OS). */
  sobreMarca?: boolean;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`O que é ${ajuda.titulo}?`}
        title="O que é isto?"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
          sobreMarca
            ? "text-brand-fg/70 hover:bg-black/10 hover:text-brand-fg"
            : "text-tinta-3 hover:bg-superficie-3 hover:text-tinta",
          className
        )}
      >
        <Interrogacao tamanho={20} />
      </button>

      {aberto && <ModalDeAjuda ajuda={ajuda} acao={acao} onFechar={() => setAberto(false)} />}
    </>
  );
}

export function ModalDeAjuda({
  ajuda,
  acao,
  onFechar,
}: {
  ajuda: TextoDeAjuda;
  acao?: { href: string; rotulo: string };
  onFechar: () => void;
}) {
  return (
    <Modal
      titulo={ajuda.titulo}
      largura="max-w-sm"
      onFechar={onFechar}
      rodape={
        // Mesma regra dos outros modais: no celular empilha e a ação mais provável
        // fica em cima; no computador vira linha, com a principal à direita.
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao variante="secundario" onClick={onFechar} data-foco-inicial>
            Entendi
          </Botao>
          {acao && (
            <BotaoLink href={acao.href} onClick={onFechar}>
              {acao.rotulo} <SetaDireita tamanho={15} />
            </BotaoLink>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-sm leading-relaxed text-tinta-2">
        <p>{ajuda.texto}</p>

        {ajuda.passos && ajuda.passos.length > 0 && (
          <ol className="space-y-2.5">
            {ajuda.passos.map((passo, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-brand-fg"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{passo}</span>
              </li>
            ))}
          </ol>
        )}

        {ajuda.dica && (
          <p className="rounded-lg border border-linha bg-superficie-2 px-3 py-2.5 text-tinta-2">
            {ajuda.dica}
          </p>
        )}
      </div>
    </Modal>
  );
}
