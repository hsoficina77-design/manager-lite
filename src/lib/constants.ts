// Constantes de domínio compartilhadas entre formulários (clientes, orçamentos, OS).
// Centralizar aqui evita listas duplicadas que divergem com o tempo.

// Ciclo de vida da OS. `ENTREGUE` é o único marco de conclusão que existe: é a data
// de entrega que decide em que semana/mês o serviço conta como produção.
//
// `PRONTA` e `FECHADA` foram removidas do fluxo: as duas tentavam codificar
// "terminei mas ainda não recebi" num campo que não é sobre dinheiro. Recebimento
// já é um eixo separado (`pago` / `valorPago`), então OS entregue e não paga é
// representável sem precisar de status próprio.
// A cor é uma escala de significado, não degraus de um cinza só. Antes os quatro
// status vivos eram zinc-100/200/300 e um preto: distinguir o carro travado
// esperando peça do carro já entregue exigia ler pílula por pílula, que é
// exatamente o trabalho que a cor deveria poupar numa lista de vinte OS.
//
// Agora cada estado tem matiz próprio, e o peso segue a urgência:
//   Ag. Peça    âmbar com anel saturado — é o único bloqueado, esperando decisão
//   Em Andamento azul — trabalho acontecendo, estado normal do pátio
//   Aberta      neutro — chegou, ninguém pôs a mão ainda
//   Entregue    verde discreto — encerrado, deve recuar
//   Cancelada   apagado — existe, mas não é trabalho
//
// As classes moram em globals.css porque cada uma precisa de um valor no tema
// claro e outro no escuro.
export const OS_STATUS = [
  { value: "ABERTA", label: "Aberta", cor: "status status-aberta" },
  { value: "EM_ANDAMENTO", label: "Em andamento", cor: "status status-andamento" },
  { value: "AGUARDANDO_PECA", label: "Ag. peça", cor: "status status-peca" },
  { value: "ENTREGUE", label: "Entregue", cor: "status status-entregue" },
  { value: "CANCELADA", label: "Cancelada", cor: "status status-inerte" },
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
  return OS_STATUS.find((s) => s.value === status)?.cor ?? "status status-inerte";
}

// Status do orçamento — mesma gramática de cor da OS, para o olho não ter que
// aprender duas escalas. Pendente aguarda o cliente, aprovado é sinal verde,
// recusado e convertido são estados encerrados.
export const ORCAMENTO_STATUS = [
  { value: "PENDENTE", label: "Pendente", cor: "status status-aberta" },
  { value: "APROVADO", label: "Aprovado", cor: "status status-entregue" },
  { value: "RECUSADO", label: "Recusado", cor: "status status-inerte" },
  { value: "CONVERTIDO", label: "Convertido", cor: "status status-andamento" },
] as const;

export function labelStatusOrcamento(status: string): string {
  return ORCAMENTO_STATUS.find((s) => s.value === status)?.label ?? status;
}

export function corStatusOrcamento(status: string): string {
  return ORCAMENTO_STATUS.find((s) => s.value === status)?.cor ?? "status status-inerte";
}

// Formas de pagamento. Ficavam redeclaradas em cinco telas, e por isso já
// divergiam entre si — a de contas a receber não tinha as mesmas opções da OS.
export const FORMAS_PAGAMENTO = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
] as const;

export const FORMAS_PAGAMENTO_VALUES: string[] = FORMAS_PAGAMENTO.map((f) => f.value);

export function labelFormaPagamento(valor: string | null | undefined): string {
  if (!valor) return "";
  return FORMAS_PAGAMENTO.find((f) => f.value === valor)?.label ?? valor;
}

/** Margem de lucro da OS, ou null quando não há faturamento para comparar. */
export function margemOS(os: { total: number; lucroReal: number }): number | null {
  return os.total > 0 ? (os.lucroReal / os.total) * 100 : null;
}

/** Faixas de margem das listas: verde saudável, âmbar apertada, vermelha no vermelho.
 *  Mesma escala em todas as telas para o olho aprender uma cor só. */
export function corMargem(margem: number | null): string {
  if (margem === null) return "text-tinta-3";
  if (margem >= 40) return "text-ok";
  if (margem >= 20) return "text-atencao";
  return "text-perigo";
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

// No orçamento não se pergunta o momento: o carro ainda nem entrou, e a foto é
// sempre o estado em que ele chegou. Guardar como ENTRADA faz com que, na conversão
// em OS, ela caia sozinha na seção certa — onde ainda dá para remanejar.
export const FOTO_TIPO_ORCAMENTO: FotoTipo = "ENTRADA";

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
