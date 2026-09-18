"use client";

// Sino de notificações — a central persistente, ao lado do toast efêmero de
// Avisos.tsx. Não há websocket/SSE no projeto, então a atualização é por polling:
// generoso o bastante (60s) para o tráfego de uma oficina só.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Papel } from "@/lib/permissoes";
import { Sino } from "./Icones";

type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  createdAt: string;
};

const INTERVALO_MS = 60_000;

function tempoRelativo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}

export function NotificacaoSino({
  papel,
  className,
  painelDesktop = "direita",
}: {
  papel: Papel;
  className?: string;
  /** De que lado do sino a borda do painel (320px) fica presa, a partir de `sm:`.
   * O menu lateral fixa o sino perto da borda esquerda da tela — presa à direita
   * (o padrão, certo para o cabeçalho mobile, que fica perto da borda direita)
   * o painel estoura para fora da viewport pela esquerda. */
  painelDesktop?: "esquerda" | "direita";
}) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/notificacoes");
      if (!res.ok) return;
      const json = await res.json();
      setNotificacoes(json.notificacoes);
      setNaoLidas(json.naoLidas);
    } catch {
      // Falha de rede não deve travar a tela — o sino só fica sem atualizar.
    }
  }, []);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, INTERVALO_MS);
    return () => clearInterval(id);
  }, [carregar]);

  // Fecha o popover do desktop em clique fora / Escape — mesmo padrão da gaveta do menu.
  useEffect(() => {
    if (!aberto) return;
    function aoClicar(e: MouseEvent) {
      if (painelRef.current?.contains(e.target as Node)) return;
      if (botaoRef.current?.contains(e.target as Node)) return;
      setAberto(false);
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  async function marcarLida(id: string) {
    setNotificacoes((atuais) => atuais.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    setNaoLidas((n) => Math.max(0, n - 1));
    try {
      await fetch(`/api/notificacoes/${id}`, { method: "PATCH" });
    } catch {
      // Estado local já mudou; a próxima carga sincroniza de volta se algo falhar.
    }
  }

  async function marcarTodasLidas() {
    setNotificacoes((atuais) => atuais.map((n) => ({ ...n, lida: true })));
    setNaoLidas(0);
    try {
      await fetch("/api/notificacoes/marcar-lidas", { method: "POST" });
    } catch {
      // Idem: reconcilia no próximo polling.
    }
  }

  const lista = (
    <div className="divide-y divide-linha">
      {notificacoes.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-tinta-3">Nenhuma notificação por aqui.</p>
      )}
      {notificacoes.map((n) => {
        const conteudo = (
          <div className="flex items-start gap-2.5 px-4 py-3">
            {!n.lida && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-hidden />
            )}
            <div className={cn("min-w-0 flex-1", n.lida && "pl-[18px]")}>
              <p className="text-sm font-medium text-tinta">{n.titulo}</p>
              <p className="mt-0.5 text-sm text-tinta-2">{n.mensagem}</p>
              <p className="mt-1 text-xs text-tinta-3">{tempoRelativo(n.createdAt)}</p>
            </div>
          </div>
        );
        return n.link ? (
          <Link
            key={n.id}
            href={n.link}
            onClick={() => {
              if (!n.lida) marcarLida(n.id);
              setAberto(false);
            }}
            className="block hover:bg-superficie-2"
          >
            {conteudo}
          </Link>
        ) : (
          <button
            key={n.id}
            type="button"
            onClick={() => !n.lida && marcarLida(n.id)}
            className="block w-full text-left hover:bg-superficie-2"
          >
            {conteudo}
          </button>
        );
      })}
    </div>
  );

  const cabecalho = (
    <div className="flex items-center justify-between gap-2 border-b border-linha px-4 py-3">
      <span className="text-sm font-semibold text-tinta">Notificações</span>
      {naoLidas > 0 && (
        <button
          type="button"
          onClick={marcarTodasLidas}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Marcar todas como lidas
        </button>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label={naoLidas > 0 ? `${naoLidas} notificações não lidas` : "Notificações"}
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-menu-texto hover:bg-menu-hover hover:text-menu-fg",
          className
        )}
      >
        <Sino tamanho={19} />
        {naoLidas > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-perigo px-1 text-[10px] font-bold text-perigo-fg ring-2 ring-menu">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {/* Desktop e cabeçalho mobile: popover simples ancorado ao sino. */}
      {aberto && (
        <div
          ref={painelRef}
          role="menu"
          className={cn(
            "fixed inset-x-4 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-linha bg-superficie shadow-xl sm:absolute sm:inset-x-auto sm:top-auto sm:mt-2 sm:w-80",
            painelDesktop === "esquerda" ? "sm:left-0" : "sm:right-0"
          )}
        >
          {cabecalho}
          {lista}
        </div>
      )}
    </div>
  );
}
