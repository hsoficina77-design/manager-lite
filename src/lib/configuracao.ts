// Configurações da oficina: formato, padrões e os derivados que tela e PDF usam.
//
// A tabela guarda uma linha só, de id fixo. Quem consome nunca precisa saber disso
// nem tratar "ainda não configurado" — os padrões daqui preenchem o que faltar.
//
// Este arquivo é puro de propósito (sem Prisma): o cabeçalho dos documentos e os
// botões de PDF são componentes de cliente e importam os mesmos derivados. A leitura
// no banco fica em `configuracao-db.ts`.

import { COR_MENU_PADRAO, COR_PRIMARIA_PADRAO } from "@/lib/tema";

export const CONFIG_ID = "default";

export type Configuracao = {
  nome: string;
  nomeCurto: string | null;
  cnpj: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  site: string | null;
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  logoUrl: string | null;
  corPrimaria: string;
  corMenu: string;
  rodapeDocumento: string | null;
  mensagemDocumento: string | null;
  mostrarAssinatura: boolean;
  validadeOrcamentoDias: number;
};

export const CONFIG_PADRAO: Configuracao = {
  nome: "Minha Oficina",
  nomeCurto: null,
  cnpj: null,
  telefone: null,
  whatsapp: null,
  email: null,
  site: null,
  cep: null,
  endereco: null,
  cidade: null,
  estado: null,
  logoUrl: null,
  corPrimaria: COR_PRIMARIA_PADRAO,
  corMenu: COR_MENU_PADRAO,
  rodapeDocumento: null,
  mensagemDocumento: null,
  mostrarAssinatura: true,
  validadeOrcamentoDias: 7,
};

/** Campos de texto editáveis pelo painel — a logo tem rota própria (upload). */
export const CAMPOS_TEXTO = [
  "nome", "nomeCurto", "cnpj", "telefone", "whatsapp", "email", "site",
  "cep", "endereco", "cidade", "estado", "rodapeDocumento", "mensagemDocumento",
] as const;

export type CampoTexto = (typeof CAMPOS_TEXTO)[number];

/** Nome curto do menu, com o nome completo como reserva. */
export function nomeDoMenu(config: Configuracao): string {
  return config.nomeCurto?.trim() || config.nome;
}

/** Linhas de contato do cabeçalho dos documentos, sem as que estiverem vazias. */
export function linhasDoCabecalho(config: Configuracao): string[] {
  const linhas: string[] = [];
  if (config.cnpj) linhas.push(`CNPJ: ${config.cnpj}`);

  const contatos: string[] = [];
  if (config.telefone) contatos.push(`Telefone: ${config.telefone}`);
  if (config.whatsapp) contatos.push(`WhatsApp: ${config.whatsapp}`);
  if (contatos.length > 0) linhas.push(contatos.join("  ·  "));

  const endereco = [config.endereco, [config.cidade, config.estado].filter(Boolean).join(" - ")]
    .filter(Boolean)
    .join(", ");
  if (endereco) linhas.push(endereco);

  const web = [config.email, config.site].filter(Boolean).join("  ·  ");
  if (web) linhas.push(web);

  return linhas;
}

/** Assinatura do rodapé: o texto livre configurado ou "Oficina · telefone". */
export function rodapeDoDocumento(config: Configuracao): string {
  if (config.rodapeDocumento?.trim()) return config.rodapeDocumento.trim();
  return [config.nome, config.telefone].filter(Boolean).join(" · ");
}
