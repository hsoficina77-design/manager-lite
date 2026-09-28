// Formatação leve da descrição do serviço (OS e orçamento).
//
// O texto continua salvo como texto simples, com marcas no estilo Markdown:
//
//   ## Título            → título de seção
//   **negrito**          → trecho em negrito
//   1. item              → lista numerada
//   - item  (ou • item)  → lista com marcadores
//   linha vazia          → separa parágrafos
//
// Texto antigo, sem marca nenhuma, sai igual ao que era: um parágrafo por linha.
// A mesma leitura alimenta a tela (TextoFormatado) e o PDF (TextoFormatadoPdf),
// para os dois nunca mostrarem coisas diferentes.

/**
 * Tamanho máximo da descrição do serviço, com as marcas. Mora aqui (e não só em
 * validacao.ts, que é do servidor) para o formulário mostrar o mesmo teto.
 * Um laudo com diagnóstico e lista de peças trocadas passa fácil de 2.000.
 */
export const DESCRICAO_SERVICO_MAX = 5000;

export type Trecho ={ texto: string; negrito: boolean };

export type Bloco =
  | { tipo: "titulo"; trechos: Trecho[] }
  | { tipo: "paragrafo"; trechos: Trecho[] }
  | { tipo: "numerado"; numero: string; nivel: number; trechos: Trecho[] }
  | { tipo: "marcador"; nivel: number; trechos: Trecho[] }
  | { tipo: "espaco" };

const RE_TITULO = /^#{1,6}\s+(.*)$/;
const RE_NUMERADO = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;
const RE_MARCADOR = /^(\s*)[-*•]\s+(.*)$/;

/** Separa `**negrito**` do texto comum. Um `**` sem par fica como está. */
export function trechosDaLinha(linha: string): Trecho[] {
  const trechos: Trecho[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let ultimo = 0;
  for (const m of linha.matchAll(re)) {
    if (m.index > ultimo) trechos.push({ texto: linha.slice(ultimo, m.index), negrito: false });
    trechos.push({ texto: m[1], negrito: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < linha.length) trechos.push({ texto: linha.slice(ultimo), negrito: false });
  return trechos;
}

/** Recuo de 2+ espaços (ou tab) vira sub-item. Só dois níveis: é descrição, não sumário. */
function nivelDoRecuo(recuo: string): number {
  return recuo.replace(/\t/g, "  ").length >= 2 ? 1 : 0;
}

export function blocosDoTexto(texto: string): Bloco[] {
  const blocos: Bloco[] = [];
  for (const bruta of texto.replace(/\r\n?/g, "\n").split("\n")) {
    const linha = bruta.trimEnd();
    if (!linha.trim()) {
      // Várias linhas vazias seguidas valem por uma.
      if (blocos.length > 0 && blocos[blocos.length - 1].tipo !== "espaco") blocos.push({ tipo: "espaco" });
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = linha.trim().match(RE_TITULO))) {
      blocos.push({ tipo: "titulo", trechos: trechosDaLinha(m[1]) });
    } else if ((m = linha.match(RE_NUMERADO))) {
      blocos.push({ tipo: "numerado", numero: m[2], nivel: nivelDoRecuo(m[1]), trechos: trechosDaLinha(m[3]) });
    } else if ((m = linha.match(RE_MARCADOR))) {
      blocos.push({ tipo: "marcador", nivel: nivelDoRecuo(m[1]), trechos: trechosDaLinha(m[2]) });
    } else {
      blocos.push({ tipo: "paragrafo", trechos: trechosDaLinha(linha.trim()) });
    }
  }
  if (blocos.length > 0 && blocos[blocos.length - 1].tipo === "espaco") blocos.pop();
  return blocos;
}

/**
 * Versão corrida, sem marcas, para as listagens que mostram só o começo da
 * descrição numa linha (lista de OS, ficha do cliente).
 */
export function resumoDoTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return blocosDoTexto(texto)
    .flatMap((b) => (b.tipo === "espaco" ? [] : [b.trechos.map((t) => t.texto).join("")]))
    .join(" · ");
}

// ── Colar texto formatado ────────────────────────────────────────────────────

/**
 * Converte o HTML da área de transferência (texto copiado de um chat, do Word,
 * de um site) para as marcas acima, preservando títulos, negrito e listas.
 * Só roda no navegador — usa DOMParser.
 */
export function htmlParaTexto(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const linhas: string[] = [];

  // nodeType em vez de instanceof: o documento do DOMParser é outro, e o teste
  // de classe falha em alguns ambientes.
  const ehElemento = (no: Node): no is HTMLElement => no.nodeType === 1;

  const inline = (no: Node): string => {
    if (no.nodeType === 3) return (no.textContent ?? "").replace(/\s+/g, " ");
    if (!ehElemento(no)) return "";
    const tag = no.tagName;
    if (tag === "BR") return "\n";
    if (tag === "UL" || tag === "OL") return ""; // listas aninhadas saem em linhas próprias
    const dentro = Array.from(no.childNodes).map(inline).join("");
    // O Google Docs embrulha tudo num <b style="font-weight:normal">: o estilo manda.
    const peso = no.getAttribute("style")?.match(/font-weight\s*:\s*(\w+)/i)?.[1];
    const negrito = peso ? peso === "bold" || Number(peso) >= 600 : tag === "B" || tag === "STRONG";
    if (negrito && dentro.trim()) {
      // O espaço fica fora das marcas: "** texto**" não é lido como negrito.
      const [, antes, meio, depois] = dentro.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
      return `${antes}**${meio}**${depois}`;
    }
    return dentro;
  };

  const empurra = (texto: string) => {
    for (const l of texto.split("\n")) {
      const limpa = l.trim();
      if (limpa) linhas.push(limpa);
    }
  };
  const separa = () => {
    if (linhas.length > 0 && linhas[linhas.length - 1] !== "") linhas.push("");
  };

  const lista = (el: HTMLElement, nivel: number) => {
    const numerada = el.tagName === "OL";
    let n = Number(el.getAttribute("start")) || 1;
    const recuo = nivel > 0 ? "  " : "";
    for (const li of Array.from(el.children)) {
      if (li.tagName !== "LI") continue;
      const conteudo = inline(li).replace(/\s*\n\s*/g, " ").trim();
      linhas.push(`${recuo}${numerada ? `${n++}.` : "-"} ${conteudo}`);
      for (const filho of Array.from(li.children)) {
        if (filho.tagName === "UL" || filho.tagName === "OL") lista(filho as HTMLElement, nivel + 1);
      }
    }
  };

  const bloco = (no: Node) => {
    if (no.nodeType === 3) {
      empurra(inline(no));
      return;
    }
    if (!ehElemento(no)) return;
    const tag = no.tagName;
    if (/^H[1-6]$/.test(tag)) {
      separa();
      const titulo = inline(no).replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
      if (titulo) linhas.push(`## ${titulo}`);
      return;
    }
    if (tag === "UL" || tag === "OL") {
      lista(no, 0);
      separa();
      return;
    }
    if (tag === "P") {
      // Parágrafo novo ganha uma linha em branco antes, como na tela de onde veio.
      separa();
      empurra(inline(no));
      return;
    }
    if (tag === "HR") {
      separa();
      return;
    }
    if (["DIV", "SECTION", "ARTICLE", "BODY", "MAIN", "BLOCKQUOTE", "SPAN", "B", "STRONG"].includes(tag)) {
      const temBloco = Array.from(no.children).some((c) =>
        /^(H[1-6]|UL|OL|P|DIV|SECTION|ARTICLE|BLOCKQUOTE|HR)$/.test(c.tagName),
      );
      if (temBloco) Array.from(no.childNodes).forEach(bloco);
      else empurra(inline(no));
      return;
    }
    empurra(inline(no));
  };

  Array.from(doc.body.childNodes).forEach(bloco);
  while (linhas.length > 0 && linhas[linhas.length - 1] === "") linhas.pop();
  return linhas.join("\n");
}
