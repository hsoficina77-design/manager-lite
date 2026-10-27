"use client";

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from "react";
import { EVENTO_INSTALAR } from "@/lib/instalar-app";
import { ModalDeAjuda, type TextoDeAjuda } from "./Ajuda";
import { Botao } from "./Botao";
import { Instalar } from "./Icones";

/**
 * Instalar o boxOS ou o Peça Peça no aparelho: um ícone na tela do celular ou na área de
 * trabalho, que abre o app direto, sem a barra do navegador. O dono quer as pessoas no app
 * e não no site: quem tem o ícone volta mais e larga menos.
 *
 * Os dois já eram instaláveis (app/boxos.webmanifest, app/pecapeca.webmanifest), mas só
 * por um ícone pequeno na barra de endereço, que ninguém procura. Aqui o convite vem do
 * próprio app:
 *
 *   Chrome e Edge (Android, Windows)   o navegador avisa que dá para instalar, e o botão
 *                                      "Instalar app" abre a janela oficial dele — um toque;
 *   iPhone e iPad                      o Safari não deixa o site abrir essa janela: o
 *                                      botão mostra o caminho pelo Compartilhar (escolha
 *                                      do dono, por ser o único jeito lá);
 *   dentro do Instagram, Facebook...   não existe instalar. No Android, "Abrir no Chrome"
 *   (Android)                          leva a mesma tela para o Chrome, onde existe;
 *   o resto (Firefox, Instagram no     nada aparece.
 *   iPhone...)
 *
 * Fora do iPhone, nunca uma tela ensinando a instalar: o dono pediu o botão que instala.
 * O aviso do Chrome depende do service worker (public/sw.js) e de a pessoa já ter usado o
 * site um pouco — um toque e uns 30 segundos, uma vez. Depois disso ele vem ao abrir. Com
 * o app já instalado ele não vem, e nada aparece.
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
    /** Número no ícone do app instalado (Windows, Mac, iPhone). Não está em todo navegador. */
    setAppBadge?: (contador?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

type Situacao =
  /** Aberto pelo ícone, ou instalado agora há pouco. */
  | "instalado"
  /** O navegador abre a própria janela de instalar. */
  | "navegador"
  /** iPhone e iPad: só pelo Compartilhar. */
  | "iphone"
  /** Android, dentro do navegador de outro app (Instagram...): só abrindo no Chrome. */
  | "outro-app"
  /** Sem o aviso do navegador (ainda, ou já instalado), ou navegador que não instala. */
  | "indisponivel";

// Navegador embutido de outro app: lá não existe "Instalar" nem "Adicionar à Tela de
// Início". `; wv)` é o WebView do Android, que os apps usam para abrir links por dentro.
const DENTRO_DE_OUTRO_APP = /Instagram|FBAN|FBAV|FB_IAB|FB4A|Line\/|TikTok|musical_ly|Bytedance|LinkedInApp|; wv\)/;

function ehIphone() {
  const ua = navigator.userAgent;
  // O iPad se apresenta como Mac; o que o entrega é a tela de toque.
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Aberto pelo ícone do app instalado, e não numa aba do navegador. */
export function abertoPeloIcone() {
  return Boolean(navigator.standalone) || window.matchMedia("(display-mode: standalone)").matches;
}

function situacaoAgora(): Situacao {
  if (window.__boxosInstalado || abertoPeloIcone()) return "instalado";
  if (window.__boxosInstalar) return "navegador";
  const ua = navigator.userAgent;
  if (DENTRO_DE_OUTRO_APP.test(ua)) return /Android/.test(ua) ? "outro-app" : "indisponivel";
  if (ehIphone()) return "iphone";
  return "indisponivel";
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO_INSTALAR, aviso);
  return () => window.removeEventListener(EVENTO_INSTALAR, aviso);
}

// O mesmo passo a passo serve aos dois produtos; muda só o nome do app.
const noIphone = (app: string): TextoDeAjuda => ({
  titulo: `Instalar o ${app}`,
  texto: "No iPhone e no iPad, quem coloca o ícone na tela é você, em três toques:",
  passos: [
    "Toque em Compartilhar: o quadrado com uma seta para cima. Se não achar, ele fica dentro do botão ⋯.",
    "Na lista que abrir, toque em Adicionar à Tela de Início. Se não aparecer, role a lista para baixo.",
    `Toque em Adicionar. O ícone do ${app} aparece junto com os outros apps.`,
  ],
  dica: `Se o ${app} pedir o login ao abrir pelo ícone, entre de novo uma vez. Depois ele lembra.`,
});

/**
 * A mesma tela, no Chrome. O Android entrega o endereço `intent://` ao app indicado; sem
 * o Chrome no aparelho, o `browser_fallback_url` reabre a tela onde ela está.
 */
function abrirNoChrome() {
  const { host, pathname, search, href } = window.location;
  window.location.href =
    `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${encodeURIComponent(href)};end`;
}

type Resultado = "aceitou" | "recusou" | "explicou" | "saiu";

export type AppInstalavel = "boxOS" | "Peça Peça";

/**
 * Se dá para oferecer a instalação neste aparelho, e o gesto de instalar.
 *
 * `explicacao` é a janela do passo a passo do iPhone: quem usa o hook a coloca na tela.
 *
 * `app` é o da tela, não o do endereço: no endereço do boxOS, as telas do Peça Peça
 * instalam o Peça Peça (ver app/pecapeca.webmanifest).
 */
export function useInstalarApp(app: AppInstalavel = "boxOS") {
  const situacao = useSyncExternalStore(assinar, situacaoAgora, () => "indisponivel" as const);
  const [explicando, setExplicando] = useState<TextoDeAjuda | null>(null);

  const instalar = useCallback(async (): Promise<Resultado> => {
    if (situacaoAgora() === "outro-app") {
      abrirNoChrome();
      return "saiu";
    }
    const pedido = window.__boxosInstalar;
    if (!pedido) {
      setExplicando(noIphone(app));
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
  }, [app]);

  return {
    situacao,
    /** Instala com um toque, ou é iPhone (que não tem outro jeito): item "Instalar" do menu. */
    disponivel: situacao === "navegador" || situacao === "iphone",
    instalar,
    explicacao: explicando ? (
      <ModalDeAjuda ajuda={explicando} onFechar={() => setExplicando(null)} />
    ) : null,
  };
}

/* ------------------------------------------------------------------- Convite */

// "v3": o convite virou a folha de baixo em todas as telas, e quem dispensou o cartão
// antigo do Início vê a nova. Um por app: no endereço do boxOS moram os dois.
const chaveDispensa = (app: AppInstalavel) => `boxos:instalar-dispensado:v3:${app}`;
const chaveFechado = (app: AppInstalavel) => `boxos:instalar-fechado:${app}`;

/**
 * Depois de "Continuar no site", o convite some deste aparelho por este tempo. Curto de
 * propósito: o objetivo é a pessoa no app, e ela usa o sistema todo dia.
 */
const PAUSA_MS = 3 * 24 * 60 * 60_000;

function dispensadoHaPouco(app: AppInstalavel) {
  try {
    if (sessionStorage.getItem(chaveFechado(app))) return true;
    const quando = Number(localStorage.getItem(chaveDispensa(app)));
    return quando > 0 && Date.now() - quando < PAUSA_MS;
  } catch {
    return false;
  }
}

/** "Continuar no site": alguns dias. Fechar sem escolher (tocar fora, Esc): só esta visita. */
function lembrarDispensa(app: AppInstalavel, porDias: boolean) {
  try {
    if (porDias) localStorage.setItem(chaveDispensa(app), String(Date.now()));
    else sessionStorage.setItem(chaveFechado(app), "1");
  } catch {
    // Armazenamento bloqueado: o convite volta na próxima abertura.
  }
}

/** A pessoa está digitando: o convite espera, para não cobrir o campo no meio. */
function campoEmFoco() {
  return document.activeElement?.matches("input, textarea, select, [contenteditable='true']") ?? false;
}

const ICONE: Record<AppInstalavel, string> = {
  boxOS: "/brand/favicon_192.png",
  "Peça Peça": "/brand-pecapeca/favicon_192.png",
};

/**
 * O convite para instalar, como o dos apps de site (Cifra Club, Letras): no celular, uma
 * folha que sobe do pé da tela por cima de tudo; no computador, um cartão no canto. Vale
 * em qualquer tela do app — está no layout raiz —, não só no Início.
 *
 * Aparece quando o navegador libera a instalação (ver o topo do arquivo) e some quando o
 * app é aberto pelo ícone, e por alguns dias depois de "Continuar no site". Quem mudar de
 * ideia acha "Instalar" no menu.
 *
 * `soParaSairDeOutroApp`: nas telas de cadastro o convite de instalar esperaria a pessoa
 * entrar, mas o "Abrir no Chrome" vale ali mais do que em qualquer lugar — é para onde o
 * link da bio do Instagram leva, e a conta criada dentro do Instagram fica presa nele.
 */
export function ConviteInstalar({ app, soParaSairDeOutroApp = false }: { app: AppInstalavel; soParaSairDeOutroApp?: boolean }) {
  const { situacao, instalar, explicacao } = useInstalarApp(app);
  const tituloId = useId();
  const textoId = useId();
  // Começa escondido: só no navegador dá para saber se a pessoa já dispensou.
  const [dispensado, setDispensado] = useState(true);
  const [aberto, setAberto] = useState(false);

  const deOutroApp = situacao === "outro-app";
  const oferece = deOutroApp || (!soParaSairDeOutroApp && (situacao === "navegador" || situacao === "iphone"));

  useEffect(() => {
    setDispensado(dispensadoHaPouco(app));
  }, [app]);

  // O aviso do Chrome pode chegar com a pessoa preenchendo um campo: espera ela sair dele.
  useEffect(() => {
    if (!oferece || dispensado || aberto) return;
    if (!campoEmFoco()) {
      setAberto(true);
      return;
    }
    const aoSairDoCampo = () =>
      setTimeout(() => {
        if (!campoEmFoco()) setAberto(true);
      }, 0);
    document.addEventListener("focusout", aoSairDoCampo);
    return () => document.removeEventListener("focusout", aoSairDoCampo);
  }, [oferece, dispensado, aberto]);

  const visivel = oferece && !dispensado && aberto;

  const fechar = useCallback(
    (porDias: boolean) => {
      lembrarDispensa(app, porDias);
      setDispensado(true);
    },
    [app]
  );

  useEffect(() => {
    if (!visivel) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar(false);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [visivel, fechar]);

  async function aoInstalar() {
    const resultado = await instalar();
    // Recusou a janela do navegador ou já leu o passo a passo do iPhone: vale como
    // "Continuar no site". Quem aceitou não precisa: a instalação já esconde o convite.
    // Quem foi para o Chrome volta a ver o convite aqui se voltar ao Instagram.
    if (resultado === "recusou" || resultado === "explicou") fechar(true);
  }

  return (
    <>
      {visivel && (
        <div className="no-print">
          {/* No celular a página escurece, como nos outros sites. Tocar fora fecha só por agora. */}
          <div aria-hidden="true" className="fixed inset-0 z-[45] bg-black/50 md:hidden" onClick={() => fechar(false)} />
          <div
            role="dialog"
            aria-labelledby={tituloId}
            aria-describedby={textoId}
            className="animate-subir fixed inset-x-0 bottom-0 z-[45] rounded-t-2xl border-t border-linha bg-superficie px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl md:inset-x-auto md:bottom-6 md:right-6 md:w-[26rem] md:rounded-2xl md:border md:p-5"
          >
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-linha-forte md:hidden" />
            <div className="flex items-center gap-4">
              {/* O próprio ícone que vai aparecer na tela: a pessoa reconhece depois. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ICONE[app]} alt="" className="h-14 w-14 shrink-0" />
              <div className="min-w-0">
                <h2 id={tituloId} className="text-lg font-bold leading-snug text-tinta">
                  Mais praticidade no app do {app}
                </h2>
                <p id={textoId} className="mt-0.5 text-sm text-tinta-3">
                  {deOutroApp ? (
                    "Aqui dentro não dá para instalar. No Chrome, é só um toque."
                  ) : (
                    <>
                      <span className="md:hidden">Fica na tela do celular e abre direto, sem procurar o site.</span>
                      <span className="hidden md:inline">
                        Fica na área de trabalho e abre direto, sem procurar o site.
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Botao variante="secundario" onClick={() => fechar(true)} className="flex-1 rounded-full">
                {deOutroApp ? "Continuar aqui" : "Continuar no site"}
              </Botao>
              <Botao onClick={aoInstalar} className="flex-1 rounded-full">
                {deOutroApp ? (
                  "Abrir no Chrome"
                ) : (
                  <>
                    <Instalar tamanho={16} /> Instalar app
                  </>
                )}
              </Botao>
            </div>
          </div>
        </div>
      )}

      {explicacao}
    </>
  );
}

/* --------------------------------------------------------------- Uso pelo app */

/**
 * Conta, no servidor, que a pessoa abriu pelo ícone (`/api/uso-app`): é o número do
 * /admin que diz se o convite funciona. Uma vez por abertura do app; o servidor guarda no
 * máximo uma por hora. Só para quem entrou — sem conta não há de quem contar.
 */
export function RegistroDoApp() {
  useEffect(() => {
    if (!abertoPeloIcone()) return;
    try {
      if (sessionStorage.getItem("boxos:uso-app")) return;
      sessionStorage.setItem("boxos:uso-app", "1");
    } catch {
      // Sem armazenamento, conta a cada carregamento — o servidor segura o excesso.
    }
    fetch("/api/uso-app", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}

/**
 * O número no ícone do app instalado: o que pede ação agora. No Windows, no Mac e no
 * iPhone aparece na barra de tarefas, no Dock ou na tela de início, mesmo com o app
 * fechado — um motivo a mais para abrir pelo ícone. Onde não existe, não faz nada.
 */
export function marcarNoIcone(contador: number) {
  try {
    const pedido = contador > 0 ? navigator.setAppBadge?.(contador) : navigator.clearAppBadge?.();
    pedido?.catch(() => {});
  } catch {
    // Navegador sem o recurso, ou sem permissão: o número fica só na tela.
  }
}
