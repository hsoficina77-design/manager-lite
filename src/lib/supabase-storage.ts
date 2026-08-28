// Acesso ao Supabase Storage via API REST (server-side only).
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.

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

/** Garante que o bucket público existe (idempotente). */
async function ensureBucket() {
  if (bucketOk) return;
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: headers(key, { "Content-Type": "application/json" }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
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

function extensao(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/svg+xml") return "svg";
  return "jpg";
}

/** Envia um arquivo sob uma pasta do bucket e retorna { path, url }. */
export async function uploadArquivo(
  pasta: string,
  bytes: ArrayBuffer,
  contentType: string
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
export function uploadFoto(osId: string, bytes: ArrayBuffer, contentType: string) {
  return uploadArquivo(`os/${osId}`, bytes, contentType);
}

/** Logo da oficina (painel de configurações). */
export function uploadLogo(bytes: ArrayBuffer, contentType: string) {
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
