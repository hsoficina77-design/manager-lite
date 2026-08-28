// Constantes de domínio compartilhadas entre formulários (clientes, orçamentos, OS).
// Centralizar aqui evita listas duplicadas que divergem com o tempo.

// Ciclo de vida da OS. `ENTREGUE` é o único marco de conclusão que existe: é a data
// de entrega que decide em que semana/mês o serviço conta como produção.
//
// `PRONTA` e `FECHADA` foram removidas do fluxo: as duas tentavam codificar
// "terminei mas ainda não recebi" num campo que não é sobre dinheiro. Recebimento
// já é um eixo separado (`pago` / `valorPago`), então OS entregue e não paga é
// representável sem precisar de status próprio.
export const OS_STATUS = [
  { value: "ABERTA", label: "Aberta", cor: "bg-zinc-200 text-zinc-700" },
  { value: "EM_ANDAMENTO", label: "Em Andamento", cor: "bg-zinc-800 text-zinc-100" },
  { value: "AGUARDANDO_PECA", label: "Ag. Peça", cor: "bg-zinc-300 text-zinc-800" },
  { value: "ENTREGUE", label: "Entregue", cor: "bg-zinc-100 text-zinc-500" },
  { value: "CANCELADA", label: "Cancelada", cor: "bg-red-100 text-red-700" },
] as const;

export type OSStatus = (typeof OS_STATUS)[number]["value"];

export const OS_STATUS_VALUES: string[] = OS_STATUS.map((s) => s.value);

/** No pátio: serviço em andamento, ainda não entregue. */
export const OS_EM_ABERTO: string[] = ["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PECA"];

/** Concluída: conta como produção, na data de entrega. */
export const OS_CONCLUIDA: string[] = ["ENTREGUE"];

// Rótulos dos status aposentados. A migração converte as linhas existentes, mas se
// alguma escapar (backup antigo, escrita concorrente no deploy) ela ainda aparece
// com nome na tela em vez de exibir o enum cru.
const OS_STATUS_LEGADO: Record<string, string> = { PRONTA: "Pronta", FECHADA: "Fechada" };

export function labelStatus(status: string): string {
  return (
    OS_STATUS.find((s) => s.value === status)?.label ?? OS_STATUS_LEGADO[status] ?? status
  );
}

export function corStatus(status: string): string {
  return OS_STATUS.find((s) => s.value === status)?.cor ?? "bg-zinc-600 text-white";
}

/** Margem de lucro da OS, ou null quando não há faturamento para comparar. */
export function margemOS(os: { total: number; lucroReal: number }): number | null {
  return os.total > 0 ? (os.lucroReal / os.total) * 100 : null;
}

/** Faixas de margem das listas: verde saudável, âmbar apertada, vermelha no vermelho.
 *  Mesma escala em todas as telas para o olho aprender uma cor só. */
export function corMargem(margem: number | null): string {
  if (margem === null) return "text-zinc-400";
  if (margem >= 40) return "text-green-600";
  if (margem >= 20) return "text-amber-600";
  return "text-red-500";
}

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

export function labelCombustivel(valor: string | null | undefined): string | null {
  if (!valor) return null;
  return COMBUSTIVEIS.find((c) => c.value === valor)?.label ?? valor;
}

export const VALVULAS = ["8V", "12V", "16V", "20V", "24V"] as const;

// Dados do veículo que interessam na hora de cotar peça. Todos opcionais menos
// marca/modelo: o cadastro antigo costuma ter buracos e o texto se adapta.
export type VeiculoInfo = {
  marca: string;
  modelo: string;
  ano?: number | null;
  anoFabricacao?: number | null;
  anoModelo?: number | null;
  km?: number | null;
  motorizacao?: string | null;
  valvulas?: string | null;
  combustivel?: string | null;
};

/** Ano no formato que a auto peça usa: fabricação/modelo quando existem os dois. */
export function anoVeiculo(v: VeiculoInfo): string | null {
  if (v.anoFabricacao && v.anoModelo) return `${v.anoFabricacao}/${v.anoModelo}`;
  const unico = v.anoFabricacao ?? v.anoModelo ?? v.ano;
  return unico ? String(unico) : null;
}

/** Texto do veículo pronto para colar no WhatsApp da auto peça.
 *  Linhas rotuladas (uma por dado) porque o balconista lê batendo o olho,
 *  e linha vazia nenhuma: campo sem cadastro simplesmente não aparece. */
export function textoVeiculo(v: VeiculoInfo): string {
  const titulo = [v.marca, v.modelo, v.motorizacao, v.valvulas]
    .map((p) => p?.toString().trim())
    .filter(Boolean)
    .join(" ");

  const linhas: string[] = [titulo];
  const ano = anoVeiculo(v);
  if (ano) linhas.push(`Ano: ${ano}`);
  const combustivel = labelCombustivel(v.combustivel);
  if (combustivel) linhas.push(`Combustível: ${combustivel}`);
  if (v.km) linhas.push(`KM: ${v.km.toLocaleString("pt-BR")}`);

  return linhas.join("\n");
}

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

/** Descrição da foto: uma linha curta, que cabe na legenda do PDF sem quebrar a grade. */
export const FOTO_LEGENDA_MAX = 140;

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
