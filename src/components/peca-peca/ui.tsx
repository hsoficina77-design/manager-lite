"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PecaPeca, Voltar } from "@/components/ui/Icones";
import { ETAPAS, etapaDa, type CotacaoVista } from "./regras";

/** Nome do produto. Fica dentro do boxOS, então usa as cores dele. */
export function MarcaPecaPeca({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-marca font-bold tracking-tight", className)}>
      <PecaPeca tamanho={18} className="text-brand-600" />
      <span className="text-tinta">
        Peça<span className="text-brand-texto">Peça</span>
      </span>
      <span className="rounded-full bg-brand-100 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-wide text-brand-texto">
        Prévia
      </span>
    </span>
  );
}

export function Cabecalho({
  titulo,
  subtitulo,
  voltar,
  acao,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  voltar?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {voltar && (
          <Link
            href={voltar}
            aria-label="Voltar"
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-3 transition-colors hover:bg-superficie-2 hover:text-tinta"
          >
            <Voltar tamanho={18} />
          </Link>
        )}
        <div className="min-w-0">
          <MarcaPecaPeca className="text-sm" />
          <h1 className="mt-1 text-xl font-bold text-tinta">{titulo}</h1>
          {subtitulo && <div className="mt-0.5 text-sm text-tinta-3">{subtitulo}</div>}
        </div>
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}

/** Lembra, em toda tela, o que ainda é de teste. */
export function AvisoDaPrevia({ children }: { children?: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-linha-forte bg-superficie-2 px-3 py-2 text-xs text-tinta-3">
      {children ?? (
        <>
          <span className="font-semibold text-tinta-2">Prévia.</span> As cotações já são de verdade e as lojas
          respondem pelo balcão delas, em tempo real. Para testar, abra os balcões em outras abas e faça o papel
          do balconista.
        </>
      )}
    </p>
  );
}

/** Aparece quando a conexão cai: os dados na tela podem estar velhos. */
export function AvisoSemConexao({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return (
    <p role="status" className="rounded-lg border border-atencao-linha bg-atencao-fraco px-3 py-2 text-xs text-atencao">
      Sem conexão agora. A tela volta a se atualizar sozinha quando a internet voltar.
    </p>
  );
}

export function PilulaEtapa({ cotacao }: { cotacao: CotacaoVista }) {
  const etapa = ETAPAS[etapaDa(cotacao)];
  return <span className={cn(etapa.cor, "shrink-0")}>{etapa.rotulo}</span>;
}

export function horaCurta(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function haQuanto(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
