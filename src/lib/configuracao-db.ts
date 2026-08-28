// Leitura da configuração da oficina no banco. Server-side apenas (importa Prisma).

import { prisma } from "@/lib/prisma";
import { COR_MENU_PADRAO, COR_PRIMARIA_PADRAO, normalizaCor } from "@/lib/tema";
import { CONFIG_ID, CONFIG_PADRAO, type Configuracao } from "@/lib/configuracao";

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
      logoUrl: row.logoUrl,
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
