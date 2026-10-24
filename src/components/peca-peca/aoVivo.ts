"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CABECALHO_CONTA_DA_ABA } from "@/lib/sessao";

/**
 * O `fetch` das telas do Peça Peça.
 *
 * O navegador guarda um login de loja só (o cookie `pp_loja`): entrar noutra conta numa
 * aba troca a conta de todas. Sem cuidado, a aba antiga seguiria com o nome da loja de
 * antes, mas lendo e gravando como a nova — o balcão de uma mostrava as cotações da
 * outra. Por isso a aba do painel da loja manda em cada pedido a conta com que nasceu
 * (o `<html>` a traz); o servidor recusa quando não bate (`guardaLoja`), e a aba
 * recarrega já na conta que o navegador tem agora — ou cai no login, se a pessoa saiu.
 */
export async function buscar(url: string, init: RequestInit = {}) {
  const conta = document.documentElement.dataset.contaLoja;
  if (!conta) return fetch(url, init);
  const cabecalhos = new Headers(init.headers);
  cabecalhos.set(CABECALHO_CONTA_DA_ABA, conta);
  const r = await fetch(url, { ...init, headers: cabecalhos });
  if (r.status === 401) window.location.reload();
  return r;
}

/**
 * Dado do servidor que se atualiza sozinho — é o que faz a oficina ver a resposta da
 * loja chegar sem recarregar, e o balcão ver a cotação nova.
 *
 * Pergunta de novo a cada `intervaloMs` enquanto a aba está visível, e na hora em que
 * ela volta a ficar. Leitura atrasada não sobrescreve a mais nova, e nenhuma leitura é
 * aplicada enquanto uma gravação está em andamento — senão o número que a pessoa acabou
 * de escolher piscaria de volta para o antigo.
 */
export function useAoVivo<T>(url: string, intervaloMs = 4000) {
  const [dados, setDados] = useState<T | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [semConexao, setSemConexao] = useState(false);
  const gravando = useRef(0);
  const ultimaLeitura = useRef(0);

  const carregar = useCallback(async () => {
    const minha = ++ultimaLeitura.current;
    try {
      const r = await buscar(url, { cache: "no-store" });
      if (minha !== ultimaLeitura.current || gravando.current > 0) return;
      if (r.status === 404) {
        setNaoEncontrado(true);
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      const novo = (await r.json()) as T;
      if (minha !== ultimaLeitura.current || gravando.current > 0) return;
      setDados(novo);
      setNaoEncontrado(false);
      setSemConexao(false);
    } catch {
      if (minha === ultimaLeitura.current) setSemConexao(true);
    }
  }, [url]);

  useEffect(() => {
    void carregar();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void carregar();
    }, intervaloMs);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [carregar, intervaloMs]);

  /**
   * Grava no servidor. `otimista` muda a tela na hora; se a rota devolver o dado
   * atualizado (`T`), ele entra no lugar. Erro volta como mensagem, e a tela é relida
   * do servidor de qualquer jeito.
   */
  const gravar = useCallback(
    async (
      requisicao: () => Promise<Response>,
      opcoes: { otimista?: (d: T) => T; devolveDado?: boolean } = {}
    ): Promise<{ ok: true; corpo: unknown } | { ok: false; erro: string }> => {
      gravando.current += 1;
      if (opcoes.otimista) setDados((d) => (d ? opcoes.otimista!(d) : d));
      try {
        const r = await requisicao();
        const corpo = await r.json().catch(() => ({}));
        if (!r.ok) return { ok: false, erro: (corpo as { error?: string }).error ?? "Não deu certo. Tente de novo." };
        if (opcoes.devolveDado) {
          ultimaLeitura.current += 1;
          setDados(corpo as T);
        }
        return { ok: true, corpo };
      } catch {
        return { ok: false, erro: "Sem conexão. Tente de novo." };
      } finally {
        gravando.current -= 1;
        if (gravando.current === 0 && !opcoes.devolveDado) void carregar();
      }
    },
    [carregar]
  );

  return { dados, naoEncontrado, semConexao, carregar, gravar };
}

/** JSON para as rotas do Peça Peça. */
export function enviarJson(url: string, metodo: "POST" | "PATCH" | "DELETE", corpo?: unknown) {
  return () =>
    buscar(url, {
      method: metodo,
      headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
}

/**
 * Dois toques curtos, para quem está no balcão (ou na oficina) com a tela de lado.
 * O navegador só deixa tocar depois do primeiro clique na página; antes disso, fica
 * em silêncio — o contador na aba continua avisando.
 */
export function tocarAviso() {
  try {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return;
    const ctx = new Contexto();
    [0, 0.18].forEach((inicio, i) => {
      const osc = ctx.createOscillator();
      const volume = ctx.createGain();
      osc.frequency.value = i === 0 ? 880 : 1175;
      volume.gain.setValueAtTime(0.0001, ctx.currentTime + inicio);
      volume.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + inicio + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + inicio + 0.16);
      osc.connect(volume).connect(ctx.destination);
      osc.start(ctx.currentTime + inicio);
      osc.stop(ctx.currentTime + inicio + 0.17);
    });
    setTimeout(() => void ctx.close(), 600);
  } catch {
    // Sem áudio no aparelho: o aviso na tela basta.
  }
}

/** Quantas novidades na aba do navegador: "(2) Balcão · Yoshio". */
export function useTituloComContador(base: string, contador: number) {
  useEffect(() => {
    document.title = contador > 0 ? `(${contador}) ${base}` : base;
  }, [base, contador]);
}
