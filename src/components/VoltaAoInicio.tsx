"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTemPendencia } from "@/components/ui/SaidaSegura";

/**
 * Quem sai do app por um tempo volta no Início.
 *
 * Abrir o app do zero já cai no Início: o ícone da tela do celular aponta para "/"
 * (start_url do manifesto), e o login e o cadastro também mandam para lá. O que
 * escapava é o jeito como o mecânico de fato "fecha" o app: aperta o botão de início
 * do aparelho. O app continua vivo por trás, e tocar no ícone de novo só traz de volta
 * a tela em que ele estava — às vezes uma de que ele nem lembra como chegou.
 *
 * Aqui, ficar mais de `TEMPO_FORA_MS` sem olhar para o app conta como ter fechado: na
 * volta, ele reabre no Início. Uma espiada rápida no WhatsApp não conta, e algumas
 * telas nunca são trocadas sozinhas (ver `FICA_ONDE_ESTA`).
 *
 * Vale também para a aba que o navegador reabre sozinho — o Chrome restaura a última
 * página ao abrir, e o Android recarrega a aba que descartou para liberar memória.
 */

/** Quanto tempo fora do app conta como "fechou e abriu de novo". */
const TEMPO_FORA_MS = 5 * 60_000;

/**
 * Telas que não se trocam sozinhas: formulário (uma OS pela metade não pode sumir
 * porque o cliente ligou), configurações, e a assinatura — quem paga o Pix sai para o
 * app do banco e precisa voltar na tela que confirma o pagamento.
 */
const FICA_ONDE_ESTA = /\/(nova|novo|editar)(\/|$)|^\/(configuracoes|assinatura)(\/|$)/;

/** Por aba (`sessionStorage`): sobrevive à aba recarregada e à restaurada pelo navegador. */
const CHAVE = "boxos:saiu-em";

function lerSaida(): number {
  try {
    return Number(sessionStorage.getItem(CHAVE)) || 0;
  } catch {
    return 0;
  }
}

function gravarSaida() {
  try {
    sessionStorage.setItem(CHAVE, String(Date.now()));
  } catch {
    // Armazenamento bloqueado (aba anônima de alguns navegadores): a volta automática
    // só deixa de acontecer.
  }
}

function limparSaida() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {}
}

export function VoltaAoInicio() {
  const pathname = usePathname();
  const router = useRouter();
  const temPendencia = useTemPendencia();

  // Os ouvintes nascem uma vez só; a rota atual eles leem daqui.
  const rotaRef = useRef(pathname);
  useEffect(() => {
    rotaRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const deveVoltar = (saiuEm: number) => {
      const rota = rotaRef.current;
      return (
        saiuEm > 0 &&
        Date.now() - saiuEm >= TEMPO_FORA_MS &&
        rota !== "/" &&
        !FICA_ONDE_ESTA.test(rota) &&
        !temPendencia()
      );
    };

    // A página acabou de carregar. Só conta se foi o navegador que a reabriu (aba
    // restaurada ou recarregada); se a pessoa seguiu um link para uma OS, é a OS que
    // ela quer ver, não o Início.
    const navegacao = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navegacao && navegacao.type !== "navigate" && deveVoltar(lerSaida())) {
      router.replace("/");
    }
    limparSaida();

    function aoTrocarVisibilidade() {
      if (document.visibilityState === "hidden") {
        gravarSaida();
        return;
      }
      const saiuEm = lerSaida();
      limparSaida();
      if (deveVoltar(saiuEm)) router.replace("/");
    }

    document.addEventListener("visibilitychange", aoTrocarVisibilidade);
    // `pagehide` cobre o fechamento e a recarga, onde a visibilidade nem sempre avisa.
    window.addEventListener("pagehide", gravarSaida);
    return () => {
      document.removeEventListener("visibilitychange", aoTrocarVisibilidade);
      window.removeEventListener("pagehide", gravarSaida);
    };
  }, [router, temPendencia]);

  return null;
}
