 // Redimensiona imagens no navegador (canvas, sem dependências).
// Usado em dois momentos:
//  - upload: fotos de celular (~4MB) viram JPEGs de ~150-300KB no Storage;
//  - PDF: miniaturas menores ainda, só em memória, sem gravar nada no bucket.

const MAX_DIM = 1600;
const QUALITY = 0.8;

// O PDF embute a imagem como data URL: quanto menor, mais leve o arquivo enviado
// ao cliente. A foto em alta continua acessível pelo link da própria imagem.
const MAX_DIM_PDF = 640;
const QUALITY_PDF = 0.72;

export async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const canvas = desenharEscalado(img, MAX_DIM);
  if (!canvas) return file; // fallback: envia original

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  // Se a compressão falhar ou não reduzir, mantém o original
  if (!blob || blob.size >= file.size) return file;
  return blob;
}

// Logo da oficina: arte pequena, mas quem envia costuma mandar a original grande.
const MAX_DIM_LOGO = 512;

/**
 * Prepara a logo para envio: reduz o tamanho sem estragar a arte.
 *
 * Diferente das fotos, aqui não se converte tudo para JPEG — logo com fundo
 * transparente viraria um retângulo branco no cabeçalho da OS. PNG continua PNG,
 * e SVG passa direto (é vetor: já é leve e escala sozinho).
 */
export async function compressLogo(file: File): Promise<Blob> {
  if (file.type === "image/svg+xml") return file;

  const img = await loadImage(await readAsDataUrl(file));
  if (img.naturalWidth <= MAX_DIM_LOGO && img.naturalHeight <= MAX_DIM_LOGO) return file;

  const canvas = desenharEscalado(img, MAX_DIM_LOGO);
  if (!canvas) return file;

  const tipo = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, tipo, QUALITY)
  );
  if (!blob || blob.size >= file.size) return file;
  return blob;
}

/**
 * Gera uma miniatura em data URL a partir de um blob de imagem.
 * Nada é gravado — a miniatura só existe enquanto o PDF é montado.
 */
export async function toThumbDataUrl(
  blob: Blob,
  maxDim = MAX_DIM_PDF,
  quality = QUALITY_PDF
): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImage(objectUrl);
    const canvas = desenharEscalado(img, maxDim);
    // Sem canvas (navegador antigo), cai para a imagem original.
    if (!canvas) return await readAsDataUrl(blob);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Desenha a imagem reduzida para caber em maxDim, mantendo a proporção. */
function desenharEscalado(img: HTMLImageElement, maxDim: number): HTMLCanvasElement | null {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = src;
  });
}
