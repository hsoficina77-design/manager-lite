// Entrega das fotos ao cliente: a URL que sai da API é sempre assinada e temporária.
//
// A coluna `url` guarda o link público gravado no upload, e ela continua ali — mas
// como registro, não como o que se serve. Quem lê recebe uma assinatura nova a cada
// requisição, e por isso fechar o bucket no painel do Supabase passa a ser só uma
// mudança de configuração: nenhuma tela depende mais do arquivo ser público.

import { urlsAssinadas } from "@/lib/supabase-storage";

type FotoComPath = { path: string; url: string };

/**
 * Troca a URL de cada foto pela versão assinada, numa chamada só ao Storage.
 *
 * Se a assinatura falhar (Storage fora do ar, credencial ausente), mantém a URL
 * gravada: enquanto o bucket for público ela funciona, e a tela não fica sem foto
 * por causa de uma indisponibilidade passageira.
 */
export async function comUrlAssinada<T extends FotoComPath>(fotos: T[]): Promise<T[]> {
  if (fotos.length === 0) return fotos;
  const assinadas = await urlsAssinadas(fotos.map((f) => f.path));
  return fotos.map((foto) => ({ ...foto, url: assinadas.get(foto.path) ?? foto.url }));
}
