// Dados da prévia do Peça Peça.
//
// Tudo mora no localStorage deste aparelho: a prévia serve para enxergar o fluxo
// (oficina pede, loja responde, oficina escolhe, orçamento sai), não para guardar
// cotação de verdade. Por isso nenhuma tabela nova no banco — quando o fluxo for
// aprovado, estes tipos viram o desenho das tabelas.
//
// O evento `storage` do navegador mantém duas abas em sincronia: dá para abrir a
// visão da oficina numa janela e a da loja na outra, e ver a resposta chegar.
//
// Sem React aqui de propósito: as páginas (servidor) também leem a lista de lojas.
// Os hooks moram em hooks.ts.

import { normalizarBusca } from "@/lib/utils";

// ─── Lojas ──────────────────────────────────────────────────────────────────

export type LojaId = "yoshio" | "bom-preco";

export type Loja = {
  id: LojaId;
  nome: string;
  /** Faixa de entrega do motoboy, em minutos — só para a simulação. */
  entrega: [number, number];
};

export const LOJAS: Loja[] = [
  { id: "yoshio", nome: "Yoshio", entrega: [30, 50] },
  { id: "bom-preco", nome: "Bom Preço", entrega: [20, 40] },
];

export function nomeDaLoja(id: LojaId): string {
  return LOJAS.find((l) => l.id === id)?.nome ?? id;
}

export function ehLoja(valor: unknown): valor is LojaId {
  return LOJAS.some((l) => l.id === valor);
}

// ─── Cotação ────────────────────────────────────────────────────────────────

export type VeiculoCotado = {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  motor: string;
  /** Preenchidos quando a placa já estava no boxOS: o orçamento nasce ligado a eles. */
  clienteId?: string;
  veiculoId?: string;
  clienteNome?: string;
};

export type PecaPedida = { id: string; descricao: string; quantidade: number };

export type Oferta = { id: string; marca: string; preco: number; prazoMin: number };

/** Ofertas por peça. Lista vazia é "não tenho". */
export type RespostaDaLoja = { respondidaEm: string; itens: Record<string, Oferta[]> };

export type EtapaEntrega = "ENVIADO" | "SEPARANDO" | "A_CAMINHO" | "ENTREGUE";

export const ETAPAS_ENTREGA: { value: EtapaEntrega; rotulo: string }[] = [
  { value: "ENVIADO", rotulo: "Pedido enviado" },
  { value: "SEPARANDO", rotulo: "Separando" },
  { value: "A_CAMINHO", rotulo: "Saiu com o motoboy" },
  { value: "ENTREGUE", rotulo: "Entregue" },
];

export type Cotacao = {
  id: string;
  numero: number;
  criadaEm: string;
  veiculo: VeiculoCotado;
  pecas: PecaPedida[];
  lojas: LojaId[];
  respostas: Partial<Record<LojaId, RespostaDaLoja>>;
  /** Peça → oferta escolhida. */
  escolhas: Record<string, { lojaId: LojaId; ofertaId: string }>;
  /** Margem da oficina sobre o preço da loja, em %. */
  margem: number;
  /** Preço de venda unitário que a oficina digitou, por peça. Sem ele vale a margem. */
  vendas?: Record<string, number>;
  orcamento?: { id: string; numero: number };
  pedido?: { feitoEm: string; entregas: Partial<Record<LojaId, EtapaEntrega>> };
};

type Estado = { seq: number; cotacoes: Cotacao[] };

// ─── Armazenamento ──────────────────────────────────────────────────────────

const CHAVE = "pecapeca:previa:v1";
const VAZIO: Estado = { seq: 0, cotacoes: [] };

// O `useSyncExternalStore` exige a mesma referência enquanto nada mudou, então o
// texto lido fica guardado junto do objeto: só se refaz o parse quando ele muda.
let textoLido: string | null = null;
let estadoLido: Estado = VAZIO;
const ouvintes = new Set<() => void>();

function ler(): Estado {
  try {
    const texto = localStorage.getItem(CHAVE);
    if (texto !== textoLido) {
      textoLido = texto;
      estadoLido = texto ? (JSON.parse(texto) as Estado) : VAZIO;
    }
  } catch {
    // Sem localStorage (modo privado) ou texto corrompido: segue com o que tinha.
  }
  return estadoLido;
}

function gravar(novo: Estado) {
  estadoLido = novo;
  textoLido = JSON.stringify(novo);
  try {
    localStorage.setItem(CHAVE, textoLido);
  } catch {
    // Fica só na memória desta aba.
  }
  ouvintes.forEach((f) => f());
}

/** Para o `useSyncExternalStore` de hooks.ts. */
export function assinarCotacoes(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  const deOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) aoMudar();
  };
  window.addEventListener("storage", deOutraAba);
  return () => {
    ouvintes.delete(aoMudar);
    window.removeEventListener("storage", deOutraAba);
  };
}

export const lerCotacoes = () => ler().cotacoes;
export const SEM_COTACOES = VAZIO.cotacoes;

function novoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function criarCotacao(dados: {
  veiculo: VeiculoCotado;
  pecas: Omit<PecaPedida, "id">[];
  lojas: LojaId[];
}): Cotacao {
  const atual = ler();
  const cotacao: Cotacao = {
    id: novoId(),
    numero: atual.seq + 1,
    criadaEm: new Date().toISOString(),
    veiculo: dados.veiculo,
    pecas: dados.pecas.map((p) => ({ ...p, id: novoId() })),
    lojas: dados.lojas,
    respostas: {},
    escolhas: {},
    margem: 30,
  };
  gravar({ seq: cotacao.numero, cotacoes: [cotacao, ...atual.cotacoes] });
  return cotacao;
}

export function atualizarCotacao(id: string, mudar: (c: Cotacao) => Cotacao) {
  const atual = ler();
  gravar({ ...atual, cotacoes: atual.cotacoes.map((c) => (c.id === id ? mudar(c) : c)) });
}

export function excluirCotacao(id: string) {
  const atual = ler();
  gravar({ ...atual, cotacoes: atual.cotacoes.filter((c) => c.id !== id) });
}

export function apagarTudo() {
  gravar(VAZIO);
}

export function responder(id: string, lojaId: LojaId, itens: Record<string, Oferta[]>) {
  atualizarCotacao(id, (c) => {
    // Oferta escolhida que a loja tirou da resposta deixa de valer.
    const escolhas = Object.fromEntries(
      Object.entries(c.escolhas).filter(
        ([pecaId, e]) => e.lojaId !== lojaId || itens[pecaId]?.some((o) => o.id === e.ofertaId)
      )
    );
    return {
      ...c,
      escolhas,
      vendas: vendasQueFicam(c, escolhas),
      respostas: { ...c.respostas, [lojaId]: { respondidaEm: new Date().toISOString(), itens } },
    };
  });
}

// ─── Leituras ───────────────────────────────────────────────────────────────

export type Etapa = "AGUARDANDO" | "RESPONDIDA" | "ORCAMENTO" | "PEDIDO" | "ENTREGUE";

export const ETAPAS: Record<Etapa, { rotulo: string; cor: string }> = {
  AGUARDANDO: { rotulo: "Aguardando as lojas", cor: "status status-aberta" },
  RESPONDIDA: { rotulo: "Lojas responderam", cor: "status status-andamento" },
  ORCAMENTO: { rotulo: "Com o cliente", cor: "status status-peca" },
  PEDIDO: { rotulo: "Peças a caminho", cor: "status status-andamento" },
  ENTREGUE: { rotulo: "Peças entregues", cor: "status status-entregue" },
};

export function etapaDa(c: Cotacao): Etapa {
  if (c.pedido) {
    const lojas = Object.values(c.pedido.entregas);
    return lojas.length > 0 && lojas.every((e) => e === "ENTREGUE") ? "ENTREGUE" : "PEDIDO";
  }
  if (c.orcamento) return "ORCAMENTO";
  if (Object.keys(c.respostas).length > 0) return "RESPONDIDA";
  return "AGUARDANDO";
}

export type OfertaNaMesa = Oferta & { lojaId: LojaId };

/** Todas as ofertas recebidas para uma peça, da mais barata para a mais cara. */
export function ofertasDa(c: Cotacao, pecaId: string): OfertaNaMesa[] {
  return c.lojas
    .flatMap((lojaId) => (c.respostas[lojaId]?.itens[pecaId] ?? []).map((o) => ({ ...o, lojaId })))
    .sort((a, b) => a.preco - b.preco || a.prazoMin - b.prazoMin);
}

/** Lojas que já responderam e disseram que não têm a peça. */
export function lojasSemAPeca(c: Cotacao, pecaId: string): LojaId[] {
  return c.lojas.filter((l) => {
    const resposta = c.respostas[l];
    return resposta && (resposta.itens[pecaId] ?? []).length === 0;
  });
}

export function escolhaDa(c: Cotacao, pecaId: string): OfertaNaMesa | undefined {
  const e = c.escolhas[pecaId];
  if (!e) return undefined;
  const oferta = c.respostas[e.lojaId]?.itens[pecaId]?.find((o) => o.id === e.ofertaId);
  return oferta ? { ...oferta, lojaId: e.lojaId } : undefined;
}

export function escolhasMaisBaratas(c: Cotacao): Cotacao["escolhas"] {
  const escolhas: Cotacao["escolhas"] = {};
  for (const p of c.pecas) {
    const [primeira] = ofertasDa(c, p.id);
    if (primeira) escolhas[p.id] = { lojaId: primeira.lojaId, ofertaId: primeira.id };
  }
  return escolhas;
}

/** Preço para o cliente: o da loja mais a margem, arredondado para cima no real. */
export function precoDeVenda(custo: number, margem: number): number {
  return Math.ceil(custo * (1 + margem / 100));
}

/** Preço unitário que o cliente paga pela peça: o digitado, ou o da margem. */
export function precoDaPeca(c: Cotacao, pecaId: string, custo: number): number {
  return c.vendas?.[pecaId] ?? precoDeVenda(custo, c.margem);
}

/**
 * Preços digitados que continuam valendo com as novas escolhas. Trocar a oferta de
 * uma peça muda o custo, então o preço pensado para a oferta antiga sai junto.
 */
export function vendasQueFicam(
  c: Cotacao,
  escolhas: Cotacao["escolhas"]
): Cotacao["vendas"] {
  return Object.fromEntries(
    Object.entries(c.vendas ?? {}).filter(
      ([pecaId]) => escolhas[pecaId]?.ofertaId === c.escolhas[pecaId]?.ofertaId
    )
  );
}

export function totaisDa(c: Cotacao) {
  let custo = 0;
  let venda = 0;
  let escolhidas = 0;
  for (const p of c.pecas) {
    const o = escolhaDa(c, p.id);
    if (!o) continue;
    escolhidas += 1;
    custo += o.preco * p.quantidade;
    venda += precoDaPeca(c, p.id, o.preco) * p.quantidade;
  }
  return { custo, venda, ganho: venda - custo, escolhidas };
}

export function descricaoDoVeiculo(v: VeiculoCotado): string {
  return [v.marca, v.modelo, v.ano].filter((x) => x.trim()).join(" ") || "Veículo sem nome";
}

export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ─── Simulação das lojas ────────────────────────────────────────────────────
//
// Enquanto as lojas não respondem de verdade, a prévia inventa uma resposta
// plausível: marcas que se vendem em autopeça de bairro e preço em torno do que
// a peça costuma custar. Serve para enxergar a comparação, não como referência.

const CATALOGO: { termos: string[]; marcas: string[]; preco: number }[] = [
  { termos: ["pastilha"], marcas: ["Cobreq", "Fras-le", "Bosch", "Jurid"], preco: 95 },
  { termos: ["lona", "sapata"], marcas: ["Fras-le", "Cobreq"], preco: 110 },
  { termos: ["disco"], marcas: ["Fremax", "Hipper Freios", "Cobreq"], preco: 175 },
  { termos: ["correia dentada", "kit correia", "kit distribuicao"], marcas: ["Gates", "Continental", "Dayco"], preco: 320 },
  { termos: ["correia"], marcas: ["Gates", "Continental", "Dayco"], preco: 85 },
  { termos: ["filtro de oleo"], marcas: ["Tecfil", "Mann", "Fram", "Wega"], preco: 28 },
  { termos: ["filtro de ar condicionado", "filtro de cabine"], marcas: ["Tecfil", "Mann", "Wega"], preco: 42 },
  { termos: ["filtro de ar"], marcas: ["Tecfil", "Mann", "Fram"], preco: 45 },
  { termos: ["filtro de combustivel"], marcas: ["Tecfil", "Mann", "Bosch"], preco: 35 },
  { termos: ["oleo"], marcas: ["Mobil", "Shell", "Lubrax", "Castrol"], preco: 38 },
  { termos: ["fluido", "aditivo"], marcas: ["Bosch", "Paraflu", "Varga"], preco: 30 },
  { termos: ["amortecedor"], marcas: ["Cofap", "Monroe", "Nakata"], preco: 290 },
  { termos: ["vela"], marcas: ["NGK", "Bosch"], preco: 32 },
  { termos: ["cabo de vela"], marcas: ["NGK", "Bosch"], preco: 120 },
  { termos: ["bobina"], marcas: ["Bosch", "Magneti Marelli", "NGK"], preco: 260 },
  { termos: ["bateria"], marcas: ["Moura", "Heliar"], preco: 480 },
  { termos: ["embreagem"], marcas: ["LUK", "Sachs", "Valeo"], preco: 650 },
  { termos: ["bomba d", "bomba de agua"], marcas: ["Urba", "Nakata", "SKF"], preco: 150 },
  { termos: ["bomba de combustivel"], marcas: ["Bosch", "Magneti Marelli"], preco: 340 },
  { termos: ["pivo", "terminal", "bieleta", "bandeja"], marcas: ["Nakata", "Viemar", "TRW"], preco: 85 },
  { termos: ["rolamento", "cubo"], marcas: ["SKF", "NSK", "Nakata"], preco: 140 },
  { termos: ["lampada"], marcas: ["Philips", "Osram"], preco: 25 },
  { termos: ["palheta"], marcas: ["Bosch", "Dyna"], preco: 45 },
  { termos: ["junta"], marcas: ["Sabó", "Taranto"], preco: 70 },
  { termos: ["radiador"], marcas: ["Visconde", "Valeo"], preco: 420 },
  { termos: ["sensor"], marcas: ["Bosch", "MTE-Thomson"], preco: 130 },
];

const GENERICO = { marcas: ["Original", "Paralela"], preco: 120 };

function sortear(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function embaralhar<T>(lista: T[]): T[] {
  return [...lista].sort(() => Math.random() - 0.5);
}

/** Uma resposta inventada para a loja — o que o balconista mandaria. */
export function respostaSimulada(c: Cotacao, lojaId: LojaId): Record<string, Oferta[]> {
  const loja = LOJAS.find((l) => l.id === lojaId)!;
  const itens: Record<string, Oferta[]> = {};
  for (const p of c.pecas) {
    // De vez em quando a loja não tem — é o que faz a comparação valer a pena.
    if (Math.random() < 0.12) {
      itens[p.id] = [];
      continue;
    }
    const nome = normalizarBusca(p.descricao);
    const ref = CATALOGO.find((item) => item.termos.some((t) => nome.includes(t))) ?? GENERICO;
    const prazo = Math.round(sortear(...loja.entrega) / 5) * 5;
    const quantas = ref.marcas.length > 1 && Math.random() < 0.45 ? 2 : 1;
    itens[p.id] = embaralhar(ref.marcas)
      .slice(0, quantas)
      .map((marca) => ({
        id: novoId(),
        marca,
        // Preço de balcão: termina em ,90.
        preco: Math.max(5, Math.round(ref.preco * sortear(0.82, 1.22))) - 0.1,
        prazoMin: prazo,
      }));
  }
  return itens;
}

/** Cotação pronta para demonstrar o fluxo sem digitar nada. */
export function criarExemplo(): Cotacao {
  return criarCotacao({
    veiculo: {
      placa: "BOX2A26",
      marca: "Volkswagen",
      modelo: "Gol 1.0",
      ano: "2015",
      motor: "1.0 12V Flex",
    },
    pecas: [
      { descricao: "Pastilha de freio dianteira", quantidade: 1 },
      { descricao: "Disco de freio dianteiro", quantidade: 2 },
      { descricao: "Kit correia dentada", quantidade: 1 },
      { descricao: "Óleo 5W40 sintético (litro)", quantidade: 4 },
      { descricao: "Filtro de óleo", quantidade: 1 },
    ],
    lojas: LOJAS.map((l) => l.id),
  });
}
