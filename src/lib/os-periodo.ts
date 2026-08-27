import { OS_CONCLUIDA, OS_EM_ABERTO } from "./constants";
import type { Janela } from "./periodo";

/**
 * OS entregues dentro da janela — a definição de "produção do período".
 *
 * O que define o período é a **data de entrega** (`fechamento`), não a de abertura:
 * um carro aberto há 30 dias e entregue hoje é produção de hoje, e uma OS ainda no
 * pátio não é produção de período nenhum.
 *
 * O segundo ramo é rede de segurança para OS entregues antes de `fechamento` passar
 * a ser carimbado. Sem ele essas OS sumiriam do resultado; com ele caem na
 * `abertura`, que é a melhor aproximação que sobrou. Nenhum dado é reescrito.
 */
export function osEntreguesNoPeriodo(j: Janela) {
  return {
    status: { in: OS_CONCLUIDA },
    OR: [
      { fechamento: { gte: j.inicio, lt: j.fim } },
      { AND: [{ fechamento: null }, { abertura: { gte: j.inicio, lt: j.fim } }] },
    ],
  };
}

/** OS ainda no pátio. Sem recorte de data de propósito: é o estado da oficina agora. */
export const osNoPatio = { status: { in: OS_EM_ABERTO } };

/** Data em que a OS conta como produzida, com o mesmo fallback do filtro acima. */
export function dataProducao(os: { fechamento: Date | null; abertura: Date }): Date {
  return os.fechamento ?? os.abertura;
}

/** Dias corridos que a OS está parada no pátio. */
export function diasParado(abertura: Date, agora = new Date()): number {
  return Math.max(0, Math.floor((agora.getTime() - abertura.getTime()) / 86_400_000));
}
