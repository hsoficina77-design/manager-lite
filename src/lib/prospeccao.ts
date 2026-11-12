// Prospecção: as regras do CRM do painel admin. Arquivo puro (sem Prisma, sem Node),
// como `admin.ts`: recebe o que `prospeccao-banco.ts` leu e devolve o que a tela mostra.
//
// Quatro partes:
//   1. Importação do CSV do scraper — limpar, classificar e achar duplicata.
//   2. Ligação com a conta do boxOS — quem se cadastrou, e em que pé está.
//   3. Tarefas do dia — o que mandar para quem, hoje.
//   4. Mensagens prontas de cada tarefa.

import { normalizarBusca } from "@/lib/utils";
import { diasAte, type Situacao } from "@/lib/plano";

const DIA_MS = 24 * 60 * 60 * 1000;
type Data = Date | string;
const ms = (d: Data) => new Date(d).getTime();

// ─── 1. Importação ───────────────────────────────────────────────────────────

export type TipoTelefone = "CELULAR" | "FIXO" | "SEM";
export type Publico = "OFICINA" | "AUTOPECA";

/** Os campos do lead que vêm do CSV. */
export type DadosDoLead = {
  placeId: string | null;
  publico: Publico;
  nome: string;
  categoria: string | null;
  telefone: string | null;
  tipoTelefone: TipoTelefone;
  email: string | null;
  site: string | null;
  instagram: string | null;
  facebook: string | null;
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  cep: string | null;
  uf: string | null;
  latitude: number | null;
  longitude: number | null;
  linkMaps: string | null;
  nota: number | null;
  avaliacoes: number | null;
  pctNegativas: number | null;
  horario: string | null;
  abreSeg: string | null;
  sinaisDeDor: string | null;
  avaliacoesRuins: string | null;
  fotoUrl: string | null;
};

/**
 * Nome de cada campo nos CSVs que o importador entende: o do `--crm` do scraper (em
 * português), o cru do motor (em inglês) e a planilha "limpa" antiga. A tela usa esta
 * lista para mandar só as colunas que servem.
 */
const APELIDOS: Record<string, string[]> = {
  placeId: ["place_id"],
  nome: ["nome", "title", "empresa"],
  categoria: ["categoria", "category"],
  telefone: ["telefone", "phone"],
  email: ["email", "emails", "e_mail"],
  site: ["site", "website", "site_proprio"],
  instagram: ["instagram"],
  facebook: ["facebook"],
  rua: ["rua", "logradouro"],
  numero: ["n", "numero"],
  bairro: ["bairro"],
  cidade: ["cidade"],
  cep: ["cep"],
  uf: ["uf"],
  latitude: ["latitude"],
  longitude: ["longitude"],
  linkMaps: ["link_maps", "link", "google_maps"],
  nota: ["nota", "review_rating"],
  avaliacoes: ["avaliacoes", "review_count"],
  estrelas1: ["estrelas_1"],
  estrelas2: ["estrelas_2"],
  pctNegativas: ["pct_negativas"],
  horario: ["horario"],
  abreSeg: ["abre_seg"],
  sinaisDeDor: ["sinais_de_dor"],
  avaliacoesRuins: ["reviews_negativas_amostra"],
  fotoUrl: ["foto_fachada", "thumbnail"],
  endereco: ["address", "endereco"],
};

/** Cabeçalho do CSV → chave comparável ("Avaliações" → "avaliacoes"). */
export function chaveDaColuna(cabecalho: string): string {
  return normalizarBusca(cabecalho.replace(/^﻿/, ""))
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const COLUNAS_CONHECIDAS = new Set(Object.values(APELIDOS).flat());

/** A coluna serve para o importador? A tela descarta as outras antes de enviar. */
export function colunaConhecida(cabecalho: string): boolean {
  return COLUNAS_CONHECIDAS.has(chaveDaColuna(cabecalho));
}

/** Teto de linhas por importação: um CSV de cidade grande cabe folgado. */
export const MAX_LINHAS_IMPORTACAO = 5000;

const limpo = (v: string | undefined | null, max = 300): string | null => {
  const t = (v ?? "").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
};

const numero = (v: string | null | undefined): number | null => {
  const t = (v ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const UFS: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
  "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA",
  paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

/** "São Paulo" ou "sp" → "SP". */
export function siglaUf(valor: string | null): string | null {
  if (!valor) return null;
  const t = valor.trim();
  if (/^[a-z]{2}$/i.test(t)) return t.toUpperCase();
  return UFS[normalizarBusca(t)] ?? null;
}

/** Números de serviço (0800, 4004…): não são da oficina, e não têm WhatsApp. */
const SERVICO = /^(0800|0300|0500|0900|400[0-9]|3003)/;

/**
 * Telefone do Google → só dígitos com 55 e DDD, e se é celular ou fixo. Número sem DDD
 * ("4292-4555") ganha o DDD mais comum do lote — o da cidade buscada.
 */
export function classificarTelefone(
  bruto: string | null,
  dddPadrao: string | null
): { telefone: string | null; tipo: TipoTelefone } {
  let d = (bruto ?? "").replace(/\D/g, "");
  const sem = { telefone: null, tipo: "SEM" as const };
  if (!d || SERVICO.test(d)) return sem;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if ((d.length === 11 || d.length === 12) && d.startsWith("0")) d = d.slice(1);

  if (d.length === 8 || (d.length === 9 && d.startsWith("9"))) {
    if (!dddPadrao) return sem;
    d = dddPadrao + d;
  }
  if (!/^[1-9][1-9]/.test(d)) return sem;
  if (d.length === 11 && d[2] === "9") return { telefone: `55${d}`, tipo: "CELULAR" };
  if (d.length === 10 && /[2-5]/.test(d[2])) return { telefone: `55${d}`, tipo: "FIXO" };
  return sem;
}

/** O DDD que mais aparece entre os telefones completos do arquivo. */
function dddMaisComum(telefones: (string | null)[]): string | null {
  const conta = new Map<string, number>();
  for (const bruto of telefones) {
    let d = (bruto ?? "").replace(/\D/g, "");
    if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
    if ((d.length === 11 || d.length === 12) && d.startsWith("0")) d = d.slice(1);
    if (d.length !== 10 && d.length !== 11) continue;
    const ddd = d.slice(0, 2);
    conta.set(ddd, (conta.get(ddd) ?? 0) + 1);
  }
  return [...conta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export type ClasseCategoria = "OFICINA" | "AUTOPECA" | "FORA" | "OUTRA";

// A ordem importa: "Auto parts store" e "Auto glass shop" também têm "auto".
const E_AUTOPECA = /parts|peca|autopec|distribuidora/;
const E_FORA =
  /gas station|posto|supermarket|supermercado|television|televis|car wash|lava|inspection|vistoria|glass|vidr|dealer|concession|rental|locadora|insurance|seguro|parking|estacion|towing|guincho|store|loja|shopping/;
const E_OFICINA =
  /repair|mechanic|mecanic|tire|pneu|borrach|alignment|alinhament|electric|eletric|air condition|ar condicion|bodywork|body shop|funilar|spring|mola|brake|freio|transmission|cambio|radiator|radiador|diesel|oil change|oleo|muffler|escapament|automotiv|oficina|auto service|centro automotivo/;

export function classeDaCategoria(categoria: string | null): ClasseCategoria {
  if (!categoria) return "OFICINA";
  const c = normalizarBusca(categoria);
  if (E_AUTOPECA.test(c)) return "AUTOPECA";
  if (E_FORA.test(c)) return "FORA";
  if (E_OFICINA.test(c)) return "OFICINA";
  return "OUTRA";
}

/** Categoria do Google em português, só para a tela. */
const CATEGORIAS_PT: Record<string, string> = {
  "auto repair shop": "Oficina mecânica",
  "car repair and maintenance service": "Manutenção automotiva",
  mechanic: "Mecânico",
  "tire shop": "Pneus / borracharia",
  "wheel alignment service": "Alinhamento",
  "auto electrical service": "Auto elétrica",
  "auto air conditioning service": "Ar-condicionado automotivo",
  "auto bodywork mechanic": "Funilaria",
  "auto body shop": "Funilaria",
  "auto spring shop": "Molas",
  "auto parts store": "Autopeças",
  "auto parts market": "Autopeças",
  "gas station": "Posto de gasolina",
  supermarket: "Supermercado",
  "car wash": "Lava-rápido",
  "car inspection station": "Vistoria",
  "auto glass shop": "Vidraçaria automotiva",
  "television repair service": "Conserto de TV",
  "transmission shop": "Câmbio",
  "brake shop": "Freios",
  "oil change service": "Troca de óleo",
  "diesel engine repair service": "Mecânica diesel",
  "truck repair shop": "Mecânica de caminhão",
  "motorcycle repair shop": "Oficina de moto",
};

export function rotuloDaCategoria(categoria: string | null): string {
  if (!categoria) return "Sem categoria";
  return CATEGORIAS_PT[normalizarBusca(categoria)] ?? categoria;
}

/** Categorias que entram por padrão na importação (as outras a pessoa marca, se quiser). */
export function categoriaEntraPorPadrao(classe: ClasseCategoria) {
  return classe === "OFICINA" || classe === "AUTOPECA";
}

/**
 * Endereço do CSV cru: "Jovencar - R. Gen. Glicério, 1668 - Centro, Suzano - SP, 08674-002".
 * O nome na frente sai; o resto vira rua, bairro, cidade, UF e CEP quando o formato bate.
 */
function partesDoEndereco(endereco: string | null, nome: string) {
  let e = (endereco ?? "").trim();
  if (!e) return {};
  if (e.toLowerCase().startsWith(`${nome.toLowerCase()} - `)) e = e.slice(nome.length + 3);
  const completo = e.match(/^(.*) - ([^,]+), ([^,]+?) - ([A-Z]{2}),? (\d{5}-?\d{3})$/);
  if (completo) {
    return { rua: completo[1], bairro: completo[2], cidade: completo[3], uf: completo[4], cep: completo[5] };
  }
  const cidade = e.match(/,\s*([^,]+?)\s*-\s*([A-Z]{2})(?:,\s*(\d{5}-?\d{3}))?\s*$/);
  return cidade ? { cidade: cidade[1], uf: cidade[2], cep: cidade[3] } : {};
}

type LinhaCsv = Record<string, string>;

/** Uma linha do CSV (qualquer um dos formatos) → campos do lead. `null` sem nome. */
export function lerLinha(linha: LinhaCsv, dddPadrao: string | null): DadosDoLead | null {
  const valores = new Map<string, string>();
  for (const [col, valor] of Object.entries(linha)) valores.set(chaveDaColuna(col), valor ?? "");
  const campo = (nome: string) => {
    for (const apelido of APELIDOS[nome] ?? []) {
      const v = valores.get(apelido);
      if (v != null && v.trim()) return v;
    }
    return null;
  };

  const nome = limpo(campo("nome"), 200);
  if (!nome) return null;

  const categoria = limpo(campo("categoria"), 120);
  const { telefone, tipo } = classificarTelefone(campo("telefone"), dddPadrao);
  const endereco = partesDoEndereco(campo("endereco"), nome);
  const ruaComNumero = [campo("rua"), campo("numero")].filter(Boolean).join(", ");

  const avaliacoes = numero(campo("avaliacoes"));
  let pctNegativas = numero(campo("pctNegativas"));
  if (pctNegativas == null && avaliacoes) {
    const ruins = (numero(campo("estrelas1")) ?? 0) + (numero(campo("estrelas2")) ?? 0);
    if (campo("estrelas1") != null) pctNegativas = Math.round((ruins / avaliacoes) * 1000) / 10;
  }

  // O campo de e-mail do motor pode trazer vários, separados por vírgula: fica o primeiro.
  const email = limpo(campo("email")?.split(/[,;\s]+/)[0], 200);

  return {
    placeId: limpo(campo("placeId"), 200),
    publico: classeDaCategoria(categoria) === "AUTOPECA" ? "AUTOPECA" : "OFICINA",
    nome,
    categoria,
    telefone,
    tipoTelefone: tipo,
    email: email && email.includes("@") ? email.toLowerCase() : null,
    site: limpo(campo("site"), 500),
    instagram: limpo(campo("instagram"), 300),
    facebook: limpo(campo("facebook"), 300),
    rua: limpo(ruaComNumero || endereco.rua, 300),
    bairro: limpo(campo("bairro") ?? endereco.bairro, 120),
    cidade: limpo(campo("cidade") ?? endereco.cidade, 120),
    cep: limpo(campo("cep") ?? endereco.cep, 12),
    uf: siglaUf(limpo(campo("uf") ?? endereco.uf, 40)),
    latitude: numero(campo("latitude")),
    longitude: numero(campo("longitude")),
    linkMaps: limpo(campo("linkMaps"), 1000),
    nota: numero(campo("nota")),
    avaliacoes: avaliacoes == null ? null : Math.round(avaliacoes),
    pctNegativas,
    horario: limpo(campo("horario"), 300),
    abreSeg: limpo(campo("abreSeg"), 10),
    sinaisDeDor: limpo(campo("sinaisDeDor"), 300),
    avaliacoesRuins: (campo("avaliacoesRuins") ?? "").trim().slice(0, 4000) || null,
    fotoUrl: limpo(campo("fotoUrl"), 1000),
  };
}

/** Chaves de duplicata, da mais confiável para a menos. */
function chaves(l: Pick<DadosDoLead, "placeId" | "telefone" | "nome" | "cep" | "cidade">): string[] {
  const lista: string[] = [];
  if (l.placeId) lista.push(`p:${l.placeId}`);
  if (l.telefone) lista.push(`t:${l.telefone}`);
  lista.push(`n:${normalizarBusca(l.nome)}|${(l.cep ?? normalizarBusca(l.cidade ?? "")).replace(/\D/g, "") || "-"}`);
  return lista;
}

/** O que o banco já tem de cada lead, para comparar com o arquivo. */
export type LeadExistente = DadosDoLead & { id: string; naoContatar: boolean };

/**
 * Campos do Google que se renovam a cada busca (nota, avaliações…): o valor novo vale.
 * Os outros só preenchem o que estava vazio. Etapa, anotações, "não contatar" e a
 * conferência do WhatsApp nunca são tocados pela importação.
 */
const RENOVAVEIS: (keyof DadosDoLead)[] = [
  "nota", "avaliacoes", "pctNegativas", "horario", "abreSeg", "sinaisDeDor",
  "avaliacoesRuins", "fotoUrl", "linkMaps", "latitude", "longitude",
];

function mudancas(antes: LeadExistente, novo: DadosDoLead): Partial<DadosDoLead> {
  const dados: Partial<DadosDoLead> = {};
  for (const k of Object.keys(novo) as (keyof DadosDoLead)[]) {
    const v = novo[k];
    if (v == null || k === "publico") continue;
    const vazio = antes[k] == null || antes[k] === "";
    if (vazio || (RENOVAVEIS.includes(k) && antes[k] !== v)) {
      // Telefone só entra se o lead não tinha: o tipo acompanha o número.
      if (k === "tipoTelefone" && !vazio) continue;
      (dados as Record<string, unknown>)[k] = v;
    }
  }
  if (dados.telefone == null) delete dados.tipoTelefone;
  else dados.tipoTelefone = novo.tipoTelefone;
  return dados;
}

export type CategoriaDoArquivo = {
  categoria: string;
  rotulo: string;
  classe: ClasseCategoria;
  total: number;
  incluida: boolean;
};

export type PlanoDeImportacao = {
  linhas: number;
  novos: DadosDoLead[];
  atualizacoes: { id: string; dados: Partial<DadosDoLead> }[];
  categorias: CategoriaDoArquivo[];
  resumo: {
    novos: number;
    jaExistiam: number;
    atualizados: number;
    repetidosNoArquivo: number;
    semNome: number;
    foraDoPublico: number;
    celular: number;
    fixo: number;
    semTelefone: number;
    autopecas: number;
    jaClientes: number;
    naoContatar: number;
  };
  /** Algumas linhas que ficaram de fora, com o motivo — para conferir na prévia. */
  exemplosDescartados: { nome: string; motivo: string }[];
};

/**
 * O plano da importação, sem gravar nada: a mesma conta serve para a prévia e para
 * gravar. `excluir` são as categorias desmarcadas na prévia (o texto cru do Google);
 * sem ela, valem as que entram por padrão.
 */
export function planejarImportacao(
  linhas: LinhaCsv[],
  existentes: LeadExistente[],
  whatsappsDeOficinas: Set<string>,
  escolha?: { excluir: string[]; incluir: string[] }
): PlanoDeImportacao {
  const ddd = dddMaisComum(
    linhas.map((l) => {
      for (const [k, v] of Object.entries(l)) if (APELIDOS.telefone.includes(chaveDaColuna(k))) return v;
      return null;
    })
  );

  const porChave = new Map<string, LeadExistente>();
  for (const e of existentes) for (const k of chaves(e)) if (!porChave.has(k)) porChave.set(k, e);

  const lidas = linhas.map((l) => lerLinha(l, ddd));

  // Categorias do arquivo e se cada uma entra.
  const contagem = new Map<string, number>();
  for (const l of lidas) if (l) contagem.set(l.categoria ?? "", (contagem.get(l.categoria ?? "") ?? 0) + 1);
  const categorias: CategoriaDoArquivo[] = [...contagem.entries()]
    .map(([categoria, total]) => {
      const classe = classeDaCategoria(categoria || null);
      const incluida = escolha?.excluir.includes(categoria)
        ? false
        : escolha?.incluir.includes(categoria)
          ? true
          : categoriaEntraPorPadrao(classe);
      return { categoria, rotulo: rotuloDaCategoria(categoria || null), classe, total, incluida };
    })
    .sort((a, b) => Number(b.incluida) - Number(a.incluida) || b.total - a.total);
  const entra = new Set(categorias.filter((c) => c.incluida).map((c) => c.categoria));

  const resumo = {
    novos: 0, jaExistiam: 0, atualizados: 0, repetidosNoArquivo: 0, semNome: 0, foraDoPublico: 0,
    celular: 0, fixo: 0, semTelefone: 0, autopecas: 0, jaClientes: 0, naoContatar: 0,
  };
  const novos: DadosDoLead[] = [];
  const atualizacoes: PlanoDeImportacao["atualizacoes"] = [];
  const exemplosDescartados: PlanoDeImportacao["exemplosDescartados"] = [];
  const vistas = new Set<string>();
  const descartar = (nome: string, motivo: string) => {
    if (exemplosDescartados.length < 30) exemplosDescartados.push({ nome, motivo });
  };

  for (const l of lidas) {
    if (!l) {
      resumo.semNome++;
      continue;
    }
    if (!entra.has(l.categoria ?? "")) {
      resumo.foraDoPublico++;
      descartar(l.nome, rotuloDaCategoria(l.categoria));
      continue;
    }
    const ks = chaves(l);
    if (ks.some((k) => vistas.has(k))) {
      resumo.repetidosNoArquivo++;
      descartar(l.nome, "repetida no arquivo");
      continue;
    }
    ks.forEach((k) => vistas.add(k));

    if (l.tipoTelefone === "CELULAR") resumo.celular++;
    else if (l.tipoTelefone === "FIXO") resumo.fixo++;
    else resumo.semTelefone++;
    if (l.publico === "AUTOPECA") resumo.autopecas++;
    if (l.telefone && whatsappsDeOficinas.has(l.telefone)) resumo.jaClientes++;

    const existente = ks.map((k) => porChave.get(k)).find(Boolean);
    if (existente) {
      resumo.jaExistiam++;
      if (existente.naoContatar) resumo.naoContatar++;
      const dados = mudancas(existente, l);
      if (Object.keys(dados).length > 0) {
        resumo.atualizados++;
        atualizacoes.push({ id: existente.id, dados });
      }
    } else {
      resumo.novos++;
      novos.push(l);
    }
  }

  return { linhas: linhas.length, novos, atualizacoes, categorias, resumo, exemplosDescartados };
}

// ─── 2. Etapas e a conta do boxOS ────────────────────────────────────────────

/** Etapas que a pessoa muda à mão — antes de a oficina se cadastrar. */
export const ETAPAS_MANUAIS = ["NOVO", "ABORDADO", "RESPONDEU", "PERDIDO"] as const;
export type EtapaManual = (typeof ETAPAS_MANUAIS)[number];

/**
 * Todas as etapas. As depois de "CADASTROU" saem da conta ligada, sozinhas.
 * "JA_CLIENTE": a conta é mais antiga que o lead — a oficina já usava o boxOS antes de
 * entrar no CSV. Não é mérito da prospecção, e não recebe as mensagens do teste.
 */
export type Etapa = EtapaManual | "CADASTROU" | "ATIVOU" | "VENCEU" | "ASSINOU" | "NAO_CONTATAR" | "JA_CLIENTE";

export const ROTULO_ETAPA: Record<Etapa, string> = {
  NOVO: "Novo",
  ABORDADO: "Abordado",
  RESPONDEU: "Respondeu",
  PERDIDO: "Perdido",
  CADASTROU: "Em teste",
  ATIVOU: "Ativou",
  VENCEU: "Teste venceu",
  ASSINOU: "Assinou",
  NAO_CONTATAR: "Não contatar",
  JA_CLIENTE: "Já era cliente",
};

export const COR_ETAPA: Record<Etapa, string> = {
  NOVO: "bg-superficie-3 text-tinta-2",
  ABORDADO: "bg-atencao-fraco text-atencao",
  RESPONDEU: "bg-atencao-fraco text-atencao",
  PERDIDO: "bg-superficie-3 text-tinta-3",
  CADASTROU: "bg-brand-100 text-brand-texto",
  ATIVOU: "bg-ok-fraco text-ok",
  VENCEU: "bg-perigo-fraco text-perigo",
  ASSINOU: "bg-ok-fraco text-ok",
  NAO_CONTATAR: "bg-perigo-fraco text-perigo",
  JA_CLIENTE: "bg-superficie-3 text-tinta-3",
};

/** Ordem do funil, para os filtros e a contagem. */
export const ORDEM_ETAPAS: Etapa[] = [
  "NOVO", "ABORDADO", "RESPONDEU", "CADASTROU", "ATIVOU", "VENCEU", "ASSINOU", "PERDIDO", "NAO_CONTATAR", "JA_CLIENTE",
];

/** A conta é anterior ao lead: a oficina já era do boxOS quando entrou no CSV. */
export function jaEraCliente(lead: { createdAt: Data }, conta: ContaDoLead | null | undefined) {
  return !!conta && ms(conta.criadaEm) < ms(lead.createdAt);
}

/** Quantas OS fazem a oficina contar como "ativou" — quem passa disso costuma ficar. */
export const OS_PARA_ATIVAR = 3;

/**
 * O link do cadastro leva `?origem=wa-<id do lead>`: o `/teste` já guarda a origem na
 * oficina, e é por ela que o CRM sabe quem se cadastrou pelo link — sem mexer no
 * cadastro. O id (cuid) cabe nos 40 caracteres que a origem aceita.
 */
export const PREFIXO_ORIGEM = "wa-";

export function origemDoLead(leadId: string) {
  return `${PREFIXO_ORIGEM}${leadId}`;
}

/** A casca da conta que o CRM mostra — a mesma de `listarOficinas` (sistema.ts). */
export type ContaDoLead = {
  id: string;
  nome: string;
  ativa: boolean;
  criadaEm: Data;
  situacao: Situacao;
  testeAte: Data | null;
  pagoAte: Data | null;
  ordens: number;
  ordens30d: number;
  clientes: number;
  ultimoAcesso: Data | null;
};

type OficinaParaLigar = ContaDoLead & { whatsapp: string | null; origem: string | null };

/**
 * Qual conta é de cada lead: a ligada à mão, depois a que veio pelo link do lead, depois
 * a que se cadastrou com o mesmo WhatsApp.
 */
export function ligarContas(
  leads: { id: string; telefone: string | null; oficinaId: string | null }[],
  oficinas: OficinaParaLigar[]
): Map<string, ContaDoLead> {
  const porId = new Map(oficinas.map((o) => [o.id, o]));
  const porOrigem = new Map<string, OficinaParaLigar>();
  const porWhatsapp = new Map<string, OficinaParaLigar>();
  for (const o of oficinas) {
    if (o.origem?.startsWith(PREFIXO_ORIGEM)) porOrigem.set(o.origem.slice(PREFIXO_ORIGEM.length), o);
    if (o.whatsapp && !porWhatsapp.has(o.whatsapp)) porWhatsapp.set(o.whatsapp, o);
  }
  const ligadas = new Map<string, ContaDoLead>();
  for (const l of leads) {
    const conta =
      (l.oficinaId && porId.get(l.oficinaId)) || porOrigem.get(l.id) || (l.telefone && porWhatsapp.get(l.telefone));
    if (conta) ligadas.set(l.id, conta);
  }
  return ligadas;
}

export function etapaDoLead(
  lead: { etapa: string; naoContatar: boolean; createdAt: Data },
  conta: ContaDoLead | null | undefined
): Etapa {
  if (jaEraCliente(lead, conta)) return "JA_CLIENTE";
  if (conta) {
    if (conta.situacao === "ASSINANTE" || conta.pagoAte) return "ASSINOU";
    if (conta.situacao === "SOMENTE_LEITURA") return "VENCEU";
    if (conta.ordens >= OS_PARA_ATIVAR) return "ATIVOU";
    return "CADASTROU";
  }
  if (lead.naoContatar) return "NAO_CONTATAR";
  return (ETAPAS_MANUAIS as readonly string[]).includes(lead.etapa) ? (lead.etapa as EtapaManual) : "NOVO";
}

/** Dá para chamar no WhatsApp: celular, ou fixo que não se sabe se tem (ou que tem). */
export function chamavel(l: { telefone: string | null; tipoTelefone: string; temWhatsapp: boolean | null }) {
  if (!l.telefone || l.temWhatsapp === false) return false;
  return l.tipoTelefone === "CELULAR" || l.tipoTelefone === "FIXO";
}

/**
 * Quem chamar primeiro: celular na frente (fixo pode nem ter WhatsApp), depois oficina
 * movimentada (muitas avaliações) e com reclamação de cliente — quem mais sente a falta
 * de organização.
 */
export function prioridade(l: {
  tipoTelefone: string;
  temWhatsapp: boolean | null;
  avaliacoes: number | null;
  pctNegativas: number | null;
  sinaisDeDor: string | null;
  nota: number | null;
}) {
  const telefone = l.tipoTelefone === "CELULAR" || l.temWhatsapp === true ? 100 : 40;
  return (
    telefone +
    Math.min(l.avaliacoes ?? 0, 300) / 10 +
    Math.min(l.pctNegativas ?? 0, 50) / 2 +
    (l.sinaisDeDor ? 5 : 0) +
    ((l.nota ?? 0) >= 4.5 ? 5 : 0)
  );
}

// ─── 3. Tarefas do dia ───────────────────────────────────────────────────────

/** Primeiras mensagens por dia. Começar devagar protege o número de bloqueio. */
export const PRIMEIRAS_POR_DIA = 30;

export type IdRegra =
  | "primeira" | "retorno-1" | "retorno-2" | "encerrar" | "link" | "link-de-novo"
  | "boas-vindas" | "ajuda" | "segundo-video" | "feedback" | "sumiu" | "resumo"
  | "vence" | "venceu" | "ultima-oferta" | "obrigado";

export type GrupoTarefa = "conta" | "retorno" | "primeira";

/**
 * Vídeos de tutorial que entram nas mensagens. Vazio = a mensagem sai sem a linha do
 * vídeo. Ao gravar um, é só colar o link aqui.
 */
export const VIDEOS: Record<"primeirosPassos" | "orcamentoNoWhatsapp", string | null> = {
  primeirosPassos: null,
  orcamentoNoWhatsapp: null,
};

/** O que a regra precisa saber do lead. */
export type LeadParaTarefa = {
  id: string;
  nome: string;
  cidade: string | null;
  publico: string;
  etapa: string;
  naoContatar: boolean;
  telefone: string | null;
  tipoTelefone: string;
  temWhatsapp: boolean | null;
  avaliacoes: number | null;
  pctNegativas: number | null;
  sinaisDeDor: string | null;
  nota: number | null;
  ultimoContato: Data | null;
  createdAt: Data;
};

/** Mensagens já mandadas (ou puladas) que cumpriram uma regra. */
export type Cumprida = { regra: string; createdAt: Data; /** "MENSAGEM" ou "PULOU". */ tipo: string };

export type Tarefa = {
  leadId: string;
  regra: IdRegra;
  grupo: GrupoTarefa;
  titulo: string;
  porque: string;
  /** Sem mensagem: é uma decisão (ex.: marcar como perdido). */
  mensagem: string | null;
};

type Contexto = {
  lead: LeadParaTarefa;
  conta: ContaDoLead | null;
  feita: (regra: IdRegra) => Data | null;
  agora: Date;
  urls: { teste: string; assinatura: string };
};

const desde = (d: Data | null, agora: Date) => (d ? Math.floor((agora.getTime() - ms(d)) / DIA_MS) : Infinity);
const dias = (n: number) => (n === 1 ? "1 dia" : `${n} dias`);
const linhaVideo = (url: string | null, texto: string) => (url ? `\n\n${texto} ${url}` : "");

const temDor = (l: LeadParaTarefa) => /orcament|demor|prazo|avis|atras|respond/.test(normalizarBusca(l.sinaisDeDor ?? ""));

type Regra = {
  id: IdRegra;
  grupo: GrupoTarefa;
  titulo: string;
  /** Devolve o porquê quando a regra vale para o lead agora; `null` quando não. */
  vale: (c: Contexto) => string | null;
  mensagem: ((c: Contexto) => string) | null;
};

const linkDoLead = (c: Contexto) => `${c.urls.teste}?origem=${origemDoLead(c.lead.id)}`;

/**
 * As regras, na ordem em que são conferidas: cada lead recebe só a primeira que vale,
 * para ninguém levar duas mensagens no mesmo dia.
 */
export const REGRAS: Regra[] = [
  // ── Depois do cadastro (a conta existe)
  {
    id: "boas-vindas",
    grupo: "conta",
    titulo: "Boas-vindas e primeiros passos",
    vale: (c) => (c.conta && c.conta.situacao === "TESTE" && !c.feita("boas-vindas") ? "Acabou de se cadastrar" : null),
    mensagem: (c) =>
      `Bem-vindo ao boxOS! Que bom ter a ${c.lead.nome} por aqui.\n\n` +
      "O caminho mais rápido para começar é: 1) cadastrar um cliente, 2) fazer um orçamento e 3) transformar o orçamento em OS." +
      linhaVideo(VIDEOS.primeirosPassos, "Neste vídeo curto eu mostro os três passos:") +
      "\n\nQualquer dúvida, é só me chamar aqui.",
  },
  {
    id: "ajuda",
    grupo: "conta",
    titulo: "Oferecer ajuda: ainda sem OS",
    vale: (c) =>
      c.conta && c.conta.situacao === "TESTE" && c.conta.ordens === 0 && desde(c.conta.criadaEm, c.agora) >= 1 && !c.feita("ajuda")
        ? `Cadastrou há ${dias(desde(c.conta.criadaEm, c.agora))} e não abriu nenhuma OS`
        : null,
    mensagem: (c) =>
      `Oi! Vi que a ${c.lead.nome} ainda não abriu a primeira OS no boxOS. Quer que eu faça a primeira junto com você? ` +
      "Leva uns 5 minutos, pode ser por chamada de vídeo ou aqui mesmo pelo WhatsApp.",
  },
  {
    id: "vence",
    grupo: "conta",
    titulo: "Avisar que o teste está acabando",
    vale: (c) => {
      if (!c.conta || c.conta.situacao !== "TESTE" || c.feita("vence")) return null;
      const n = diasAte(c.conta.testeAte, c.agora);
      return n <= 5 ? `O teste termina em ${dias(Math.max(1, n))}` : null;
    },
    mensagem: (c) => {
      const n = Math.max(1, diasAte(c.conta!.testeAte, c.agora));
      return (
        `Oi! O teste grátis da ${c.lead.nome} termina em ${dias(n)}. Nada é apagado: você continua vendo tudo o que registrou.\n\n` +
        `Para seguir registrando, baixando e imprimindo documentos, é só assinar por aqui: ${c.urls.assinatura}\n\n` +
        "Quer que eu explique como funciona?"
      );
    },
  },
  {
    id: "venceu",
    grupo: "conta",
    titulo: "Teste venceu: convidar a assinar",
    vale: (c) =>
      c.conta && c.conta.situacao === "SOMENTE_LEITURA" && !c.conta.pagoAte && !c.feita("venceu")
        ? "O teste terminou e ainda não assinou"
        : null,
    mensagem: (c) =>
      `Oi! O teste da ${c.lead.nome} terminou. ` +
      (c.conta!.ordens > 0
        ? `As ${c.conta!.ordens} OS e os ${c.conta!.clientes} clientes que você registrou continuam guardados, é só entrar para ver.`
        : "Tudo o que você registrou continua guardado, é só entrar para ver.") +
      `\n\nPara voltar a registrar, é só assinar: ${c.urls.assinatura}\n\nSe ficou alguma dúvida, estou por aqui.`,
  },
  {
    id: "ultima-oferta",
    grupo: "conta",
    titulo: "Perguntar o que faltou para assinar",
    vale: (c) => {
      const venceu = c.feita("venceu");
      return c.conta && c.conta.situacao === "SOMENTE_LEITURA" && venceu && desde(venceu, c.agora) >= 3 && !c.feita("ultima-oferta")
        ? "Avisado do fim do teste há 3 dias, sem assinar"
        : null;
    },
    mensagem: (c) =>
      `Oi! Passando para saber se ficou alguma dúvida sobre a assinatura do boxOS para a ${c.lead.nome}. ` +
      "Se não for o momento, tudo bem: você me conta o que faltou? Isso me ajuda muito a melhorar o sistema.",
  },
  {
    id: "sumiu",
    grupo: "conta",
    titulo: "Chamar de volta: parou de usar",
    vale: (c) => {
      if (!c.conta || c.conta.situacao !== "TESTE") return null;
      const parado = desde(c.conta.ultimoAcesso ?? c.conta.criadaEm, c.agora);
      const ultimaVez = c.feita("sumiu");
      if (parado < 5 || (ultimaVez && desde(ultimaVez, c.agora) < 7)) return null;
      return c.conta.ultimoAcesso ? `Sem entrar há ${dias(parado)}` : `Ninguém entrou desde o cadastro (${dias(parado)})`;
    },
    mensagem: (c) =>
      `Oi! Senti falta da ${c.lead.nome} no boxOS esses dias. Aconteceu alguma coisa ou ficou alguma dúvida? ` +
      "Se quiser, te mostro rapidinho como encaixar no dia a dia da oficina.",
  },
  {
    id: "segundo-video",
    grupo: "conta",
    titulo: "Próximo passo: orçamento no WhatsApp",
    vale: (c) =>
      c.conta && c.conta.situacao === "TESTE" && c.conta.ordens >= 1 && !c.feita("segundo-video")
        ? `Já abriu ${c.conta.ordens} OS`
        : null,
    mensagem: (c) =>
      "Parabéns pela primeira OS no boxOS! O próximo passo é mandar o orçamento direto no WhatsApp do cliente, " +
      `em PDF com a marca da ${c.lead.nome}. O cliente aprova mais rápido quando recebe tudo organizado.` +
      linhaVideo(VIDEOS.orcamentoNoWhatsapp, "Mostro como fazer aqui:"),
  },
  {
    id: "feedback",
    grupo: "conta",
    titulo: "Pedir opinião (1 semana de uso)",
    vale: (c) =>
      c.conta && c.conta.situacao === "TESTE" && desde(c.conta.criadaEm, c.agora) >= 7 && !c.feita("feedback")
        ? "Uma semana desde o cadastro"
        : null,
    mensagem: (c) =>
      `Oi! A ${c.lead.nome} já está há uma semana com o boxOS. O que está achando? ` +
      "Tem alguma coisa que atrapalha ou que você sente falta? Sua resposta me ajuda a melhorar o sistema.",
  },
  {
    id: "resumo",
    grupo: "conta",
    titulo: "Mostrar o que já registrou",
    vale: (c) =>
      c.conta && c.conta.situacao === "TESTE" && c.conta.ordens >= 1 && desde(c.conta.criadaEm, c.agora) >= 20 && !c.feita("resumo")
        ? `${c.conta.ordens} OS em ${dias(desde(c.conta.criadaEm, c.agora))}`
        : null,
    mensagem: (c) => {
      const n = Math.max(1, diasAte(c.conta!.testeAte, c.agora));
      return (
        `Oi! Um resumo dos primeiros dias da ${c.lead.nome} no boxOS: ${c.conta!.ordens} OS e ${c.conta!.clientes} clientes cadastrados. ` +
        `Faltam ${dias(n)} de teste. Tudo isso continua guardado depois; para seguir registrando, é só assinar.`
      );
    },
  },
  {
    id: "obrigado",
    grupo: "conta",
    titulo: "Agradecer a assinatura e pedir indicação",
    vale: (c) => (c.conta && (c.conta.situacao === "ASSINANTE" || c.conta.pagoAte) && !c.feita("obrigado") ? "Assinou o boxOS" : null),
    mensagem: (c) =>
      `Muito obrigado por assinar o boxOS, ${c.lead.nome}! Qualquer coisa que precisar, é só chamar aqui.\n\n` +
      "Se conhecer outra oficina que possa gostar, pode indicar: ajuda muito a gente a crescer.",
  },

  // ── Antes do cadastro
  {
    id: "link",
    grupo: "retorno",
    titulo: "Mandar o link do teste",
    vale: (c) => (!c.conta && c.lead.etapa === "RESPONDEU" && !c.feita("link") ? "Respondeu a abordagem" : null),
    mensagem: (c) =>
      `Aqui está o link para criar o acesso da ${c.lead.nome}: ${linkDoLead(c)}\n\n` +
      "Leva uns 2 minutos, sem cartão. Depois que entrar, te mando um vídeo curto mostrando como abrir a primeira OS.",
  },
  {
    id: "link-de-novo",
    grupo: "retorno",
    titulo: "Conferir se conseguiu se cadastrar",
    vale: (c) => {
      const link = c.feita("link");
      return !c.conta && c.lead.etapa === "RESPONDEU" && link && desde(link, c.agora) >= 2 && !c.feita("link-de-novo")
        ? `Recebeu o link há ${dias(desde(link, c.agora))} e não se cadastrou`
        : null;
    },
    mensagem: (c) =>
      `Oi! Conseguiu criar o acesso da ${c.lead.nome}? Se der qualquer problema, me fala que eu te ajudo. O link é este: ${linkDoLead(c)}`,
  },
  {
    id: "retorno-1",
    grupo: "retorno",
    titulo: "Segunda mensagem: sem resposta",
    vale: (c) =>
      !c.conta && c.lead.etapa === "ABORDADO" && desde(c.lead.ultimoContato, c.agora) >= 3 && !c.feita("retorno-1")
        ? `Sem resposta há ${dias(desde(c.lead.ultimoContato, c.agora))}`
        : null,
    mensagem: (c) =>
      `Oi! Passando de novo por aqui: o teste grátis do boxOS para a ${c.lead.nome} continua disponível, 30 dias sem cartão. Quer que eu mande o link?`,
  },
  {
    id: "retorno-2",
    grupo: "retorno",
    titulo: "Última tentativa",
    vale: (c) => {
      const r1 = c.feita("retorno-1");
      return !c.conta && c.lead.etapa === "ABORDADO" && r1 && desde(r1, c.agora) >= 5 && !c.feita("retorno-2")
        ? "Duas mensagens sem resposta"
        : null;
    },
    mensagem: (c) =>
      `Oi, esta é a última mensagem, prometo. Se em algum momento quiser organizar as OS e os orçamentos da ${c.lead.nome} pelo celular, ` +
      "é só me chamar aqui que eu libero o teste grátis.",
  },
  {
    id: "encerrar",
    grupo: "retorno",
    titulo: "Encerrar: três mensagens sem resposta",
    vale: (c) => {
      const r2 = c.feita("retorno-2");
      return !c.conta && c.lead.etapa === "ABORDADO" && r2 && desde(r2, c.agora) >= 7 && !c.feita("encerrar")
        ? "Nenhuma resposta depois da última tentativa"
        : null;
    },
    mensagem: null,
  },
  {
    id: "primeira",
    grupo: "primeira",
    titulo: "Primeira mensagem",
    vale: (c) =>
      !c.conta && c.lead.etapa === "NOVO" && chamavel(c.lead) && !c.feita("primeira")
        ? c.lead.tipoTelefone === "FIXO" && c.lead.temWhatsapp == null
          ? "Telefone fixo: confira se tem WhatsApp ao abrir"
          : "Ainda não foi abordada"
        : null,
    mensagem: (c) =>
      `Olá, tudo bem? Falo com a ${c.lead.nome}?\n\n` +
      "Aqui é do boxOS, um sistema para oficina mecânica que funciona no celular: ordem de serviço, orçamento que vai direto no WhatsApp do cliente e controle do que tem para receber." +
      (temDor(c.lead) ? " Ajuda muito com orçamento que demora para sair e cliente que fica sem resposta." : "") +
      `\n\nEstou liberando 30 dias grátis para oficinas${c.lead.cidade ? ` de ${c.lead.cidade}` : ""}, sem cartão e sem compromisso. Posso te mandar o link para testar?`,
  },
];

const POR_ID = new Map(REGRAS.map((r) => [r.id, r]));

export function tituloDaRegra(id: string): string {
  return POR_ID.get(id as IdRegra)?.titulo ?? id;
}

/** "2026-11-08" no fuso de São Paulo — para contar o que foi mandado hoje. */
export function diaEmSaoPaulo(d: Data) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(d));
}

/**
 * A lista do dia. Cada lead recebe no máximo uma tarefa (a primeira regra que vale), e
 * as primeiras mensagens param no limite do dia, contando as já mandadas hoje.
 */
export function tarefasDoDia(
  leads: LeadParaTarefa[],
  contas: Map<string, ContaDoLead>,
  cumpridas: Map<string, Cumprida[]>,
  urls: { teste: string; assinatura: string },
  agora = new Date()
): { tarefas: Tarefa[]; primeirasHoje: number; primeirasNaFila: number } {
  const hoje = diaEmSaoPaulo(agora);
  let primeirasHoje = 0;
  for (const lista of cumpridas.values()) {
    // Só as enviadas: tirar da fila não gasta a cota do dia.
    for (const c of lista) {
      if (c.regra === "primeira" && c.tipo === "MENSAGEM" && diaEmSaoPaulo(c.createdAt) === hoje) primeirasHoje++;
    }
  }

  const tarefas: Tarefa[] = [];
  const primeiras: { tarefa: Tarefa; nota: number }[] = [];

  for (const lead of leads) {
    const conta = contas.get(lead.id) ?? null;
    // Pediu para não ser procurado: nem as mensagens de depois do cadastro.
    if (lead.naoContatar) continue;
    // Já usava o boxOS antes de entrar no CSV: não é para receber mensagem de teste.
    if (jaEraCliente(lead, conta)) continue;
    if (!conta && (lead.publico !== "OFICINA" || lead.etapa === "PERDIDO")) continue;
    if (conta && !conta.ativa) continue;

    const historico = cumpridas.get(lead.id) ?? [];
    const feita = (regra: IdRegra) =>
      historico.filter((h) => h.regra === regra).reduce<Data | null>((max, h) => (!max || ms(h.createdAt) > ms(max) ? h.createdAt : max), null);
    const c: Contexto = { lead, conta, feita, agora, urls };

    for (const regra of REGRAS) {
      const porque = regra.vale(c);
      if (!porque) continue;
      const tarefa: Tarefa = {
        leadId: lead.id,
        regra: regra.id,
        grupo: regra.grupo,
        titulo: regra.titulo,
        porque,
        mensagem: regra.mensagem ? regra.mensagem(c) : null,
      };
      if (regra.grupo === "primeira") primeiras.push({ tarefa, nota: prioridade(lead) });
      else tarefas.push(tarefa);
      break;
    }
  }

  const vagas = Math.max(0, PRIMEIRAS_POR_DIA - primeirasHoje);
  primeiras.sort((a, b) => b.nota - a.nota);
  return {
    tarefas: [...tarefas, ...primeiras.slice(0, vagas).map((p) => p.tarefa)],
    primeirasHoje,
    primeirasNaFila: primeiras.length,
  };
}

/** Mensagem pronta de uma regra para um lead — a ficha usa para "mandar de novo". */
export function linkWhatsappDoLead(telefone: string, mensagem: string) {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

/** "(11) 94452-2019" a partir dos dígitos com 55. */
export function telefoneLegivel(digitos: string | null) {
  if (!digitos) return "";
  const d = digitos.replace(/^55/, "");
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

/** Funil: quantos leads (do público oficina) chegaram a cada etapa. */
export function funilDaProspeccao(todas: Etapa[]) {
  const etapas = todas.filter((e) => e !== "JA_CLIENTE");
  const passou = (lista: Etapa[]) => etapas.filter((e) => lista.includes(e)).length;
  const depoisDoCadastro: Etapa[] = ["CADASTROU", "ATIVOU", "VENCEU", "ASSINOU"];
  return [
    { rotulo: "Leads", valor: etapas.length },
    { rotulo: "Abordados", valor: passou(["ABORDADO", "RESPONDEU", "PERDIDO", ...depoisDoCadastro]) },
    { rotulo: "Responderam", valor: passou(["RESPONDEU", ...depoisDoCadastro]) },
    { rotulo: "Cadastraram", valor: passou(depoisDoCadastro) },
    { rotulo: "Ativaram", valor: passou(["ATIVOU", "ASSINOU"]) },
    { rotulo: "Assinaram", valor: passou(["ASSINOU"]) },
  ];
}
