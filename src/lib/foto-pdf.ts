// Preparo das imagens para os PDFs (OS e orçamento). Roda só no navegador: usa
// canvas e FileReader.

import { toThumbDataUrl } from "@/lib/image-compress";
import { PRAZO, fetchComPrazo } from "@/lib/tempo-limite";

/**
 * Foto pronta para o PDF: `src` é uma miniatura em data URL (o react-pdf não busca
 * imagens remotas de forma confiável) e `url` é a original no Storage, usada como
 * link — o PDF fica leve e a foto em alta continua a um toque, sem gravar nada novo.
 */
export type FotoPdf = {
  id: string;
  src: string;
  url: string;
  legenda: string | null;
  tipo: string;
  createdAt: string;
};

/** Foto como ela vem da API, antes de virar miniatura. */
export type FotoDoDocumento = {
  id: string;
  url: string;
  legenda: string | null;
  tipo: string;
  createdAt: string;
};

/** Baixa um arquivo e devolve o conteúdo em data URL (usado para a logo). */
export async function toDataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetchComPrazo(url, PRAZO.imagem);
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
export async function toFotoPdf(foto: FotoDoDocumento): Promise<FotoPdf | null> {
  try {
    const res = await fetchComPrazo(foto.url, PRAZO.imagem);
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

/** Converte a lista inteira, descartando as que falharam. */
export async function fotosParaPdf(fotos: FotoDoDocumento[]): Promise<FotoPdf[]> {
  const convertidas = await Promise.all(fotos.map(toFotoPdf));
  return convertidas.filter((f): f is FotoPdf => f !== null);
}
