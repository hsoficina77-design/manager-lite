// Regras do Peça Peça que valem dos dois lados: o servidor monta as respostas com
// estes tipos e a tela faz as contas com as mesmas funções. Sem React e sem banco
// aqui — o arquivo é importado por rotas de API e por componentes.

import { normalizarBusca } from "@/lib/utils";

// ─── O que a API devolve ────────────────────────────────────────────────────

export type VeiculoCotado = {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  motor: string;
};

/** Loja como a oficina vê. `link` só existe na prévia: é o balcão para abrir em outra aba. */
export type LojaVista = {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  /** Cidades que a loja atende — a região dela —, como "Suzano - SP". */
  atende: string[];
  entregaMin: number;
  entregaMax: number;
  link?: string;
};

/** O que `/api/peca-peca/lojas` devolve: a cidade da oficina e as lojas que a atendem. */
export type LojasDaOficina = { cidade: string | null; estado: string | null; lojas: LojaVista[] };

export type OfertaVista = { id: string; pecaId: string; marca: string; preco: number; prazoMin: number };

export type EnvioVista = {
  id: string;
  lojaId: string;
  lojaNome: string;
  respondidaEm: string | null;
  entrega: EtapaEntrega | null;
  ofertas: OfertaVista[];
};

export type PecaVista = {
  id: string;
  descricao: string;
  quantidade: number;
  ofertaId: string | null;
  vendaUnit: number | null;
};

export type CotacaoVista = {
  id: string;
  numero: number;
  criadaEm: string;
  veiculo: VeiculoCotado;
  /** Preenchidos quando a placa já estava no boxOS: o orçamento nasce ligado a eles. */
  clienteId: string | null;
  veiculoId: string | null;
  clienteNome: string | null;
  margem: number;
  orcamento: { id: string; numero: number; status: string } | null;
  pedidoEm: string | null;
  pecas: PecaVista[];
  envios: EnvioVista[];
};

// ─── O que o balcão da loja recebe ──────────────────────────────────────────
//
// Só o que o balconista precisa para conferir a aplicação e separar a peça. Nada de
// cliente, margem, preço de venda, nem do que as outras lojas mandaram.

export type SituacaoNoBalcao =
  | "RESPONDER"
  | "OFICINA_DECIDINDO"
  | "COM_O_CLIENTE"
  | "PEDIDO"
  | "OUTRA_LOJA"
  | "ENCERRADA";

export const SITUACOES_NO_BALCAO: Record<SituacaoNoBalcao, { rotulo: string; cor: string }> = {
  RESPONDER: { rotulo: "Responder", cor: "status status-peca" },
  OFICINA_DECIDINDO: { rotulo: "Oficina decidindo", cor: "status status-andamento" },
  COM_O_CLIENTE: { rotulo: "Com o cliente da oficina", cor: "status status-andamento" },
  PEDIDO: { rotulo: "Pedido fechado", cor: "status status-entregue" },
  OUTRA_LOJA: { rotulo: "Fechou com outra loja", cor: "status status-inerte" },
  ENCERRADA: { rotulo: "Encerrada sem resposta", cor: "status status-inerte" },
};

export type PecaNoBalcao = {
  id: string;
  descricao: string;
  quantidade: number;
  /** As ofertas desta loja para a peça. */
  ofertas: { id: string; marca: string; preco: number; prazoMin: number }[];
  /** A oficina fechou esta peça com esta loja: a marca que vai no pedido. */
  pedida: string | null;
};

export type EnvioNoBalcao = {
  id: string;
  oficina: string;
  recebidoEm: string;
  respondidaEm: string | null;
  situacao: SituacaoNoBalcao;
  entrega: EtapaEntrega | null;
  /** A oficina já gerou o orçamento: a resposta não muda mais. */
  travada: boolean;
  veiculo: VeiculoCotado;
  pecas: PecaNoBalcao[];
};

export type CaixaDoBalcao = {
  loja: { nome: string; cidade: string | null; entregaMin: number; entregaMax: number };
  envios: EnvioNoBalcao[];
};

// ─── Entrega ────────────────────────────────────────────────────────────────

export type EtapaEntrega = "ENVIADO" | "SEPARANDO" | "A_CAMINHO" | "ENTREGUE";

export const ETAPAS_ENTREGA: { value: EtapaEntrega; rotulo: string }[] = [
  { value: "ENVIADO", rotulo: "Pedido recebido" },
  { value: "SEPARANDO", rotulo: "Separando" },
  { value: "A_CAMINHO", rotulo: "Saiu com o motoboy" },
  { value: "ENTREGUE", rotulo: "Entregue" },
];

export function ehEtapaEntrega(valor: unknown): valor is EtapaEntrega {
  return ETAPAS_ENTREGA.some((e) => e.value === valor);
}

export function proximaEtapa(atual: EtapaEntrega): EtapaEntrega | null {
  const i = ETAPAS_ENTREGA.findIndex((e) => e.value === atual);
  return ETAPAS_ENTREGA[i + 1]?.value ?? null;
}

export function rotuloDaEntrega(etapa: EtapaEntrega): string {
  return ETAPAS_ENTREGA.find((e) => e.value === etapa)?.rotulo ?? etapa;
}

// ─── Etapas da cotação (lado da oficina) ────────────────────────────────────

export type Etapa = "AGUARDANDO" | "RESPONDIDA" | "ORCAMENTO" | "PEDIDO" | "ENTREGUE";

export const ETAPAS: Record<Etapa, { rotulo: string; cor: string }> = {
  AGUARDANDO: { rotulo: "Aguardando as lojas", cor: "status status-aberta" },
  RESPONDIDA: { rotulo: "Lojas responderam", cor: "status status-andamento" },
  ORCAMENTO: { rotulo: "Com o cliente", cor: "status status-peca" },
  PEDIDO: { rotulo: "Peças a caminho", cor: "status status-andamento" },
  ENTREGUE: { rotulo: "Peças entregues", cor: "status status-entregue" },
};

export function etapaDa(c: CotacaoVista): Etapa {
  if (c.pedidoEm) {
    const entregas = c.envios.flatMap((e) => (e.entrega ? [e.entrega] : []));
    return entregas.length > 0 && entregas.every((e) => e === "ENTREGUE") ? "ENTREGUE" : "PEDIDO";
  }
  if (c.orcamento) return "ORCAMENTO";
  if (c.envios.some((e) => e.respondidaEm)) return "RESPONDIDA";
  return "AGUARDANDO";
}

// ─── Comparação e preço ─────────────────────────────────────────────────────

export type OfertaNaMesa = OfertaVista & { lojaId: string; lojaNome: string };

/** Todas as ofertas recebidas para uma peça, da mais barata para a mais cara. */
export function ofertasDa(c: CotacaoVista, pecaId: string): OfertaNaMesa[] {
  return c.envios
    .flatMap((e) =>
      e.ofertas.filter((o) => o.pecaId === pecaId).map((o) => ({ ...o, lojaId: e.lojaId, lojaNome: e.lojaNome }))
    )
    .sort((a, b) => a.preco - b.preco || a.prazoMin - b.prazoMin);
}

/** Lojas que já responderam e disseram que não têm a peça. */
export function lojasSemAPeca(c: CotacaoVista, pecaId: string): string[] {
  return c.envios
    .filter((e) => e.respondidaEm && !e.ofertas.some((o) => o.pecaId === pecaId))
    .map((e) => e.lojaNome);
}

export function escolhaDa(c: CotacaoVista, peca: PecaVista): OfertaNaMesa | undefined {
  if (!peca.ofertaId) return undefined;
  return ofertasDa(c, peca.id).find((o) => o.id === peca.ofertaId);
}

/** Preço para o cliente: o da loja mais a margem, arredondado para cima no real. */
export function precoDeVenda(custo: number, margem: number): number {
  return Math.ceil(custo * (1 + margem / 100));
}

/** Preço unitário que o cliente paga pela peça: o digitado, ou o da margem. */
export function precoDaPeca(peca: Pick<PecaVista, "vendaUnit">, custo: number, margem: number): number {
  return peca.vendaUnit ?? precoDeVenda(custo, margem);
}

export function totaisDa(c: CotacaoVista) {
  let custo = 0;
  let venda = 0;
  let escolhidas = 0;
  for (const p of c.pecas) {
    const o = escolhaDa(c, p);
    if (!o) continue;
    escolhidas += 1;
    custo += o.preco * p.quantidade;
    venda += precoDaPeca(p, o.preco, c.margem) * p.quantidade;
  }
  return { custo, venda, ganho: venda - custo, escolhidas };
}

export function descricaoDoVeiculo(v: Pick<VeiculoCotado, "marca" | "modelo" | "ano">): string {
  return [v.marca, v.modelo, v.ano].filter((x) => x?.trim()).join(" ") || "Veículo sem nome";
}

export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ─── Simulação das lojas ────────────────────────────────────────────────────
//
// Para testar sem abrir o balcão: o servidor inventa uma resposta plausível, com
// marcas que se vendem em autopeça de bairro e preço em torno do que a peça costuma
// custar. Serve para enxergar a comparação, não como referência de preço.

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
  { termos: ["cabo de vela"], marcas: ["NGK", "Bosch"], preco: 120 },
  { termos: ["vela"], marcas: ["NGK", "Bosch"], preco: 32 },
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

export type OfertaNova = { marca: string; preco: number; prazoMin: number };

/** Uma resposta inventada — o que o balconista mandaria. Lista vazia é "não tenho". */
export function respostaSimulada(
  pecas: { id: string; descricao: string }[],
  entrega: { entregaMin: number; entregaMax: number }
): Record<string, OfertaNova[]> {
  const itens: Record<string, OfertaNova[]> = {};
  for (const p of pecas) {
    // De vez em quando a loja não tem — é o que faz a comparação valer a pena.
    if (Math.random() < 0.12) {
      itens[p.id] = [];
      continue;
    }
    const nome = normalizarBusca(p.descricao);
    const ref = CATALOGO.find((item) => item.termos.some((t) => nome.includes(t))) ?? GENERICO;
    const prazo = Math.round(sortear(entrega.entregaMin, entrega.entregaMax) / 5) * 5;
    const quantas = ref.marcas.length > 1 && Math.random() < 0.45 ? 2 : 1;
    itens[p.id] = embaralhar(ref.marcas)
      .slice(0, quantas)
      .map((marca) => ({
        marca,
        // Preço de balcão: termina em ,90.
        preco: Math.round((Math.max(5, Math.round(ref.preco * sortear(0.82, 1.22))) - 0.1) * 100) / 100,
        prazoMin: prazo,
      }));
  }
  return itens;
}

/** Cotação pronta para demonstrar o fluxo sem digitar nada. */
export const EXEMPLO = {
  veiculo: { placa: "BOX2A26", marca: "Volkswagen", modelo: "Gol 1.0", ano: "2015", motor: "1.0 12V Flex" },
  pecas: [
    { descricao: "Pastilha de freio dianteira", quantidade: 1 },
    { descricao: "Disco de freio dianteiro", quantidade: 2 },
    { descricao: "Kit correia dentada", quantidade: 1 },
    { descricao: "Óleo 5W40 sintético (litro)", quantidade: 4 },
    { descricao: "Filtro de óleo", quantidade: 1 },
  ],
};
