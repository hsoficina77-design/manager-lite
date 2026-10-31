"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import type { ConversaNaLista } from "./regras";
import { buscar, useAoVivo } from "./aoVivo";
import { AvisoSemConexao, haQuanto } from "./ui";
import { AvisoNoCelular, ContadorDeMensagens } from "./Conversa";

// A caixa "Conversas": as conversas de todas as cotações, a mais recente em cima — a
// mesma tela para a oficina e para a loja. Cada linha leva à cotação com a conversa
// aberta. Lê só o resumo guardado no envio, nunca as mensagens.

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
  const { dados, semConexao } = useAoVivo<{ total: number; conversas: ConversaNaLista[] }>(api, 8000);
  const conversas = dados?.conversas ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold text-tinta">Conversas</h1>
        <p className="mt-0.5 text-sm text-tinta-3">
          {eu === "OFICINA"
            ? "O que as lojas perguntaram e responderam sobre as suas cotações."
            : "O que as oficinas perguntaram e responderam sobre as cotações da loja."}{" "}
          As mensagens se apagam quando a entrega fecha.
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
      ) : (
        <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
          {conversas.map((c) => (
            <Link
              key={c.envioId}
              href={c.link}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-superficie-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={cn("truncate text-sm text-tinta", c.naoLidas > 0 ? "font-bold" : "font-medium")}>
                    {c.titulo}
                  </p>
                  <span className="shrink-0 text-xs text-tinta-3">{haQuanto(c.em)}</span>
                </div>
                <p className="truncate text-xs text-tinta-3">{c.subtitulo}</p>
                {c.ultima && (
                  <p className={cn("mt-0.5 truncate text-sm", c.naoLidas > 0 ? "text-tinta" : "text-tinta-2")}>
                    {c.ultimaDe === eu && <span className="text-tinta-3">Você: </span>}
                    {c.ultima}
                  </p>
                )}
              </div>
              <ContadorDeMensagens total={c.naoLidas} className="mt-0.5 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
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
      const r = await buscar(`${api}?total=1`, { cache: "no-store" }).catch(() => null);
      if (vivo && r?.ok) setTotal(((await r.json()) as { total: number }).total);
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
