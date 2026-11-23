"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import Link from "next/link";
import { Avancar, Enviar, Fechar, Sino } from "@/components/ui/Icones";
import { LIMITE_MENSAGEM, type ConversaVista, type LadoDaConversa, type MensagemVista } from "./regras";
import { buscar, tocarAviso } from "./aoVivo";
import { horaCurta } from "./ui";

// A conversa entre a oficina e uma loja sobre uma cotação — a mesma tela dos dois lados.
//
// Escala: aberta, a tela pergunta só "o que chegou depois da última" (`?depois=`), a
// cada 2,5 s enquanto a conversa está andando e a cada 6 s quando está parada. Fechada,
// não pergunta nada: o número de não lidas vem na leitura que a tela de baixo já faz.

/** Fato da cotação que aparece no meio das mensagens ("A loja respondeu"). */
export type EventoDaConversa = { em: string; texto: string };

type Pendente = { idCliente: string; texto: string; em: string; falhou: string | null };

const RAPIDO_MS = 2500;
const DEVAGAR_MS = 6000;
/** Sem mensagem nova há este tempo, a conversa está parada: pergunta mais devagar. */
const PARADA_MS = 60_000;

function novoIdCliente() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Junta mensagens sem repetir, em ordem de chegada. */
function juntar(atuais: MensagemVista[], novas: MensagemVista[]) {
  if (novas.length === 0) return atuais;
  const porId = new Map(atuais.map((m) => [m.id, m]));
  for (const m of novas) porId.set(m.id, m);
  return [...porId.values()].sort((a, b) => a.seq - b.seq);
}

/**
 * Os dados da conversa, sempre em dia enquanto a tela está aberta e visível. Marca como
 * lido o que chegou do outro lado — só quando `podeEscrever`: quem só acompanha não
 * apaga o aviso de quem precisa responder.
 */
function useConversa(api: string, eu: LadoDaConversa, podeEscrever: boolean) {
  const [conversa, setConversa] = useState<ConversaVista | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const ultimaSeq = useRef(0);
  const ultimaNovidade = useRef(Date.now());
  const lidoEnviado = useRef(0);

  const aplicar = useCallback((nova: ConversaVista, modo: "tudo" | "depois" | "antes") => {
    setConversa((atual) => {
      if (!atual || modo === "tudo") return nova;
      return {
        ...nova,
        mensagens:
          modo === "antes" ? juntar(nova.mensagens, atual.mensagens) : juntar(atual.mensagens, nova.mensagens),
        maisAntigas: modo === "antes" ? nova.maisAntigas : atual.maisAntigas,
      };
    });
    const maior = nova.mensagens.at(-1)?.seq ?? 0;
    if (maior > ultimaSeq.current) {
      ultimaSeq.current = maior;
      ultimaNovidade.current = Date.now();
    }
    if (modo === "tudo") lidoEnviado.current = Math.max(lidoEnviado.current, nova.lidoPorMimAte);
  }, []);

  // Primeira leitura, e depois só o que chegou — num laço de `setTimeout` (o intervalo
  // muda conforme a conversa anda).
  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function ler(primeira: boolean) {
      try {
        const url = primeira ? api : `${api}?depois=${ultimaSeq.current}`;
        const r = await buscar(url, { cache: "no-store" });
        if (!vivo) return;
        if (r.status === 404) return setErroLeitura("Esta cotação não existe mais.");
        if (!r.ok) throw new Error(String(r.status));
        aplicar((await r.json()) as ConversaVista, primeira ? "tudo" : "depois");
        setErroLeitura(null);
      } catch {
        if (vivo) setErroLeitura("Sem conexão agora. A conversa volta sozinha quando a internet voltar.");
      }
    }

    function agendar() {
      const parada = Date.now() - ultimaNovidade.current > PARADA_MS;
      timer = setTimeout(async () => {
        if (document.visibilityState === "visible") await ler(false);
        if (vivo) agendar();
      }, parada ? DEVAGAR_MS : RAPIDO_MS);
    }

    const aoVoltar = () => {
      if (document.visibilityState === "visible") void ler(false);
    };

    void ler(true).then(() => vivo && agendar());
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      vivo = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [api, aplicar]);

  // "Li até aqui", quando chega algo do outro lado com a tela visível.
  useEffect(() => {
    if (!conversa || !podeEscrever || document.visibilityState !== "visible") return;
    const ultimaDoOutro = conversa.mensagens.filter((m) => m.autor !== eu).at(-1)?.seq ?? 0;
    if (ultimaDoOutro <= lidoEnviado.current) return;
    lidoEnviado.current = ultimaDoOutro;
    void buscar(api, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ate: ultimaDoOutro }),
    }).catch(() => {
      // Fica para a próxima mensagem: o contador só demora a zerar.
      lidoEnviado.current = 0;
    });
  }, [conversa, api, eu, podeEscrever]);

  async function maisAntigas() {
    const primeira = conversa?.mensagens[0]?.seq;
    if (!primeira) return;
    const r = await buscar(`${api}?antes=${primeira}`, { cache: "no-store" }).catch(() => null);
    if (r?.ok) aplicar((await r.json()) as ConversaVista, "antes");
  }

  async function mandar(p: Pendente) {
    setPendentes((lista) => lista.map((x) => (x.idCliente === p.idCliente ? { ...x, falhou: null } : x)));
    try {
      const r = await buscar(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: p.texto, idCliente: p.idCliente }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((corpo as { error?: string }).error ?? "Não foi. Toque para tentar de novo.");
      const mensagem = corpo as MensagemVista;
      setPendentes((lista) => lista.filter((x) => x.idCliente !== p.idCliente));
      setConversa((atual) => (atual ? { ...atual, mensagens: juntar(atual.mensagens, [mensagem]) } : atual));
      if (mensagem.seq > ultimaSeq.current) ultimaSeq.current = mensagem.seq;
      ultimaNovidade.current = Date.now();
    } catch (err) {
      const falhou = err instanceof TypeError ? "Sem conexão. Toque para tentar de novo." : (err as Error).message;
      setPendentes((lista) => lista.map((x) => (x.idCliente === p.idCliente ? { ...x, falhou } : x)));
    }
  }

  function enviar(texto: string) {
    const p: Pendente = { idCliente: novoIdCliente(), texto, em: new Date().toISOString(), falhou: null };
    setPendentes((lista) => [...lista, p]);
    void mandar(p);
  }

  return { conversa, erroLeitura, pendentes, maisAntigas, enviar, reenviar: mandar };
}

// ─── A janela ───────────────────────────────────────────────────────────────

/** O que mais se diz no balcão, para quem digita pouco no celular. */
const RAPIDAS_OFICINA = ["Pode mandar", "Vou ver e já respondo", "Tem de outra marca?", "Qual o prazo?", "Obrigado!"];
const RAPIDAS_LOJA = ["Tenho sim", "Não tenho essa", "Manda foto da peça velha?", "Já respondi a cotação", "Obrigado!"];

export function Conversa({
  api,
  titulo,
  subtitulo,
  eu,
  podeEscrever = true,
  semAcessoTexto,
  eventos = [],
  pushApi,
  link,
  onFechar,
}: {
  /** A rota da conversa (GET, POST, PATCH). */
  api: string;
  titulo: string;
  subtitulo?: string;
  eu: LadoDaConversa;
  /** Falso para quem só acompanha (no balcão, sem o acesso de conversar). */
  podeEscrever?: boolean;
  semAcessoTexto?: string;
  eventos?: EventoDaConversa[];
  /** A rota do aviso no celular; sem ela (link antigo do balcão), o botão some. */
  pushApi?: string;
  /** Atalho no topo (aberta fora da cotação, na caixa de conversas): "Ver cotação". */
  link?: { href: string; rotulo: string };
  onFechar: () => void;
}) {
  const { conversa, erroLeitura, pendentes, maisAntigas, enviar, reenviar } = useConversa(api, eu, podeEscrever);
  const [texto, setTexto] = useState("");
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const colado = useRef(true);
  const quantasAntes = useRef(0);

  // Trava a rolagem da página atrás e fecha no Escape, como o Modal.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [onFechar]);

  // Mensagem nova desce a lista — só se a pessoa já estava lá embaixo (não arranca quem
  // subiu para reler). A minha mensagem desce sempre.
  const total = (conversa?.mensagens.length ?? 0) + pendentes.length;
  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    const chegouDoOutro =
      total > quantasAntes.current && conversa?.mensagens.at(-1)?.autor !== eu && quantasAntes.current > 0;
    if (colado.current || pendentes.length > 0) el.scrollTop = el.scrollHeight;
    if (chegouDoOutro && document.visibilityState === "visible") tocarAviso();
    quantasAntes.current = total;
  }, [total, conversa, eu, pendentes.length]);

  function mandar() {
    const t = texto.trim();
    if (!t) return;
    enviar(t);
    setTexto("");
    colado.current = true;
    campo.current?.focus();
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // No computador, Enter manda e Shift+Enter quebra a linha. No celular o Enter do
    // teclado quebra a linha, e quem manda é o botão — como nos apps de mensagem.
    if (e.key !== "Enter" || e.shiftKey || window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    mandar();
  }

  const mensagens = conversa?.mensagens ?? [];
  // Fato da cotação só entra no trecho que a tela tem: antes da primeira mensagem
  // carregada, se há mais antigas, ele ficaria fora de lugar.
  const desde = conversa?.maisAntigas ? mensagens[0]?.em : undefined;
  const linhas = [
    ...mensagens.map((m) => ({ tipo: "mensagem" as const, em: m.em, m })),
    ...eventos.filter((ev) => !desde || ev.em >= desde).map((ev) => ({ tipo: "evento" as const, em: ev.em, ev })),
  ].sort((a, b) => a.em.localeCompare(b.em));
  const minhaUltima = [...mensagens].reverse().find((m) => m.autor === eu);
  const vista = minhaUltima && conversa && minhaUltima.seq <= conversa.lidoPeloOutroAte;

  return (
    <div className="no-print fixed inset-0 z-50 flex bg-black/50 sm:items-center sm:justify-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Conversa com ${titulo}`}
        className="flex h-[100dvh] w-full flex-col bg-superficie shadow-xl max-sm:animate-subir sm:h-[min(44rem,calc(100dvh-2rem))] sm:max-w-lg sm:rounded-2xl sm:linha-entra"
      >
        <div className="flex items-start gap-2 border-b border-linha px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-tinta">{titulo}</h2>
            {subtitulo && <p className="truncate text-xs text-tinta-3">{subtitulo}</p>}
            {link && (
              <Link
                href={link.href}
                className="mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium text-brand-texto underline-offset-4 hover:underline"
              >
                {link.rotulo}
                <Avancar tamanho={12} />
              </Link>
            )}
          </div>
          {pushApi && <AvisoNoCelular api={pushApi} compacto />}
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar a conversa"
            className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta"
          >
            <Fechar tamanho={18} />
          </button>
        </div>

        <div
          ref={lista}
          onScroll={(e) => {
            const el = e.currentTarget;
            colado.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-fundo px-3 py-3"
          aria-live="polite"
        >
          {conversa?.maisAntigas && (
            <div className="flex justify-center">
              <Botao variante="fantasma" tamanho="denso" onClick={maisAntigas}>
                Ver mensagens anteriores
              </Botao>
            </div>
          )}

          {!conversa && !erroLeitura && <p className="py-6 text-center text-sm text-tinta-3">Carregando…</p>}

          {conversa && mensagens.length === 0 && pendentes.length === 0 && (
            <div className="mx-auto max-w-xs py-6 text-center text-sm text-tinta-3">
              <p className="font-medium text-tinta-2">Nenhuma mensagem ainda.</p>
              <p className="mt-1">
                {eu === "LOJA"
                  ? "Ficou dúvida na aplicação? Pergunte à oficina antes de responder: versão, ABS, motor, foto da peça velha."
                  : "Pergunte à loja o que precisar sobre a peça antes de fechar o pedido."}
              </p>
            </div>
          )}

          {linhas.map((l, i) => {
            if (l.tipo === "evento") {
              return (
                <p key={`ev-${l.ev.em}-${i}`} className="py-1 text-center text-xs text-tinta-3">
                  {l.ev.texto}, às {horaCurta(l.ev.em)}
                </p>
              );
            }
            const m = l.m;
            const anterior = linhas[i - 1];
            const novoAutor = !(anterior?.tipo === "mensagem" && anterior.m.autorNome === m.autorNome);
            return (
              <Balao
                key={m.id}
                minha={m.autor === eu}
                nome={novoAutor ? m.autorNome : null}
                texto={m.texto}
                rodape={horaCurta(m.em) + (vista && m.id === minhaUltima?.id ? " · visto" : "")}
              />
            );
          })}

          {pendentes.map((p) => (
            <Balao
              key={p.idCliente}
              minha
              nome={null}
              texto={p.texto}
              pendente={!p.falhou}
              entrando
              rodape={p.falhou ?? "enviando…"}
              falhou={Boolean(p.falhou)}
              onTentarDeNovo={p.falhou ? () => void reenviar(p) : undefined}
            />
          ))}
        </div>

        {erroLeitura && (
          <p role="status" className="border-t-2 border-[rgb(var(--gr-sem-resposta))] px-4 py-2 text-xs text-tinta-2">
            {erroLeitura}
          </p>
        )}

        <div className="border-t border-linha px-3 py-2 pb-segura">
          {conversa && !conversa.aberta ? (
            <p className="px-1 py-2 text-sm text-tinta-2">{conversa.motivoFechada}</p>
          ) : !podeEscrever ? (
            <p className="px-1 py-2 text-sm text-tinta-2">
              {semAcessoTexto ?? "Seu acesso não inclui conversar. Quem cuida da equipe libera."}
            </p>
          ) : (
            <>
              {/* Respostas de balcão, um toque e entram no campo (não mandam sozinhas:
                  dá para completar antes). Somem quando a pessoa começa a escrever. */}
              {!texto && conversa && (
                <div className="-mx-3 mb-2 flex gap-1.5 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none]">
                  {(eu === "OFICINA" ? RAPIDAS_OFICINA : RAPIDAS_LOJA).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setTexto(r);
                        campo.current?.focus();
                      }}
                      className="aperta min-h-9 shrink-0 rounded-full border border-linha bg-superficie-2 px-3 text-xs font-medium text-tinta-2 hover:border-brand-500 hover:text-tinta"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={campo}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={aoTeclar}
                  maxLength={LIMITE_MENSAGEM}
                  rows={Math.min(4, Math.max(1, texto.split("\n").length))}
                  placeholder="Escreva a mensagem"
                  aria-label="Mensagem"
                  disabled={!conversa}
                  className="min-h-11 flex-1 resize-none rounded-xl border border-linha bg-superficie px-3 py-2.5 text-sm text-tinta placeholder:text-tinta-3 focus:border-brand-500 focus:outline-none"
                />
                <Botao onClick={mandar} disabled={!texto.trim() || !conversa} tamanho="icone" aria-label="Mandar">
                  <Enviar tamanho={18} />
                </Botao>
              </div>
              <p className="mt-1.5 px-1 text-[0.7rem] leading-snug text-tinta-3">
                Número de telefone sai escondido. As mensagens se apagam quando a entrega fecha.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Balao({
  minha,
  nome,
  texto,
  rodape,
  pendente = false,
  falhou = false,
  entrando = false,
  onTentarDeNovo,
}: {
  minha: boolean;
  /** Quem escreveu, na primeira de uma sequência da mesma pessoa. */
  nome: string | null;
  texto: string;
  rodape: string;
  pendente?: boolean;
  falhou?: boolean;
  /** A mensagem que acabei de mandar: entra deslizando. */
  entrando?: boolean;
  onTentarDeNovo?: () => void;
}) {
  const conteudo = (
    <>
      <p className="whitespace-pre-wrap break-words text-sm">{texto}</p>
      <p
        className={cn(
          "mt-0.5 text-right text-[0.7rem]",
          falhou ? "font-medium" : minha ? "text-brand-fg/80" : "text-tinta-3"
        )}
      >
        {rodape}
      </p>
    </>
  );
  return (
    <div className={cn("flex flex-col", minha ? "items-end" : "items-start", entrando && "linha-entra")}>
      {nome && <p className="mb-0.5 px-1 text-[0.7rem] font-medium text-tinta-3">{nome}</p>}
      {onTentarDeNovo ? (
        <button
          type="button"
          onClick={onTentarDeNovo}
          className="max-w-[85%] rounded-2xl rounded-br-md bg-perigo px-3 py-2 text-left text-perigo-fg"
        >
          {conteudo}
        </button>
      ) : (
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3 py-2",
            minha ? "rounded-br-md bg-brand-600 text-brand-fg" : "rounded-bl-md border border-linha bg-superficie text-tinta",
            pendente && "opacity-70"
          )}
        >
          {conteudo}
        </div>
      )}
    </div>
  );
}

// ─── Número de não lidas ────────────────────────────────────────────────────

/** A bolinha com o número de mensagens não lidas. */
export function ContadorDeMensagens({ total, className }: { total: number; className?: string }) {
  if (total <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-perigo px-1.5 text-[0.7rem] font-bold leading-none text-perigo-fg",
        className
      )}
      aria-label={total === 1 ? "1 mensagem não lida" : `${total} mensagens não lidas`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}

/**
 * Abre a conversa pelo endereço — é para onde o aviso no celular leva: `?conversa=<id>`
 * (ou `=1`, quando a tela só tem uma conversa). Lê uma vez e limpa o parâmetro, para o
 * "voltar" do celular não reabrir.
 */
export function useConversaDoEndereco(abrir: (valor: string) => void) {
  const abrirRef = useRef(abrir);
  abrirRef.current = abrir;
  useEffect(() => {
    const url = new URL(window.location.href);
    const valor = url.searchParams.get("conversa");
    if (!valor) return;
    abrirRef.current(valor);
    url.searchParams.delete("conversa");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, []);
}

// ─── Aviso no celular ───────────────────────────────────────────────────────

function chaveEmBytes(base64: string) {
  const preenchido = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = window.atob(preenchido);
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

type EstadoDoAviso = "carregando" | "indisponivel" | "bloqueado" | "desligado" | "ligado";

/**
 * Liga e desliga o aviso de mensagem nova neste aparelho, com o app fechado. Some quando
 * o navegador não tem (iPhone fora do app instalado) ou o servidor não tem as chaves.
 */
export function AvisoNoCelular({ api, compacto = false }: { api: string; compacto?: boolean }) {
  const [estado, setEstado] = useState<EstadoDoAviso>("carregando");
  const [chave, setChave] = useState<string | null>(null);
  const [mexendo, setMexendo] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setEstado("indisponivel");
      }
      const r = await buscar(api, { cache: "no-store" }).catch(() => null);
      const corpo = r?.ok ? ((await r.json()) as { chave: string | null }) : null;
      if (!vivo) return;
      if (!corpo?.chave) return setEstado("indisponivel");
      setChave(corpo.chave);
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const registro = await navigator.serviceWorker.getRegistration();
      const inscricao = await registro?.pushManager.getSubscription();
      if (vivo) setEstado(inscricao && Notification.permission === "granted" ? "ligado" : "desligado");
    })().catch(() => vivo && setEstado("indisponivel"));
    return () => {
      vivo = false;
    };
  }, [api]);

  async function ligar() {
    if (!chave) return;
    setMexendo(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") return setEstado(permissao === "denied" ? "bloqueado" : "desligado");
      const registro = await navigator.serviceWorker.ready;
      const inscricao =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveEmBytes(chave) }));
      const r = await buscar(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inscricao.toJSON()),
      });
      setEstado(r.ok ? "ligado" : "desligado");
    } catch {
      setEstado("desligado");
    } finally {
      setMexendo(false);
    }
  }

  async function desligar() {
    setMexendo(true);
    try {
      const registro = await navigator.serviceWorker.getRegistration();
      const inscricao = await registro?.pushManager.getSubscription();
      if (inscricao) {
        await buscar(api, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: inscricao.endpoint }),
        });
        await inscricao.unsubscribe();
      }
      setEstado("desligado");
    } finally {
      setMexendo(false);
    }
  }

  if (estado === "carregando" || estado === "indisponivel") return null;

  if (estado === "bloqueado") {
    return compacto ? null : (
      <p className="text-xs text-tinta-3">
        O aviso no celular está bloqueado neste navegador. Libere as notificações do Peça Peça nas configurações do
        celular.
      </p>
    );
  }

  const ligado = estado === "ligado";
  return (
    <button
      type="button"
      onClick={ligado ? desligar : ligar}
      disabled={mexendo}
      aria-pressed={ligado}
      title={ligado ? "Aviso no celular ligado. Toque para desligar." : "Avisar no celular quando chegar mensagem"}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors disabled:opacity-50",
        ligado ? "text-ok hover:bg-ok-fraco" : "text-tinta-2 hover:bg-superficie-2 hover:text-tinta",
        !compacto && "border border-linha bg-superficie"
      )}
    >
      <Sino tamanho={16} />
      {compacto ? (ligado ? "Aviso ligado" : "Avisar") : ligado ? "Aviso no celular ligado" : "Avisar no celular quando chegar mensagem"}
    </button>
  );
}
