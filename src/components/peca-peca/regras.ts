// Regras do Peça Peça que valem dos dois lados: o servidor monta as respostas com
// estes tipos e a tela faz as contas com as mesmas funções. Sem React e sem banco
// aqui — o arquivo é importado por rotas de API e por componentes.

// ─── O que a API devolve ────────────────────────────────────────────────────

export type VeiculoCotado = {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  motor: string;
};

/**
 * Loja como a oficina vê. Sem o link do balcão: com ele daria para ver o que as
 * outras oficinas mandaram para a loja. Quem passa o link à loja é o painel admin.
 */
export type LojaVista = {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  /** Cidades que a loja atende — a região dela —, como "Suzano - SP". */
  atende: string[];
  /** Tempo real de entrega, em minutos. Nulo enquanto vale a faixa padrão. */
  entregaMedia: number | null;
  /** Dias para devolver peça sem uso (zero = não aceita). */
  prazoDevolucao: number;
};

/** O que `/api/peca-peca/lojas` devolve: a cidade da oficina e as lojas que a atendem. */
export type LojasDaOficina = { cidade: string | null; estado: string | null; lojas: LojaVista[] };

export type OfertaVista = { id: string; pecaId: string; marca: string; preco: number; prazoMin: number };

/** O que o balconista manda para uma peça. */
export type OfertaNova = { marca: string; preco: number; prazoMin: number };

export type EnvioVista = {
  id: string;
  lojaId: string;
  lojaNome: string;
  respondidaEm: string | null;
  entrega: EtapaEntrega | null;
  /** A oficina conferiu as peças desta loja. */
  oficinaRecebeuEm: string | null;
  /** Quando as peças chegaram: é daqui que conta o prazo para devolver. */
  entregueEm: string | null;
  /** Dias que a loja dá para devolver peça sem uso (zero = não aceita). */
  prazoDevolucao: number;
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
  /** Recado da oficina para as lojas; vazio quando não escreveu nada. */
  observacao: string;
  /** Preenchidos quando a placa já estava no boxOS: o orçamento nasce ligado a eles. */
  clienteId: string | null;
  veiculoId: string | null;
  clienteNome: string | null;
  margem: number;
  orcamento: { id: string; numero: number; status: string } | null;
  pedidoEm: string | null;
  pecas: PecaVista[];
  envios: EnvioVista[];
  devolucoes: DevolucaoVista[];
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

// O verde "chegou" é o da marca: oferta aceita (aqui) e resposta e peça a caminho (nas
// etapas da oficina).
export const SITUACOES_NO_BALCAO: Record<SituacaoNoBalcao, { rotulo: string; cor: string }> = {
  RESPONDER: { rotulo: "Responder", cor: "status status-peca" },
  OFICINA_DECIDINDO: { rotulo: "Oficina decidindo", cor: "status status-andamento" },
  COM_O_CLIENTE: { rotulo: "Com o cliente da oficina", cor: "status status-andamento" },
  PEDIDO: { rotulo: "Pedido fechado", cor: "status status-chegou" },
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
  /** A oficina confirmou que as peças chegaram. */
  oficinaRecebeuEm: string | null;
  /** A oficina já gerou o orçamento ou fez o pedido: a resposta não muda mais. */
  travada: boolean;
  veiculo: VeiculoCotado;
  observacao: string;
  pecas: PecaNoBalcao[];
  /** Peças deste pedido que a oficina quer devolver (ou já devolveu). */
  devolucoes: DevolucaoVista[];
};

/** O que o link antigo do balcão responde depois que a loja passou a ter login. */
export const MENSAGEM_BALCAO_COM_LOGIN =
  "O balcão desta loja agora é com login. Entre com o seu e-mail e senha no Peça Peça.";

export type CaixaDoBalcao = {
  loja: { nome: string; cidade: string | null; entregaMedia: number | null };
  envios: EnvioNoBalcao[];
};

// ─── Tempo de entrega da loja ───────────────────────────────────────────────
//
// Ninguém digita o tempo de entrega: toda loja começa com a faixa padrão e, depois de
// algumas entregas, passa a mostrar o tempo real dela — do pedido até as peças chegarem
// na oficina (`medirEntregasDaLoja` em lib/balcao.ts).

/** Faixa que vale para a loja enquanto ela não tem entregas suficientes. */
export const ENTREGA_PADRAO = { min: 20, max: 40 } as const;

/** Com menos entregas que isto, uma só fora da curva pesaria demais: vale a faixa padrão. */
export const ENTREGAS_PARA_MEDIA = 3;

/** "28 min (média real)", ou a faixa padrão "20–40 min". */
export function prazoDaLoja(loja: { entregaMedia: number | null }): string {
  return loja.entregaMedia === null
    ? `${ENTREGA_PADRAO.min}–${ENTREGA_PADRAO.max} min`
    : `${loja.entregaMedia} min (média real)`;
}

/** Prazo que vem preenchido em cada oferta do balcão: o tempo real, ou o da faixa padrão. */
export function prazoSugerido(loja: { entregaMedia: number | null }): number {
  return loja.entregaMedia ?? ENTREGA_PADRAO.min;
}

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

export type Etapa = "AGUARDANDO" | "RESPONDIDA" | "ORCAMENTO" | "PEDIDO" | "CONFERIR" | "DEVOLUCAO" | "ENTREGUE";

export const ETAPAS: Record<Etapa, { rotulo: string; cor: string }> = {
  AGUARDANDO: { rotulo: "Aguardando as lojas", cor: "status status-aberta" },
  RESPONDIDA: { rotulo: "Lojas responderam", cor: "status status-chegou" },
  ORCAMENTO: { rotulo: "Com o cliente", cor: "status status-peca" },
  PEDIDO: { rotulo: "Peças a caminho", cor: "status status-chegou" },
  CONFERIR: { rotulo: "Confirmar recebimento", cor: "status status-peca" },
  DEVOLUCAO: { rotulo: "Devolução em andamento", cor: "status status-peca" },
  ENTREGUE: { rotulo: "Peças entregues", cor: "status status-entregue" },
};

/** As lojas do pedido: as que receberam o pedido (só elas ganham etapa de entrega). */
export function enviosDoPedido(c: CotacaoVista): EnvioVista[] {
  return c.envios.filter((e) => e.entrega);
}

/**
 * O pedido como ele sai (ou saiu): cada loja de quem se escolheu alguma peça, as peças
 * dela e quanto fica nela. É o que a confirmação do pedido e o resumo mostram.
 */
export function pedidoPorLoja(c: CotacaoVista) {
  return c.envios.flatMap((envio) => {
    const pecas = c.pecas.flatMap((peca) => {
      const oferta = envio.ofertas.find((o) => o.id === peca.ofertaId);
      return oferta ? [{ peca, oferta }] : [];
    });
    if (pecas.length === 0) return [];
    return [{ envio, pecas, total: pecas.reduce((s, { peca, oferta }) => s + oferta.preco * peca.quantidade, 0) }];
  });
}

/** A loja marcou "entregue" e a oficina ainda não confirmou que as peças chegaram. */
export function aConferir(e: EnvioVista): boolean {
  return e.entrega === "ENTREGUE" && !e.oficinaRecebeuEm;
}

/** Todas as lojas do pedido entregaram e a oficina conferiu. */
export function tudoRecebido(c: CotacaoVista): boolean {
  const doPedido = enviosDoPedido(c);
  return doPedido.length > 0 && doPedido.every((e) => e.oficinaRecebeuEm);
}

/**
 * Só a oficina fecha a entrega: a loja marcar "entregue" deixa a cotação em CONFERIR.
 * Devolução aberta vem antes de "entregue" — ainda há peça indo ou voltando.
 */
export function etapaDa(c: CotacaoVista): Etapa {
  if (c.pedidoEm) {
    if (enviosDoPedido(c).some(aConferir)) return "CONFERIR";
    if (c.devolucoes.some(devolucaoAberta)) return "DEVOLUCAO";
    return tudoRecebido(c) ? "ENTREGUE" : "PEDIDO";
  }
  if (c.orcamento) return "ORCAMENTO";
  if (c.envios.some((e) => e.respondidaEm)) return "RESPONDIDA";
  return "AGUARDANDO";
}

// ─── Devolução ──────────────────────────────────────────────────────────────
//
// Depois da entrega, a peça pode voltar: com defeito, sem uso (o diagnóstico mudou) ou
// errada (o mesmo carro aceita versões diferentes). A oficina pede, a loja aceita ou
// recusa, e cada lado confirma o que recebe — a loja, a peça que voltou; a oficina, a
// peça nova da troca. Nada aqui é gravado como situação: sai das datas, como a etapa.
//
// O pagamento é feito na entrega, fora do app; a devolução só registra quanto, para os
// dois lados conferirem.

export type MotivoDevolucao = "DEFEITO" | "ERRADA" | "NAO_USADA";

export const MOTIVOS_DEVOLUCAO: {
  value: MotivoDevolucao;
  rotulo: string;
  ajuda: string;
  /** O que perguntar no detalhe. Sem pergunta, o detalhe é opcional. */
  pergunta: string | null;
}[] = [
  {
    value: "DEFEITO",
    rotulo: "Veio com defeito",
    ajuda: "Quebrada, com barulho, vazando ou não funcionou.",
    pergunta: "O que aconteceu com a peça?",
  },
  {
    value: "ERRADA",
    rotulo: "Veio a peça errada",
    ajuda: "Não serve no carro: outra versão, outro lado, outra medida.",
    pergunta: "O que estava diferente?",
  },
  {
    value: "NAO_USADA",
    rotulo: "Não vou usar",
    ajuda: "O defeito do carro era outro. A peça volta na caixa, sem montar.",
    pergunta: null,
  },
];

export function ehMotivoDevolucao(valor: unknown): valor is MotivoDevolucao {
  return MOTIVOS_DEVOLUCAO.some((m) => m.value === valor);
}

export function rotuloDoMotivo(motivo: MotivoDevolucao): string {
  return MOTIVOS_DEVOLUCAO.find((m) => m.value === motivo)?.rotulo ?? motivo;
}

export type DevolucaoVista = {
  id: string;
  envioId: string;
  pecaId: string;
  quantidade: number;
  motivo: MotivoDevolucao;
  detalhe: string;
  querTroca: boolean;
  /** Preço da loja × quantidade, quando a devolução foi pedida. */
  valor: number;
  pedidaEm: string;
  aceitaEm: string | null;
  recusadaEm: string | null;
  motivoRecusa: string;
  semAPeca: boolean;
  trocaMarca: string | null;
  /** Preço por unidade da peça da troca, quando mudou. */
  trocaPreco: number | null;
  trocaSaiuEm: string | null;
  lojaRecebeuEm: string | null;
  valorDevolvido: number | null;
  precoAceitoEm: string | null;
  oficinaRecebeuTrocaEm: string | null;
  canceladaEm: string | null;
};

export type SituacaoDevolucao =
  | "PEDIDA"
  | "PRECO_NOVO"
  | "ACEITA"
  | "TROCA_A_CAMINHO"
  | "CONCLUIDA"
  | "RECUSADA"
  | "CANCELADA";

export const SITUACOES_DEVOLUCAO: Record<SituacaoDevolucao, { rotulo: string; cor: string }> = {
  PEDIDA: { rotulo: "Esperando a loja", cor: "status status-aberta" },
  PRECO_NOVO: { rotulo: "Troca com preço novo", cor: "status status-peca" },
  ACEITA: { rotulo: "Aceita", cor: "status status-andamento" },
  TROCA_A_CAMINHO: { rotulo: "Peça nova a caminho", cor: "status status-chegou" },
  CONCLUIDA: { rotulo: "Concluída", cor: "status status-entregue" },
  RECUSADA: { rotulo: "Recusada", cor: "status status-inerte" },
  CANCELADA: { rotulo: "Cancelada", cor: "status status-inerte" },
};

/** A oficina pediu outra peça no lugar, e a loja tem: há uma peça nova indo. */
export function ehTroca(d: Pick<DevolucaoVista, "querTroca" | "semAPeca">): boolean {
  return d.querTroca && !d.semAPeca;
}

/**
 * Quanto a troca muda no bolso da oficina: positivo, ela paga a mais; negativo, a loja
 * devolve a diferença. Zero quando o preço não mudou.
 */
export function diferencaDaTroca(d: Pick<DevolucaoVista, "trocaPreco" | "quantidade" | "valor">): number {
  if (d.trocaPreco === null) return 0;
  return Math.round((d.trocaPreco * d.quantidade - d.valor) * 100) / 100;
}

/** A troca ficou mais cara e a oficina ainda não disse se topa. */
function precoPendente(d: DevolucaoVista): boolean {
  return ehTroca(d) && diferencaDaTroca(d) > 0 && !d.precoAceitoEm;
}

export function situacaoDaDevolucao(d: DevolucaoVista): SituacaoDevolucao {
  if (d.canceladaEm) return "CANCELADA";
  if (d.recusadaEm) return "RECUSADA";
  if (!d.aceitaEm) return "PEDIDA";
  if (precoPendente(d)) return "PRECO_NOVO";
  if (d.lojaRecebeuEm && (!ehTroca(d) || d.oficinaRecebeuTrocaEm)) return "CONCLUIDA";
  if (ehTroca(d) && d.trocaSaiuEm && !d.oficinaRecebeuTrocaEm) return "TROCA_A_CAMINHO";
  return "ACEITA";
}

export function devolucaoAberta(d: DevolucaoVista): boolean {
  const s = situacaoDaDevolucao(d);
  return s !== "CONCLUIDA" && s !== "RECUSADA" && s !== "CANCELADA";
}

/** O que falta, dito do lado da oficina. */
export function oQueFaltaNaDevolucao(d: DevolucaoVista): string {
  switch (situacaoDaDevolucao(d)) {
    case "PEDIDA":
      return "A loja ainda vai responder.";
    case "PRECO_NOVO":
      return "A peça da troca custa mais. Diga se pode mandar.";
    case "TROCA_A_CAMINHO":
      return "A peça nova saiu com o motoboy. Confirme quando ela chegar.";
    case "ACEITA":
      if (!ehTroca(d)) return "O motoboy da loja busca a peça. A loja confirma quando ela voltar.";
      if (!d.trocaSaiuEm) return "A loja vai mandar a peça nova e buscar a outra.";
      return "Falta a loja confirmar que a peça devolvida voltou.";
    case "CONCLUIDA":
      return ehTroca(d) ? "Troca feita." : "Peça devolvida à loja.";
    case "RECUSADA":
      return d.motivoRecusa ? `A loja recusou: ${d.motivoRecusa}` : "A loja recusou a devolução.";
    case "CANCELADA":
      return "Você cancelou esta devolução.";
  }
}

/** A oficina precisa fazer algo: topar o preço novo, ou confirmar a peça nova. */
export function oficinaPrecisaAgir(d: DevolucaoVista): boolean {
  const s = situacaoDaDevolucao(d);
  return s === "PRECO_NOVO" || s === "TROCA_A_CAMINHO";
}

/** A loja precisa fazer algo: responder, mandar a peça nova ou confirmar a que voltou. */
export function lojaPrecisaAgir(d: DevolucaoVista): boolean {
  const s = situacaoDaDevolucao(d);
  if (s === "PEDIDA") return true;
  if (s !== "ACEITA" && s !== "TROCA_A_CAMINHO") return false;
  return !d.lojaRecebeuEm || (ehTroca(d) && !d.trocaSaiuEm);
}

/**
 * Até quando a oficina pode devolver peça sem uso: dias da loja contados de quando as
 * peças chegaram. Nulo quando a loja não aceita (prazo zero) ou a entrega não fechou.
 */
export function prazoParaDevolver(e: Pick<EnvioVista, "entregueEm" | "oficinaRecebeuEm" | "prazoDevolucao">): Date | null {
  const chegou = e.entregueEm ?? e.oficinaRecebeuEm;
  if (!chegou || e.prazoDevolucao <= 0) return null;
  return new Date(new Date(chegou).getTime() + e.prazoDevolucao * 24 * 60 * 60 * 1000);
}

/** Dá para pedir a devolução: a loja entregou ou a oficina já conferiu. */
export function podeDevolver(e: { entrega: string | null; oficinaRecebeuEm: string | Date | null }): boolean {
  return e.entrega === "ENTREGUE" || Boolean(e.oficinaRecebeuEm);
}

/**
 * Quantas unidades da peça ainda dá para devolver: as pedidas menos as que já estão
 * voltando ou voltaram. Recusada e cancelada não contam.
 */
export function quantasDaParaDevolver(
  peca: Pick<PecaVista, "id" | "quantidade">,
  devolucoes: { pecaId: string; quantidade: number; recusadaEm: string | Date | null; canceladaEm: string | Date | null }[]
): number {
  const usadas = devolucoes
    .filter((d) => d.pecaId === peca.id && !d.recusadaEm && !d.canceladaEm)
    .reduce((s, d) => s + d.quantidade, 0);
  return Math.max(0, peca.quantidade - usadas);
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
