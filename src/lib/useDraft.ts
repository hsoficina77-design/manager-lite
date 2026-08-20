"use client";

import { useEffect, useState } from "react";

const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // rascunhos mais velhos que isso são descartados

type DraftEnvelope<T> = { savedAt: number; data: T };

/**
 * Autosave de formulário no localStorage do navegador — protege contra o app
 * reiniciar (troca de app no celular, aba morta em 2º plano) e perder o que
 * estava sendo digitado. Não depende de servidor: leitura/escrita são só locais.
 */
export function useDraft<T>(key: string, data: T, isEmpty: (data: T) => boolean) {
  const [pending, setPending] = useState<DraftEnvelope<T> | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: DraftEnvelope<T> = JSON.parse(raw);
        if (Date.now() - parsed.savedAt < DRAFT_MAX_AGE_MS && !isEmpty(parsed.data)) {
          setPending(parsed);
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // localStorage indisponível (modo privado etc.) — segue sem rascunho
    }
    setResolved(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!resolved || pending) return; // espera o usuário decidir sobre o rascunho pendente antes de sobrescrever
    if (isEmpty(data)) {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data } satisfies DraftEnvelope<T>));
      } catch {}
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, resolved, pending, JSON.stringify(data)]);

  function discardPending() {
    try { localStorage.removeItem(key); } catch {}
    setPending(null);
  }

  function clear() {
    try { localStorage.removeItem(key); } catch {}
  }

  return {
    pendingDraft: pending?.data ?? null,
    pendingSavedAt: pending?.savedAt ?? null,
    discardPending,
    clear,
  };
}

export function formatDraftAge(savedAt: number): string {
  const diffMin = Math.round((Date.now() - savedAt) / 60000);
  if (diffMin < 1) return "agora há pouco";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d atrás`;
}
