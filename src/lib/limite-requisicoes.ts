// Freio de requisições — janela fixa, contagem em memória.
//
// Escrito em JavaScript puro (nada de `node:*`, nada de Redis) porque roda nos dois
// lados: no proxy (`src/proxy.ts`, runtime Edge) e nas rotas de API (Node). É o que
// permite barrar uma enxurrada antes de ela virar consulta no banco ou cálculo de
// scrypt.
//
// Escopo honesto: o app roda num container só no Railway, então uma contagem em
// memória cobre o caso real (alguém martelando o endereço por script). Reiniciar o app
// zera a contagem, e vários containers contariam separado — se um dia escalar
// horizontal, ou se entrar um CDN na frente, isto precisa virar Redis ou WAF de borda.
// Contra ataque distribuído de verdade (muitos IPs), nada aqui salva: isso é trabalho
// de camada de rede, não de aplicação.

export type Regra = {
  /** Quantas requisições cabem na janela. */
  limite: number;
  /** Tamanho da janela, em milissegundos. */
  janelaMs: number;
};

/**
 * Todas as regras num lugar só, para dar para ajustar sem caçar número solto pelo
 * código. Os valores são folgados de propósito: têm de conter enxurrada sem atrapalhar
 * a oficina — vários funcionários saem pelo mesmo IP do Wi-Fi.
 */
export const REGRAS = {
  /** Teto geral por IP. ~10 req/s sustentados; uso normal fica uma ordem abaixo. */
  porIp: { limite: 600, janelaMs: 60_000 },
  /** Teto por sessão: contém cookie roubado ou tela em laço sem punir o Wi-Fi inteiro. */
  porSessao: { limite: 300, janelaMs: 60_000 },
  /**
   * Login por IP — conta **toda** tentativa, não só as que falham.
   *
   * É este o freio que importa contra derrubar o app: cada tentativa custa ~100ms de
   * CPU e 16MB de RAM no scrypt (ver `lib/senha.ts`), e o freio por e-mail sozinho não
   * pega quem varia o e-mail a cada requisição.
   */
  loginPorIp: { limite: 30, janelaMs: 15 * 60_000 },
  /** Criação do dono: rota pública que abre transação Serializable no banco. */
  primeiroAcesso: { limite: 10, janelaMs: 15 * 60_000 },
  /** Leitura do estado da instalação: a tela chama uma vez, mas faz `count()` no banco. */
  primeiroAcessoLeitura: { limite: 60, janelaMs: 15 * 60_000 },
  /** Upload de foto: 10MB cada, cobrado do Storage. Um serviço grande rende ~20. */
  upload: { limite: 60, janelaMs: 10 * 60_000 },
} as const satisfies Record<string, Regra>;

type Balde = { contagem: number; reinicia: number };

const baldes = new Map<string, Balde>();

// Sem teto, quem varia a chave (um IP forjado por requisição) enche a memória do
// processo — trocaria um problema por outro.
const MAX_BALDES = 20_000;

function faxina(agora: number) {
  for (const [chave, balde] of baldes) {
    if (balde.reinicia <= agora) baldes.delete(chave);
  }
  // Se mesmo depois da faxina continua cheio, é enxurrada em curso: zera tudo. Perde-se
  // a contagem de quem estava dentro do limite, o que é melhor do que estourar a RAM.
  if (baldes.size > MAX_BALDES) baldes.clear();
}

/**
 * Registra uma requisição na chave dada.
 *
 * Devolve `0` quando pode passar, ou quantos **segundos** faltam para a janela virar.
 * Contar a requisição barrada de propósito: quem insiste durante o bloqueio continua
 * batendo no balde cheio e não ganha nada com isso.
 */
export function consumir(chave: string, regra: Regra): number {
  const agora = Date.now();

  if (baldes.size >= MAX_BALDES) faxina(agora);

  const balde = baldes.get(chave);
  if (!balde || balde.reinicia <= agora) {
    baldes.set(chave, { contagem: 1, reinicia: agora + regra.janelaMs });
    return 0;
  }

  balde.contagem += 1;
  if (balde.contagem <= regra.limite) return 0;
  return Math.max(1, Math.ceil((balde.reinicia - agora) / 1000));
}

/** Esquece a chave — usado quando a ação deu certo e não faz sentido seguir contando. */
export function esquecer(chave: string) {
  baldes.delete(chave);
}

// Quantos proxies confiáveis existem na frente do app. No Railway é 1 (o proxy de
// borda). Se um dia entrar Cloudflare ou outro CDN na frente, vira 2 — senão o IP lido
// passa a ser o do CDN e todo mundo cai no mesmo balde.
const HOPS = Number(process.env.PROXIES_CONFIAVEIS || "1");

/**
 * IP de quem fez a requisição.
 *
 * O detalhe que decide se o freio funciona: `x-forwarded-for` é uma lista em que cada
 * proxy **acrescenta** o endereço de quem falou com ele. O cliente pode mandar a sua
 * própria lista, então o primeiro item é escolha do atacante — ler dali deixaria
 * qualquer um trocar de identidade a cada requisição e passar por cima de todo limite.
 * O item que vale é o que o proxy de borda escreveu: contado a partir do fim.
 */
export function ipDaRequisicao(origem: Request | { headers: Headers }): string {
  const headers = origem.headers;

  const bruto = headers.get("x-forwarded-for");
  if (bruto) {
    const lista = bruto
      .split(",")
      .map((parte) => parte.trim())
      .filter(Boolean);
    const hops = Number.isFinite(HOPS) && HOPS >= 1 ? Math.floor(HOPS) : 1;
    const ip = lista[lista.length - hops] ?? lista[lista.length - 1];
    if (ip) return ip;
  }

  // `x-real-ip` só como reserva: proxies costumam sobrescrevê-lo, mas nem todos.
  return headers.get("x-real-ip")?.trim() || "local";
}

/**
 * Resposta 429 pronta, com `Retry-After`.
 *
 * Em rota de API sai JSON (é o que as telas sabem ler); em página sai texto puro, para
 * não entregar um JSON cru a quem só abriu o endereço no navegador.
 */
export function respostaDeLimite(
  esperaSegundos: number,
  opcoes: { json?: boolean; mensagem?: string } = {}
): Response {
  const { json = true, mensagem } = opcoes;
  const minutos = Math.ceil(esperaSegundos / 60);
  const texto =
    mensagem ??
    `Muitas requisições. Tente de novo em ${minutos} minuto${minutos > 1 ? "s" : ""}.`;

  const headers: Record<string, string> = {
    "Retry-After": String(esperaSegundos),
    // Não faz sentido guardar a recusa em cache de navegador ou de CDN.
    "Cache-Control": "no-store",
  };

  return json
    ? new Response(JSON.stringify({ error: texto }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json" },
      })
    : new Response(texto, {
        status: 429,
        headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
      });
}
