// Leitura da configuração da oficina no banco. Server-side apenas (importa Prisma).

import { prisma } from "@/lib/prisma";
import { COR_MENU_PADRAO, COR_PRIMARIA_PADRAO, normalizaCor } from "@/lib/tema";
import { CONFIG_ID, CONFIG_PADRAO, type Configuracao } from "@/lib/configuracao";
import { URL_TTL_SEGUNDOS, urlAssinada } from "@/lib/supabase-storage";

/**
 * Assinatura da logo em memória.
 *
 * Diferente das fotos, a logo aparece em toda página — menu lateral, aba do
 * navegador — e o layout raiz chama `getConfiguracao()` a cada requisição. Assinar
 * toda vez colocaria uma ida ao Storage no caminho de cada carregamento de tela.
 * Guardar aqui deixa isso em uma chamada por hora, por instância.
 *
 * A chave é o caminho do arquivo: trocar ou remover a logo muda (ou zera) o caminho,
 * e a entrada antiga simplesmente deixa de casar — não há o que invalidar à mão.
 */
const RENOVA_ANTES_MS = 5 * 60 * 1000;
let logoEmCache: { path: string; url: string; venceEm: number } | null = null;

async function urlDaLogo(path: string | null, gravada: string | null): Promise<string | null> {
  if (!path) return gravada;

  const agora = Date.now();
  if (logoEmCache?.path === path && logoEmCache.venceEm > agora) return logoEmCache.url;

  const assinada = await urlAssinada(path);
  if (!assinada) return gravada;

  logoEmCache = { path, url: assinada, venceEm: agora + URL_TTL_SEGUNDOS * 1000 - RENOVA_ANTES_MS };
  return assinada;
}

/**
 * Configuração da oficina, com padrões no lugar do que faltar.
 *
 * Falha de banco não pode derrubar o app inteiro: o layout raiz chama isto em toda
 * requisição, então um deploy que ainda não rodou a migração precisa renderizar com
 * o tema padrão em vez de dar 500 em todas as telas.
 */
export async function getConfiguracao(): Promise<Configuracao> {
  try {
    const row = await prisma.configuracao.findUnique({ where: { id: CONFIG_ID } });
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
      corPrimaria: normalizaCor(row.corPrimaria, COR_PRIMARIA_PADRAO),
      corMenu: normalizaCor(row.corMenu, COR_MENU_PADRAO),
      rodapeDocumento: row.rodapeDocumento,
      mensagemDocumento: row.mensagemDocumento,
      mostrarAssinatura: row.mostrarAssinatura,
      validadeOrcamentoDias: row.validadeOrcamentoDias,
    };
  } catch (err) {
    console.error("Configuração indisponível — usando padrão:", err);
    return CONFIG_PADRAO;
  }
}
