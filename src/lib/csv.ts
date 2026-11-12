// Leitor de CSV pequeno e sem dependência, para a importação da prospecção.
//
// Segue o formato comum (RFC 4180): campo entre aspas pode ter vírgula, quebra de linha
// e aspas dobradas (""). Tira o BOM do começo (o scraper grava UTF-8 com BOM para o
// Excel) e descobre o separador pela primeira linha — o Excel em português salva com
// ponto e vírgula.

function separadorDa(primeiraLinha: string): string {
  const contar = (c: string) => primeiraLinha.split(c).length - 1;
  return contar(";") > contar(",") ? ";" : contar("\t") > contar(",") ? "\t" : ",";
}

/** Linhas cruas: cada uma é a lista de campos. */
export function lerCsv(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "");
  const fimDaPrimeira = t.search(/\r?\n/);
  const sep = separadorDa(fimDaPrimeira === -1 ? t : t.slice(0, fimDaPrimeira));

  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          aspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }
    if (c === '"') aspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++;
      linha.push(campo);
      campo = "";
      if (linha.some((v) => v !== "")) linhas.push(linha);
      linha = [];
    } else {
      campo += c;
    }
  }
  linha.push(campo);
  if (linha.some((v) => v !== "")) linhas.push(linha);
  return linhas;
}

/** Linhas como objetos, com o cabeçalho de chave. `colunas` filtra as que interessam. */
export function lerCsvComCabecalho(
  texto: string,
  colunas?: (cabecalho: string) => boolean
): { cabecalho: string[]; linhas: Record<string, string>[] } {
  const [cabecalho = [], ...resto] = lerCsv(texto);
  const usadas = cabecalho.map((c, i) => ({ c: c.trim(), i })).filter(({ c }) => c && (!colunas || colunas(c)));
  return {
    cabecalho: cabecalho.map((c) => c.trim()),
    linhas: resto.map((campos) => Object.fromEntries(usadas.map(({ c, i }) => [c, (campos[i] ?? "").trim()]))),
  };
}
