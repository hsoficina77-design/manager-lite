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

// Combustíveis que admitem "combustível em uso" (motor bicombustível).
export const COMBUSTIVEIS_BICOMBUSTIVEL = ["FLEX", "HIBRIDO"];

export const COMBUSTIVEL_EM_USO = [
  { value: "GASOLINA", label: "Gasolina" },
  { value: "ETANOL", label: "Álcool" },
  { value: "GNV", label: "GNV" },
] as const;
