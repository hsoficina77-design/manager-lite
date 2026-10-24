"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTemPendencia } from "@/components/ui/SaidaSegura";

/**
 * Abrir o app é abrir no Início.
 *
 * O ícone da tela do celular aponta para "/" (start_url do manifesto), e o login e o
 * cadastro também mandam para lá. Mas nem toda abertura passa por esse endereço:
 *
 *   - o celular encerra o app que estava em segundo plano e, ao tocar no ícone,
 *     reabre na última tela (comum no iPhone e no Android com pouca memória);
 *   - o navegador reabre a última aba ao ser aberto;
 *   - quem "fecha" o app só aperta o botão de início do aparelho, e tocar no ícone
 *     de novo traz de volta a tela em que ele estava.
 *
 * Por isso três regras, todas levando ao Início:
 *
 *   1. aba (ou app) aberta agora, sem ter vindo de outra tela do boxOS;
 *   2. página recarregada depois de `TEMPO_FORA_MS` fora;
 *   3. app que volta do segundo plano depois de `TEMPO_FORA_MS` fora.
 *
 * A regra 1 não espera o navegador dizer que "reabriu" a página: cada navegador conta
 * isso de um jeito, e no iPhone a memória da aba some junto com o app — foi assim que
 * o app ainda abria em Ordens de serviço. Ela pode valer para qualquer abertura vinda
 * de fora porque o boxOS não tem link de tela interna para compartilhar: ninguém chega
 * numa OS por um link do WhatsApp. Uma aba aberta a partir do próprio boxOS (Ctrl+
 * clique no computador) mantém a tela pedida.
 *
 * Algumas telas nunca são trocadas sozinhas (ver `FICA_ONDE_ESTA`), nem a que tem
 * alteração não salva.
 */

/** Quanto tempo fora do app conta como "fechou e abriu de novo". */
const TEMPO_FORA_MS = 5 * 60_000;

/**
 * Telas que não se trocam sozinhas: formulário (uma OS pela metade não pode sumir
 * porque o cliente ligou; reaberta do zero, ela mostra o rascunho para restaurar),
 * configurações, e a assinatura — quem paga o Pix sai para o app do banco e precisa
 * voltar na tela que confirma o pagamento. E as do Peça Peça, que é outro produto: a
 * cotação fica aberta esperando as lojas, e é nela que abre o app instalado do Peça
 * Peça — sem isto, quem também tem o boxOS tocava no ícone e caía no Início do boxOS.
 */
const FICA_ONDE_ESTA = /\/(nova|novo|editar)(\/|$)|^\/(configuracoes|assinatura|peca-peca)(\/|$)/;

// Por aba (`sessionStorage`): sobrevivem à aba recarregada e à restaurada pelo
// navegador, e somem quando a aba (ou o app) é aberta do zero.
const CHAVE_SAIDA = "boxos:saiu-em";
const CHAVE_SESSAO = "boxos:sessao";

function lerSaida(): number {
  try {
    return Number(sessionStorage.getItem(CHAVE_SAIDA)) || 0;
  } catch {
    return 0;
  }
}

function gravarSaida() {
  try {
    sessionStorage.setItem(CHAVE_SAIDA, String(Date.now()));
  } catch {
    // Armazenamento bloqueado (aba anônima de alguns navegadores): a volta automática
    // só deixa de acontecer.
  }
}

function limparSaida() {
  try {
    sessionStorage.removeItem(CHAVE_SAIDA);
  } catch {}
}

/**
 * Marca a aba e diz se ela acabou de nascer. Sem armazenamento responde "não": sem a
 * marca, toda recarga pareceria abertura nova e o F5 levaria ao Início.
 */
function abriuAgora(): boolean {
  try {
    if (sessionStorage.getItem(CHAVE_SESSAO)) return false;
    sessionStorage.setItem(CHAVE_SESSAO, "1");
    return true;
  } catch {
    return false;
  }
}

/** A página foi aberta a partir de outra tela do boxOS (nova aba, Ctrl+clique). */
function veioDoBoxOS(): boolean {
  const { referrer } = document;
  const { origin } = window.location;
  return referrer === origin || referrer.startsWith(`${origin}/`);
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
    const podeTrocar = () => {
      const rota = rotaRef.current;
      return rota !== "/" && !FICA_ONDE_ESTA.test(rota) && !temPendencia();
    };
    const ficouFora = (saiuEm: number) => saiuEm > 0 && Date.now() - saiuEm >= TEMPO_FORA_MS;

    // ── A página acabou de carregar (regras 1 e 2) ──
    const abertura = abriuAgora() && !veioDoBoxOS();
    if ((abertura || ficouFora(lerSaida())) && podeTrocar()) router.replace("/");
    limparSaida();

    // ── O app volta do segundo plano (regra 3) ──
    function aoVoltar() {
      const saiuEm = lerSaida();
      limparSaida();
      if (ficouFora(saiuEm) && podeTrocar()) router.replace("/");
    }

    function aoTrocarVisibilidade() {
      if (document.visibilityState === "hidden") gravarSaida();
      else aoVoltar();
    }

    // Página devolvida da memória pelo "voltar" do navegador: não carrega de novo nem
    // sempre avisa pela visibilidade.
    function aoMostrar(e: PageTransitionEvent) {
      if (e.persisted) aoVoltar();
    }

    document.addEventListener("visibilitychange", aoTrocarVisibilidade);
    // `pagehide` cobre o fechamento e a recarga, onde a visibilidade nem sempre avisa.
    window.addEventListener("pagehide", gravarSaida);
    window.addEventListener("pageshow", aoMostrar);
    return () => {
      document.removeEventListener("visibilitychange", aoTrocarVisibilidade);
      window.removeEventListener("pagehide", gravarSaida);
      window.removeEventListener("pageshow", aoMostrar);
    };
  }, [router, temPendencia]);

  return null;
}
