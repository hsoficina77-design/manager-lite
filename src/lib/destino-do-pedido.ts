import type { Configuracao } from "@/lib/configuracao";

// Para onde o pedido vai: o que a autopeça precisa para entregar e para cadastrar a
// oficina na base dela. Fica gravado no envio quando o pedido é feito — mudar o endereço
// depois não mexe em pedido que já saiu. O telefone não entra: a loja fala com a oficina
// pela conversa do app.

export type DestinoDoPedido = {
  oficina: string;
  cnpj: string;
  cep: string;
  endereco: string;
  /** "Suzano - SP" */
  cidade: string;
  recebedor: string;
};

/** Nulo enquanto a oficina não preencheu o que a entrega exige. */
export function destinoDoPedido(config: Configuracao, recebedor: string): DestinoDoPedido | null {
  const cnpj = config.cnpj?.trim();
  const endereco = config.endereco?.trim();
  const cep = config.cep?.trim();
  const cidade = config.cidade?.trim();
  if (!cnpj || !endereco || !cep || !cidade) return null;
  const uf = config.estado?.trim();
  return {
    oficina: config.nomeCurto?.trim() || config.nome,
    cnpj,
    cep,
    endereco,
    cidade: uf ? `${cidade} - ${uf}` : cidade,
    recebedor,
  };
}

/** Lê o JSON gravado no envio, sem confiar no formato. */
export function lerDestino(valor: unknown): DestinoDoPedido | null {
  if (!valor || typeof valor !== "object") return null;
  const v = valor as Record<string, unknown>;
  const texto = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const d = {
    oficina: texto("oficina"),
    cnpj: texto("cnpj"),
    cep: texto("cep"),
    endereco: texto("endereco"),
    cidade: texto("cidade"),
    recebedor: texto("recebedor"),
  };
  return d.endereco ? d : null;
}
