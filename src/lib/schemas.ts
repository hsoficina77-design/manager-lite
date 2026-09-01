// Schemas das rotas de escrita. Um por operação, no formato que o formulário
// realmente envia — os blocos e os limites vêm de lib/validacao.
//
// Os enums saem das listas de lib/constants para não existirem duas verdades:
// se um status novo entra na constante, ele passa a ser aceito aqui junto.

import { z } from "zod";
import {
  LIMITES,
  dataNulavel,
  dataObrigatoria,
  dinheiro,
  dinheiroNulavel,
  dinheiroPositivo,
  id,
  idNulavel,
  inteiroNulavel,
  mesNulavel,
  mesObrigatorio,
  nulavel,
  obrigatorio,
} from "@/lib/validacao";
import { OS_STATUS, type OSStatus } from "@/lib/constants";

// "Categoria: valor inválido" em vez de "Categoria inválido" — a forma com dois
// pontos concorda com rótulo masculino e feminino, e é a mesma dos limites.
const enumDe = <T extends readonly [string, ...string[]]>(rotulo: string, valores: T) =>
  z.enum(valores, { errorMap: () => ({ message: `${rotulo}: valor inválido` }) });

/** Enum de dropdown em que vazio e ausente caem no padrão. */
const enumComPadrao = <T extends readonly [string, ...string[]]>(
  rotulo: string,
  valores: T,
  padrao: T[number]
) => z.preprocess((v) => (v === "" || v == null ? padrao : v), enumDe(rotulo, valores));

const STATUS_OS = OS_STATUS.map((s) => s.value) as [OSStatus, ...OSStatus[]];
const TIPOS_ITEM = ["PECA", "MAO_DE_OBRA", "SERVICO"] as const;
const FORMAS_PAGAMENTO = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
] as const;
const STATUS_ORCAMENTO = ["PENDENTE", "APROVADO", "RECUSADO", "CONVERTIDO"] as const;

// ── Itens (OS e orçamento usam o mesmo formato) ─────────────────────────────

export const itemSchema = z.object({
  // Id do item que já existe no banco. Não é usado para gravar (a lista é sempre
  // substituída inteira), mas sem ele `lib/custos.ts` não consegue recuperar o custo
  // que o operador não recebeu — e salvar zeraria o lucro do dono. Como o zod remove
  // o que não está declarado, tirar esta linha reintroduz esse bug em silêncio.
  id: id("Id do item").optional(),
  tipo: enumComPadrao("Tipo do item", TIPOS_ITEM, "PECA"),
  descricao: obrigatorio("Descrição do item", LIMITES.descricao),
  quantidade: dinheiro("Quantidade").max(LIMITES.quantidade, "Quantidade acima do limite"),
  valorUnit: dinheiro("Valor unitário"),
  // Ausente quando o formulário deixa o servidor calcular quantidade × unitário.
  valorTotal: dinheiro("Valor total").optional(),
  custoUnit: dinheiroNulavel("Custo unitário").optional(),
  fornecedor: nulavel("Fornecedor", LIMITES.nome).optional(),
});

export type ItemValidado = z.infer<typeof itemSchema>;

export const listaDeItens = z
  .array(itemSchema)
  .max(LIMITES.itensPorDocumento, `No máximo ${LIMITES.itensPorDocumento} itens por documento`);

/** Valor do item: o total que veio no formulário ou, na falta dele, quantidade × unitário. */
export function valorDoItem(item: ItemValidado): number {
  return item.valorTotal ?? item.quantidade * item.valorUnit;
}

// ── Cliente ─────────────────────────────────────────────────────────────────

const clienteCampos = {
  nome: obrigatorio("Nome", LIMITES.nome),
  apelido: nulavel("Apelido", LIMITES.nomeCurto).optional(),
  telefone: nulavel("Telefone", LIMITES.telefone).optional(),
  cpfCnpj: nulavel("CPF/CNPJ", LIMITES.identidade).optional(),
  email: nulavel("E-mail", LIMITES.email).optional(),
  obs: nulavel("Observações", LIMITES.observacao).optional(),
  // Texto livre em vez de enum: a lista de origens já mudou uma vez, e um cadastro
  // antigo com origem aposentada não pode travar a edição do cliente.
  origem: nulavel("Origem", LIMITES.nomeCurto).optional(),
  profissao: nulavel("Profissão", LIMITES.nomeCurto).optional(),
  telefones: z
    .array(z.string().trim().max(LIMITES.telefone, `Telefone: máximo de ${LIMITES.telefone} caracteres`))
    .max(LIMITES.telefonesPorCliente, `No máximo ${LIMITES.telefonesPorCliente} telefones`)
    .transform((lista) => lista.filter(Boolean))
    .optional(),
  cep: nulavel("CEP", LIMITES.identidade).optional(),
  endereco: nulavel("Endereço", LIMITES.endereco).optional(),
  cidade: nulavel("Cidade", LIMITES.cidade).optional(),
  estado: nulavel("Estado", LIMITES.estado).optional(),
};

// ── Veículo ─────────────────────────────────────────────────────────────────

export const veiculoSchema = z.object({
  marca: obrigatorio("Marca", LIMITES.nomeCurto),
  modelo: obrigatorio("Modelo", LIMITES.nomeCurto),
  placa: nulavel("Placa", LIMITES.identidade).optional(),
  cor: nulavel("Cor", LIMITES.nomeCurto).optional(),
  ano: inteiroNulavel("Ano", 1900, 2100).optional(),
  anoFabricacao: inteiroNulavel("Ano de fabricação", 1900, 2100).optional(),
  anoModelo: inteiroNulavel("Ano do modelo", 1900, 2100).optional(),
  km: inteiroNulavel("KM", 0, LIMITES.km).optional(),
  motorizacao: nulavel("Motorização", LIMITES.nomeCurto).optional(),
  // Nome antigo de `motorizacao`; segue aceito por causa de rascunho salvo no
  // navegador antes da renomeação — ver lib/veiculo.
  cilindrada: nulavel("Motorização", LIMITES.nomeCurto).optional(),
  valvulas: nulavel("Válvulas", LIMITES.identidade).optional(),
  combustivel: nulavel("Combustível", LIMITES.identidade).optional(),
  combustivelEmUso: nulavel("Combustível em uso", LIMITES.identidade).optional(),
});

export const veiculoCriarSchema = veiculoSchema.extend({
  clienteId: id("Cliente"),
});

export const clienteCriarSchema = z.object({
  ...clienteCampos,
  // O cadastro de cliente pode trazer o primeiro veículo junto.
  veiculo: veiculoSchema.nullish(),
});

export const clienteAtualizarSchema = z.object(clienteCampos);

// ── Ordem de serviço ────────────────────────────────────────────────────────

const osCampos = {
  descricao: obrigatorio("Descrição", LIMITES.descricao),
  defeitoRelatado: nulavel("Defeito relatado", LIMITES.observacao).optional(),
  kmEntrada: inteiroNulavel("KM de entrada", 0, LIMITES.km).optional(),
  obs: nulavel("Observações", LIMITES.observacao).optional(),
  mecanicoId: idNulavel("Mecânico").optional(),
  nivelCombustivel: nulavel("Nível de combustível", LIMITES.identidade).optional(),
  combustivelEmUso: nulavel("Combustível em uso", LIMITES.identidade).optional(),
};

export const osCriarSchema = z.object({
  ...osCampos,
  clienteId: id("Cliente"),
  veiculoId: id("Veículo"),
  itens: listaDeItens.default([]),
});

export const osAtualizarSchema = z.object({
  ...osCampos,
  // Na edição todo campo é opcional: a tela da OS manda só o que mudou, e o
  // ausente precisa continuar significando "não mexe".
  descricao: obrigatorio("Descrição", LIMITES.descricao).optional(),
  clienteId: id("Cliente").optional(),
  veiculoId: id("Veículo").optional(),
  status: enumDe("Status", STATUS_OS).optional(),
  kmSaida: inteiroNulavel("KM de saída", 0, LIMITES.km).optional(),
  desconto: dinheiro("Desconto").optional(),
  formaPagamento: z
    .union([enumDe("Forma de pagamento", FORMAS_PAGAMENTO), z.literal(""), z.null()])
    .optional(),
  nps: inteiroNulavel("NPS", 0, 10).optional(),
  itens: listaDeItens.optional(),
});

export const itemAvulsoSchema = itemSchema;

export const fotoAtualizarSchema = z.object({
  legenda: z.union([z.string(), z.null()]).optional(),
  tipo: z.string().max(LIMITES.identidade, "Momento da foto inválido").optional(),
});

// ── Pagamentos (OS e dívida avulsa) ─────────────────────────────────────────

export const pagamentoSchema = z.object({
  valor: dinheiroPositivo("Valor"),
  formaPagamento: enumComPadrao("Forma de pagamento", FORMAS_PAGAMENTO, "DINHEIRO"),
  obs: nulavel("Observações", LIMITES.observacao).optional(),
});

// ── Orçamento ───────────────────────────────────────────────────────────────

const orcamentoCampos = {
  clienteId: idNulavel("Cliente").optional(),
  veiculoId: idNulavel("Veículo").optional(),
  clienteNome: nulavel("Nome do cliente", LIMITES.nome).optional(),
  clienteTelefone: nulavel("Telefone", LIMITES.telefone).optional(),
  veiculoDesc: nulavel("Veículo", LIMITES.descricao).optional(),
  descricao: nulavel("Descrição", LIMITES.descricao).optional(),
  validade: dataNulavel("Validade").optional(),
  obs: nulavel("Observações", LIMITES.observacao).optional(),
};

export const orcamentoCriarSchema = z.object({
  ...orcamentoCampos,
  itens: listaDeItens.default([]),
});

export const orcamentoAtualizarSchema = z.object({
  ...orcamentoCampos,
  status: enumDe("Status", STATUS_ORCAMENTO).optional(),
  desconto: dinheiro("Desconto").optional(),
  itens: listaDeItens.optional(),
});

// ── Mecânico ────────────────────────────────────────────────────────────────

export const mecanicoCriarSchema = z.object({
  nome: obrigatorio("Nome", LIMITES.nome),
  telefone: nulavel("Telefone", LIMITES.telefone).optional(),
  especialidade: nulavel("Especialidade", LIMITES.nomeCurto).optional(),
});

export const mecanicoAtualizarSchema = z.object({
  nome: obrigatorio("Nome", LIMITES.nome).optional(),
  telefone: nulavel("Telefone", LIMITES.telefone).optional(),
  especialidade: nulavel("Especialidade", LIMITES.nomeCurto).optional(),
  ativo: z.boolean().optional(),
});

// ── Meta ────────────────────────────────────────────────────────────────────

// `valorAlvo` zero é uma operação válida: significa "remover a meta".
export const metaCriarSchema = z.object({
  mecanicoId: id("Mecânico"),
  ano: z.coerce.number().int("Ano inválido").min(2000, "Ano inválido").max(2100, "Ano inválido"),
  mes: z.coerce.number().int("Mês inválido").min(1, "Mês inválido").max(12, "Mês inválido"),
  valorAlvo: dinheiro("Meta"),
});

export const metaAtualizarSchema = z.object({
  valorAlvo: dinheiro("Meta"),
});

// ── Dívida avulsa ───────────────────────────────────────────────────────────

export const dividaCriarSchema = z.object({
  clienteId: id("Cliente"),
  descricao: obrigatorio("Descrição", LIMITES.descricao),
  valor: dinheiroPositivo("Valor"),
});

export const dividaAtualizarSchema = z.object({
  descricao: obrigatorio("Descrição", LIMITES.descricao).optional(),
  valor: dinheiroPositivo("Valor").optional(),
});

// ── Controle de gastos ──────────────────────────────────────────────────────
//
// Categoria virou tabela: o que chega agora é um id, não mais um dos nove valores
// fixos. Quem garante que o id existe é a foreign key.

const HEX_COR = /^#[0-9a-fA-F]{6}$/;

export const categoriaDespesaSchema = z.object({
  nome: obrigatorio("Nome da categoria", LIMITES.nomeCurto),
  cor: z.string().trim().regex(HEX_COR, "Cor: use o formato #rrggbb").optional(),
  ordem: z.coerce.number().int().min(0).max(999).optional(),
  ativa: z.boolean().optional(),
});

export const categoriaDespesaAtualizarSchema = categoriaDespesaSchema.partial();

const PERIODICIDADES_DESPESA = [
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
] as const;

const FORMAS_PAGAMENTO_DESPESA = [
  "DINHEIRO",
  "PIX",
  "BOLETO",
  "DEBITO_AUTOMATICO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
] as const;

const formaDespesa = (rotulo: string) =>
  z
    .union([enumDe(rotulo, FORMAS_PAGAMENTO_DESPESA), z.literal(""), z.null()])
    .transform((v) => (v === "" ? null : v));

/** Regra da despesa fixa. `inicio`/`fim` chegam como "AAAA-MM" — é mês, não dia. */
export const despesaRecorrenteCriarSchema = z.object({
  categoriaId: id("Categoria"),
  descricao: obrigatorio("Descrição", LIMITES.descricao),
  valor: dinheiroPositivo("Valor"),
  fornecedor: nulavel("Fornecedor", LIMITES.nome).optional(),
  diaVencimento: z.coerce
    .number({ invalid_type_error: "Dia do vencimento deve ser um número" })
    .int("Dia do vencimento deve ser um número inteiro")
    .min(1, "Dia do vencimento: mínimo de 1")
    .max(31, "Dia do vencimento: máximo de 31"),
  periodicidade: enumDe("Periodicidade", PERIODICIDADES_DESPESA),
  inicio: mesObrigatorio("Mês de início"),
  fim: mesNulavel("Mês final").optional(),
  ativa: z.boolean().optional(),
  observacao: nulavel("Observação", LIMITES.observacao).optional(),
});

export const despesaRecorrenteAtualizarSchema = despesaRecorrenteCriarSchema.partial().extend({
  /** Replicar o valor novo nos lançamentos futuros ainda não pagos. */
  propagar: z.boolean().optional(),
});

export const despesaCriarSchema = z.object({
  categoriaId: id("Categoria"),
  descricao: obrigatorio("Descrição", LIMITES.descricao),
  valor: dinheiroPositivo("Valor"),
  vencimento: dataObrigatoria("Data de vencimento"),
  fornecedor: nulavel("Fornecedor", LIMITES.nome).optional(),
  observacao: nulavel("Observação", LIMITES.observacao).optional(),
});

export const despesaAtualizarSchema = z.object({
  categoriaId: id("Categoria").optional(),
  descricao: obrigatorio("Descrição", LIMITES.descricao).optional(),
  valor: dinheiroPositivo("Valor").optional(),
  vencimento: dataObrigatoria("Data de vencimento").optional(),
  fornecedor: nulavel("Fornecedor", LIMITES.nome).optional(),
  observacao: nulavel("Observação", LIMITES.observacao).optional(),
  /** Reativa um lançamento de regra que tinha sido marcado como "não teve". */
  cancelado: z.boolean().optional(),
});

/**
 * Baixa do pagamento. `valorPago` ausente significa "pagou o previsto" — é o caminho
 * de um clique, que é como a conta é quitada na maioria das vezes.
 */
export const despesaPagamentoSchema = z.object({
  pago: z.boolean(),
  valorPago: dinheiroNulavel("Valor pago").optional(),
  pagoEm: dataNulavel("Data do pagamento").optional(),
  formaPagamento: formaDespesa("Forma de pagamento").optional(),
});

// ── Configuração da oficina ─────────────────────────────────────────────────

const HEX = /^#[0-9a-fA-F]{6}$/;
const cor = (rotulo: string) =>
  z.string().trim().regex(HEX, `${rotulo}: use o formato #rrggbb`).optional();

export const configuracaoSchema = z.object({
  nome: obrigatorio("O nome da oficina", LIMITES.nome),
  nomeCurto: nulavel("Nome curto", LIMITES.nomeCurto).optional(),
  cnpj: nulavel("CNPJ", LIMITES.identidade).optional(),
  telefone: nulavel("Telefone", LIMITES.telefone).optional(),
  whatsapp: nulavel("WhatsApp", LIMITES.telefone).optional(),
  email: nulavel("E-mail", LIMITES.email).optional(),
  site: nulavel("Site", LIMITES.url).optional(),
  cep: nulavel("CEP", LIMITES.identidade).optional(),
  endereco: nulavel("Endereço", LIMITES.endereco).optional(),
  cidade: nulavel("Cidade", LIMITES.cidade).optional(),
  estado: nulavel("Estado", LIMITES.estado).optional(),
  rodapeDocumento: nulavel("Rodapé do documento", LIMITES.documento).optional(),
  mensagemDocumento: nulavel("Mensagem do documento", LIMITES.documento).optional(),
  corPrimaria: cor("Cor primária"),
  corMenu: cor("Cor do menu"),
  mostrarAssinatura: z.boolean().optional(),
  validadeOrcamentoDias: z.coerce
    .number()
    .int("A validade do orçamento deve ser de 1 a 365 dias")
    .min(1, "A validade do orçamento deve ser de 1 a 365 dias")
    .max(365, "A validade do orçamento deve ser de 1 a 365 dias"),
});
