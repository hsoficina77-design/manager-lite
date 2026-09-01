"use client";

import { useEffect, useState } from "react";
import { CONFIG_PADRAO, type Configuracao } from "@/lib/configuracao";
import { PRAZO, fetchComPrazo } from "@/lib/tempo-limite";

// A configuração é a mesma para o app inteiro e quase nunca muda, então uma
// requisição por carregamento de página basta — o cabeçalho da OS, o do orçamento
// e os dois botões de PDF dividem esta promessa.
let cache: Promise<Configuracao> | null = null;

export function carregarConfiguracao(): Promise<Configuracao> {
  if (!cache) {
    // Com prazo: sem ele, uma requisição travada ficaria pendente para sempre e,
    // por ser compartilhada, travaria junto todo mundo que a esperasse — foi
    // assim que o botão de baixar já ficou girando sem erro nenhum.
    const promessa = fetchComPrazo("/api/configuracao", PRAZO.api)
      .then((res) => (res.ok ? (res.json() as Promise<Configuracao>) : CONFIG_PADRAO))
      .catch((err) => {
        console.error("Configuração indisponível — usando padrão:", err);
        // A falha não fica guardada: a próxima chamada tenta de novo, em vez de
        // servir o padrão pelo resto da visita.
        if (cache === promessa) cache = null;
        return CONFIG_PADRAO;
      });
    cache = promessa;
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
