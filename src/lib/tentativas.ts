// Freio de força bruta no login.
//
// Contagem em memória: o app roda num container só no Railway, então isso cobre o caso
// real (alguém martelando senha no formulário ou por script). Reiniciar o app zera a
// contagem, e vários containers contariam separado — se um dia escalar horizontal,
// isto precisa virar tabela ou Redis.
//
// Server-side apenas.

const JANELA_MS = 15 * 60 * 1000;
const LIMITE = 8;

type Registro = { tentativas: number; ate: number };

const registros = new Map<string, Registro>();

// Sem isto, um atacante variando o e-mail encheria a memória do processo.
const MAX_CHAVES = 5000;

function limpar(agora: number) {
  for (const [chave, reg] of registros) {
    if (reg.ate <= agora) registros.delete(chave);
  }
}

/** Segundos que faltam para poder tentar de novo, ou 0 se está liberado. */
export function esperaRestante(chave: string): number {
  const reg = registros.get(chave);
  if (!reg) return 0;
  const agora = Date.now();
  if (reg.ate <= agora) {
    registros.delete(chave);
    return 0;
  }
  if (reg.tentativas < LIMITE) return 0;
  return Math.ceil((reg.ate - agora) / 1000);
}

/** Marca uma tentativa fracassada. */
export function registrarFalha(chave: string) {
  const agora = Date.now();
  if (registros.size > MAX_CHAVES) limpar(agora);

  const reg = registros.get(chave);
  if (!reg || reg.ate <= agora) {
    registros.set(chave, { tentativas: 1, ate: agora + JANELA_MS });
    return;
  }
  reg.tentativas += 1;
  // Cada falha depois do limite empurra a liberação para frente.
  if (reg.tentativas >= LIMITE) reg.ate = agora + JANELA_MS;
}

/** Login deu certo: esquece o histórico daquela chave. */
export function limparFalhas(chave: string) {
  registros.delete(chave);
}

/** Identifica quem está tentando, mesmo atrás do proxy do Railway. */
export function chaveDaRequisicao(request: Request, email: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "desconhecido";
  return `${ip}|${email.toLowerCase()}`;
}
