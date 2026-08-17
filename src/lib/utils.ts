import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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
  veiculo?: { marca: string; modelo: string; placa?: string | null; ano?: number | null } | null;
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
    const { marca, modelo, placa, ano } = o.veiculo;
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
