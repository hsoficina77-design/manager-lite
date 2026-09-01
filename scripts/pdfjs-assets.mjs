// Copia para `public/pdfjs/` os arquivos que o pdf.js precisa buscar em tempo de
// execução para transformar o PDF gerado em imagem (ver src/lib/pdf-para-imagem.ts).
//
// Por que copiar em vez de importar:
//  - o worker é carregado por URL, não por `import` — servi-lo de `public/` evita
//    depender de como o bundler resolve `new URL(..., import.meta.url)`;
//  - o PDF não carrega a Helvetica dentro dele (é uma das fontes que todo leitor
//    de PDF tem que conhecer). No computador o pdf.js resolve com a fonte do
//    sistema, mas celular Android não tem Helvetica nem Arial — aí ele busca
//    estes arquivos. Sem eles, o texto sairia com outro desenho.
//
// Roda antes de `dev` e de `build` (ver package.json), então os arquivos sempre
// batem com a versão instalada do pdfjs-dist — por isso `public/pdfjs/` fica fora
// do Git.

import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origem = join(raiz, "node_modules", "pdfjs-dist");
const destino = join(raiz, "public", "pdfjs");

// Só as fontes que os documentos usam: Helvetica normal/negrito/itálico viram
// Liberation Sans no pdf.js. Copiar as ~20 restantes seria peso morto em public/.
const FONTES = [
  "LiberationSans-Regular.ttf",
  "LiberationSans-Bold.ttf",
  "LiberationSans-Italic.ttf",
  "LiberationSans-BoldItalic.ttf",
  "LICENSE_LIBERATION",
];

async function copiar(de, para) {
  await mkdir(dirname(para), { recursive: true });
  await copyFile(de, para);
}

async function main() {
  try {
    await readdir(origem);
  } catch {
    console.error("[pdfjs] pdfjs-dist não encontrado — rode `npm install` antes.");
    process.exit(1);
  }

  await copiar(
    join(origem, "build", "pdf.worker.min.mjs"),
    join(destino, "pdf.worker.min.mjs")
  );

  for (const fonte of FONTES) {
    await copiar(
      join(origem, "standard_fonts", fonte),
      join(destino, "standard_fonts", fonte)
    );
  }
}

main().catch((err) => {
  console.error("[pdfjs] falha ao preparar os arquivos:", err);
  process.exit(1);
});
