// Os dois produtos que este app serve: o boxOS (gestão da oficina) e o Peça Peça
// (cotação nas autopeças da região). Um servidor e um banco só — o endereço pelo qual a
// pessoa chegou é que decide qual dos dois ela vê.
//
// Arquivo puro (sem Prisma, sem API de Node): o proxy, o layout e o manifesto precisam
// responder exatamente a mesma coisa.
//
// O produto é só apresentação — moldura, marca, para onde "/" leva. Nenhuma trava
// depende dele: quem decide o que a pessoa pode é a sessão (`guardaApi`, `guardaLoja`).
// Por isso não faz mal confiar no cabeçalho do host para escolhê-lo.

export type Produto = "boxos" | "peca-peca";

/** Cabeçalho com o produto da requisição, escrito pelo proxy e lido pelo layout. */
export const HEADER_PRODUTO = "x-produto";

/** Endereço de desenvolvimento do Peça Peça: o Chrome resolve `*.localhost` sozinho. */
const HOST_LOCAL_PECA_PECA = "pecapeca.localhost";

function semBarraNoFim(url: string | undefined): string {
  return (url ?? "").trim().replace(/\/+$/, "");
}

/**
 * Endereço público do Peça Peça (`PECA_PECA_URL`). Vazio enquanto ele não tem domínio
 * próprio — aí tudo continua servido pelo endereço do boxOS.
 */
export function urlPecaPeca(): string {
  return semBarraNoFim(process.env.PECA_PECA_URL);
}

/** Endereço público do boxOS (`APP_URL`). */
export function urlBoxOS(): string {
  return semBarraNoFim(process.env.APP_URL);
}

/** "www.pecapeca.com.br:443" → "pecapeca.com.br". O com e o sem `www.` são o mesmo site. */
function nomeDoHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0].replace(/^www\./, "");
}

function hostDaUrl(url: string): string | null {
  try {
    return nomeDoHost(new URL(url).host);
  } catch {
    return null;
  }
}

export function produtoDoHost(host: string | null | undefined): Produto {
  if (!host) return "boxos";
  // Atrás de proxy reverso pode chegar uma lista; vale o primeiro.
  const nome = nomeDoHost(host.split(",")[0]);
  if (nome === HOST_LOCAL_PECA_PECA) return "peca-peca";
  const doPecaPeca = hostDaUrl(urlPecaPeca());
  return doPecaPeca && nome === doPecaPeca ? "peca-peca" : "boxos";
}

/** O host como chegou: o do proxy reverso, se houver, senão o da própria requisição. */
export function hostDaRequisicao(cabecalhos: Pick<Headers, "get">): string | null {
  return cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");
}

export function ehProduto(valor: unknown): valor is Produto {
  return valor === "boxos" || valor === "peca-peca";
}

// ─── Que tela é de que produto ────────────────────────────────────────────────

function comecaCom(pathname: string, rotas: readonly string[]) {
  return rotas.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}

/**
 * Telas que só existem no Peça Peça: no endereço do boxOS elas mandam para o do Peça
 * Peça (quando ele existe). É o que mantém vivos os links antigos do balcão.
 */
const TELAS_SO_DO_PECA_PECA = ["/balcao", "/loja", "/acesso-loja", "/cadastro", "/bem-vindo"];

/**
 * Telas que o endereço do Peça Peça serve. O resto (OS, clientes, caixa...) é do boxOS
 * e manda para lá. As APIs não entram nesta conta: a tela do Peça Peça de quem também
 * tem boxOS consulta `/api/veiculos`, e quem barra API é a sessão, não o endereço.
 */
const TELAS_DO_PECA_PECA = [
  ...TELAS_SO_DO_PECA_PECA,
  "/peca-peca",
  "/login",
  "/conheca-o-boxos",
  "/termos",
  "/privacidade",
];

/**
 * Tela que só existe no Peça Peça — balcão, painel e convite da loja, cadastro e boas-
 * vindas. Enquanto o Peça Peça não tem endereço próprio, elas moram no do boxOS, mas
 * continuam com a cara do Peça Peça e sem o menu de quem estiver logado.
 */
export function ehTelaDoPecaPeca(pathname: string): boolean {
  return comecaCom(pathname, TELAS_SO_DO_PECA_PECA);
}

/**
 * O login de quem sai do Peça Peça, ou chega nele sem ter entrado. No endereço do boxOS
 * o `/login` é um só, e é o `?next=` que diz de que produto a pessoa vem (ver
 * `loginDoPecaPeca`). As boas-vindas levam cada conta à sua tela depois de entrar:
 * oficina às cotações, loja ao balcão.
 */
export const LOGIN_DO_PECA_PECA = "/login?next=/bem-vindo";

/** O `next` do login aponta para uma tela do Peça Peça: o login ganha a cara dele. */
export function loginDoPecaPeca(next: string | null | undefined): boolean {
  return Boolean(next) && ehTelaDoPecaPeca(next!.split("?")[0]);
}

/**
 * Endereço para onde a tela deve ir, quando foi aberta no produto errado. `null` = fica.
 * Só desvia quando o outro endereço está configurado — sem `PECA_PECA_URL`, o boxOS
 * serve tudo.
 */
export function desvioDeProduto(produto: Produto, pathname: string): string | null {
  if (pathname.startsWith("/api/")) return null;
  if (produto === "boxos") {
    return comecaCom(pathname, TELAS_SO_DO_PECA_PECA) ? urlPecaPeca() || null : null;
  }
  if (pathname === "/" || comecaCom(pathname, TELAS_DO_PECA_PECA)) return null;
  return urlBoxOS() || null;
}
