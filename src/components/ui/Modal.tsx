"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { Fechar } from "./Icones";

/**
 * Casca única dos modais.
 *
 * Antes eram treze sobreposições `fixed inset-0` espalhadas, e o comportamento
 * variava: três fechavam no Escape, nenhuma prendia o foco, nenhuma declarava
 * `aria-modal`, e só a gaveta do menu travava a rolagem — então abrir o modal de
 * pagamento e rolar movia a página atrás dele.
 *
 * Aqui isso é resolvido uma vez:
 *
 *   Escape        fecha
 *   Tab           circula dentro do modal, sem escapar para a página
 *   rolagem       travada no corpo enquanto aberto
 *   foco          entra no modal ao abrir e volta para o gatilho ao fechar
 *
 * `items-start` + `overflow-y-auto` no fundo e `my-auto` no cartão são a
 * convenção daqui: no Android o teclado encolhe a viewport, e um modal centrado
 * sem rolagem esconde o botão de salvar sem deixar como chegar nele.
 */
export function Modal({
  titulo,
  descricao,
  largura = "max-w-md",
  onFechar,
  children,
  rodape,
}: {
  titulo: string;
  descricao?: string;
  largura?: string;
  onFechar: () => void;
  children: React.ReactNode;
  /** Ações fixas no pé do modal, fora da área que rola. */
  rodape?: React.ReactNode;
}) {
  const cartaoRef = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const descricaoId = useId();

  // Guarda quem tinha o foco para devolver ao fechar. Sem isso, fechar um modal
  // no teclado joga o foco para o início da página.
  const origemRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    origemRef.current = document.activeElement as HTMLElement | null;
    return () => origemRef.current?.focus?.();
  }, []);

  // Trava a rolagem do fundo, compensando a largura da barra para a página não
  // "pular" ao abrir no desktop.
  useEffect(() => {
    const { body } = document;
    const larguraBarra = window.innerWidth - document.documentElement.clientWidth;
    const overflowAnterior = body.style.overflow;
    const paddingAnterior = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (larguraBarra > 0) body.style.paddingRight = `${larguraBarra}px`;
    return () => {
      body.style.overflow = overflowAnterior;
      body.style.paddingRight = paddingAnterior;
    };
  }, []);

  // Foco inicial: o primeiro campo, ou o próprio cartão quando não há nenhum.
  useEffect(() => {
    const alvo =
      cartaoRef.current?.querySelector<HTMLElement>(
        "[data-foco-inicial], input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])"
      ) ?? cartaoRef.current;
    alvo?.focus?.();
  }, []);

  // Escape fecha, Tab circula.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onFechar();
        return;
      }
      if (e.key !== "Tab") return;
      const focaveis = cartaoRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focaveis || focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      const ativo = document.activeElement;
      if (e.shiftKey && (ativo === primeiro || !cartaoRef.current?.contains(ativo))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && ativo === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar, true);
    return () => document.removeEventListener("keydown", aoTeclar, true);
  }, [onFechar]);

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        ref={cartaoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricao ? descricaoId : undefined}
        tabIndex={-1}
        className={cn(
          "my-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-2xl bg-superficie shadow-xl outline-none",
          largura
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-linha px-5 py-4">
          <div className="min-w-0">
            <h2 id={tituloId} className="font-semibold text-tinta">
              {titulo}
            </h2>
            {descricao && (
              <p id={descricaoId} className="mt-0.5 text-xs text-tinta-3">
                {descricao}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta"
          >
            <Fechar tamanho={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {rodape && (
          <div className="border-t border-linha px-5 py-4 pb-segura">{rodape}</div>
        )}
      </div>
    </div>
  );
}
