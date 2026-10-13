"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { EVENTO_INSTALAR } from "@/lib/instalar-app";
import { ModalDeAjuda, type TextoDeAjuda } from "./Ajuda";
import { Botao } from "./Botao";
import { Instalar } from "./Icones";

/**
 * Instalar o boxOS no aparelho: um ícone na tela do celular ou na área de trabalho, que
 * abre o boxOS direto, sem a barra do navegador.
 *
 * O boxOS já era instalável (ver app/manifest.ts), mas só por um ícone pequeno na barra
 * de endereço, que ninguém procura. Aqui o convite vem do próprio boxOS:
 *
 *   Chrome e Edge (Android, Windows)   o navegador avisa que dá para instalar, e o botão
 *                                      "Instalar" abre a janela oficial dele;
 *   iPhone e iPad                      o Safari não deixa o site abrir essa janela: o
 *                                      botão mostra o caminho pelo Compartilhar;
 *   o resto (Firefox, Instagram...)    nada aparece.
 *
 * O aviso do navegador é guardado pelo `SCRIPT_INSTALAR` (lib/instalar-app), no `<head>`.
 */

/** O aviso do navegador. Não está nos tipos do DOM. */
type PedidoDeInstalacao = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __boxosInstalar?: PedidoDeInstalacao | null;
    __boxosInstalado?: boolean;
  }
  interface Navigator {
    /** Safari do iPhone: aberto pelo ícone da tela de início. */
    standalone?: boolean;
  }
}

type Situacao =
  /** Aberto pelo ícone, ou instalado agora há pouco. */
  | "instalado"
  /** O navegador abre a própria janela de instalar. */
  | "navegador"
  /** iPhone e iPad: só pelo Compartilhar. */
  | "iphone"
  | "indisponivel";

function ehIphone() {
  const ua = navigator.userAgent;
  // O iPad se apresenta como Mac; o que o entrega é a tela de toque.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  // Aberto de dentro do Instagram ou do Facebook não existe "Adicionar à Tela de Início".
  const dentroDeOutroApp = /Instagram|FBAN|FBAV|FB_IAB/.test(ua);
  return ios && !dentroDeOutroApp;
}

function situacaoAgora(): Situacao {
  if (
    window.__boxosInstalado ||
    navigator.standalone ||
    window.matchMedia("(display-mode: standalone)").matches
  ) {
    return "instalado";
  }
  if (window.__boxosInstalar) return "navegador";
  if (ehIphone()) return "iphone";
  return "indisponivel";
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO_INSTALAR, aviso);
  return () => window.removeEventListener(EVENTO_INSTALAR, aviso);
}

const NO_IPHONE: TextoDeAjuda = {
  titulo: "Instalar o boxOS",
  texto: "No iPhone e no iPad, quem coloca o ícone na tela é você, em três toques:",
  passos: [
    "Toque em Compartilhar: o quadrado com uma seta para cima. Se não achar, ele fica dentro do botão ⋯.",
    "Na lista que abrir, toque em Adicionar à Tela de Início. Se não aparecer, role a lista para baixo.",
    "Toque em Adicionar. O ícone do boxOS aparece junto com os outros apps.",
  ],
  dica: "Se o boxOS pedir o login ao abrir pelo ícone, entre de novo uma vez. Depois ele lembra.",
};

type Resultado = "aceitou" | "recusou" | "explicou";

/**
 * Se dá para oferecer a instalação neste aparelho, e o gesto de instalar.
 *
 * `explicacao` é a janela do passo a passo do iPhone: quem usa o hook a coloca na tela.
 */
export function useInstalarApp() {
  const situacao = useSyncExternalStore(assinar, situacaoAgora, () => "indisponivel" as const);
  const [explicando, setExplicando] = useState(false);

  const instalar = useCallback(async (): Promise<Resultado> => {
    const pedido = window.__boxosInstalar;
    if (!pedido) {
      setExplicando(true);
      return "explicou";
    }
    // O aviso vale uma vez só. Se a pessoa recusar, o navegador avisa de novo outro dia.
    window.__boxosInstalar = null;
    try {
      await pedido.prompt();
      const { outcome } = await pedido.userChoice;
      return outcome === "accepted" ? "aceitou" : "recusou";
    } catch {
      return "recusou";
    } finally {
      window.dispatchEvent(new Event(EVENTO_INSTALAR));
    }
  }, []);

  return {
    disponivel: situacao === "navegador" || situacao === "iphone",
    instalar,
    explicacao: explicando ? (
      <ModalDeAjuda ajuda={NO_IPHONE} onFechar={() => setExplicando(false)} />
    ) : null,
  };
}

/* ------------------------------------------------------------------- Convite */

const CHAVE_DISPENSA = "boxos:instalar-dispensado";

/** Depois de um "Agora não", o convite some deste aparelho por este tempo. */
const PAUSA_MS = 30 * 24 * 60 * 60_000;

function dispensadoHaPouco() {
  try {
    const quando = Number(localStorage.getItem(CHAVE_DISPENSA));
    return quando > 0 && Date.now() - quando < PAUSA_MS;
  } catch {
    return false;
  }
}

function lembrarDispensa() {
  try {
    localStorage.setItem(CHAVE_DISPENSA, String(Date.now()));
  } catch {
    // Armazenamento bloqueado: o convite volta na próxima abertura.
  }
}

/**
 * O convite para instalar, flutuando no pé da tela — como o dos outros sites, e sem
 * empurrar os cartões do Início: o Chrome avisa que dá para instalar só depois de a
 * tela abrir, e um convite que entrasse no meio da página mudaria de lugar o cartão
 * em que o polegar ia tocar.
 *
 * Some quando o boxOS já foi aberto pelo ícone, e por 30 dias depois de "Agora não".
 * Quem mudar de ideia acha "Instalar o boxOS" no menu.
 */
export function ConviteInstalar() {
  const { disponivel, instalar, explicacao } = useInstalarApp();
  const tituloId = useId();
  // Começa escondido: só no navegador dá para saber se a pessoa já dispensou.
  const [dispensado, setDispensado] = useState(true);

  useEffect(() => {
    setDispensado(dispensadoHaPouco());
  }, []);

  function agoraNao() {
    lembrarDispensa();
    setDispensado(true);
  }

  async function aoInstalar() {
    const resultado = await instalar();
    // Recusou a janela do navegador ou já leu o passo a passo do iPhone: o convite
    // cumpriu o papel. Quem aceitou não precisa: a instalação já o esconde.
    if (resultado !== "aceitou") agoraNao();
  }

  return (
    <>
      {/* Espaço no fim da página para os últimos cartões poderem subir acima do convite. */}
      {disponivel && !dispensado && <div aria-hidden="true" className="h-40" />}

      {disponivel && !dispensado && (
        <aside
          aria-labelledby={tituloId}
          className="no-print fixed inset-x-4 bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px)+0.75rem)] z-20 rounded-2xl border border-linha bg-superficie p-4 shadow-xl md:inset-x-auto md:bottom-6 md:right-6 md:w-96"
        >
          <div className="flex items-start gap-3">
            {/* O próprio ícone que vai aparecer na tela: a pessoa reconhece depois. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/favicon_192.png" alt="" className="h-12 w-12 shrink-0" />
            <div className="min-w-0">
              <h2 id={tituloId} className="font-semibold text-tinta">
                Instale o boxOS
              </h2>
              <p className="mt-0.5 text-sm text-tinta-3">
                Ele ganha um ícone igual ao dos outros apps e abre direto, sem precisar procurar
                o site.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Botao variante="secundario" onClick={agoraNao} className="flex-1">
              Agora não
            </Botao>
            <Botao onClick={aoInstalar} className="flex-1">
              <Instalar tamanho={16} /> Instalar
            </Botao>
          </div>
        </aside>
      )}

      {explicacao}
    </>
  );
}
