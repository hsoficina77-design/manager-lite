// Plano da oficina: teste grátis, assinatura e o modo só leitura.
//
// Um arquivo puro (sem Prisma, sem Node), porque a tela também precisa das mesmas
// regras — a faixa de "faltam N dias" e o modal de bloqueio leem daqui.
//
// O "corte" do teste não é executado por ninguém: a oficina guarda datas, e a situação
// sai delas a cada requisição (`auth.ts` → `getUsuarioAtual`). Venceu o prazo, a
// próxima ação já é recusada; pagou, a próxima já passa. Não existe job para esquecer
// de rodar.

export const DIAS_TESTE = 30;

/**
 * Folga depois do `pagoAte`. Cobre as novas tentativas de cobrança do cartão (o gateway
 * tenta de novo por alguns dias) sem a oficina cair em modo leitura no meio do mês.
 */
export const CARENCIA_DIAS = 3;

/** Quando o pagamento está para vencer, a faixa começa a avisar. */
export const AVISO_VENCIMENTO_DIAS = 5;

const DIA_MS = 24 * 60 * 60 * 1000;

export type Situacao =
  /** Sem prazo: oficinas antigas, criadas por convite ou liberadas como cortesia. */
  | "LIBERADA"
  /** Dentro dos dias grátis. */
  | "TESTE"
  /** Pago (ou dentro da carência). */
  | "ASSINANTE"
  /** Teste ou pagamento vencido: vê tudo, não altera nada. */
  | "SOMENTE_LEITURA";

export type DatasDoPlano = {
  testeAte: Date | string | null;
  pagoAte: Date | string | null;
};

const data = (valor: Date | string | null) => (valor ? new Date(valor) : null);

export function situacaoDaOficina(datas: DatasDoPlano, agora = new Date()): Situacao {
  const testeAte = data(datas.testeAte);
  const pagoAte = data(datas.pagoAte);

  if (pagoAte && agora.getTime() <= pagoAte.getTime() + CARENCIA_DIAS * DIA_MS) return "ASSINANTE";
  if (!testeAte && !pagoAte) return "LIBERADA";
  if (testeAte && agora <= testeAte) return "TESTE";
  return "SOMENTE_LEITURA";
}

/**
 * Dias até a data, arredondando para cima: faltando 30 horas, são "2 dias". Zero ou
 * negativo quando já passou.
 */
export function diasAte(ate: Date | string | null, agora = new Date()): number {
  const fim = data(ate);
  if (!fim) return 0;
  return Math.ceil((fim.getTime() - agora.getTime()) / DIA_MS);
}

export function fimDoTeste(inicio = new Date()): Date {
  return new Date(inicio.getTime() + DIAS_TESTE * DIA_MS);
}

/** Código que a API devolve junto com o 402 — é por ele que a tela abre o modal. */
export const CODIGO_SOMENTE_LEITURA = "ACESSO_SOMENTE_LEITURA";

export const MENSAGEM_SOMENTE_LEITURA =
  "Seu período de teste terminou. Assine o boxOS para voltar a registrar.";

/**
 * Rotas que continuam aceitando gravação em modo só leitura: sair, e assinar — que é
 * justamente o que a oficina bloqueada precisa conseguir fazer.
 */
export const ROTAS_LIVRES_NO_BLOQUEIO = ["/api/auth/logout", "/api/assinatura"];

/** Métodos que não alteram nada — passam sempre. */
const METODOS_DE_LEITURA = new Set(["GET", "HEAD", "OPTIONS"]);

export function acaoBloqueada(metodo: string, pathname: string): boolean {
  if (METODOS_DE_LEITURA.has(metodo.toUpperCase())) return false;
  return !ROTAS_LIVRES_NO_BLOQUEIO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}

/** WhatsApp só com dígitos e o DDI do Brasil — é assim que se compara e se monta o wa.me. */
export function normalizarWhatsapp(valor: string): string | null {
  let digitos = valor.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;
  if (!/^55\d{10,11}$/.test(digitos)) return null;
  return digitos;
}

/** Número de contato do boxOS (env pública), já pronto para `wa.me`. */
export function linkWhatsappBoxOS(mensagem: string): string | null {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_BOXOS?.replace(/\D/g, "");
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
