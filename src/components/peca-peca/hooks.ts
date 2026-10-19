"use client";

import { useSyncExternalStore } from "react";
import { SEM_COTACOES, assinarCotacoes, lerCotacoes, type Cotacao } from "./dados";

export function useCotacoes(): Cotacao[] {
  return useSyncExternalStore(assinarCotacoes, lerCotacoes, () => SEM_COTACOES);
}

/** `false` no servidor e no primeiro render: o localStorage ainda não foi lido. */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
