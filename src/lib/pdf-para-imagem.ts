// Converte o PDF já montado (ver OSPdfDocument / OrcamentoPdfDocument) em imagens
// PNG — uma por página.
//
// A imagem sai do próprio PDF em vez de um HTML paralelo: assim existe um só
// layout para manter, e o que o cliente vê na imagem é exatamente o que sairia
// impresso. O pdfjs-dist só é baixado quando alguém escolhe imagem — quem baixa
// em PDF não paga por ele.
//
// Uma imagem por página, e não uma folha empilhada: empilhando, o limite de
// canvas do navegador é dividido entre todas as páginas, então uma OS com fotos
// borrava também o texto da primeira folha. Separadas, cada página usa o limite
// inteiro e sai na resolução cheia — que é o que se lê no WhatsApp.
//
// Os arquivos que o pdf.js busca em `/pdfjs/` são colocados lá por
// scripts/pdfjs-assets.mjs.

const WORKER_URL = "/pdfjs/pdf.worker.min.mjs";
const FONTES_URL = "/pdfjs/standard_fonts/";

// 3x ≈ 220 DPI numa folha A4. Dá para dar zoom no número da peça sem embaçar, e
// o WhatsApp recomprime na hora de enviar — mandar pixel a mais é barato, e a
// nitidez perdida numa origem pequena não volta.
const ESCALA_ALVO = 3;
const ESCALA_MINIMA = 0.75;

// Canvas grande demais volta em branco em alguns celulares, sem erro nenhum.
// Estes limites são conservadores de propósito — vale mais uma imagem um pouco
// menor do que um arquivo vazio na mão do cliente.
const LADO_MAXIMO = 10000;
const AREA_MAXIMA = 16_000_000;

const COR_PAGINA = "#ffffff";

export type ProgressoImagem = { pagina: number; total: number };

/**
 * Rasteriza o PDF em um PNG por página, na ordem do documento.
 *
 * @param onProgresso chamado a cada página desenhada — o botão usa para avisar
 *   que documentos com muitas fotos demoram mais.
 */
export async function pdfParaPngs(
  pdfBlob: Blob,
  onProgresso?: (p: ProgressoImagem) => void
): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;

  const tarefa = pdfjs.getDocument({
    data: new Uint8Array(await pdfBlob.arrayBuffer()),
    standardFontDataUrl: FONTES_URL,
  });

  try {
    const doc = await tarefa.promise;
    const total = doc.numPages;

    // O mesmo canvas serve a todas as páginas: redimensionar já limpa o que
    // havia, e criar um por página deixaria vários bitmaps grandes vivos ao
    // mesmo tempo — que é justamente o que faz o celular devolver folha branca.
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("2d")) throw new Error("Navegador sem suporte a canvas");

    const pngs: Blob[] = [];
    for (let n = 1; n <= total; n++) {
      const pagina = await doc.getPage(n);
      const viewport = pagina.getViewport({ scale: escalaQueCabe(pagina.getViewport({ scale: 1 })) });

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await pagina.render({ canvas, viewport, background: COR_PAGINA }).promise;

      const png = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!png) throw new Error(`Não foi possível gerar a imagem da página ${n}`);
      pngs.push(png);

      // Libera o bitmap antes da próxima página, em vez de esperar o coletor.
      pagina.cleanup();
      onProgresso?.({ pagina: n, total });
    }

    return pngs;
  } finally {
    // Encerra o worker: sem isso ele fica vivo até a aba fechar.
    await tarefa.destroy();
  }
}

/**
 * Maior escala que ainda cabe nos limites de canvas do navegador, para UMA
 * página. A4 em ESCALA_ALVO dá ~1785x2525px, bem dentro do limite — a conta só
 * age em página fora do comum.
 */
function escalaQueCabe({ width, height }: { width: number; height: number }): number {
  const limiteLado = Math.min(LADO_MAXIMO / width, LADO_MAXIMO / height);
  const limiteArea = Math.sqrt(AREA_MAXIMA / (width * height));

  return Math.max(ESCALA_MINIMA, Math.min(ESCALA_ALVO, limiteLado, limiteArea));
}
