"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { CampoCidade } from "@/components/ui/CampoCidade";
import type { Municipio } from "@/lib/municipios";
import { useAvisar } from "@/components/ui/Avisos";
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

/** Aparece quando a conexão cai: os dados na tela podem estar velhos. */
export function AvisoSemConexao({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return (
    <p role="status" className="rounded-lg border border-atencao-linha bg-atencao-fraco px-3 py-2 text-xs text-atencao">
      Sem conexão agora. A tela volta a se atualizar sozinha quando a internet voltar.
    </p>
  );
}

/**
 * Para a oficina que se cadastrou antes de a cidade ser pedida: sem ela, aparecem as
 * lojas de todas as regiões. Grava só a cidade (a mesma de Configurações).
 */
export function InformarCidade({ cidadeAtual, onSalva }: { cidadeAtual?: string | null; onSalva: () => void }) {
  const avisar = useAvisar();
  const [municipio, setMunicipio] = useState<Municipio | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!municipio) return setErro("Escolha a cidade na lista.");
    setErro("");
    setSalvando(true);
    try {
      const r = await fetch("/api/peca-peca/cidade", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade: municipio.nome, estado: municipio.uf }),
      });
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) return setErro(corpo.error ?? "Não consegui salvar a cidade.");
      avisar(`Cidade salva: ${corpo.cidade} - ${corpo.estado}`);
      onSalva();
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-2 rounded-xl border border-atencao-linha bg-atencao-fraco p-4">
      <p className="text-sm font-semibold text-atencao">
        {cidadeAtual ? "Confirme a cidade da oficina" : "Em que cidade fica a oficina?"}
      </p>
      <p className="text-sm text-tinta-2">
        É por ela que aparecem as autopeças que atendem a sua região.
        {cidadeAtual ? " Escolha na lista para ela ficar com o nome oficial e o estado." : " Sem a cidade, aparecem as lojas de todas as regiões."}
      </p>
      <div className="flex gap-2">
        <div className="min-w-0 max-w-xs flex-1">
          <CampoCidade
            valor={municipio}
            onChange={setMunicipio}
            textoInicial={cidadeAtual ?? undefined}
            aria-label="Cidade da oficina"
          />
        </div>
        <Botao type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </Botao>
      </div>
      {erro && <p className="text-xs text-perigo">{erro}</p>}
    </form>
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
