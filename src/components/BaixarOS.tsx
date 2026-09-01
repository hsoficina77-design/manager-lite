"use client";

import { useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { toThumbDataUrl } from "@/lib/image-compress";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import BaixarDocumento from "./BaixarDocumento";
import { OSPdfDocument, type FotoPdf, type OSForPdf } from "./OSPdfDocument";

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

/**
 * Baixa a foto e reduz para miniatura só na memória. O PDF carrega a miniatura e
 * aponta para a original no Storage — nada de novo é gravado no bucket.
 */
async function toFotoPdf(foto: NonNullable<OSForPdf["fotos"]>[number]): Promise<FotoPdf | null> {
  try {
    const res = await fetch(foto.url);
    if (!res.ok) return null;
    const src = await toThumbDataUrl(await res.blob());
    return {
      id: foto.id,
      src,
      url: foto.url,
      legenda: foto.legenda,
      tipo: foto.tipo,
      createdAt: foto.createdAt,
    };
  } catch {
    return null;
  }
}

/** Ex.: "OS 123 - João Silva - Gol ABC1D23" */
function nomeArquivo(os: OSForPdf) {
  const { marca, modelo, placa } = os.veiculo;
  const veiculo = [marca, modelo, placa].filter(Boolean).join(" ");
  const partes = [`OS ${os.numero}`, limparNome(os.cliente.nome), limparNome(veiculo)];
  return partes.filter(Boolean).join(" - ");
}

export default function BaixarOS({ os }: { os: OSForPdf }) {
  const gerarPdf = useCallback(async () => {
    // Identidade da oficina e imagens só são buscadas na hora de gerar: o arquivo
    // é raro perto do número de vezes que a tela da OS abre.
    const config = await carregarConfiguracao();
    const logo = config.logoUrl ? await toDataUrl(config.logoUrl) : undefined;

    // As imagens precisam virar data URL antes de entrar no PDF.
    const convertidas = await Promise.all((os.fotos ?? []).map(toFotoPdf));
    const fotos = convertidas.filter((f): f is FotoPdf => f !== null);

    return await pdf(
      <OSPdfDocument os={os} logoSrc={logo} fotos={fotos} config={config} />
    ).toBlob();
  }, [os]);

  return <BaixarDocumento gerarPdf={gerarPdf} nomeBase={nomeArquivo(os)} descricao="a OS" />;
}
