"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";
import { Botao } from "./Botao";
import { Alerta, Confere, Fechar } from "./Icones";

/* ==========================================================================
   Confirmação e aviso — no lugar de confirm() e alert() do navegador.

   Eram dezenove chamadas nativas convivendo com modais próprios muito melhores:
   o de estorno explica o que acontece com o saldo e o que não muda no status,
   enquanto excluir uma OS caía numa caixa cinza do sistema, fora do tema e sem
   dizer o valor envolvido.

   Aqui a confirmação é uma promessa, então o local de chamada continua lendo
   quase como antes:

       if (!(await confirmar({ titulo: "Excluir esta OS?", ... }))) return;
   ========================================================================== */

type PedidoConfirmacao = {
  titulo: string;
  /** O que exatamente vai acontecer. Vale citar valores e consequências. */
  texto?: React.ReactNode;
  /** Rótulo do botão que confirma. Diga a ação, não "OK". */
  acao?: string;
  cancelar?: string;
  /** Ação destrutiva: botão contornado em vermelho. */
  perigo?: boolean;
};

type Toast = { id: number; mensagem: string; tipo: "ok" | "erro" };

type Contexto = {
  confirmar: (pedido: PedidoConfirmacao) => Promise<boolean>;
  avisar: (mensagem: string, tipo?: "ok" | "erro") => void;
};

const AvisosContexto = createContext<Contexto | null>(null);

export function useConfirmar() {
  const ctx = useContext(AvisosContexto);
  if (!ctx) throw new Error("useConfirmar precisa do AvisosProvider no layout.");
  return ctx.confirmar;
}

export function useAvisar() {
  const ctx = useContext(AvisosContexto);
  if (!ctx) throw new Error("useAvisar precisa do AvisosProvider no layout.");
  return ctx.avisar;
}

export function AvisosProvider({ children }: { children: React.ReactNode }) {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);
  const proximoId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Sem isso, sair da tela com um toast no ar deixa o timer disparando contra um
  // componente desmontado.
  useEffect(() => {
    const atuais = timers.current;
    return () => atuais.forEach(clearTimeout);
  }, []);

  const confirmar = useCallback((p: PedidoConfirmacao) => {
    setPedido(p);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const responder = useCallback((ok: boolean) => {
    setPedido(null);
    resolverRef.current?.(ok);
    resolverRef.current = null;
  }, []);

  const avisar = useCallback((mensagem: string, tipo: "ok" | "erro" = "ok") => {
    const id = proximoId.current++;
    setToasts((atuais) => [...atuais, { id, mensagem, tipo }]);
    const t = setTimeout(
      () => setToasts((atuais) => atuais.filter((x) => x.id !== id)),
      tipo === "erro" ? 6000 : 3000
    );
    timers.current.push(t);
  }, []);

  const valor = useMemo(() => ({ confirmar, avisar }), [confirmar, avisar]);

  return (
    <AvisosContexto.Provider value={valor}>
      {children}

      {pedido && (
        <Modal
          titulo={pedido.titulo}
          largura="max-w-sm"
          onFechar={() => responder(false)}
          rodape={
            <div className="flex gap-2">
              <Botao
                variante={pedido.perigo ? "perigo" : "primario"}
                className="flex-1"
                onClick={() => responder(true)}
                data-foco-inicial
              >
                {pedido.acao ?? "Confirmar"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => responder(false)}>
                {pedido.cancelar ?? "Cancelar"}
              </Botao>
            </div>
          }
        >
          {typeof pedido.texto === "string" ? (
            <p className="text-sm text-tinta-2">{pedido.texto}</p>
          ) : (
            pedido.texto ?? (
              <p className="text-sm text-tinta-2">Esta ação não pode ser desfeita.</p>
            )
          )}
        </Modal>
      )}

      {/* No celular o toast vem de baixo, acima da barra de navegação: em cima ele
          cobria o botão de menu e o contador de pendências do cabeçalho fixo. */}
      {toasts.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end sm:pb-0"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm shadow-lg sm:w-auto",
                t.tipo === "erro"
                  ? "bg-perigo-fraco text-perigo ring-1 ring-perigo-linha"
                  : "bg-contraste text-contraste-fg"
              )}
            >
              <span className="mt-0.5 shrink-0">
                {t.tipo === "erro" ? <Alerta tamanho={16} /> : <Confere tamanho={16} />}
              </span>
              <span className="min-w-0 flex-1">{t.mensagem}</span>
              <button
                type="button"
                onClick={() => setToasts((a) => a.filter((x) => x.id !== t.id))}
                aria-label="Dispensar"
                className="-my-1 -mr-1 shrink-0 rounded p-1 opacity-70 hover:opacity-100"
              >
                <Fechar tamanho={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </AvisosContexto.Provider>
  );
}
