"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FORMATOS,
  formatoSalvo,
  salvarFormato,
  type FormatoDownload,
} from "@/lib/formato-download";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";

/**
 * Botão de baixar com escolha de formato — usado pela OS e pelo orçamento.
 *
 * É um botão dividido: a parte grande baixa no formato que a pessoa usou da
 * última vez (o caso comum, um toque só) e a setinha abre a troca de formato.
 * Escolher no menu já baixa naquele formato, para que ninguém precise escolher e
 * clicar de novo.
 *
 * A imagem sai do próprio PDF (ver src/lib/pdf-para-imagem.ts), então os dois
 * formatos mostram exatamente o mesmo documento.
 */
export default function BaixarDocumento({
  gerarPdf,
  nomeBase,
  descricao,
}: {
  /** Monta o PDF do documento. Chamado só na hora de baixar. */
  gerarPdf: () => Promise<Blob>;
  /** Nome do arquivo sem extensão. Ex.: "OS 123 - João Silva - Gol ABC1D23". */
  nomeBase: string;
  /** Como o documento se chama nas dicas. Ex.: "a OS", "o orçamento". */
  descricao: string;
}) {
  const [formato, setFormato] = useState<FormatoDownload>("pdf");
  const [menuAberto, setMenuAberto] = useState(false);
  const [gerando, setGerando] = useState<FormatoDownload | null>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  // Guarda a mensagem, não só "deu erro": quando o arquivo não sai, saber em qual
  // passo travou é a diferença entre relatar o problema e adivinhar.
  const [erro, setErro] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // A preferência só é lida no navegador: ler durante a renderização quebraria a
  // primeira pintura da tela.
  useEffect(() => setFormato(formatoSalvo()), []);

  // Fecha o menu ao tocar fora ou apertar Esc — comportamento que todo mundo já
  // espera de um menu.
  useEffect(() => {
    if (!menuAberto) return;
    function fora(e: MouseEvent) {
      if (!caixa.current?.contains(e.target as Node)) setMenuAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAberto(false);
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [menuAberto]);

  const baixar = useCallback(
    async (alvo: FormatoDownload) => {
      const info = FORMATOS.find((f) => f.valor === alvo)!;
      setGerando(alvo);
      setProgresso(null);
      setErro(null);
      try {
        let arquivo = await gerarPdf();

        if (alvo === "imagem") {
          // Carregado só agora: quem baixa em PDF nunca busca o pdf.js.
          const { pdfParaPng } = await import("@/lib/pdf-para-imagem");
          arquivo = await comPrazo(
            pdfParaPng(arquivo, ({ pagina, total }) =>
              // Só conta as páginas quando há mais de uma — em documento de página
              // única o "1/1" só faria o botão pular de largura.
              setProgresso(total > 1 ? `${pagina}/${total}` : null)
            ),
            PRAZO.pdf,
            "Converter em imagem"
          );
        }

        const url = URL.createObjectURL(arquivo);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nomeBase}.${info.extensao}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        setErro(err instanceof Error ? err.message : "Falha ao gerar o arquivo");
      } finally {
        setGerando(null);
        setProgresso(null);
      }
    },
    [gerarPdf, nomeBase]
  );

  function escolher(alvo: FormatoDownload) {
    setFormato(alvo);
    salvarFormato(alvo);
    setMenuAberto(false);
    baixar(alvo);
  }

  const atual = FORMATOS.find((f) => f.valor === formato)!;
  const ocupado = gerando !== null;

  const rotulo = ocupado
    ? `Gerando ${gerando === "imagem" ? "imagem" : "PDF"}${progresso ? ` ${progresso}` : ""}...`
    : erro
      ? "Tentar de novo"
      : `Baixar ${atual.label}`;

  return (
    <div ref={caixa} className="relative">
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-lg border",
          erro ? "border-red-300" : "border-zinc-300"
        )}
      >
        <button
          onClick={() => baixar(formato)}
          disabled={ocupado}
          title={erro ? `Não foi possível gerar o arquivo: ${erro}` : `Salvar ${descricao} em ${atual.label}`}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60",
            erro ? "text-red-600" : "text-zinc-700"
          )}
        >
          <IconeDownload className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">{rotulo}</span>
        </button>

        <button
          onClick={() => setMenuAberto((v) => !v)}
          disabled={ocupado}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          aria-label="Escolher o formato do download"
          title="Escolher o formato: PDF ou imagem"
          className={cn(
            "border-l px-2 text-zinc-500 hover:bg-zinc-50 disabled:opacity-60",
            erro ? "border-red-300" : "border-zinc-300",
            menuAberto && "bg-zinc-100"
          )}
        >
          <IconeSeta className={cn("h-4 w-4 transition-transform", menuAberto && "rotate-180")} />
        </button>
      </div>

      {/* A mensagem fica à vista: quem está no balcão precisa saber se foi a rede
          ou o próprio documento antes de tentar de novo. */}
      {erro && (
        <p role="alert" className="mt-1 max-w-[16rem] text-right text-xs leading-snug text-red-600">
          {erro}
        </p>
      )}

      {menuAberto && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          <p className="border-b border-zinc-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Baixar como
          </p>
          {FORMATOS.map((f) => {
            const selecionado = f.valor === formato;
            return (
              <button
                key={f.valor}
                role="menuitemradio"
                aria-checked={selecionado}
                onClick={() => escolher(f.valor)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-zinc-50"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selecionado ? "border-brand-500 bg-brand-500" : "border-zinc-300"
                  )}
                >
                  {selecionado && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-zinc-800">
                    {f.label}
                    <span className="ml-1 font-normal text-zinc-400">.{f.extensao}</span>
                  </span>
                  <span className="block text-xs leading-snug text-zinc-500">{f.descricao}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconeDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" />
      <path d="M3.5 13.5v1.75A1.75 1.75 0 0 0 5.25 17h9.5a1.75 1.75 0 0 0 1.75-1.75V13.5" />
    </svg>
  );
}

function IconeSeta({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5.5 8 4.5 4.5L14.5 8" />
    </svg>
  );
}
