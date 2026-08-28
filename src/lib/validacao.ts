// Validação das rotas de escrita: teto de tamanho do corpo e blocos de schema
// reaproveitados pelos schemas de cada recurso (lib/schemas.ts).
//
// Duas coisas que a validação manual anterior não cobria:
//
//  1. Tamanho. Todo campo de texto do banco é `text` do Postgres — sem limite. E
//     `request.json()` lê o corpo inteiro na memória antes de qualquer checagem.
//     Sem um teto, um POST com uma descrição de 50MB ou um `itens[]` com um milhão
//     de linhas entra no banco e leva a instância junto.
//  2. Faixa dos números. `Number(valor)` aceita negativo, NaN e Infinity — um
//     desconto negativo *aumentava* o total da OS.

import { NextResponse } from "next/server";
import { z, type ZodError, type ZodTypeAny } from "zod";

/**
 * Teto do corpo JSON. Uma OS cheia (60 itens, observações longas) não passa de
 * ~30KB; 256KB deixa folga de uma ordem de grandeza e ainda assim é um limite.
 */
export const CORPO_MAX_BYTES = 256 * 1024;

/** Tamanhos máximos por natureza de campo — um lugar só para não divergirem. */
export const LIMITES = {
  nome: 120,
  nomeCurto: 60,
  identidade: 32, // CPF/CNPJ, CEP, placa: documentos formatados
  telefone: 32,
  email: 160,
  url: 300,
  endereco: 200,
  cidade: 100,
  estado: 2,
  descricao: 500,
  observacao: 2000,
  /** Recado da oficina no rodapé do PDF: alguns parágrafos, não um contrato. */
  documento: 2000,
  /** Itens por OS ou orçamento. A maior OS real da oficina tem ~40. */
  itensPorDocumento: 200,
  /** Telefones adicionais de um cliente. */
  telefonesPorCliente: 10,
  /** Teto de qualquer valor em reais. Um serviço de oficina não chega perto. */
  valor: 10_000_000,
  /** Quantidade de um item (fracionária: 2,5 litros de óleo). */
  quantidade: 100_000,
  km: 10_000_000,
} as const;

/** Erro de entrada do cliente — vira resposta 4xx, nunca 500. */
export class ErroDeEntrada extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ErroDeEntrada";
  }
}

/**
 * Lê o corpo contando os bytes conforme chegam e aborta ao passar do teto.
 *
 * O `content-length` é conferido antes por ser barato, mas não dá para confiar
 * nele: o cabeçalho pode mentir e some de vez em `Transfer-Encoding: chunked`.
 * Quem realmente segura é a contagem no laço.
 */
async function lerCorpoLimitado(request: Request, maxBytes: number): Promise<string> {
  const declarado = Number(request.headers.get("content-length"));
  if (Number.isFinite(declarado) && declarado > maxBytes) {
    throw new ErroDeEntrada(413, "Requisição grande demais");
  }

  const corpo = request.body;
  if (!corpo) return "";

  const leitor = corpo.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new ErroDeEntrada(413, "Requisição grande demais");
      }
      partes.push(value);
    }
  } finally {
    // Solta a conexão mesmo quando o limite estourou no meio do envio.
    await leitor.cancel().catch(() => {});
  }

  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const parte of partes) {
    bytes.set(parte, posicao);
    posicao += parte.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** A primeira falha, em português, já apontando o item quando for uma lista. */
function primeiraMensagem(erro: ZodError): string {
  const falha = erro.issues[0];
  if (!falha) return "Dados inválidos";
  const indice = falha.path.find((p) => typeof p === "number");
  return typeof indice === "number" ? `Item ${indice + 1}: ${falha.message}` : falha.message;
}

/**
 * Lê e valida o corpo da requisição. Lança `ErroDeEntrada` no que não passar.
 *
 * O genérico é o schema, e não o tipo de saída: os blocos usam `transform`/`pipe`,
 * então entrada e saída têm formatos diferentes (o formulário manda `"1500,00"`,
 * a rota recebe `1500`). Amarrar em `ZodType<T>` faria o TypeScript devolver o
 * formato de entrada, cru — que é justamente o que a validação existe para evitar.
 */
export async function lerJson<S extends ZodTypeAny>(
  request: Request,
  schema: S,
  maxBytes = CORPO_MAX_BYTES
): Promise<z.output<S>> {
  const texto = await lerCorpoLimitado(request, maxBytes);

  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new ErroDeEntrada(400, "Corpo da requisição inválido");
  }

  const resultado = schema.safeParse(bruto);
  if (!resultado.success) {
    throw new ErroDeEntrada(400, primeiraMensagem(resultado.error));
  }
  return resultado.data;
}

/**
 * Resposta para erro de entrada, ou null quando o erro é outro — aí o `catch` da
 * rota segue com o tratamento que já tinha (Prisma P2002, P2025, etc.).
 */
export function respostaDeValidacao(err: unknown): NextResponse | null {
  if (err instanceof ErroDeEntrada) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return null;
}

// ── Blocos de schema ────────────────────────────────────────────────────────
// Todos recebem o rótulo do campo para que a mensagem de erro chegue ao usuário
// falando o nome que ele vê na tela, e não "String must contain at most...".

/** Texto que precisa vir preenchido. */
export const obrigatorio = (rotulo: string, max: number) =>
  z
    .string({
      required_error: `${rotulo} é obrigatório`,
      invalid_type_error: `${rotulo} é obrigatório`,
    })
    .trim()
    .min(1, `${rotulo} é obrigatório`)
    .max(max, `${rotulo}: máximo de ${max} caracteres`);

/**
 * Texto que pode ser limpo: `""` e `null` viram null.
 *
 * `undefined` **não** é aceito aqui de propósito — quem chama põe `.optional()`
 * em cima. Assim as rotas de atualização parcial continuam distinguindo "não
 * mandou o campo" (não mexe) de "mandou vazio" (apaga), que é o comportamento
 * que os formulários de edição dependem.
 */
export const nulavel = (rotulo: string, max: number) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (typeof v === "string" ? v.trim() || null : null))
    .pipe(z.string().max(max, `${rotulo}: máximo de ${max} caracteres`).nullable());

/** Valor em reais: número finito, não negativo, dentro do teto. */
export const dinheiro = (rotulo: string) =>
  z.coerce
    .number({ invalid_type_error: `${rotulo} deve ser um número` })
    .finite(`${rotulo} deve ser um número`)
    .min(0, `${rotulo} não pode ser negativo`)
    .max(LIMITES.valor, `${rotulo} acima do limite permitido`);

/** Valor em reais que precisa ser maior que zero (pagamento, meta). */
export const dinheiroPositivo = (rotulo: string) =>
  dinheiro(rotulo).refine((v) => v > 0, `${rotulo} deve ser maior que zero`);

/** Valor em reais que pode ser apagado — `""`, null e ausente viram null. */
export const dinheiroNulavel = (rotulo: string) =>
  z
    .union([z.string(), z.number(), z.null()])
    .transform((v) => (v === "" || v === null ? null : v))
    .pipe(dinheiro(rotulo).nullable());

/** Inteiro numa faixa; `""`, null e ausente viram null. */
export const inteiroNulavel = (rotulo: string, min: number, max: number) =>
  z
    .union([z.string(), z.number(), z.null()])
    .transform((v) => (v === "" || v === null ? null : v))
    .pipe(
      z.coerce
        .number({ invalid_type_error: `${rotulo} deve ser um número` })
        .int(`${rotulo} deve ser um número inteiro`)
        .min(min, `${rotulo}: mínimo de ${min}`)
        .max(max, `${rotulo}: máximo de ${max}`)
        .nullable()
    );

/** Data ISO vinda do formulário; `""`, null e ausente viram null. */
export const dataNulavel = (rotulo: string) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (typeof v === "string" ? v.trim() || null : null))
    .pipe(
      z.coerce
        .date({ invalid_type_error: `${rotulo} inválida` })
        .nullable()
        .refine((d) => d === null || !Number.isNaN(d.getTime()), `${rotulo} inválida`)
    );

/** Data ISO obrigatória. */
export const dataObrigatoria = (rotulo: string) =>
  z.coerce.date({
    required_error: `${rotulo} é obrigatória`,
    invalid_type_error: `${rotulo} inválida`,
  });

/** Identificador (cuid) vindo do corpo — texto curto, sem espaço. */
export const id = (rotulo: string) =>
  z
    .string({
      required_error: `${rotulo} é obrigatório`,
      invalid_type_error: `${rotulo} é obrigatório`,
    })
    .trim()
    .min(1, `${rotulo} é obrigatório`)
    .max(64, `${rotulo} inválido`);

/** Identificador que pode vir vazio (orçamento rascunho, mecânico não atribuído). */
export const idNulavel = (rotulo: string) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (typeof v === "string" ? v.trim() || null : null))
    .pipe(z.string().max(64, `${rotulo} inválido`).nullable());
