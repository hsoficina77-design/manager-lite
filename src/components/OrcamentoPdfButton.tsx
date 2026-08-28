"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
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

/** Remove caracteres que o Windows/macOS não aceitam em nome de arquivo. */
function limpar(texto: string) {
  return texto.replace(/[\\/:*?"<>|]/g, "").trim();
}

/** Ex.: "Orçamento 123 - João Silva - Gol ABC1D23.pdf" */
function nomeArquivo(orc: OrcamentoForPdf) {
  const clienteNome = orc.cliente?.nome || orc.clienteNome?.trim() || "";
  const veiculo = orc.veiculo
    ? [orc.veiculo.marca, orc.veiculo.modelo, orc.veiculo.placa].filter(Boolean).join(" ")
    : orc.veiculoDesc?.trim() || "";
  const partes = [`Orçamento ${orc.numero}`, limpar(clienteNome), limpar(veiculo)];
  return `${partes.filter(Boolean).join(" - ")}.pdf`;
}

export default function OrcamentoPdfButton({ orc }: { orc: OrcamentoForPdf }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  async function baixar() {
    setGerando(true);
    setErro(false);
    try {
      // Identidade e logo só são buscadas na hora de gerar o arquivo.
      const config = await carregarConfiguracao();
      const logo = config.logoUrl ? await toDataUrl(config.logoUrl) : undefined;

      const blob = await pdf(
        <OrcamentoPdfDocument orc={orc} logoSrc={logo} config={config} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo(orc);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErro(true);
    } finally {
      setGerando(false);
    }
  }

  return (
    <button
      onClick={baixar}
      disabled={gerando}
      title={erro ? "Não foi possível gerar o PDF — tente de novo" : "Salvar o orçamento em PDF"}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
    >
      {gerando ? "Gerando..." : erro ? "Tentar de novo" : "Baixar"}
    </button>
  );
}
