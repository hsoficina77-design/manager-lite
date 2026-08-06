"use client";

import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { toThumbDataUrl } from "@/lib/image-compress";
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

/** Remove caracteres que o Windows/macOS não aceitam em nome de arquivo. */
function limpar(texto: string) {
  return texto.replace(/[\\/:*?"<>|]/g, "").trim();
}

/** Ex.: "OS 123 - João Silva - Gol ABC1D23.pdf" */
function nomeArquivo(os: OSForPdf) {
  const { marca, modelo, placa } = os.veiculo;
  const veiculo = [marca, modelo, placa].filter(Boolean).join(" ");
  const partes = [`OS ${os.numero}`, limpar(os.cliente.nome), limpar(veiculo)];
  return `${partes.filter(Boolean).join(" - ")}.pdf`;
}

export default function OSPdfButton({ os }: { os: OSForPdf }) {
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    toDataUrl("/logo-hs.png").then(setLogo);
  }, []);

  async function baixar() {
    setGerando(true);
    setErro(false);
    try {
      // As imagens precisam virar data URL antes de entrar no PDF.
      const convertidas = await Promise.all((os.fotos ?? []).map(toFotoPdf));
      const fotos = convertidas.filter((f): f is FotoPdf => f !== null);

      const blob = await pdf(<OSPdfDocument os={os} logoSrc={logo} fotos={fotos} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo(os);
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

  const totalFotos = os.fotos?.length ?? 0;

  return (
    <button
      onClick={baixar}
      disabled={gerando}
      title={erro ? "Não foi possível gerar o PDF — tente de novo" : "Salvar a OS em PDF"}
      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
    >
      {gerando
        ? totalFotos > 0
          ? "Gerando PDF..."
          : "Gerando..."
        : erro
          ? "Tentar de novo"
          : "Baixar"}
    </button>
  );
}
