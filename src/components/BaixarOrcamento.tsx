"use client";

import { useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import { fotosParaPdf, toDataUrl } from "@/lib/foto-pdf";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";
import BaixarDocumento from "./BaixarDocumento";
import { OrcamentoPdfDocument, type OrcamentoForPdf } from "./OrcamentoPdfDocument";

/** Ex.: "Orçamento 123 - João Silva - Gol ABC1D23" */
function nomeArquivo(orc: OrcamentoForPdf) {
  const clienteNome = orc.cliente?.nome || orc.clienteNome?.trim() || "";
  const veiculo = orc.veiculo
    ? [orc.veiculo.marca, orc.veiculo.modelo, orc.veiculo.placa].filter(Boolean).join(" ")
    : orc.veiculoDesc?.trim() || "";
  const partes = [`Orçamento ${orc.numero}`, limparNome(clienteNome), limparNome(veiculo)];
  return partes.filter(Boolean).join(" - ");
}

export default function BaixarOrcamento({ orc }: { orc: OrcamentoForPdf }) {
  const gerarPdf = useCallback(async () => {
    // Identidade, logo e fotos só são buscadas na hora de gerar o arquivo.
    const config = await carregarConfiguracao();
    const logo = config.logoUrl ? await toDataUrl(config.logoUrl) : undefined;

    // As imagens precisam virar data URL antes de entrar no PDF.
    const fotos = await fotosParaPdf(orc.fotos ?? []);

    return await comPrazo(
      pdf(
        <OrcamentoPdfDocument orc={orc} logoSrc={logo} fotos={fotos} config={config} />
      ).toBlob(),
      PRAZO.pdf,
      "Montar o PDF"
    );
  }, [orc]);

  return (
    <BaixarDocumento gerarPdf={gerarPdf} nomeBase={nomeArquivo(orc)} descricao="o orçamento" />
  );
}
