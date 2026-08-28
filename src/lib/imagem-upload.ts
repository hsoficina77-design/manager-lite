// Validação de imagem no servidor, pela assinatura dos bytes.
//
// O `type` de um arquivo de multipart é *declarado por quem envia* — o navegador o
// preenche a partir da extensão, e um cliente qualquer preenche com o que quiser.
// Como o Storage guarda e depois serve o arquivo com o content-type que recebeu,
// confiar nessa declaração é o que transformaria o bucket em hospedagem de conteúdo
// arbitrário: basta enviar um SVG (que é HTML executável) dizendo "image/png".
//
// Por isso o formato sai daqui, dos primeiros bytes do arquivo, e é esse formato —
// não o declarado — que vai para o Storage.

export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"] as const;
export type TipoImagem = (typeof TIPOS_IMAGEM)[number];

/** Rótulo dos formatos aceitos, para a mensagem de erro não repetir a lista na mão. */
export const FORMATOS_ACEITOS = "JPG, PNG ou WebP";

/**
 * Formato real do arquivo pela assinatura (magic bytes), ou null quando não é
 * nenhuma das imagens aceitas.
 *
 * SVG fica de fora de propósito: é o único formato de imagem da web que executa
 * script, e um bucket público serve o arquivo na íntegra.
 */
export function tipoRealDaImagem(bytes: ArrayBuffer): TipoImagem | null {
  const b = new Uint8Array(bytes);
  // 12 bytes é o cabeçalho do WebP, o maior dos três.
  if (b.length < 12) return null;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";

  // PNG: 89 "PNG" CR LF SUB LF
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (PNG.every((valor, i) => b[i] === valor)) return "image/png";

  // WebP: "RIFF" ....(tamanho).... "WEBP"
  const ascii = (inicio: number, fim: number) =>
    String.fromCharCode(...b.subarray(inicio, fim));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";

  return null;
}
