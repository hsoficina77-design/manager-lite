// Cidades do Brasil pela lista oficial do IBGE.
//
// A lista mora em `municipios.json` ([nome, UF], 5.571 municípios), baixada uma vez de
// servicodados.ibge.gov.br — não muda (o último município novo é de 2013), e assim a
// busca não depende de serviço de fora nem manda nada do usuário para ninguém.
//
// A cidade é sempre gravada com o nome oficial e a UF separados (Configuracao.cidade e
// .estado), e as cidades que uma loja atende como rótulo "Nome - UF". A UF importa: há
// 232 nomes repetidos entre estados ("Bom Jesus" existe em cinco).
//
// Este arquivo não importa o JSON: o servidor carrega a lista em
// `municipios-servidor.ts`, e a tela a carrega só quando o campo de cidade aparece.

import { normalizarBusca } from "@/lib/utils";

export type Municipio = { nome: string; uf: string };
export type ListaDeMunicipios = [string, string][];
export type IndiceDeMunicipios = (Municipio & { chave: string })[];

export const UFS = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]);

export function rotuloDoMunicipio(m: Municipio): string {
  return `${m.nome} - ${m.uf}`;
}

/** "Suzano - SP", "Suzano/SP", "suzano sp" ou só "Suzano" → nome e, se houver, UF. */
export function lerCidade(texto: string): { nome: string; uf: string | null } {
  const limpo = texto.trim().replace(/\s+/g, " ");
  const comUf = limpo.match(/^(.*?)\s*[-/,\s]\s*([A-Za-z]{2})$/);
  if (comUf && UFS.has(comUf[2].toUpperCase()) && comUf[1].trim()) {
    return { nome: comUf[1].trim(), uf: comUf[2].toUpperCase() };
  }
  return { nome: limpo, uf: null };
}

/**
 * A mesma cidade? Nome sem acento nem maiúscula; a UF só pesa quando os dois lados a
 * têm — assim um cadastro antigo, sem UF, continua batendo pelo nome.
 */
export function mesmaCidade(a: string, b: string): boolean {
  const x = lerCidade(a);
  const y = lerCidade(b);
  if (normalizarBusca(x.nome) !== normalizarBusca(y.nome)) return false;
  return !x.uf || !y.uf || x.uf === y.uf;
}

export function prepararIndice(lista: ListaDeMunicipios): IndiceDeMunicipios {
  return lista.map(([nome, uf]) => ({ nome, uf, chave: normalizarBusca(nome) }));
}

/** Sugestões para o que a pessoa digitou: primeiro as que começam assim, depois as que contêm. */
export function buscarMunicipios(indice: IndiceDeMunicipios, termo: string, limite = 8): Municipio[] {
  const { nome, uf } = lerCidade(termo);
  const t = normalizarBusca(nome);
  if (t.length < 2) return [];
  const comecam: Municipio[] = [];
  const contem: Municipio[] = [];
  for (const m of indice) {
    if (uf && m.uf !== uf) continue;
    if (m.chave.startsWith(t)) comecam.push({ nome: m.nome, uf: m.uf });
    else if (contem.length < limite && m.chave.includes(t)) contem.push({ nome: m.nome, uf: m.uf });
  }
  // Nome exato primeiro: "Poá" antes de "Poãs"; quem digitou a cidade inteira acha ela no topo.
  comecam.sort((a, b) => Number(normalizarBusca(b.nome) === t) - Number(normalizarBusca(a.nome) === t));
  return [...comecam, ...contem].slice(0, limite);
}

/**
 * O município oficial para o texto, ou `null` se não existe ou se o nome é de mais de
 * um estado e a UF não veio (aí a pessoa precisa escolher na lista).
 */
export function acharMunicipio(indice: IndiceDeMunicipios, texto: string, uf?: string | null): Municipio | null {
  const lido = lerCidade(texto);
  const estado = (uf ?? lido.uf)?.trim().toUpperCase() || null;
  const chave = normalizarBusca(lido.nome);
  const achados = indice.filter((m) => m.chave === chave && (!estado || m.uf === estado));
  return achados.length === 1 ? { nome: achados[0].nome, uf: achados[0].uf } : null;
}
