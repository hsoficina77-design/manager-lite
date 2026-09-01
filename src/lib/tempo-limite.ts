// Prazo para as etapas de gerar o documento (ver BaixarOS / BaixarOrcamento).
//
// Nenhuma delas pode ficar pendente para sempre: o botão de baixar só sai do
// "Gerando..." quando a promessa termina, então uma requisição que trava deixa a
// tela girando sem erro nenhum — nem no console, porque `fetch` não desiste
// sozinho. Com prazo, o pior caso vira uma mensagem dizendo onde travou.

/** Prazos por etapa. Generosos: são rede lenta, não erro. */
export const PRAZO = {
  /** Requisição ao próprio servidor (configuração). */
  api: 20_000,
  /** Download de uma imagem (logo, foto no Storage). */
  imagem: 30_000,
  /** Montagem do PDF — cresce com o número de fotos. */
  pdf: 90_000,
} as const;

export class TempoEsgotado extends Error {
  constructor(etapa: string, ms: number) {
    super(`${etapa} demorou mais de ${Math.round(ms / 1000)}s`);
    this.name = "TempoEsgotado";
  }
}

/**
 * Devolve a promessa, mas falhando se ela passar do prazo.
 *
 * @param etapa aparece na mensagem de erro — é o que diz à pessoa (e a quem for
 *   consertar) qual passo travou.
 */
export function comPrazo<T>(promessa: Promise<T>, ms: number, etapa: string): Promise<T> {
  let relogio: ReturnType<typeof setTimeout>;
  const estouro = new Promise<never>((_, reject) => {
    relogio = setTimeout(() => reject(new TempoEsgotado(etapa, ms)), ms);
  });
  return Promise.race([promessa, estouro]).finally(() => clearTimeout(relogio));
}

/**
 * `fetch` que desiste sozinho.
 *
 * Aborta de verdade (AbortSignal), em vez de só ignorar a resposta: sem isso a
 * conexão travada continuaria segurando uma das poucas por origem que o
 * navegador permite, e a segunda tentativa nasceria na fila da primeira.
 */
export function fetchComPrazo(url: string, ms: number): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(ms) });
}
