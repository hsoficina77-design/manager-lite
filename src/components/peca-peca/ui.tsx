"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { CampoCidade } from "@/components/ui/CampoCidade";
import type { Municipio } from "@/lib/municipios";
import { useAvisar } from "@/components/ui/Avisos";
import { Voltar } from "@/components/ui/Icones";
import { LogoPecaPeca } from "@/components/marca/LogoPecaPeca";
import { useProduto } from "@/components/ProdutoProvider";
import { useUsaBoxOS } from "@/components/UsuarioProvider";
import { ETAPAS, FORMAS_DE_PAGAMENTO, etapaDa, type CotacaoVista, type FormaDePagamento } from "./regras";

/**
 * Como a oficina vai pagar: três botões lado a lado. A loja lê no balcão — é o que decide
 * o desconto —, e a comparação dos preços usa a forma marcada.
 */
export function EscolhaDaForma({
  valor,
  onChange,
  desligado = false,
}: {
  valor: FormaDePagamento;
  onChange: (forma: FormaDePagamento) => void;
  desligado?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Como vai pagar" className="grid grid-cols-3 gap-1.5">
      {(Object.keys(FORMAS_DE_PAGAMENTO) as FormaDePagamento[]).map((forma) => (
        <button
          key={forma}
          type="button"
          role="radio"
          aria-checked={valor === forma}
          disabled={desligado}
          onClick={() => valor !== forma && onChange(forma)}
          className={cn(
            "min-h-11 rounded-lg border px-2 text-sm font-medium leading-tight transition-colors disabled:cursor-default",
            valor === forma
              ? "border-brand-500 bg-brand-50 text-tinta"
              : "border-linha text-tinta-2 enabled:hover:border-brand-500 disabled:opacity-60"
          )}
        >
          {FORMAS_DE_PAGAMENTO[forma].rotulo}
        </button>
      ))}
    </div>
  );
}

/** Nome do produto, com as cores dele — também dentro do boxOS: é outro produto. */
export function MarcaPecaPeca({ className }: { className?: string }) {
  return <LogoPecaPeca className={cn("text-tinta", className)} />;
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
  // Dentro do boxOS a marca diz que esta parte é o Peça Peça; na moldura do próprio
  // Peça Peça ela já está no cabeçalho de cima.
  const naMolduraPropria = useProduto() === "peca-peca" || !useUsaBoxOS();
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
          {!naMolduraPropria && <MarcaPecaPeca className="text-sm" />}
          <h1 className={cn("text-xl font-bold text-tinta", !naMolduraPropria && "mt-1")}>{titulo}</h1>
          {subtitulo && <div className="mt-0.5 text-sm text-tinta-3">{subtitulo}</div>}
        </div>
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}

const REGUA_DO_RECADO = {
  atencao: "border-[rgb(var(--gr-sem-resposta))]",
  ok: "border-[rgb(var(--gr-vendida))]",
  marca: "border-brand-600",
} as const;

/**
 * Recado no meio da tela: uma régua de cor à esquerda e o texto na tinta de sempre.
 * Substitui as caixas pastel (fundo âmbar ou verde com contorno), que eram a mesma
 * caixa em toda tela e brigavam com o conteúdo. A régua diz o tom; a frase, o resto.
 */
export function Recado({
  tom = "atencao",
  titulo,
  className,
  children,
  role,
}: {
  tom?: keyof typeof REGUA_DO_RECADO;
  titulo?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <div role={role} className={cn("border-l-[3px] py-0.5 pl-3.5", REGUA_DO_RECADO[tom], className)}>
      {titulo && <p className="text-sm font-semibold text-tinta">{titulo}</p>}
      {children && <div className={cn("text-sm text-tinta-2", titulo && "mt-1")}>{children}</div>}
    </div>
  );
}

/** Aparece quando a conexão cai: os dados na tela podem estar velhos. */
export function AvisoSemConexao({ ativo }: { ativo: boolean }) {
  if (!ativo) return null;
  return (
    <Recado role="status">Sem conexão agora. A tela volta a se atualizar sozinha quando a internet voltar.</Recado>
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
    <form onSubmit={salvar} className="space-y-2 border-l-[3px] border-[rgb(var(--gr-sem-resposta))] py-0.5 pl-3.5">
      <p className="text-sm font-semibold text-tinta">
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
