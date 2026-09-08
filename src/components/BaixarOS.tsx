"use client";

import { useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import { fotosParaPdf, toDataUrl } from "@/lib/foto-pdf";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";
import BaixarDocumento from "./BaixarDocumento";
import { OSPdfDocument, type OSForPdf } from "./OSPdfDocument";

/** Ex.: "OS 123 - João Silva - Gol ABC1D23" */
function nomeArquivo(os: OSForPdf) {
  const { marca, modelo, placa } = os.veiculo;
  const veiculo = [marca, modelo, placa].filter(Boolean).join(" ");
  const partes = [`OS ${os.numero}`, limparNome(os.cliente.nome), limparNome(veiculo)];
  return partes.filter(Boolean).join(" - ");
}

export default function BaixarOS({ os, comoItem = false }: { os: OSForPdf; comoItem?: boolean }) {
  const gerarPdf = useCallback(async () => {
    // Identidade da oficina e imagens só são buscadas na hora de gerar: o arquivo
    // é raro perto do número de vezes que a tela da OS abre.
    const config = await carregarConfiguracao();
    const logo = config.logoUrl ? await toDataUrl(config.logoUrl) : undefined;

    // As imagens precisam virar data URL antes de entrar no PDF.
    const fotos = await fotosParaPdf(os.fotos ?? []);

    return await comPrazo(
      pdf(<OSPdfDocument os={os} logoSrc={logo} fotos={fotos} config={config} />).toBlob(),
      PRAZO.pdf,
      "Montar o PDF"
    );
  }, [os]);

  return (
    <BaixarDocumento
      gerarPdf={gerarPdf}
      nomeBase={nomeArquivo(os)}
      descricao="a OS"
      comoItem={comoItem}
    />
  );
}
