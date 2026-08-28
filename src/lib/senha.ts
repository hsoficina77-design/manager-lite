// Hash de senha com scrypt.
//
// scrypt vem no Node — nada de dependência nova. E é *memory-hard* de propósito:
// diferente de SHA-256, não adianta ter GPU, porque cada tentativa precisa de 16MB de
// RAM. Se o banco vazar, quebrar as senhas continua caro.
//
// Server-side apenas.

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

// `promisify` escolhe a sobrecarga de 3 argumentos; o tipo abaixo recupera a versão
// com opções, que é a que carrega o custo (N, r, p).
const scryptAsync = promisify(scrypt) as (
  senha: Buffer,
  salt: Buffer,
  tamanho: number,
  opcoes: ScryptOptions
) => Promise<Buffer>;

// N=16384, r=8, p=1 → ~16MB e ~100ms por verificação. Os parâmetros vão gravados no
// hash para que subir o custo no futuro não invalide as senhas já existentes.
const N = 16384;
const R = 8;
const P = 1;
const TAMANHO_CHAVE = 64;
const MAXMEM = 64 * 1024 * 1024;

export { SENHA_MIN, validarSenha } from "@/lib/senha-regras";

// Normalizar evita a armadilha do acento: "José" digitado no celular e no teclado do
// PC pode gerar bytes diferentes para a mesma senha visível.
const normalizar = (senha: string) => Buffer.from(senha.normalize("NFKC"), "utf8");

/** Hash no formato `scrypt$N$r$p$salt$chave` (tudo em base64url). */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const chave = await scryptAsync(normalizar(senha), salt, TAMANHO_CHAVE, {
    N, r: R, p: P, maxmem: MAXMEM,
  });
  return [
    "scrypt", N, R, P,
    salt.toString("base64url"),
    chave.toString("base64url"),
  ].join("$");
}

/**
 * Confere a senha contra o hash guardado.
 *
 * Nunca lança: hash corrompido ou em formato desconhecido devolve `false`, para que
 * uma linha estragada no banco vire "senha errada" em vez de erro 500 no login.
 */
export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  try {
    const [algoritmo, n, r, p, salt64, chave64] = hash.split("$");
    if (algoritmo !== "scrypt") return false;

    const esperada = Buffer.from(chave64, "base64url");
    const calculada = await scryptAsync(
      normalizar(senha),
      Buffer.from(salt64, "base64url"),
      esperada.length,
      { N: Number(n), r: Number(r), p: Number(p), maxmem: MAXMEM }
    );

    // Comparação em tempo constante: comparar com === vazaria, pelo tempo de resposta,
    // quantos bytes do hash já batem.
    return timingSafeEqual(esperada, calculada);
  } catch {
    return false;
  }
}
