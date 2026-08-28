// Token de sessão — assinatura e verificação.
//
// Escrito só com Web Crypto (nada de `node:crypto`) porque este arquivo roda também no
// proxy (`src/proxy.ts`), que executa no runtime Edge. É o que permite barrar
// requisição não autenticada antes de ela chegar no banco.
//
// Formato do cookie: `<sessaoId>.<expiraEm>.<papel>.<assinatura>`
//
// O `sessaoId` sozinho já seria imprevisível (32 bytes aleatórios). A assinatura serve
// para outra coisa: deixar o proxy descartar cookie forjado ou vencido — e barrar
// operador em rota de dono — sem precisar consultar o banco. A checagem que vale
// (sessão existe, usuário continua ativo, papel atual) acontece depois, no servidor,
// em `auth.ts`.
//
// O papel viaja assinado, então não dá para editar o cookie e virar admin. Se o papel
// mudar no banco, as sessões daquele usuário são apagadas na hora (ver a rota de
// usuários), e o cookie antigo morre junto.

const COOKIE = "ml_sessao";

/** 30 dias. Sem renovação automática: quando vence, faz login de novo. */
export const DURACAO_MS = 30 * 24 * 60 * 60 * 1000;

export const COOKIE_SESSAO = COOKIE;

function segredo(): string {
  const valor = process.env.AUTH_SECRET;
  if (!valor || valor.length < 32) {
    // Falhar alto é proposital: sem segredo forte, qualquer um forja um cookie de
    // admin. Melhor o login parar de funcionar e aparecer no log do que abrir a porta.
    throw new Error(
      "AUTH_SECRET ausente ou curto demais. Defina uma chave de pelo menos 32 caracteres " +
        "nas variáveis de ambiente (ex.: openssl rand -base64 48)."
    );
  }
  return valor;
}

const bytes = (texto: string) => new TextEncoder().encode(texto);

let chaveCache: { segredo: string; chave: CryptoKey } | null = null;

async function chaveHmac(): Promise<CryptoKey> {
  const atual = segredo();
  if (chaveCache?.segredo === atual) return chaveCache.chave;
  const chave = await crypto.subtle.importKey(
    "raw",
    bytes(atual),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  chaveCache = { segredo: atual, chave };
  return chave;
}

function base64url(dados: ArrayBuffer): string {
  let texto = "";
  for (const byte of new Uint8Array(dados)) texto += String.fromCharCode(byte);
  return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64url(texto: string): ArrayBuffer {
  const normal = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(normal.padEnd(Math.ceil(normal.length / 4) * 4, "="));
  const buffer = new ArrayBuffer(bruto.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < bruto.length; i++) view[i] = bruto.charCodeAt(i);
  return buffer;
}

/** Identificador de sessão: 32 bytes aleatórios. É o segredo — nunca logar. */
export function novoIdDeSessao(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

/** Monta o valor do cookie para uma sessão. */
export async function assinarToken(
  sessaoId: string,
  expiraEm: Date,
  papel: string
): Promise<string> {
  const corpo = `${sessaoId}.${expiraEm.getTime()}.${papel}`;
  const assinatura = await crypto.subtle.sign("HMAC", await chaveHmac(), bytes(corpo));
  return `${corpo}.${base64url(assinatura)}`;
}

export type TokenLido = { sessaoId: string; expiraEm: number; papel: string };

/**
 * Confere assinatura e validade do cookie. `null` = não confiável.
 *
 * Não diz que a sessão existe — só que o cookie saiu daqui e ainda não venceu.
 */
export async function lerToken(token: string | undefined | null): Promise<TokenLido | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 4) return null;

  const [sessaoId, expiraTexto, papel, assinatura] = partes;
  const expiraEm = Number(expiraTexto);
  if (!sessaoId || !papel || !Number.isFinite(expiraEm)) return null;
  if (expiraEm <= Date.now()) return null;

  try {
    const valida = await crypto.subtle.verify(
      "HMAC",
      await chaveHmac(),
      deBase64url(assinatura),
      bytes(`${sessaoId}.${expiraEm}.${papel}`)
    );
    return valida ? { sessaoId, expiraEm, papel } : null;
  } catch {
    return null;
  }
}

/** Opções do cookie. `httpOnly` tira o token do alcance de qualquer JavaScript. */
export function opcoesDoCookie(expiraEm: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiraEm,
  };
}
