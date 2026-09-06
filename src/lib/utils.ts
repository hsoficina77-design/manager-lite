import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { anoVeiculo } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Valor sem o "R$" — para dentro de campos, onde o prefixo já está desenhado. */
export function formatarValorBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Lê um valor digitado em português e devolve número.
 *
 * Os campos de dinheiro usavam `type="number"`, que só aceita ponto como
 * separador decimal: quem digitava `1250,50` — como se escreve aqui — entregava
 * um campo inválido, que virava vazio no envio sem mensagem nenhuma.
 *
 * Regras de desambiguação:
 *   "1250,50"     vírgula é decimal                    → 1250.5
 *   "1.250,50"    ponto é milhar, vírgula é decimal    → 1250.5
 *   "1.50"        último grupo com 1-2 dígitos: decimal → 1.5
 *   "1.500"       último grupo com 3 dígitos: milhar    → 1500
 */
export function paraNumero(texto: string | number | null | undefined): number {
  if (typeof texto === "number") return Number.isFinite(texto) ? texto : 0;
  if (texto == null) return 0;

  const limpo = String(texto).trim().replace(/[^\d.,-]/g, "");
  if (!limpo) return 0;

  const temVirgula = limpo.includes(",");
  const temPonto = limpo.includes(".");

  let normalizado: string;
  if (temVirgula && temPonto) {
    // O separador decimal é o que aparece por último.
    normalizado =
      limpo.lastIndexOf(",") > limpo.lastIndexOf(".")
        ? limpo.replace(/\./g, "").replace(",", ".")
        : limpo.replace(/,/g, "");
  } else if (temVirgula) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if (temPonto) {
    const ultimoGrupo = limpo.slice(limpo.lastIndexOf(".") + 1);
    normalizado = ultimoGrupo.length === 3 ? limpo.replace(/\./g, "") : limpo;
  } else {
    normalizado = limpo;
  }

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : 0;
}

/** `true` quando o campo tem conteúdo que não seja espaço. */
export function temValor(texto: string | null | undefined): boolean {
  return !!texto && texto.trim() !== "";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

// Um orçamento pode ser rascunho: sem cliente/veículo cadastrados, a identificação
// vem dos campos de texto livre. Estes helpers escolhem o que exibir.
type OrcamentoIdentificacao = {
  cliente?: { nome: string } | null;
  clienteNome?: string | null;
  clienteTelefone?: string | null;
  veiculo?: {
    marca: string; modelo: string; placa?: string | null;
    ano?: number | null; anoFabricacao?: number | null; anoModelo?: number | null;
  } | null;
  veiculoDesc?: string | null;
};

export function nomeCliente(o: OrcamentoIdentificacao): string {
  return o.cliente?.nome || o.clienteNome?.trim() || "Sem identificação";
}

export function telefoneCliente(
  o: OrcamentoIdentificacao & { cliente?: { telefone?: string | null } | null }
): string | null {
  return o.cliente ? o.cliente.telefone ?? null : o.clienteTelefone?.trim() || null;
}

export function descricaoVeiculo(o: OrcamentoIdentificacao): string | null {
  if (o.veiculo) {
    const { marca, modelo, placa } = o.veiculo;
    const ano = anoVeiculo(o.veiculo);
    return `${marca} ${modelo}${placa ? ` · ${placa}` : ""}${ano ? ` (${ano})` : ""}`;
  }
  return o.veiculoDesc?.trim() || null;
}

// Rascunho = ainda falta cadastro para virar OS.
export function ehRascunho(o: OrcamentoIdentificacao & { clienteId?: string | null }): boolean {
  return !o.cliente && !o.clienteId;
}

export function formatDatetime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
