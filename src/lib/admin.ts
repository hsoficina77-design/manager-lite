// Contas do painel admin do boxOS. Puras (sem Prisma, sem Node): recebem o que
// `sistema.ts` já leu e devolvem os números da tela — dá para usar no servidor e no
// navegador do mesmo jeito.

import { diasAte, type Situacao } from "@/lib/plano";

const DIA_MS = 24 * 60 * 60 * 1000;

type Data = Date | string;
const ms = (d: Data) => new Date(d).getTime();

/** O mínimo de cada oficina que as métricas precisam. */
export type OficinaResumo = {
  id: string;
  nome: string;
  ativa: boolean;
  criadaEm: Data;
  situacao: Situacao;
  testeAte: Data | null;
  pagoAte: Data | null;
  whatsapp: string | null;
  origem: string | null;
  assinaturaAutomatica: boolean;
  ordens: number;
  ordens30d: number;
  ultimoAcesso: Data | null;
};

/** Filtros da lista de oficinas — também chegam pela URL (`?filtro=`) vindos da visão geral. */
export type Filtro = "todas" | "teste" | "encerradas" | "assinantes" | "sem-prazo" | "suspensas";

export const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "teste", rotulo: "Em teste" },
  { valor: "encerradas", rotulo: "Só consulta" },
  { valor: "assinantes", rotulo: "Assinantes" },
  { valor: "sem-prazo", rotulo: "Sem prazo" },
  { valor: "suspensas", rotulo: "Suspensas" },
];

export function ehFiltro(valor: unknown): valor is Filtro {
  return FILTROS.some((f) => f.valor === valor);
}

/** Oficina "ativa": alguém entrou nos últimos 7 dias. */
export const DIAS_ATIVA = 7;
/** Em teste e sem entrar há este tanto: vale um contato. */
export const DIAS_SUMIDA = 5;
/** Teste acabando: avisar antes que vire só consulta. */
export const DIAS_TESTE_ACABANDO = 3;

export function resumoDaPlataforma(oficinas: OficinaResumo[], agora = new Date()) {
  const t = agora.getTime();
  const desde = (dias: number) => t - dias * DIA_MS;
  const ativas = oficinas.filter((o) => o.ativa);

  const porSituacao = {
    TESTE: ativas.filter((o) => o.situacao === "TESTE").length,
    SOMENTE_LEITURA: ativas.filter((o) => o.situacao === "SOMENTE_LEITURA").length,
    ASSINANTE: ativas.filter((o) => o.situacao === "ASSINANTE").length,
    LIBERADA: ativas.filter((o) => o.situacao === "LIBERADA").length,
  };

  // O funil é do cadastro público (quem tem WhatsApp veio do link); convidadas e
  // cortesias não passam por ele.
  const doLink = oficinas.filter((o) => o.whatsapp);
  const funil = [
    { rotulo: "Cadastraram", valor: doLink.length },
    { rotulo: "Abriram 1ª OS", valor: doLink.filter((o) => o.ordens > 0).length },
    { rotulo: "Já pagaram", valor: doLink.filter((o) => o.pagoAte).length },
  ];

  return {
    total: oficinas.length,
    suspensas: oficinas.length - ativas.length,
    porSituacao,
    novas7d: oficinas.filter((o) => ms(o.criadaEm) >= desde(7)).length,
    novas30d: oficinas.filter((o) => ms(o.criadaEm) >= desde(30)).length,
    ativas7d: ativas.filter((o) => o.ultimoAcesso && ms(o.ultimoAcesso) >= desde(DIAS_ATIVA)).length,
    usandoOs30d: ativas.filter((o) => o.ordens30d > 0).length,
    funil,
    origens: contarOrigens(oficinas),
    porSemana: cadastrosPorSemana(oficinas, agora),
    atencao: precisamDeAtencao(ativas, agora),
  };
}

export type ResumoDaPlataforma = ReturnType<typeof resumoDaPlataforma>;

/** De onde vieram: `?origem=` do link, ou o caminho de entrada quando não há. */
export function origemDa(o: Pick<OficinaResumo, "origem" | "whatsapp">): string {
  if (o.origem) return o.origem;
  return o.whatsapp ? "link sem origem" : "convite";
}

function contarOrigens(oficinas: OficinaResumo[]) {
  const contagem = new Map<string, number>();
  for (const o of oficinas) contagem.set(origemDa(o), (contagem.get(origemDa(o)) ?? 0) + 1);
  return [...contagem.entries()]
    .map(([origem, valor]) => ({ origem, valor }))
    .sort((a, b) => b.valor - a.valor);
}

/** Cadastros nas últimas 12 semanas, da mais antiga para a atual (semana começa na segunda). */
function cadastrosPorSemana(oficinas: OficinaResumo[], agora: Date, semanas = 12) {
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  const SEMANA = 7 * DIA_MS;

  return Array.from({ length: semanas }, (_, i) => {
    const de = inicio.getTime() - (semanas - 1 - i) * SEMANA;
    const ate = de + SEMANA;
    return {
      inicio: new Date(de).toISOString(),
      valor: oficinas.filter((o) => ms(o.criadaEm) >= de && ms(o.criadaEm) < ate).length,
    };
  });
}

export type MotivoAtencao = "teste-acabando" | "sumida" | "nunca-entrou" | "so-consulta";

/** Quem merece um contato agora, do mais urgente para o menos. */
function precisamDeAtencao(ativas: OficinaResumo[], agora: Date) {
  const t = agora.getTime();
  const lista: { oficina: OficinaResumo; motivo: MotivoAtencao; texto: string }[] = [];

  for (const o of ativas) {
    if (o.situacao === "TESTE") {
      const dias = diasAte(o.testeAte, agora);
      if (dias <= DIAS_TESTE_ACABANDO) {
        lista.push({
          oficina: o,
          motivo: "teste-acabando",
          texto: dias <= 1 ? "Teste acaba hoje" : `Teste acaba em ${dias} dias`,
        });
        continue;
      }
      if (!o.ultimoAcesso) {
        lista.push({ oficina: o, motivo: "nunca-entrou", texto: "Ninguém entrou desde o cadastro" });
        continue;
      }
      const parado = Math.floor((t - ms(o.ultimoAcesso)) / DIA_MS);
      if (parado >= DIAS_SUMIDA) {
        lista.push({ oficina: o, motivo: "sumida", texto: `Em teste e sem entrar há ${parado} dias` });
      }
    } else if (o.situacao === "SOMENTE_LEITURA") {
      lista.push({
        oficina: o,
        motivo: "so-consulta",
        texto: o.pagoAte ? "Pagamento vencido" : "Teste acabou e não assinou",
      });
    }
  }

  const ordem: MotivoAtencao[] = ["teste-acabando", "so-consulta", "sumida", "nunca-entrou"];
  return lista.sort((a, b) => ordem.indexOf(a.motivo) - ordem.indexOf(b.motivo));
}

// ─── Receita ─────────────────────────────────────────────────────────────────

/** Eventos que significam "este pagamento entrou" (o mesmo conjunto de `lib/asaas.ts`). */
const PAGOU = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RECEIVED_IN_CASH"]);
const ESTORNOU = new Set(["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE"]);

type Evento = { id: string; tipo: string; valor: number | null; createdAt: Data };

export function ehPagamento(tipo: string) {
  return PAGOU.has(tipo);
}

/** Nome do evento do gateway em português, para listas. */
export function rotuloDoEvento(tipo: string): string {
  const nomes: Record<string, string> = {
    PAYMENT_CONFIRMED: "Pagamento confirmado",
    PAYMENT_RECEIVED: "Pagamento recebido",
    PAYMENT_RECEIVED_IN_CASH: "Pagamento em dinheiro",
    PAYMENT_OVERDUE: "Cobrança vencida",
    PAYMENT_REFUNDED: "Estorno",
    PAYMENT_CHARGEBACK_REQUESTED: "Contestação aberta",
    PAYMENT_CHARGEBACK_DISPUTE: "Contestação em disputa",
    PAYMENT_CREATED: "Cobrança criada",
    PAYMENT_DELETED: "Cobrança removida",
    SUBSCRIPTION_CREATED: "Assinatura criada",
    SUBSCRIPTION_DELETED: "Assinatura cancelada",
    SUBSCRIPTION_INACTIVATED: "Assinatura desativada",
  };
  return nomes[tipo] ?? tipo;
}

/**
 * Recebido e estornado por mês, nos últimos `meses` (o atual incluído), em centavos.
 *
 * No cartão o mesmo pagamento chega como CONFIRMED e, um mês depois, RECEIVED — mas o
 * webhook grava os dois com o mesmo id (`<cobrança>:pago`), então só o primeiro fica
 * na tabela e nada é contado duas vezes.
 */
export function receitaPorMes(eventos: Evento[], agora = new Date(), meses = 6) {
  return Array.from({ length: meses }, (_, i) => {
    const de = new Date(agora.getFullYear(), agora.getMonth() - (meses - 1 - i), 1);
    const ate = new Date(de.getFullYear(), de.getMonth() + 1, 1);
    const doMes = eventos.filter((e) => ms(e.createdAt) >= de.getTime() && ms(e.createdAt) < ate.getTime());
    return {
      inicio: de.toISOString(),
      recebido: doMes.filter((e) => PAGOU.has(e.tipo)).reduce((s, e) => s + (e.valor ?? 0), 0),
      pagamentos: doMes.filter((e) => PAGOU.has(e.tipo)).length,
      estornado: doMes.filter((e) => ESTORNOU.has(e.tipo)).reduce((s, e) => s + (e.valor ?? 0), 0),
    };
  });
}

// ─── Acessos ─────────────────────────────────────────────────────────────────

/** "Android · Chrome", "Windows · Edge"… a partir do user-agent da sessão. */
export function dispositivo(userAgent: string | null): string {
  if (!userAgent) return "aparelho desconhecido";
  const ua = userAgent;
  const sistema = /iPhone|iPad/.test(ua)
    ? "iPhone"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "outro sistema";
  const navegador = /Edg\//.test(ua)
    ? "Edge"
    : /SamsungBrowser/.test(ua)
      ? "Samsung Internet"
      : /OPR\/|Opera/.test(ua)
        ? "Opera"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : null;
  return navegador ? `${sistema} · ${navegador}` : sistema;
}
