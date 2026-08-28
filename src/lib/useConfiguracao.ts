"use client";

import { useEffect, useState } from "react";
import { CONFIG_PADRAO, type Configuracao } from "@/lib/configuracao";

// A configuração é a mesma para o app inteiro e quase nunca muda, então uma
// requisição por carregamento de página basta — o cabeçalho da OS, o do orçamento
// e os dois botões de PDF dividem esta promessa.
let cache: Promise<Configuracao> | null = null;

export function carregarConfiguracao(): Promise<Configuracao> {
  if (!cache) {
    cache = fetch("/api/configuracao")
      .then((res) => (res.ok ? (res.json() as Promise<Configuracao>) : CONFIG_PADRAO))
      .catch(() => CONFIG_PADRAO);
  }
  return cache;
}

/** Descarta o cache — o painel chama isto depois de salvar. */
export function invalidarConfiguracao() {
  cache = null;
}

/**
 * Configuração da oficina, ou `null` enquanto carrega.
 *
 * O `null` é proposital: o cabeçalho impresso prefere um instante de esqueleto a
 * piscar "Minha Oficina" antes de trocar pelo nome real.
 */
export function useConfiguracao(): Configuracao | null {
  const [config, setConfig] = useState<Configuracao | null>(null);

  useEffect(() => {
    let vivo = true;
    carregarConfiguracao().then((c) => {
      if (vivo) setConfig(c);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return config;
}
