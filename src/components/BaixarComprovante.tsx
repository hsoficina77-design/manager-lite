"use client";

import { useCallback, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import { toDataUrl } from "@/lib/foto-pdf";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { ComprovantePagamentoPdfDocument, type ComprovanteDados } from "./ComprovantePagamentoPdfDocument";

/**
 * Botão que gera direto uma imagem do histórico de pagamento — a mesma coisa
 * que hoje sai de um print recortado à mão para mandar no WhatsApp.
 *
 * Sai só em PNG, sem a escolha de formato do BaixarDocumento: aqui a imagem é
 * o próprio produto, não um documento que também poderia virar PDF.
 */
export default function BaixarComprovante({
  dados,
  rotulo = "Baixar comprovante",
  titulo = "Baixar uma imagem com o histórico de pagamento",
}: {
  dados: ComprovanteDados;
  rotulo?: string;
  titulo?: string;
}) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const baixar = useCallback(async () => {
    setGerando(true);
    setErro(null);
    try {
      // Identidade da oficina só é buscada na hora de baixar — o comprovante é
      // raro perto do número de vezes que a OS abre.
      const config = await carregarConfiguracao();
      const logo = config.logoUrl ? await toDataUrl(config.logoUrl) : undefined;

      const pdfBlob = await comPrazo(
        pdf(
          <ComprovantePagamentoPdfDocument dados={dados} logoSrc={logo} config={config} geradoEm={new Date()} />
        ).toBlob(),
        PRAZO.pdf,
        "Montar o comprovante"
      );

      // Carregado só agora: quem nunca baixa comprovante não paga pelo pdf.js.
      const { pdfParaPngs } = await import("@/lib/pdf-para-imagem");
      const [png] = await comPrazo(pdfParaPngs(pdfBlob), PRAZO.pdf, "Converter em imagem");
      if (!png) throw new Error("Não foi possível gerar a imagem");

      const url = URL.createObjectURL(png);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nomeArquivo(dados)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Falha ao gerar o comprovante");
    } finally {
      setGerando(false);
    }
  }, [dados]);

  return (
    <div className="relative">
      <Botao
        type="button"
        variante="secundario"
        tamanho="denso"
        onClick={baixar}
        disabled={gerando}
        title={erro ? `Não foi possível gerar o comprovante: ${erro}` : titulo}
        className={cn(erro && "border-perigo-linha text-perigo hover:bg-perigo-fraco")}
      >
        <IconeDownload className="h-3.5 w-3.5 shrink-0" />
        {gerando ? "Gerando..." : erro ? "Tentar de novo" : rotulo}
      </Botao>

      {erro && (
        <p role="alert" className="absolute right-0 top-full z-10 mt-1 w-56 text-right text-xs leading-snug text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * Ex.: "Comprovante - OS 123 - João Silva" com um débito só; com vários, o nome
 * cai para "Comprovante - João Silva" — enfileirar as OS no nome do arquivo não
 * caberia na tela do celular de quem recebe.
 */
function nomeArquivo({ cliente, itens }: ComprovanteDados) {
  const nome = limparNome(cliente.nome);
  if (itens.length !== 1) return ["Comprovante", nome].filter(Boolean).join(" - ");
  const identificacao = itens[0].numero != null ? `OS ${itens[0].numero}` : "Dívida";
  return [`Comprovante - ${identificacao}`, nome].filter(Boolean).join(" - ");
}

function IconeDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" />
      <path d="M3.5 13.5v1.75A1.75 1.75 0 0 0 5.25 17h9.5a1.75 1.75 0 0 0 1.75-1.75V13.5" />
    </svg>
  );
}
