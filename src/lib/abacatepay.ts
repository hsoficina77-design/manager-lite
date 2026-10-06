// AbacatePay — o gateway de pagamento da assinatura do boxOS.
//
// Um cliente pequeno, com `fetch`, em vez do SDK: são quatro chamadas, e assim não
// entra dependência nova no build. Só roda no servidor (usa `node:crypto` e a chave).
//
// Duas formas de pagar, porque a assinatura recorrente da AbacatePay só aceita cartão:
//   - cartão: `subscriptions/create` com um produto de ciclo mensal; renova sozinho.
//   - Pix:    `checkouts/create` avulso; cada pagamento libera mais 30 dias.
//
// Quem libera a oficina é sempre o webhook (`/api/webhooks/abacatepay`) — nunca a tela
// de retorno, que qualquer um pode abrir digitando o endereço.

import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.abacatepay.com/v2";

/**
 * Chave pública com que a AbacatePay assina os webhooks (HMAC-SHA256 do corpo cru, em
 * base64, no cabeçalho `X-Webhook-Signature`). É pública — está na documentação —, então
 * sozinha não prova nada; junto com o segredo na URL, que só nós e o painel sabemos, sim.
 */
const CHAVE_PUBLICA_WEBHOOK =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export type FormaDePagamento = "cartao" | "pix";

export class ErroGateway extends Error {}

/** As variáveis que o pagamento precisa estão todas definidas? */
export function gatewayConfigurado(): boolean {
  return Boolean(
    process.env.ABACATEPAY_API_KEY &&
      process.env.ABACATEPAY_WEBHOOK_SECRET &&
      process.env.ABACATEPAY_PRODUTO_MENSAL &&
      process.env.ABACATEPAY_PRODUTO_PIX
  );
}

/** Preço do mês em centavos, só para mostrar na tela (quem cobra é o produto no gateway). */
export function precoMensalCentavos(): number | null {
  const valor = Number(process.env.PRECO_MENSAL_CENTAVOS);
  return Number.isInteger(valor) && valor > 0 ? valor : null;
}

async function chamar<T>(caminho: string, corpo: unknown): Promise<T> {
  const chave = process.env.ABACATEPAY_API_KEY;
  if (!chave) throw new ErroGateway("ABACATEPAY_API_KEY não definida");

  const res = await fetch(`${BASE}${caminho}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as { data?: T; error?: string | null } | null;
  if (!res.ok || !json?.data || json.error) {
    throw new ErroGateway(`AbacatePay ${caminho}: ${json?.error ?? `HTTP ${res.status}`}`);
  }
  return json.data;
}

export async function criarCliente(dados: { nome: string; email: string; celular: string | null }) {
  const cliente = await chamar<{ id: string }>("/customers/create", {
    name: dados.nome,
    email: dados.email,
    ...(dados.celular ? { cellphone: dados.celular } : {}),
  });
  return cliente.id;
}

/**
 * Abre a cobrança e devolve o endereço da página de pagamento da AbacatePay.
 *
 * A oficina vai em `externalId` **e** em `metadata` — o webhook procura nos dois, e a
 * `forma` em metadata é o que separa o Pix avulso do primeiro pagamento da assinatura.
 */
export async function criarCobranca(dados: {
  forma: FormaDePagamento;
  clienteId: string;
  oficinaId: string;
  appUrl: string;
}): Promise<string> {
  const comum = {
    customerId: dados.clienteId,
    externalId: dados.oficinaId,
    metadata: { oficinaId: dados.oficinaId, forma: dados.forma },
    returnUrl: `${dados.appUrl}/assinatura`,
    completionUrl: `${dados.appUrl}/assinatura/obrigado`,
  };

  const cobranca =
    dados.forma === "cartao"
      ? await chamar<{ url: string }>("/subscriptions/create", {
          ...comum,
          items: [{ id: process.env.ABACATEPAY_PRODUTO_MENSAL, quantity: 1 }],
          methods: ["CARD"],
        })
      : await chamar<{ url: string }>("/checkouts/create", {
          ...comum,
          items: [{ id: process.env.ABACATEPAY_PRODUTO_PIX, quantity: 1 }],
          methods: ["PIX"],
        });
  return cobranca.url;
}

/** Cancela na hora no gateway (sem novas cobranças). O acesso segue até o `pagoAte`. */
export async function cancelarAssinatura(assinaturaId: string) {
  await chamar("/subscriptions/cancel", { id: assinaturaId });
}

// ─── Webhook ─────────────────────────────────────────────────────────────────

function iguais(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * O webhook veio mesmo da AbacatePay? Confere as duas coisas que ela manda: o segredo
 * na URL (`?webhookSecret=`, cadastrado por nós no painel) e a assinatura HMAC do corpo
 * cru. Comparação em tempo constante nas duas.
 */
export function verificarWebhook(url: URL, corpoCru: string, assinatura: string | null): boolean {
  const segredo = process.env.ABACATEPAY_WEBHOOK_SECRET;
  const recebido = url.searchParams.get("webhookSecret");
  if (!segredo || !recebido || !iguais(recebido, segredo)) return false;
  if (!assinatura) return false;

  const esperada = createHmac("sha256", CHAVE_PUBLICA_WEBHOOK).update(Buffer.from(corpoCru, "utf8")).digest("base64");
  return iguais(assinatura, esperada);
}

export type EventoGateway = {
  /** Id do evento — o mesmo em todas as reentregas. */
  id: string;
  tipo: string;
  devMode: boolean;
  oficinaId: string | null;
  forma: FormaDePagamento | null;
  assinaturaId: string | null;
  valor: number | null;
};

/**
 * Lê o que interessa do evento.
 *
 * A documentação garante o envelope (`id`, `event`, `devMode`, `data`), mas não o
 * desenho de `data` em cada evento — a cobrança pode vir na raiz ou aninhada
 * (`data.checkout`, `data.subscription`…). Por isso a busca é em profundidade: acha o
 * nosso `metadata.oficinaId` ou o `externalId` onde estiverem. O evento inteiro fica
 * gravado em `EventoPagamento.payload`, para conferir no sandbox.
 */
export function lerEvento(corpo: unknown): EventoGateway | null {
  if (!corpo || typeof corpo !== "object") return null;
  const e = corpo as { id?: unknown; event?: unknown; devMode?: unknown; data?: unknown };
  if (typeof e.id !== "string" || typeof e.event !== "string") return null;

  const metadata = procurar(e.data, (chave, valor) => chave === "metadata" && objeto(valor) && "oficinaId" in valor) as
    | { oficinaId?: unknown; forma?: unknown }
    | undefined;
  const externalId = procurar(e.data, (chave, valor) => chave === "externalId" && typeof valor === "string");
  const assinaturaId = procurar(
    e.data,
    (chave, valor) => chave === "id" && typeof valor === "string" && valor.startsWith("subs_")
  );
  const valor = procurar(e.data, (chave, v) => (chave === "amount" || chave === "paidAmount") && typeof v === "number");

  const oficinaId =
    typeof metadata?.oficinaId === "string" ? metadata.oficinaId : typeof externalId === "string" ? externalId : null;
  const forma = metadata?.forma === "cartao" || metadata?.forma === "pix" ? metadata.forma : null;

  return {
    id: e.id,
    tipo: e.event,
    devMode: e.devMode === true,
    oficinaId,
    forma,
    assinaturaId: typeof assinaturaId === "string" ? assinaturaId : null,
    valor: typeof valor === "number" ? valor : null,
  };
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor);
}

/** Primeiro valor, em largura, cuja chave satisfaz o teste. Largura: o mais raso vence. */
function procurar(raiz: unknown, teste: (chave: string, valor: unknown) => boolean): unknown {
  const fila: unknown[] = [raiz];
  let visitados = 0;
  while (fila.length && visitados++ < 500) {
    const atual = fila.shift();
    if (Array.isArray(atual)) {
      fila.push(...atual);
    } else if (objeto(atual)) {
      for (const [chave, valor] of Object.entries(atual)) {
        if (teste(chave, valor)) return valor;
        if (valor && typeof valor === "object") fila.push(valor);
      }
    }
  }
  return undefined;
}
