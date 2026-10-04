// Leitura da configuração da oficina no banco. Server-side apenas (importa Prisma).

import type { BancoDaOficina } from "@/lib/db-oficina";
import { CONFIG_PADRAO, type Configuracao } from "@/lib/configuracao";
import { URL_TTL_SEGUNDOS, urlAssinada } from "@/lib/supabase-storage";

/**
 * Assinatura da logo em memória.
 *
 * Diferente das fotos, a logo aparece em toda página — menu lateral, aba do
 * navegador — e o layout raiz chama `getConfiguracao()` a cada requisição. Assinar
 * toda vez colocaria uma ida ao Storage no caminho de cada carregamento de tela.
 * Guardar aqui deixa isso em uma chamada por hora, por instância.
 *
 * A chave é o caminho do arquivo — que já começa pela pasta da oficina, então uma
 * oficina nunca recebe a logo assinada de outra. Trocar ou remover a logo muda (ou
 * zera) o caminho, e a entrada antiga simplesmente deixa de casar.
 */
const RENOVA_ANTES_MS = 5 * 60 * 1000;
const LIMITE_LOGOS = 1000;
const logosEmCache = new Map<string, { url: string; venceEm: number }>();

async function urlDaLogo(path: string | null, gravada: string | null): Promise<string | null> {
  if (!path) return gravada;

  const agora = Date.now();
  const emCache = logosEmCache.get(path);
  if (emCache && emCache.venceEm > agora) return emCache.url;

  const assinada = await urlAssinada(path);
  if (!assinada) return gravada;

  if (logosEmCache.size >= LIMITE_LOGOS) logosEmCache.clear();
  logosEmCache.set(path, { url: assinada, venceEm: agora + URL_TTL_SEGUNDOS * 1000 - RENOVA_ANTES_MS });
  return assinada;
}

/**
 * Configuração da oficina, com padrões no lugar do que faltar.
 *
 * Sem oficina (tela de login, cadastro) volta o padrão: ninguém logado, nenhuma marca.
 *
 * Falha de banco não pode derrubar o app inteiro: o layout raiz chama isto em toda
 * requisição, então um deploy que ainda não rodou a migração precisa renderizar com
 * o tema padrão em vez de dar 500 em todas as telas.
 */
export async function getConfiguracao(banco: BancoDaOficina | null): Promise<Configuracao> {
  if (!banco) return CONFIG_PADRAO;
  try {
    const row = await banco.db.configuracao.findUnique({ where: { oficinaId: banco.oficinaId } });
    if (!row) return CONFIG_PADRAO;
    return {
      nome: row.nome?.trim() || CONFIG_PADRAO.nome,
      nomeCurto: row.nomeCurto,
      cnpj: row.cnpj,
      telefone: row.telefone,
      whatsapp: row.whatsapp,
      email: row.email,
      site: row.site,
      cep: row.cep,
      endereco: row.endereco,
      cidade: row.cidade,
      estado: row.estado,
      logoUrl: await urlDaLogo(row.logoPath, row.logoUrl),
      rodapeDocumento: row.rodapeDocumento,
      mensagemDocumento: row.mensagemDocumento,
      mostrarAssinatura: row.mostrarAssinatura,
      validadeOrcamentoDias: row.validadeOrcamentoDias,
      reservaLucroAtiva: row.reservaLucroAtiva,
      reservaLucroPercentual: row.reservaLucroPercentual,
    };
  } catch (err) {
    console.error("Configuração indisponível — usando padrão:", err);
    return CONFIG_PADRAO;
  }
}
