// Constantes de domínio compartilhadas entre formulários (clientes, orçamentos, OS).
// Centralizar aqui evita listas duplicadas que divergem com o tempo.

export const ORIGENS = [
  { value: "INDICACAO", label: "Indicação" },
  { value: "GOOGLE", label: "Google" },
  { value: "CHATGPT", label: "ChatGPT" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "FAIXADA", label: "Faixada" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const COMBUSTIVEIS = [
  { value: "GASOLINA", label: "Gasolina" },
  { value: "ETANOL", label: "Etanol" },
  { value: "FLEX", label: "Flex" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELETRICO", label: "Elétrico" },
  { value: "HIBRIDO", label: "Híbrido" },
  { value: "GNV", label: "GNV" },
] as const;

// Momento em que a foto da OS foi tirada.
// A ordem daqui define a ordem das seções na tela, na impressão e no PDF.
export const FOTO_TIPOS = [
  { value: "ENTRADA", label: "Entrada", ajuda: "Estado do veículo na chegada" },
  { value: "SERVICO", label: "Serviço", ajuda: "Peças trocadas, antes e depois" },
  { value: "SAIDA", label: "Saída", ajuda: "Estado do veículo na entrega" },
] as const;

export type FotoTipo = (typeof FOTO_TIPOS)[number]["value"];

export const FOTO_TIPO_VALUES: readonly string[] = FOTO_TIPOS.map((t) => t.value);

// Fotos criadas antes da separação por momento ficam como serviço.
export const FOTO_TIPO_PADRAO: FotoTipo = "SERVICO";

/** Momento da foto, tolerante a valor desconhecido — assim nenhuma foto some da tela. */
export function tipoDaFoto(tipo: string): FotoTipo {
  return FOTO_TIPOS.find((t) => t.value === tipo)?.value ?? FOTO_TIPO_PADRAO;
}

// Combustíveis que admitem "combustível em uso" (motor bicombustível).
export const COMBUSTIVEIS_BICOMBUSTIVEL = ["FLEX", "HIBRIDO"];

export const COMBUSTIVEL_EM_USO = [
  { value: "GASOLINA", label: "Gasolina" },
  { value: "ETANOL", label: "Álcool" },
  { value: "GNV", label: "GNV" },
] as const;
