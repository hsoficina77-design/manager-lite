// Em que formato a oficina prefere baixar OS e orçamentos.
//
// A escolha fica no navegador de quem usa (não no banco): é preferência de quem
// está com o aparelho na mão — o dono no computador costuma querer PDF, quem
// atende no balcão manda imagem no WhatsApp o dia inteiro.

export type FormatoDownload = "pdf" | "imagem";

const CHAVE = "manager-lite:formato-download";
const PADRAO: FormatoDownload = "pdf";

export const FORMATOS: {
  valor: FormatoDownload;
  label: string;
  extensao: string;
  descricao: string;
}[] = [
  {
    valor: "pdf",
    label: "PDF",
    extensao: "pdf",
    descricao: "Para imprimir, arquivar ou anexar em e-mail.",
  },
  {
    valor: "imagem",
    label: "Imagem",
    extensao: "png",
    descricao: "Abre direto na conversa — bom para mandar no WhatsApp.",
  },
];

export function formatoSalvo(): FormatoDownload {
  try {
    const valor = localStorage.getItem(CHAVE);
    if (valor === "pdf" || valor === "imagem") return valor;
  } catch {
    // localStorage indisponível (modo privado etc.) — segue com o padrão
  }
  return PADRAO;
}

export function salvarFormato(formato: FormatoDownload) {
  try {
    localStorage.setItem(CHAVE, formato);
  } catch {
    // sem persistir: a escolha ainda vale para esta visita
  }
}

/** Remove caracteres que o Windows/macOS não aceitam em nome de arquivo. */
export function limparNome(texto: string) {
  return texto.replace(/[\\/:*?"<>|]/g, "").trim();
}
