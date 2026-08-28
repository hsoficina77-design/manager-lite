// Acesso ao Supabase Storage via API REST (server-side only).
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.

import type { TipoImagem } from "@/lib/imagem-upload";

const BUCKET = "os-fotos";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return { url, key };
}

function headers(key: string, extra?: Record<string, string>) {
  return { Authorization: `Bearer ${key}`, apikey: key, ...extra };
}

let bucketOk = false;

/**
 * Garante que o bucket existe (idempotente).
 *
 * Nasce privado: como toda leitura passa por URL assinada, instalação nova já sobe
 * fechada. Bucket que já existe não é alterado por esta chamada — virar o de uma
 * oficina que já roda continua sendo uma ação no painel do Supabase.
 */
async function ensureBucket() {
  if (bucketOk) return;
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  });
  // 409/400 = já existe — ok
  if (!res.ok && res.status !== 409 && res.status !== 400) {
    throw new Error(`Erro ao criar bucket: ${res.status} ${await res.text()}`);
  }
  bucketOk = true;
}

export function publicUrl(path: string) {
  const { url } = config();
  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Validade das URLs assinadas. Uma hora cobre com folga a visita à tela da OS e a
 * geração do PDF logo em seguida, e é curta o bastante para que um link vazado por
 * print ou encaminhamento de WhatsApp não vire acesso permanente à foto do cliente.
 */
export const URL_TTL_SEGUNDOS = 60 * 60;

/** Monta a URL completa a partir do caminho relativo que o Supabase devolve. */
function urlDeAssinatura(base: string, assinado: unknown): string | null {
  // A API já respondeu `signedURL` e `signedUrl` conforme a versão; aceita as duas.
  const caminho = (assinado as { signedURL?: string; signedUrl?: string })?.signedURL
    ?? (assinado as { signedUrl?: string })?.signedUrl;
  return caminho ? `${base}/storage/v1${caminho}` : null;
}

/**
 * URL temporária e assinada para um arquivo do bucket.
 *
 * Assinar funciona tanto com o bucket público quanto com o privado — é justamente
 * isso que permite fechá-lo no painel do Supabase, depois, sem tocar no código.
 * Devolve null em qualquer falha, para quem chama cair na URL gravada.
 */
export async function urlAssinada(path: string): Promise<string | null> {
  try {
    const { url, key } = config();
    const res = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${path}`, {
      method: "POST",
      headers: headers(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn: URL_TTL_SEGUNDOS }),
    });
    if (!res.ok) return null;
    return urlDeAssinatura(url, await res.json());
  } catch (err) {
    console.error("Falha ao assinar URL do Storage:", err);
    return null;
  }
}

/** Assina vários caminhos numa chamada só. Devolve o mapa caminho → URL assinada. */
export async function urlsAssinadas(paths: string[]): Promise<Map<string, string>> {
  const mapa = new Map<string, string>();
  if (paths.length === 0) return mapa;

  try {
    const { url, key } = config();
    const res = await fetch(`${url}/storage/v1/object/sign/${BUCKET}`, {
      method: "POST",
      headers: headers(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ expiresIn: URL_TTL_SEGUNDOS, paths }),
    });
    if (!res.ok) return mapa;

    for (const item of (await res.json()) as { path?: string }[]) {
      const assinada = urlDeAssinatura(url, item);
      if (item.path && assinada) mapa.set(item.path, assinada);
    }
    return mapa;
  } catch (err) {
    console.error("Falha ao assinar URLs do Storage:", err);
    return mapa;
  }
}

function extensao(contentType: TipoImagem) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

/** Envia um arquivo sob uma pasta do bucket e retorna { path, url }. */
export async function uploadArquivo(
  pasta: string,
  bytes: ArrayBuffer,
  contentType: TipoImagem
): Promise<{ path: string; url: string }> {
  await ensureBucket();
  const { url, key } = config();
  const path = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao(contentType)}`;
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers(key, { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000" }),
    body: bytes,
  });
  if (!res.ok) {
    throw new Error(`Erro no upload: ${res.status} ${await res.text()}`);
  }
  return { path, url: publicUrl(path) };
}

/** Foto da OS — cada OS tem sua pasta. */
export function uploadFoto(osId: string, bytes: ArrayBuffer, contentType: TipoImagem) {
  return uploadArquivo(`os/${osId}`, bytes, contentType);
}

/** Logo da oficina (painel de configurações). */
export function uploadLogo(bytes: ArrayBuffer, contentType: TipoImagem) {
  return uploadArquivo("marca", bytes, contentType);
}

/** Exclui arquivos do bucket (best-effort — não lança em caso de falha). */
export async function deleteFotos(paths: string[]) {
  if (paths.length === 0) return;
  try {
    const { url, key } = config();
    await fetch(`${url}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: headers(key, { "Content-Type": "application/json" }),
      body: JSON.stringify({ prefixes: paths }),
    });
  } catch (err) {
    console.error("Falha ao excluir fotos do storage:", err);
  }
}
