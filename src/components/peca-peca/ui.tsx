"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PecaPeca, Voltar } from "@/components/ui/Icones";
import { ETAPAS, etapaDa, type Cotacao } from "./dados";

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

/** Lembra, em toda tela, o que é de mentira e o que é de verdade. */
export function AvisoDaPrevia({ children }: { children?: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-linha-forte bg-superficie-2 px-3 py-2 text-xs text-tinta-3">
      {children ?? (
        <>
          <span className="font-semibold text-tinta-2">Prévia.</span> As lojas ainda são simuladas e as
          cotações ficam guardadas só neste aparelho. O orçamento que sai no final é de verdade, no boxOS.
        </>
      )}
    </p>
  );
}

/** Troca entre o que a oficina vê e o que o balconista da loja vê. */
export function AlternarVisao({ atual }: { atual: "oficina" | "loja" }) {
  const opcoes = [
    { valor: "oficina", rotulo: "Visão da oficina", href: "/peca-peca" },
    { valor: "loja", rotulo: "Visão da loja", href: "/peca-peca/loja" },
  ] as const;
  return (
    <div role="tablist" className="inline-flex rounded-lg border border-linha bg-superficie p-1">
      {opcoes.map((o) => (
        <Link
          key={o.valor}
          href={o.href}
          role="tab"
          aria-selected={atual === o.valor}
          className={cn(
            "flex min-h-9 items-center rounded-md px-3 text-sm font-medium transition-colors",
            atual === o.valor ? "bg-contraste text-contraste-fg" : "text-tinta-2 hover:bg-superficie-2"
          )}
        >
          {o.rotulo}
        </Link>
      ))}
    </div>
  );
}

export function PilulaEtapa({ cotacao }: { cotacao: Cotacao }) {
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
