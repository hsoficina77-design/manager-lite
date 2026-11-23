"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import { Avancar } from "@/components/ui/Icones";
import type { ConversaNaLista } from "./regras";
import { buscar, useAoVivo } from "./aoVivo";
import { AvisoSemConexao, haQuanto } from "./ui";
import { AvisoNoCelular, ContadorDeMensagens, Conversa } from "./Conversa";

/*
 * A caixa "Conversas": as conversas de todas as cotações — a mesma tela para a oficina
 * e para a loja. Lê só o resumo guardado no envio, nunca as mensagens.
 *
 * Do lado da oficina, as conversas vêm agrupadas pelo carro (é como o mecânico lembra:
 * "a do Civic"), e tocar numa loja abre o chat ali mesmo. Antes levava para a tela da
 * cotação, e ao fechar o chat a pessoa ficava lá, longe da caixa — para responder três
 * lojas era preciso voltar três vezes.
 *
 * Do lado da loja continua levando ao balcão: é lá que mora o acesso de conversar.
 */

type Grupo = {
  chave: string;
  carro: string;
  numero: number | null;
  cotacaoId: string | null;
  conversas: ConversaNaLista[];
};

/** Junta as lojas do mesmo carro, na ordem da conversa mais recente de cada carro. */
function agrupar(conversas: ConversaNaLista[]): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const c of conversas) {
    const chave = c.cotacao?.id ?? c.envioId;
    const grupo = grupos.get(chave) ?? {
      chave,
      carro: c.cotacao?.carro ?? c.subtitulo,
      numero: c.cotacao?.numero ?? null,
      cotacaoId: c.cotacao?.id ?? null,
      conversas: [],
    };
    grupo.conversas.push(c);
    grupos.set(chave, grupo);
  }
  // A lista vem do servidor da mais recente para a mais antiga: o Map guarda essa ordem.
  return [...grupos.values()];
}

export function CaixaDeConversas({
  api,
  pushApi,
  eu,
}: {
  /** A rota da caixa (devolve `{ total, conversas }`). */
  api: string;
  pushApi: string;
  eu: "OFICINA" | "LOJA";
}) {
  const { dados, semConexao, carregar } = useAoVivo<{
    total: number;
    conversas: ConversaNaLista[];
  }>(api, 8000);
  const conversas = dados?.conversas ?? null;
  const [aberta, setAberta] = useState<ConversaNaLista | null>(null);
  const novas = useNovidades(conversas);

  const total = dados?.total ?? 0;
  const naCaixa = eu === "OFICINA";

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <div>
          <h1 className="text-xl font-bold text-tinta">Conversas</h1>
          <p className="mt-0.5 text-sm text-tinta-3">
            {conversas === null
              ? " "
              : total > 0
                ? `${total === 1 ? "1 mensagem nova" : `${total} mensagens novas`} ${eu === "OFICINA" ? "das lojas" : "das oficinas"}`
                : conversas.length > 0
                  ? "Tudo lido."
                  : eu === "OFICINA"
                    ? "Dúvidas das lojas sobre as suas cotações aparecem aqui."
                    : "Dúvidas das oficinas sobre as cotações da loja aparecem aqui."}
          </p>
          <div className="mt-2">
            <AvisoNoCelular api={pushApi} />
          </div>
        </div>

        <AvisoSemConexao ativo={semConexao} />

        {!conversas ? (
          <EsqueletoLista linhas={3} />
        ) : conversas.length === 0 ? (
          <Vazio
            titulo="Nenhuma conversa agora"
            texto={
              eu === "OFICINA"
                ? "Para falar com uma loja, abra a cotação e toque em “Conversar”."
                : "Para falar com uma oficina, abra a cotação no balcão e toque em “Perguntar à oficina”."
            }
          />
        ) : naCaixa ? (
          <div className="space-y-5">
            {agrupar(conversas).map((g) => (
              <section key={g.chave} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 px-1">
                  <h2 className="min-w-0 truncate font-semibold text-tinta">
                    {g.carro}
                    {g.numero !== null && (
                      <span className="ml-2 text-xs font-normal text-tinta-3">
                        <span className="font-pecapeca font-bold">
                          nº {g.numero}
                        </span>
                      </span>
                    )}
                  </h2>
                  {g.cotacaoId && (
                    <Link
                      href={`/peca-peca/${g.cotacaoId}`}
                      className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-brand-texto underline-offset-4 hover:underline"
                    >
                      Ver cotação
                      <Avancar tamanho={14} />
                    </Link>
                  )}
                </div>
                <ul className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
                  {g.conversas.map((c) => (
                    <li
                      key={c.envioId}
                      className={cn(novas.has(c.envioId) && "linha-chega")}
                    >
                      <button
                        type="button"
                        onClick={() => setAberta(c)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-superficie-2 focus-visible:bg-superficie-2 focus-visible:outline-none"
                      >
                        <Linha c={c} eu={eu} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
            {conversas.map((c) => (
              <li
                key={c.envioId}
                className={cn(novas.has(c.envioId) && "linha-chega")}
              >
                <Link
                  href={c.link}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-superficie-2"
                >
                  <Linha c={c} eu={eu} mostrarAssunto />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {conversas && conversas.length > 0 && (
          <p className="px-1 text-xs text-tinta-3">
            O número de telefone sai escondido nas mensagens, e elas se apagam
            quando a entrega fecha.
          </p>
        )}
      </div>

      {/* Fora da coluna: dentro dela, o espaçamento entre blocos empurrava o chat para baixo. */}
      {aberta?.api && (
        <Conversa
          api={aberta.api}
          titulo={aberta.titulo}
          subtitulo={
            aberta.cotacao
              ? `Cotação nº ${aberta.cotacao.numero}, ${aberta.cotacao.carro}`
              : aberta.subtitulo
          }
          eu={eu}
          pushApi={pushApi}
          link={
            aberta.cotacao
              ? {
                  href: `/peca-peca/${aberta.cotacao.id}`,
                  rotulo: "Ver cotação",
                }
              : undefined
          }
          onFechar={() => {
            setAberta(null);
            // O chat marcou como lido: a caixa já volta com o número certo.
            void carregar();
          }}
        />
      )}
    </>
  );
}

function Linha({
  c,
  eu,
  mostrarAssunto = false,
}: {
  c: ConversaNaLista;
  eu: "OFICINA" | "LOJA";
  mostrarAssunto?: boolean;
}) {
  const nova = c.naoLidas > 0;
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "mt-2 h-2 w-2 shrink-0 rounded-full",
          nova ? "bg-brand-600" : "bg-transparent",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm text-tinta",
              nova ? "font-bold" : "font-medium",
            )}
          >
            {c.titulo}
          </p>
          <span
            className={cn(
              "shrink-0 text-xs",
              nova ? "font-semibold text-brand-texto" : "text-tinta-3",
            )}
          >
            {haQuanto(c.em)}
          </span>
        </div>
        {mostrarAssunto && (
          <p className="truncate text-xs text-tinta-3">{c.subtitulo}</p>
        )}
        {c.ultima && (
          <p
            className={cn(
              "mt-0.5 line-clamp-2 text-sm",
              nova ? "text-tinta" : "text-tinta-2",
            )}
          >
            {c.ultimaDe === eu && <span className="text-tinta-3">Você: </span>}
            {c.ultima}
          </p>
        )}
      </div>
      <ContadorDeMensagens total={c.naoLidas} className="mt-0.5 shrink-0" />
    </>
  );
}

/**
 * Conversas que mudaram desde a última atualização (mensagem nova chegou): acendem de
 * leve. Na primeira carga nada acende — nada é novidade quando a tela acabou de abrir.
 */
function useNovidades(conversas: ConversaNaLista[] | null) {
  const vistas = useRef<Map<string, string> | null>(null);
  const [novas, setNovas] = useState<Set<string>>(() => new Set());
  const chave = conversas?.map((c) => `${c.envioId}@${c.em}`).join(",") ?? null;
  useEffect(() => {
    if (chave === null) return;
    const agora = new Map(
      chave
        ? chave.split(",").map((x) => x.split("@") as [string, string])
        : [],
    );
    const antes = vistas.current;
    vistas.current = agora;
    if (!antes) return;
    const mudaram = [...agora]
      .filter(([id, em]) => antes.get(id) !== em)
      .map(([id]) => id);
    if (mudaram.length === 0) return;
    setNovas(new Set(mudaram));
    const t = setTimeout(() => setNovas(new Set()), 1200);
    return () => clearTimeout(t);
  }, [chave]);
  return novas;
}

/**
 * Quantas mensagens não lidas, para o número no menu. Pergunta pouco (a cada 20 s, com a
 * aba visível) e só o total — que o servidor soma dos envios, sem ler mensagem.
 */
export function useMensagensNaoLidas(api: string | null) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    if (!api) return;
    let vivo = true;
    const ler = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await buscar(`${api}?total=1`, { cache: "no-store" }).catch(
        () => null,
      );
      if (vivo && r?.ok)
        setTotal(((await r.json()) as { total: number }).total);
    };
    void ler();
    const timer = setInterval(ler, 20_000);
    document.addEventListener("visibilitychange", ler);
    return () => {
      vivo = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ler);
    };
  }, [api]);
  return total;
}
