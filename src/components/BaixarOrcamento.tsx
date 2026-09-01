"use client";

import { useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import BaixarDocumento from "./BaixarDocumento";
import { OrcamentoPdfDocument, type OrcamentoForPdf } from "./OrcamentoPdfDocument";

async function toDataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

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
    // Identidade e logo só são buscadas na hora de gerar o arquivo.
    const config = await carregarConfiguracao();
    const logo = config.logoUrl ? await toDataUrl(config.logoUrl) : undefined;

    return await pdf(
      <OrcamentoPdfDocument orc={orc} logoSrc={logo} config={config} />
    ).toBlob();
  }, [orc]);

  return (
    <BaixarDocumento gerarPdf={gerarPdf} nomeBase={nomeArquivo(orc)} descricao="o orçamento" />
  );
}
