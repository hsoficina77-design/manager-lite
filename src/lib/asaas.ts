// Asaas — o gateway de pagamento da assinatura do boxOS.
//
// Um cliente pequeno, com `fetch`, em vez do SDK: são poucas chamadas, e assim não
// entra dependência nova no build. Só roda no servidor (usa a chave).
//
// Duas formas de pagar, as duas pela página de fatura do Asaas (o boxOS nunca vê cartão):
//   - cartão: `POST /subscriptions` mensal. A primeira fatura é paga na página do Asaas,
//     que guarda o cartão; as seguintes são cobradas nele sozinhas.
//   - Pix:    `POST /payments` avulso; cada pagamento libera mais 30 dias.
//
// O ambiente sai da própria chave: `$aact_hmlg_…` é sandbox, `$aact_prod_…` é produção.
//
// Quem libera a oficina é sempre o webhook (`/api/webhooks/asaas`) — nunca a tela de
// retorno, que qualquer um pode abrir digitando o endereço.

import { timingSafeEqual } from "node:crypto";

export type FormaDePagamento = "cartao" | "pix";

export class ErroGateway extends Error {
  constructor(
    mensagem: string,
    readonly status?: number
  ) {
    super(mensagem);
  }
}

/** As variáveis que o pagamento precisa estão todas definidas? */
export function gatewayConfigurado(): boolean {
  return Boolean(process.env.ASAAS_API_KEY && process.env.ASAAS_WEBHOOK_TOKEN && precoMensalCentavos());
}

/** Preço do mês em centavos. É o valor cobrado no Asaas, não só o mostrado na tela. */
export function precoMensalCentavos(): number | null {
  const valor = Number(process.env.PRECO_MENSAL_CENTAVOS);
  return Number.isInteger(valor) && valor > 0 ? valor : null;
}

function base() {
  return process.env.ASAAS_API_KEY?.includes("_hmlg_")
    ? "https://api-sandbox.asaas.com/v3"
    : "https://api.asaas.com/v3";
}

async function chamar<T>(metodo: "GET" | "POST" | "DELETE", caminho: string, corpo?: unknown): Promise<T> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) throw new ErroGateway("ASAAS_API_KEY não definida");

  const res = await fetch(`${base()}${caminho}`, {
    method: metodo,
    // User-Agent é obrigatório nas contas criadas a partir de junho de 2024.
    headers: { access_token: chave, "Content-Type": "application/json", "User-Agent": "boxOS/1.0" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as (T & { errors?: { description?: string }[] }) | null;
  if (!res.ok || !json) {
    const motivo = json?.errors?.map((e) => e.description).join("; ") || `HTTP ${res.status}`;
    throw new ErroGateway(`Asaas ${metodo} ${caminho}: ${motivo}`, res.status);
  }
  return json;
}

// ─── CPF / CNPJ ──────────────────────────────────────────────────────────────

function digitoVerificador(digitos: string, pesos: number[]) {
  const soma = pesos.reduce((acc, peso, i) => acc + Number(digitos[i]) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** CPF ou CNPJ só com dígitos, se for válido. O Asaas exige um dos dois no cliente. */
export function normalizarCpfCnpj(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const d = valor.replace(/\D/g, "");
  if (/^(\d)\1+$/.test(d)) return null;
  if (d.length === 11) {
    const ok =
      digitoVerificador(d, [10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[9]) &&
      digitoVerificador(d, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[10]);
    return ok ? d : null;
  }
  if (d.length === 14) {
    const ok =
      digitoVerificador(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
      digitoVerificador(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13]);
    return ok ? d : null;
  }
  return null;
}

// ─── Cobrança ────────────────────────────────────────────────────────────────

/** O id é de um cliente do Asaas? Os da AbacatePay, se sobrou algum, não servem aqui. */
export function ehClienteAsaas(id: string | null): id is string {
  return Boolean(id?.startsWith("cus_"));
}

export async function criarCliente(dados: {
  nome: string;
  email: string;
  celular: string | null;
  cpfCnpj: string;
  oficinaId: string;
}) {
  // O WhatsApp é guardado com o 55 na frente; o Asaas quer DDD + número.
  const celular = dados.celular?.replace(/^55(?=\d{10,11}$)/, "");
  const cliente = await chamar<{ id: string }>("POST", "/customers", {
    name: dados.nome,
    email: dados.email,
    cpfCnpj: dados.cpfCnpj,
    externalReference: dados.oficinaId,
    // Quem avisa do vencimento é o boxOS (faixa no topo); sem e-mail e SMS do Asaas.
    notificationDisabled: true,
    ...(celular ? { mobilePhone: celular } : {}),
  });
  return cliente.id;
}

/** Data de hoje em Brasília, no formato do Asaas. */
function hoje(somaDias = 0) {
  const data = new Date(Date.now() + somaDias * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(data);
}

type Fatura = { id: string; invoiceUrl: string };

/**
 * Cria com o redirecionamento de volta para o boxOS. O Asaas só aceita o redirecionamento
 * para o domínio cadastrado na conta (Minha conta → Informações); se recusar, cria sem —
 * o pagamento funciona igual, só não volta sozinho para a tela de "obrigado".
 */
async function criarComRetorno<T>(caminho: string, corpo: Record<string, unknown>, appUrl: string) {
  try {
    return await chamar<T>("POST", caminho, {
      ...corpo,
      callback: { successUrl: `${appUrl}/assinatura/obrigado`, autoRedirect: true },
    });
  } catch (err) {
    if (!(err instanceof ErroGateway) || err.status !== 400) throw err;
    console.warn(`[pagamento] Asaas recusou o retorno automático, criando sem: ${err.message}`);
    return chamar<T>("POST", caminho, corpo);
  }
}

/**
 * Abre a cobrança e devolve o endereço da fatura do Asaas.
 *
 * A oficina vai em `externalReference`; o webhook também a acha pelo id do cliente.
 */
export async function criarCobranca(dados: {
  forma: FormaDePagamento;
  clienteId: string;
  oficinaId: string;
  appUrl: string;
}): Promise<string> {
  const valor = precoMensalCentavos();
  if (!valor) throw new ErroGateway("PRECO_MENSAL_CENTAVOS não definido");

  const comum = {
    customer: dados.clienteId,
    value: valor / 100,
    externalReference: dados.oficinaId,
  };

  if (dados.forma === "pix") {
    const cobranca = await criarComRetorno<Fatura>(
      "/payments",
      // Três dias de prazo: dá tempo de pagar sem a cobrança vencer no meio do caminho.
      { ...comum, billingType: "PIX", dueDate: hoje(3), description: "boxOS — 1 mês (Pix)" },
      dados.appUrl
    );
    return cobranca.invoiceUrl;
  }

  const assinatura = await criarComRetorno<{ id: string }>(
    "/subscriptions",
    { ...comum, billingType: "CREDIT_CARD", cycle: "MONTHLY", nextDueDate: hoje(), description: "boxOS — plano mensal" },
    dados.appUrl
  );
  // A primeira cobrança nasce junto com a assinatura; é a fatura dela que a oficina paga.
  const cobrancas = await chamar<{ data: Fatura[] }>("GET", `/subscriptions/${assinatura.id}/payments`);
  const primeira = cobrancas.data[0];
  if (!primeira?.invoiceUrl) throw new ErroGateway(`Asaas: assinatura ${assinatura.id} sem fatura`);
  return primeira.invoiceUrl;
}

/** Cancela no gateway (sem novas cobranças; as pendentes somem). O acesso segue até o `pagoAte`. */
export async function cancelarAssinatura(assinaturaId: string) {
  await chamar("DELETE", `/subscriptions/${assinaturaId}`);
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

/**
 * O webhook veio mesmo do Asaas? Ele manda, no cabeçalho `asaas-access-token`, o token
 * que nós cadastramos no painel junto com a URL. Comparação em tempo constante.
 */
export function verificarWebhook(tokenRecebido: string | null): boolean {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token || !tokenRecebido) return false;
  const a = Buffer.from(tokenRecebido);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Eventos que significam "este pagamento entrou". */
export const EVENTOS_DE_PAGAMENTO = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RECEIVED_IN_CASH"]);

export type EventoGateway = {
  /** Chave da reentrega — ver `lerEvento`. */
  id: string;
  tipo: string;
  oficinaId: string | null;
  clienteId: string | null;
  assinaturaId: string | null;
  /** Em centavos. */
  valor: number | null;
};

type Objeto = Record<string, unknown>;
const texto = (v: unknown) => (typeof v === "string" && v ? v : null);

/**
 * Lê o que interessa do evento: `{ id, event, payment: {...} }` ou `{ id, event, subscription: {...} }`.
 *
 * A chave de reentrega é o `id` do evento, com uma exceção: no cartão, o mesmo pagamento
 * chega duas vezes com ids diferentes — `PAYMENT_CONFIRMED` na aprovação e
 * `PAYMENT_RECEIVED` uns 30 dias depois, quando o dinheiro cai. Para não estender o
 * prazo duas vezes, todo evento de "pagamento entrou" usa o id da cobrança.
 */
export function lerEvento(corpo: unknown): EventoGateway | null {
  if (!corpo || typeof corpo !== "object") return null;
  const e = corpo as { id?: unknown; event?: unknown; payment?: unknown; subscription?: unknown };
  const tipo = texto(e.event);
  if (!tipo) return null;

  const pagamento = (e.payment && typeof e.payment === "object" ? e.payment : null) as Objeto | null;
  const assinatura = (e.subscription && typeof e.subscription === "object" ? e.subscription : null) as Objeto | null;
  const recurso = pagamento ?? assinatura;
  const recursoId = texto(recurso?.id);

  const id = pagamento && recursoId && EVENTOS_DE_PAGAMENTO.has(tipo) ? `${recursoId}:pago` : texto(e.id);
  if (!id) return null;

  return {
    id,
    tipo,
    oficinaId: texto(recurso?.externalReference),
    clienteId: texto(recurso?.customer),
    assinaturaId: pagamento ? texto(pagamento.subscription) : recursoId,
    valor: typeof pagamento?.value === "number" ? Math.round(pagamento.value * 100) : null,
  };
}
