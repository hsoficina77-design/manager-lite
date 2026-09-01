// Converte o PDF já montado (ver OSPdfDocument / OrcamentoPdfDocument) em uma
// única imagem PNG, com as páginas empilhadas na vertical.
//
// A imagem sai do próprio PDF em vez de um HTML paralelo: assim existe um só
// layout para manter, e o que o cliente vê na imagem é exatamente o que sairia
// impresso. O pdfjs-dist só é baixado quando alguém escolhe imagem — quem baixa
// em PDF não paga por ele.
//
// Os arquivos que o pdf.js busca em `/pdfjs/` são colocados lá por
// scripts/pdfjs-assets.mjs.

const WORKER_URL = "/pdfjs/pdf.worker.min.mjs";
const FONTES_URL = "/pdfjs/standard_fonts/";

// 2x ≈ 150 DPI: o texto aguenta o zoom de quem abre a foto no celular sem que o
// arquivo fique pesado demais para mandar no WhatsApp.
const ESCALA_ALVO = 2;
const ESCALA_MINIMA = 0.75;

// Canvas grande demais volta em branco em alguns celulares, sem erro nenhum.
// Estes limites são conservadores de propósito — vale mais uma imagem um pouco
// menor do que um arquivo vazio na mão do cliente.
const LADO_MAXIMO = 10000;
const AREA_MAXIMA = 16_000_000;

const ESPACO_ENTRE_PAGINAS = 24;
const COR_FUNDO = "#e4e4e7"; // cinza atrás das folhas, para separar as páginas
const COR_PAGINA = "#ffffff";

export type ProgressoImagem = { pagina: number; total: number };

/**
 * Rasteriza todas as páginas do PDF em um PNG só.
 *
 * @param onProgresso chamado a cada página desenhada — o botão usa para avisar
 *   que documentos com muitas fotos demoram mais.
 */
export async function pdfParaPng(
  pdfBlob: Blob,
  onProgresso?: (p: ProgressoImagem) => void
): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;

  const tarefa = pdfjs.getDocument({
    data: new Uint8Array(await pdfBlob.arrayBuffer()),
    standardFontDataUrl: FONTES_URL,
  });

  try {
    const doc = await tarefa.promise;
    const paginas = [];
    for (let n = 1; n <= doc.numPages; n++) paginas.push(await doc.getPage(n));

    const medidas = paginas.map((p) => p.getViewport({ scale: 1 }));
    const escala = escalaQueCabe(medidas);

    const largura = Math.ceil(Math.max(...medidas.map((v) => v.width)) * escala);
    const altura =
      Math.ceil(medidas.reduce((soma, v) => soma + v.height * escala, 0)) +
      ESPACO_ENTRE_PAGINAS * (paginas.length - 1);

    const folha = document.createElement("canvas");
    folha.width = largura;
    folha.height = altura;
    const ctx = folha.getContext("2d");
    if (!ctx) throw new Error("Navegador sem suporte a canvas");
    ctx.fillStyle = COR_FUNDO;
    ctx.fillRect(0, 0, largura, altura);

    // Uma página é desenhada por vez em um canvas avulso e depois colada na
    // folha final: o pdf.js pinta o fundo do canvas inteiro a cada render e
    // apagaria as páginas já desenhadas se fossem todas no mesmo canvas.
    const pagina = document.createElement("canvas");
    const ctxPagina = pagina.getContext("2d");
    if (!ctxPagina) throw new Error("Navegador sem suporte a canvas");

    let topo = 0;
    for (let i = 0; i < paginas.length; i++) {
      const viewport = paginas[i].getViewport({ scale: escala });
      pagina.width = Math.ceil(viewport.width);
      pagina.height = Math.ceil(viewport.height);

      await paginas[i].render({ canvas: pagina, viewport, background: COR_PAGINA })
        .promise;

      // Páginas mais estreitas que a maior ficam centralizadas.
      ctx.drawImage(pagina, Math.round((largura - pagina.width) / 2), topo);
      topo += pagina.height + ESPACO_ENTRE_PAGINAS;

      onProgresso?.({ pagina: i + 1, total: paginas.length });
    }

    const png = await new Promise<Blob | null>((resolve) =>
      folha.toBlob(resolve, "image/png")
    );
    if (!png) throw new Error("Não foi possível gerar a imagem");
    return png;
  } finally {
    // Encerra o worker: sem isso ele fica vivo até a aba fechar.
    await tarefa.destroy();
  }
}

/**
 * Maior escala que ainda cabe nos limites de canvas do navegador. Documento de
 * uma página sai em ESCALA_ALVO; um com muitas fotos vai reduzindo até caber.
 */
function escalaQueCabe(medidas: { width: number; height: number }[]): number {
  const larguraBase = Math.max(...medidas.map((v) => v.width));
  const alturaBase = medidas.reduce((soma, v) => soma + v.height, 0);

  const limiteLado = Math.min(LADO_MAXIMO / larguraBase, LADO_MAXIMO / alturaBase);
  const limiteArea = Math.sqrt(AREA_MAXIMA / (larguraBase * alturaBase));

  return Math.max(ESCALA_MINIMA, Math.min(ESCALA_ALVO, limiteLado, limiteArea));
}
