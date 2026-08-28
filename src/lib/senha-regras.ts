// Regras de senha — puras, sem criptografia, para valerem igual no formulário e na API.
//
// Separado de `senha.ts` porque aquele importa `node:crypto` e não pode entrar no
// pacote enviado ao navegador.

export const SENHA_MIN = 8;

/** Mensagem de recusa, ou `null` quando a senha serve. */
export function validarSenha(senha: string): string | null {
  if (senha.length < SENHA_MIN) {
    return `A senha precisa de pelo menos ${SENHA_MIN} caracteres`;
  }
  if (senha.length > 200) return "Senha longa demais";
  if (!senha.trim()) return "A senha não pode ser só espaços";
  return null;
}
