// Balcão do Peça Peça — o lado da loja.
//
// A loja não é de oficina nenhuma: uma autopeça atende várias. Por isso este arquivo
// usa o cliente Prisma cru e está na lista curta de `scripts/checar-isolamento.mjs`.
// O que segura o isolamento aqui é a forma das consultas:
//
//   - toda leitura parte de `CotacaoLoja` filtrado pelo `lojaId` do link — a loja só
//     alcança cotação que foi enviada para ela;
//   - o `select` é a lista do que o balconista precisa (o carro e as peças), e nada de
//     cliente, margem, preço de venda ou oferta de outra loja sai daqui;
//   - o que a loja grava (oferta, etapa da entrega) leva o `oficinaId` do próprio
//     envio, e os gatilhos do banco recusam qualquer vínculo com outra oficina.

import { lerDestino } from "@/lib/destino-do-pedido";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bancoDaOficina } from "@/lib/db-oficina";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";
import { ErroDeEntrada } from "@/lib/validacao";
import { mesmaCidade, rotuloDoMunicipio } from "@/lib/municipios";
import { municipioOficial } from "@/lib/municipios-servidor";
import {
  ENTREGAS_PARA_MEDIA,
  ENTREGA_E_PAGAMENTO_PADRAO,
  diferencaDaTroca,
  ehEtapaEntrega,
  ehFormaDePagamento,
  ehTipoDeFrete,
  freteDoEnvio,
  lerFretePorCidade,
  precoNaForma,
  taxaDaCidade,
  type EntregaEPagamento,
  type FormaDePagamento,
  ehMotivoDevolucao,
  ehTroca,
  proximaEtapa,
  situacaoDaConversa,
  situacaoDaDevolucao,
  type CaixaDoBalcao,
  type DevolucaoVista,
  type EnvioNoBalcao,
  type EtapaEntrega,
  type LojaVista,
  type MotivoDevolucao,
  type OfertaNova,
  type SituacaoNoBalcao,
} from "@/components/peca-peca/regras";
import { formatCurrency } from "@/lib/utils";

// ─── Lojas ──────────────────────────────────────────────────────────────────
//
// O cadastro é do painel admin (/admin/lojas): o dono da plataforma cria cada loja à
// mão, com a cidade onde ela fica e as cidades que atende — a região dela. Depois, o
// dono da loja mexe na região e no telefone pela tela "Loja" do painel dele.

function novoToken() {
  return randomBytes(24).toString("base64url");
}

const CAMPOS_DA_LOJA = {
  id: true,
  nome: true,
  cidade: true,
  uf: true,
  atende: true,
  entregaMedia: true,
  prazoDevolucao: true,
} as const;

/**
 * Lojas ativas que atendem a cidade da oficina. Oficina sem cidade na configuração
 * vê todas — é melhor mostrar a mais do que esconder a loja que a atenderia.
 */
export async function lojasQueAtendem(cidade: string | null, estado: string | null): Promise<LojaVista[]> {
  const lojas = await prisma.loja.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    select: CAMPOS_DA_LOJA,
  });
  // Com a UF, "Suzano - SP"; sem ela (cadastro antigo), o nome sozinho — ver mesmaCidade.
  const daOficina = cidade?.trim() ? (estado?.trim() ? `${cidade.trim()} - ${estado.trim()}` : cidade.trim()) : null;
  return lojas.filter((l) => !daOficina || l.atende.some((c) => mesmaCidade(c, daOficina)));
}

/** Todas as lojas, inclusive as desativadas — a cotação antiga continua com o nome dela. */
export async function todasAsLojas(): Promise<Map<string, LojaVista>> {
  const lojas = await prisma.loja.findMany({ select: CAMPOS_DA_LOJA });
  return new Map(lojas.map((l) => [l.id, l]));
}

// ─── Painel admin ───────────────────────────────────────────────────────────

export type DadosDaLoja = {
  nome: string;
  cidade: string;
  uf: string;
  /** Rótulos "Nome - UF" escolhidos da lista do IBGE. */
  atende: string[];
  telefone: string | null;
  prazoDevolucao?: number;
};

export type LojaDoPainel = LojaVista & {
  telefone: string | null;
  /** Entregas que entraram no tempo real da loja. */
  entregasMedidas: number;
  ativa: boolean;
  /** Link antigo do balcão. Só vale enquanto a loja não tem conta (`contas` zero). */
  link: string;
  /** Pessoas da loja com login ativo. */
  contas: number;
  criadaEm: string;
  cotacoes: number;
  respondidas: number;
  pedidos: number;
  /** Devoluções pedidas à loja (sem as canceladas), e quantas foram de peça errada. */
  devolucoes: number;
  erradas: number;
};

/**
 * A sede e a região da loja conferidas na lista do IBGE: nome oficial, UF, e a
 * região como rótulos "Nome - UF" sem repetição, com a cidade da própria loja junto.
 * Cidade que não é município responde 400 — a tela só deixa escolher da lista.
 */
function conferirCidades(cidade: string, uf: string, atende: string[]) {
  const sede = municipioOficial(cidade, uf);
  if (!sede) throw new ErroDeEntrada(400, "Cidade da loja não encontrada: escolha na lista");
  const regiao: string[] = [rotuloDoMunicipio(sede)];
  for (const c of atende) {
    const m = municipioOficial(c);
    if (!m) throw new ErroDeEntrada(400, `Cidade não encontrada: ${c}`);
    const rotulo = rotuloDoMunicipio(m);
    if (!regiao.includes(rotulo)) regiao.push(rotulo);
  }
  return { cidade: sede.nome, uf: sede.uf, atende: regiao };
}

export async function lojasDoPainel(): Promise<LojaDoPainel[]> {
  const [lojas, respondidas, pedidos, devolucoes] = await Promise.all([
    prisma.loja.findMany({
      orderBy: [{ ativa: "desc" }, { nome: "asc" }],
      select: {
        ...CAMPOS_DA_LOJA,
        telefone: true,
        entregasMedidas: true,
        ativa: true,
        tokenBalcao: true,
        createdAt: true,
        _count: { select: { envios: true, usuarios: { where: { ativo: true } } } },
      },
    }),
    prisma.cotacaoLoja.groupBy({ by: ["lojaId"], where: { respondidaEm: { not: null } }, _count: { _all: true } }),
    prisma.cotacaoLoja.groupBy({ by: ["lojaId"], where: { entrega: { not: null } }, _count: { _all: true } }),
    // A devolução não tem a loja direto: vem pelo envio. Só contagens, como o resto daqui.
    prisma.devolucao.findMany({ where: { canceladaEm: null }, select: { motivo: true, envio: { select: { lojaId: true } } } }),
  ]);
  const contar = (lista: { lojaId: string; _count: { _all: number } }[], id: string) =>
    lista.find((x) => x.lojaId === id)?._count._all ?? 0;
  const daLoja = (id: string) => devolucoes.filter((d) => d.envio.lojaId === id);

  return lojas.map(({ tokenBalcao, createdAt, _count, ...l }) => ({
    ...l,
    link: `/balcao/${tokenBalcao}`,
    contas: _count.usuarios,
    criadaEm: createdAt.toISOString(),
    cotacoes: _count.envios,
    respondidas: contar(respondidas, l.id),
    pedidos: contar(pedidos, l.id),
    devolucoes: daLoja(l.id).length,
    erradas: daLoja(l.id).filter((d) => d.motivo === "ERRADA").length,
  }));
}

export async function criarLoja(dados: DadosDaLoja) {
  return prisma.loja.create({
    data: { ...dados, ...conferirCidades(dados.cidade, dados.uf, dados.atende), tokenBalcao: novoToken() },
    select: { id: true },
  });
}

/**
 * Edita o cadastro — inteiro, do painel admin, ou só o telefone e as cidades, da tela
 * do dono da loja — ou liga e desliga a loja. Loja inexistente devolve `null`.
 */
export async function atualizarLoja(
  id: string,
  { entrega, ...dados }: Partial<DadosDaLoja> & { ativa?: boolean; entrega?: EntregaEPagamento }
) {
  const atual = await prisma.loja.findUnique({ where: { id }, select: { cidade: true, uf: true, atende: true } });
  if (!atual) return null;
  const mexeNaCidade = dados.cidade !== undefined || dados.uf !== undefined || dados.atende !== undefined;
  const cidades = mexeNaCidade
    ? conferirCidades(dados.cidade ?? atual.cidade ?? "", dados.uf ?? atual.uf ?? "", dados.atende ?? atual.atende)
    : null;
  return prisma.loja.update({
    where: { id },
    data: {
      ...dados,
      ...(cidades ?? {}),
      ...(entrega ? colunasDaEntrega(entrega, cidades?.atende ?? atual.atende) : {}),
    },
    select: { id: true },
  });
}

/**
 * A entrega e o pagamento como vão para o banco. A taxa por cidade fica só com as
 * cidades que a loja atende, gravadas com o rótulo da região dela — cidade tirada da
 * região some da tabela na próxima vez que o dono salvar.
 */
function colunasDaEntrega(e: EntregaEPagamento, atende: string[]) {
  const porCidade: Record<string, number> = {};
  if (e.freteTipo === "POR_CIDADE") {
    for (const [cidade, valor] of Object.entries(e.fretePorCidade)) {
      const daRegiao = atende.find((c) => mesmaCidade(c, cidade));
      if (daRegiao) porCidade[daRegiao] = valor;
    }
  }
  return {
    freteTipo: e.freteTipo,
    freteValor: e.freteTipo === "GRATIS" ? 0 : e.freteValor,
    fretePorCidade: porCidade,
    freteGratisAcima: e.freteTipo === "GRATIS" ? null : e.freteGratisAcima,
    acrescimoCredito: e.acrescimoCredito,
    debitoAVista: e.debitoAVista,
  };
}

const CAMPOS_DA_ENTREGA = {
  freteTipo: true,
  freteValor: true,
  fretePorCidade: true,
  freteGratisAcima: true,
  acrescimoCredito: true,
  debitoAVista: true,
} as const;

/** A entrega e o pagamento da loja, para a tela "Loja" do dono. */
export async function entregaEPagamentoDaLoja(lojaId: string): Promise<EntregaEPagamento> {
  const l = await prisma.loja.findUnique({ where: { id: lojaId }, select: CAMPOS_DA_ENTREGA });
  return l ? entregaEPagamentoDa(l) : ENTREGA_E_PAGAMENTO_PADRAO;
}

/** A entrega e o pagamento de uma loja lidos do banco, já conferidos. */
export function entregaEPagamentoDa(l: {
  freteTipo: string;
  freteValor: number;
  fretePorCidade: unknown;
  freteGratisAcima: number | null;
  acrescimoCredito: number;
  debitoAVista: boolean;
}): EntregaEPagamento {
  return {
    freteTipo: ehTipoDeFrete(l.freteTipo) ? l.freteTipo : "GRATIS",
    freteValor: l.freteValor,
    fretePorCidade: lerFretePorCidade(l.fretePorCidade),
    freteGratisAcima: l.freteGratisAcima,
    acrescimoCredito: l.acrescimoCredito,
    debitoAVista: l.debitoAVista,
  };
}

/** Link novo para o balcão: o antigo para de funcionar na hora (vazou, trocou de funcionário). */
export async function trocarLinkDaLoja(id: string) {
  const existe = await prisma.loja.findUnique({ where: { id }, select: { id: true } });
  if (!existe) return null;
  return prisma.loja.update({ where: { id }, data: { tokenBalcao: novoToken() }, select: { id: true } });
}

/**
 * A loja do link antigo do balcão (`/balcao/<token>`), da época em que a loja não tinha
 * conta. O link só vale enquanto a loja não tem ninguém com login: a partir da primeira
 * conta, `comLogin` vem verdadeiro e as rotas do link recusam — o balcão passa a ser o
 * painel da loja, com acesso por pessoa.
 */
export async function lojaPeloToken(token: string | undefined | null) {
  // Token de verdade tem 32 caracteres; qualquer coisa muito diferente nem vai ao banco.
  if (!token || token.length < 16 || token.length > 64) return null;
  const loja = await prisma.loja.findUnique({
    where: { tokenBalcao: token },
    select: { ...CAMPOS_DA_LOJA, ativa: true, _count: { select: { usuarios: { where: { ativo: true } } } } },
  });
  if (!loja?.ativa) return null;
  const { _count, ...resto } = loja;
  return { ...resto, comLogin: _count.usuarios > 0 };
}

export { MENSAGEM_BALCAO_COM_LOGIN } from "@/components/peca-peca/regras";

// ─── Devolução: o que os dois lados leem ────────────────────────────────────
//
// A mesma lista de campos serve à oficina (lib/cotacoes.ts) e ao balcão: na devolução
// não há nada que um lado não possa ver — é a conversa entre os dois sobre a peça.

export const CAMPOS_DA_DEVOLUCAO = {
  id: true,
  envioId: true,
  pecaId: true,
  quantidade: true,
  motivo: true,
  detalhe: true,
  querTroca: true,
  valor: true,
  createdAt: true,
  aceitaEm: true,
  recusadaEm: true,
  motivoRecusa: true,
  semAPeca: true,
  trocaMarca: true,
  trocaPreco: true,
  trocaSaiuEm: true,
  lojaRecebeuEm: true,
  valorDevolvido: true,
  precoAceitoEm: true,
  oficinaRecebeuTrocaEm: true,
  canceladaEm: true,
} satisfies Prisma.DevolucaoSelect;

type DevolucaoDoBanco = Prisma.DevolucaoGetPayload<{ select: typeof CAMPOS_DA_DEVOLUCAO }>;

const iso = (d: Date | null) => d?.toISOString() ?? null;

export function devolucaoVista(d: DevolucaoDoBanco): DevolucaoVista {
  return {
    id: d.id,
    envioId: d.envioId,
    pecaId: d.pecaId,
    quantidade: d.quantidade,
    motivo: ehMotivoDevolucao(d.motivo) ? d.motivo : "DEFEITO",
    detalhe: d.detalhe ?? "",
    querTroca: d.querTroca,
    valor: d.valor,
    pedidaEm: d.createdAt.toISOString(),
    aceitaEm: iso(d.aceitaEm),
    recusadaEm: iso(d.recusadaEm),
    motivoRecusa: d.motivoRecusa ?? "",
    semAPeca: d.semAPeca,
    trocaMarca: d.trocaMarca,
    trocaPreco: d.trocaPreco,
    trocaSaiuEm: iso(d.trocaSaiuEm),
    lojaRecebeuEm: iso(d.lojaRecebeuEm),
    valorDevolvido: d.valorDevolvido,
    precoAceitoEm: iso(d.precoAceitoEm),
    oficinaRecebeuTrocaEm: iso(d.oficinaRecebeuTrocaEm),
    canceladaEm: iso(d.canceladaEm),
  };
}

// ─── Caixa de entrada ───────────────────────────────────────────────────────

const SELECAO_DO_ENVIO = {
  id: true,
  oficinaId: true,
  createdAt: true,
  respondidaEm: true,
  entrega: true,
  oficinaRecebeuEm: true,
  naoLidasLoja: true,
  conversaFechadaEm: true,
  taxaEntrega: true,
  freteGratisAcima: true,
  debitoAVista: true,
  formaPagamento: true,
  destino: true,
  ofertas: {
    orderBy: { createdAt: "asc" },
    select: { id: true, pecaId: true, marca: true, preco: true, precoCredito: true, prazoMin: true },
  },
  devolucoes: { orderBy: { createdAt: "asc" }, select: CAMPOS_DA_DEVOLUCAO },
  cotacao: {
    select: {
      formaPagamento: true,
      placa: true,
      marca: true,
      modelo: true,
      ano: true,
      motor: true,
      observacao: true,
      orcamentoId: true,
      pedidoEm: true,
      // `ofertaId` só serve para saber se a peça foi fechada com ESTA loja; não sai daqui.
      pecas: { orderBy: { ordem: "asc" }, select: { id: true, descricao: true, quantidade: true, ofertaId: true } },
    },
  },
} as const;

type EnvioDoBanco = Awaited<ReturnType<typeof lerEnvios>>[number];

function lerEnvios(where: { lojaId: string; id?: string }) {
  return prisma.cotacaoLoja.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: SELECAO_DO_ENVIO,
  });
}

type OficinaNoBalcao = { nome: string; cidade: string | null };

/**
 * Nome da oficina, o mesmo que ela vê no menu, e a cidade dela ("Suzano - SP"). É tudo o
 * que a loja sabe de quem pediu — a cidade só serve para a taxa de entrega da região.
 */
async function oficinasDosEnvios(ids: string[]) {
  const oficinas = new Map<string, OficinaNoBalcao>();
  await Promise.all(
    ids.map(async (id) => {
      const config = await getConfiguracao(bancoDaOficina(id));
      const cidade = config.cidade?.trim() || null;
      const uf = config.estado?.trim() || null;
      oficinas.set(id, { nome: nomeDoMenu(config), cidade: cidade && uf ? `${cidade} - ${uf}` : cidade });
    })
  );
  return oficinas;
}

/** Nome da oficina, o mesmo que ela vê no menu. */
export async function nomesDasOficinas(ids: string[]) {
  const oficinas = await oficinasDosEnvios(ids);
  return new Map([...oficinas].map(([id, o]) => [id, o.nome]));
}

const OFICINA_SEM_NOME: OficinaNoBalcao = { nome: "Oficina", cidade: null };

/**
 * Quando cada oficina fez o primeiro pedido nesta loja. A oficina cujo envio é esse é
 * cliente novo: o balcão oferece os dados para a loja cadastrá-la.
 */
async function primeirosPedidos(lojaId: string, oficinaIds: string[]) {
  const grupos = await prisma.cotacaoLoja.groupBy({
    by: ["oficinaId"],
    where: { lojaId, oficinaId: { in: oficinaIds }, entrega: { not: null } },
    _min: { createdAt: true },
  });
  return new Map(grupos.map((g) => [g.oficinaId, g._min.createdAt]));
}

function paraOBalcao(
  e: EnvioDoBanco,
  oficina: OficinaNoBalcao,
  regra: EntregaEPagamento,
  primeiros: Map<string, Date | null>
): EnvioNoBalcao {
  const salvo = e.entrega ? lerDestino(e.destino) : null;
  const c = e.cotacao;
  // Respondida, valem a taxa e o pagamento que a loja mandou; antes, a regra dela agora.
  const respondida = Boolean(e.respondidaEm);
  const forma: FormaDePagamento = ehFormaDePagamento(e.formaPagamento)
    ? e.formaPagamento
    : ehFormaDePagamento(c.formaPagamento)
      ? c.formaPagamento
      : "PIX";
  // O que o motoboy cobra: as peças pedidas a esta loja no preço da forma, mais a entrega.
  let cobranca: EnvioNoBalcao["cobranca"] = null;
  if (c.pedidoEm && e.entrega) {
    const ofertas = new Map(e.ofertas.map((o) => [o.id, o]));
    const pecas = c.pecas.reduce((s, p) => {
      const o = p.ofertaId ? ofertas.get(p.ofertaId) : undefined;
      return o ? s + precoNaForma(o, forma, e.debitoAVista) * p.quantidade : s;
    }, 0);
    cobranca = { pecas, entrega: freteDoEnvio(e, pecas) };
  }
  const minhas = new Map(e.ofertas.map((o) => [o.id, o]));
  const fechouComigo = c.pecas.some((p) => p.ofertaId && minhas.has(p.ofertaId));
  const travada = Boolean(c.orcamentoId || c.pedidoEm);

  let situacao: SituacaoNoBalcao;
  if (c.pedidoEm) situacao = e.entrega ? "PEDIDO" : "OUTRA_LOJA";
  else if (c.orcamentoId) situacao = !e.respondidaEm ? "ENCERRADA" : fechouComigo ? "COM_O_CLIENTE" : "OUTRA_LOJA";
  else situacao = e.respondidaEm ? "OFICINA_DECIDINDO" : "RESPONDER";

  return {
    id: e.id,
    oficina: oficina.nome,
    destino: salvo
      ? { ...salvo, clienteNovo: primeiros.get(e.oficinaId)?.getTime() === e.createdAt.getTime() }
      : null,
    recebidoEm: e.createdAt.toISOString(),
    respondidaEm: e.respondidaEm?.toISOString() ?? null,
    situacao,
    entrega: ehEtapaEntrega(e.entrega) ? e.entrega : null,
    oficinaRecebeuEm: e.oficinaRecebeuEm?.toISOString() ?? null,
    travada,
    pedidoEm: c.pedidoEm?.toISOString() ?? null,
    veiculo: {
      placa: c.placa ?? "",
      marca: c.marca ?? "",
      modelo: c.modelo,
      ano: c.ano ?? "",
      motor: c.motor ?? "",
    },
    observacao: c.observacao ?? "",
    formaPagamento: forma,
    debitoAVista: respondida ? e.debitoAVista : regra.debitoAVista,
    taxaEntrega: e.taxaEntrega,
    taxaSugerida: taxaDaCidade(regra, oficina.cidade),
    freteGratisAcima: respondida ? e.freteGratisAcima : regra.freteGratisAcima,
    acrescimoCredito: regra.acrescimoCredito,
    cobranca,
    pecas: c.pecas.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      quantidade: p.quantidade,
      ofertas: e.ofertas
        .filter((o) => o.pecaId === p.id)
        .map(({ id, marca, preco, precoCredito, prazoMin }) => ({ id, marca, preco, precoCredito, prazoMin })),
      pedida: c.pedidoEm && p.ofertaId ? (minhas.get(p.ofertaId)?.marca ?? null) : null,
    })),
    devolucoes: e.devolucoes.map(devolucaoVista),
    naoLidas: e.naoLidasLoja,
    conversaFechada: !situacaoDaConversa({ ...e, pedidoEm: c.pedidoEm }).aberta,
  };
}

/**
 * Envios mais antigos que os da caixa, mas com devolução esperando a loja: a peça
 * pode voltar dias depois, quando o pedido já saiu da lista das últimas cotações.
 */
function enviosComDevolucaoPendente(lojaId: string, foraDe: string[]) {
  return prisma.cotacaoLoja.findMany({
    where: {
      lojaId,
      id: { notIn: foraDe },
      devolucoes: {
        some: {
          recusadaEm: null,
          canceladaEm: null,
          OR: [{ lojaRecebeuEm: null }, { querTroca: true, semAPeca: false, trocaSaiuEm: null }],
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: SELECAO_DO_ENVIO,
  });
}

export async function caixaDaLoja(
  loja: Pick<LojaVista, "id" | "nome" | "cidade" | "entregaMedia">
): Promise<CaixaDoBalcao> {
  const [recentes, regra] = await Promise.all([lerEnvios({ lojaId: loja.id }), entregaEPagamentoDaLoja(loja.id)]);
  const envios = [...recentes, ...(await enviosComDevolucaoPendente(loja.id, recentes.map((e) => e.id)))];
  const ids = [...new Set(envios.map((e) => e.oficinaId))];
  const [oficinas, primeiros] = await Promise.all([oficinasDosEnvios(ids), primeirosPedidos(loja.id, ids)]);
  return {
    loja: { nome: loja.nome, cidade: loja.cidade, entregaMedia: loja.entregaMedia },
    envios: envios.map((e) => paraOBalcao(e, oficinas.get(e.oficinaId) ?? OFICINA_SEM_NOME, regra, primeiros)),
  };
}

export async function envioDaLoja(lojaId: string, envioId: string): Promise<EnvioNoBalcao | null> {
  const [[envio], regra] = await Promise.all([lerEnvios({ lojaId, id: envioId }), entregaEPagamentoDaLoja(lojaId)]);
  if (!envio) return null;
  const [oficinas, primeiros] = await Promise.all([
    oficinasDosEnvios([envio.oficinaId]),
    primeirosPedidos(lojaId, [envio.oficinaId]),
  ]);
  return paraOBalcao(envio, oficinas.get(envio.oficinaId) ?? OFICINA_SEM_NOME, regra, primeiros);
}

// ─── O que a loja grava ─────────────────────────────────────────────────────

export type ResultadoDoBalcao = "ok" | "nao-encontrado" | "travada" | "sem-pedido";

/**
 * Resposta da loja: as ofertas de cada peça (lista vazia = não tenho).
 *
 * Oferta que já existia (veio com o `id`) é atualizada no lugar — assim a escolha que a
 * oficina já fez nela continua valendo. A que sumiu da resposta é apagada, e a escolha
 * nela cai junto (a chave estrangeira zera). Se um preço de uma oferta escolhida mudou
 * (o à vista ou o do crédito), o preço de venda digitado pela oficina para aquela peça
 * deixa de valer.
 *
 * A taxa de entrega e o pagamento da loja (o "grátis acima de", o débito) ficam gravados
 * no envio: a regra pode mudar depois sem mexer no que a loja já mandou. Sem taxa na
 * resposta (o link antigo do balcão), vale a da regra para a cidade da oficina.
 */
export async function responderEnvio(
  lojaId: string,
  envioId: string,
  itens: Record<string, (OfertaNova & { id?: string | null })[]>,
  /** Quem respondeu, no painel com login; nulo no link antigo. */
  respondidoPor: string | null = null,
  taxaEntrega?: number | null
): Promise<ResultadoDoBalcao> {
  const regra = await entregaEPagamentoDaLoja(lojaId);
  return prisma.$transaction(async (tx) => {
    const envio = await tx.cotacaoLoja.findFirst({
      where: { id: envioId, lojaId },
      select: {
        id: true,
        oficinaId: true,
        ofertas: { select: { id: true, preco: true, precoCredito: true } },
        cotacao: { select: { orcamentoId: true, pedidoEm: true, pecas: { select: { id: true } } } },
      },
    });
    if (!envio) return "nao-encontrado";
    if (envio.cotacao.orcamentoId || envio.cotacao.pedidoEm) return "travada";

    const taxa =
      taxaEntrega ??
      taxaDaCidade(regra, (await oficinasDosEnvios([envio.oficinaId])).get(envio.oficinaId)?.cidade ?? null);

    const precoAntes = new Map(envio.ofertas.map((o) => [o.id, o]));
    const pecasDaCotacao = new Set(envio.cotacao.pecas.map((p) => p.id));
    const manter: string[] = [];
    const atualizar: { id: string; dados: OfertaNova }[] = [];
    const criar: { pecaId: string; dados: OfertaNova }[] = [];
    const precoMudou: string[] = [];

    for (const [pecaId, ofertas] of Object.entries(itens)) {
      if (!pecasDaCotacao.has(pecaId)) continue;
      for (const { id, ...dados } of ofertas) {
        const antes = id ? precoAntes.get(id) : undefined;
        if (id && antes && !manter.includes(id)) {
          manter.push(id);
          atualizar.push({ id, dados });
          if (antes.preco !== dados.preco || antes.precoCredito !== dados.precoCredito) precoMudou.push(id);
        } else {
          criar.push({ pecaId, dados });
        }
      }
    }

    // Os removidos saem antes de criar os novos — senão o `notIn` levaria junto quem
    // acabou de entrar.
    await tx.oferta.deleteMany({ where: { envioId: envio.id, id: { notIn: manter } } });
    for (const { id, dados } of atualizar) {
      await tx.oferta.update({ where: { id }, data: dados });
    }
    if (criar.length > 0) {
      await tx.oferta.createMany({
        data: criar.map(({ pecaId, dados }) => ({ oficinaId: envio.oficinaId, envioId: envio.id, pecaId, ...dados })),
      });
    }
    if (precoMudou.length > 0) {
      await tx.cotacaoPeca.updateMany({ where: { ofertaId: { in: precoMudou } }, data: { vendaUnit: null } });
    }
    await tx.cotacaoLoja.update({
      where: { id: envio.id },
      data: {
        respondidaEm: new Date(),
        respondidoPor,
        taxaEntrega: taxa,
        freteGratisAcima: regra.freteTipo === "GRATIS" ? null : regra.freteGratisAcima,
        debitoAVista: regra.debitoAVista,
      },
    });
    return "ok";
  });
}

/** Tipo da notificação "a loja entregou" — a confirmação da oficina dá ela por lida. */
export const TIPO_AVISO_ENTREGA = "PECA_PECA_ENTREGA";

/**
 * O balconista avança a entrega: recebido → separando → saiu com o motoboy → entregue.
 *
 * "Entregue" pela loja não fecha a entrega: avisa a oficina, no sino, para ela conferir
 * as peças e confirmar. Se a oficina já confirmou, a etapa já está em "entregue" e não
 * há mais o que avançar.
 */
export async function avancarEntrega(
  lojaId: string,
  envioId: string
): Promise<ResultadoDoBalcao | EtapaEntrega> {
  const envio = await prisma.cotacaoLoja.findFirst({
    where: { id: envioId, lojaId },
    select: {
      id: true,
      oficinaId: true,
      entrega: true,
      oficinaRecebeuEm: true,
      cotacao: { select: { id: true, numero: true } },
      loja: { select: { nome: true } },
    },
  });
  if (!envio) return "nao-encontrado";
  if (!ehEtapaEntrega(envio.entrega)) return "sem-pedido";
  const proxima = proximaEtapa(envio.entrega);
  if (!proxima) return envio.entrega;
  // A condição na etapa atual impede que dois cliques pulem uma etapa.
  const { count } = await prisma.cotacaoLoja.updateMany({
    where: { id: envio.id, entrega: envio.entrega },
    data: proxima === "ENTREGUE" ? { entrega: proxima, entregueEm: new Date() } : { entrega: proxima },
  });

  if (count > 0 && proxima === "ENTREGUE") {
    await medirEntregasDaLoja(lojaId).catch((err: unknown) =>
      console.error("Falha ao medir o tempo de entrega da loja:", err)
    );
  }

  if (count > 0 && proxima === "ENTREGUE" && !envio.oficinaRecebeuEm) {
    // Cliente cru, com o `oficinaId` do envio: a loja não está logada em oficina nenhuma.
    // O aviso não pode desfazer a etapa que já foi gravada.
    await prisma.notificacao
      .create({
        data: {
          oficinaId: envio.oficinaId,
          tipo: TIPO_AVISO_ENTREGA,
          publico: "TODOS",
          titulo: "Peças entregues pela loja",
          mensagem: `${envio.loja.nome} marcou como entregues as peças da cotação #${envio.cotacao.numero}. Confira e confirme o recebimento.`,
          link: `/peca-peca/${envio.cotacao.id}`,
        },
      })
      .catch((err: unknown) => console.error("Falha ao avisar a oficina da entrega:", err));
  }
  return proxima;
}

// ─── Devolução: o que a loja faz ────────────────────────────────────────────

/** Tipo da notificação de devolução — só nas novidades em que a oficina tem o que fazer. */
export const TIPO_AVISO_DEVOLUCAO = "PECA_PECA_DEVOLUCAO";

export type AcaoDaLojaNaDevolucao =
  | { acao: "aceitar"; trocaMarca?: string | null; trocaPreco?: number | null }
  | { acao: "sem-a-peca" }
  | { acao: "recusar"; motivoRecusa: string }
  | { acao: "saiu" }
  | { acao: "voltou"; valorDevolvido?: number | null };

/** "ok", "nao-encontrado", ou a explicação de por que a ação não vale agora (409). */
export type ResultadoDaDevolucao = "ok" | "nao-encontrado" | { recusa: string };

const MUDOU = { recusa: "Esta devolução mudou enquanto isso. Veja como ela está agora." };

/**
 * A loja responde à devolução, uma ação por vez, como os botões do balcão:
 *
 *   - aceitar: o motoboy busca a peça. Na troca, é "tenho, vou trocar", com a marca e
 *     o preço da peça nova quando mudam — se ficar mais cara, a oficina precisa topar;
 *   - sem-a-peca: aceita, mas não tem peça para trocar — vira devolução do dinheiro;
 *   - recusar: com o motivo, enquanto a peça não voltou para a loja;
 *   - saiu: a peça nova da troca saiu com o motoboy;
 *   - voltou: a peça devolvida chegou na loja, com o valor devolvido (sem troca).
 *
 * Toda gravação leva na condição o estado que a loja viu: dois cliques, ou a oficina
 * cancelando no mesmo instante, não passam por cima um do outro.
 */
export async function responderDevolucao(
  lojaId: string,
  envioId: string,
  devolucaoId: string,
  pedido: AcaoDaLojaNaDevolucao,
  /** Quem respondeu, no painel com login; nulo no link antigo. */
  respondidoPor: string | null = null
): Promise<ResultadoDaDevolucao> {
  const linha = await prisma.devolucao.findFirst({
    where: { id: devolucaoId, envioId, envio: { lojaId } },
    select: {
      ...CAMPOS_DA_DEVOLUCAO,
      oficinaId: true,
      peca: { select: { descricao: true } },
      envio: { select: { loja: { select: { nome: true } }, cotacao: { select: { id: true, numero: true } } } },
    },
  });
  if (!linha) return "nao-encontrado";
  const d = devolucaoVista(linha);
  const situacao = situacaoDaDevolucao(d);
  const agora = new Date();
  const aberta = { id: d.id, recusadaEm: null, canceladaEm: null };

  async function gravar(where: Prisma.DevolucaoWhereInput, data: Prisma.DevolucaoUpdateManyMutationInput) {
    const { count } = await prisma.devolucao.updateMany({ where: { ...aberta, ...where }, data: { ...data, respondidoPor } });
    return count > 0;
  }

  // Cliente cru, com o `oficinaId` da devolução: a loja não está logada em oficina
  // nenhuma. O aviso não pode desfazer o que já foi gravado.
  const peca = `${d.quantidade}× ${linha.peca.descricao}`;
  const avisar = (titulo: string, mensagem: string) =>
    prisma.notificacao
      .create({
        data: {
          oficinaId: linha.oficinaId,
          tipo: TIPO_AVISO_DEVOLUCAO,
          publico: "TODOS",
          titulo,
          mensagem: `${linha.envio.loja.nome}, cotação #${linha.envio.cotacao.numero}: ${mensagem}`,
          link: `/peca-peca/${linha.envio.cotacao.id}`,
        },
      })
      .catch((err: unknown) => console.error("Falha ao avisar a oficina da devolução:", err));

  switch (pedido.acao) {
    case "aceitar": {
      if (situacao !== "PEDIDA") return { recusa: "Esta devolução já foi respondida." };
      // Marca e preço só valem na troca; na devolução do dinheiro não há peça nova.
      const troca = d.querTroca
        ? { trocaMarca: pedido.trocaMarca?.trim() || null, trocaPreco: pedido.trocaPreco ?? null }
        : {};
      if (!(await gravar({ aceitaEm: null }, { aceitaEm: agora, ...troca }))) return MUDOU;
      const mais = d.querTroca ? diferencaDaTroca({ ...d, trocaPreco: troca.trocaPreco ?? null }) : 0;
      if (mais > 0) {
        await avisar(
          "A troca ficou mais cara",
          `a peça para trocar ${peca} custa ${formatCurrency(mais)} a mais. Diga se a loja pode mandar.`
        );
      }
      return "ok";
    }

    case "sem-a-peca": {
      if (situacao !== "PEDIDA") return { recusa: "Esta devolução já foi respondida." };
      if (!d.querTroca) return { recusa: "A oficina não pediu troca nesta devolução." };
      if (!(await gravar({ aceitaEm: null }, { aceitaEm: agora, semAPeca: true }))) return MUDOU;
      await avisar(
        "A loja não tem a peça para trocar",
        `aceitou a devolução de ${peca}, mas não tem outra para trocar. O valor volta para você; dá para cotar nas outras lojas.`
      );
      return "ok";
    }

    case "recusar": {
      if (situacao === "CONCLUIDA" || situacao === "RECUSADA" || situacao === "CANCELADA") {
        return { recusa: "Esta devolução já terminou." };
      }
      if (d.lojaRecebeuEm) return { recusa: "A peça já voltou para a loja." };
      if (d.trocaSaiuEm) return { recusa: "A peça da troca já saiu com o motoboy." };
      const motivoRecusa = pedido.motivoRecusa.trim();
      if (!(await gravar({ lojaRecebeuEm: null, trocaSaiuEm: null }, { recusadaEm: agora, motivoRecusa }))) return MUDOU;
      await avisar("Devolução recusada", `a loja recusou a devolução de ${peca}: ${motivoRecusa}`);
      return "ok";
    }

    case "saiu": {
      if (!ehTroca(d)) return { recusa: "Esta devolução não tem troca." };
      if (situacao === "PRECO_NOVO") return { recusa: "A oficina ainda vai dizer se topa o preço novo." };
      if (situacao !== "ACEITA" || d.trocaSaiuEm) return { recusa: "A peça da troca já saiu." };
      if (!(await gravar({ aceitaEm: { not: null }, trocaSaiuEm: null }, { trocaSaiuEm: agora }))) return MUDOU;
      await avisar("A peça da troca saiu", `a peça nova (${peca}) saiu com o motoboy. Confirme quando ela chegar.`);
      return "ok";
    }

    case "voltou": {
      if (situacao === "PEDIDA") return { recusa: "Aceite a devolução antes." };
      if (situacao === "PRECO_NOVO") return { recusa: "A oficina ainda vai dizer se topa o preço novo." };
      if (situacao !== "ACEITA" && situacao !== "TROCA_A_CAMINHO") return { recusa: "Esta devolução já terminou." };
      if (d.lojaRecebeuEm) return { recusa: "A peça já voltou para a loja." };
      // Na troca não volta dinheiro: a peça nova vai no lugar (a diferença se acerta na entrega).
      let valorDevolvido: number | null = null;
      if (!ehTroca(d)) {
        valorDevolvido = pedido.valorDevolvido ?? d.valor;
        if (valorDevolvido > d.valor) {
          return { recusa: `O valor devolvido não pode passar de ${formatCurrency(d.valor)}.` };
        }
      }
      if (!(await gravar({ aceitaEm: { not: null }, lojaRecebeuEm: null }, { lojaRecebeuEm: agora, valorDevolvido }))) {
        return MUDOU;
      }
      return "ok";
    }
  }
}

// ─── Tempo de entrega ───────────────────────────────────────────────────────
//
// Medido, não digitado: do pedido (`Cotacao.pedidoEm`) até as peças chegarem
// (`CotacaoLoja.entregueEm` — o primeiro entre a loja marcar "entregue" e a oficina
// confirmar). Vale a mediana das últimas entregas, e não a média simples: uma entrega
// esquecida aberta até o dia seguinte não desfigura o tempo da loja. Fica gravado na
// loja, refeito a cada entrega — as telas da oficina leem a toda hora.

/** Quantas entregas, das mais recentes para trás, entram no tempo da loja. */
const ENTREGAS_NA_CONTA = 20;

/** O valor do meio (com quantidade par, o de cima). Lista vazia não tem. */
function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.floor(ordenados.length / 2)];
}

/** Refaz o tempo de entrega da loja. Chamado quando uma entrega dela fecha. */
export async function medirEntregasDaLoja(lojaId: string) {
  const entregas = await prisma.cotacaoLoja.findMany({
    where: { lojaId, entregueEm: { not: null }, cotacao: { pedidoEm: { not: null } } },
    orderBy: { entregueEm: "desc" },
    take: ENTREGAS_NA_CONTA,
    select: { entregueEm: true, cotacao: { select: { pedidoEm: true } } },
  });
  const minutos = entregas.flatMap(({ entregueEm, cotacao }) =>
    entregueEm && cotacao.pedidoEm ? [Math.max(0, (entregueEm.getTime() - cotacao.pedidoEm.getTime()) / 60000)] : []
  );
  const meio = minutos.length >= ENTREGAS_PARA_MEDIA ? mediana(minutos) : null;
  await prisma.loja.update({
    where: { id: lojaId },
    data: { entregasMedidas: minutos.length, entregaMedia: meio === null ? null : Math.max(1, Math.round(meio)) },
  });
}

// ─── Resultados da loja ─────────────────────────────────────────────────────
//
// O que o dono da autopeça vê do próprio balcão: quanto vendeu, o que aconteceu com
// cada cotação, se responder rápido faz diferença, a que horas o movimento aperta,
// que peças saem e quais pediram e a loja não tinha, os melhores clientes e a equipe.
// Tudo a partir dos envios para esta loja: as ofertas e os pedidos são dela. Da outra
// loja sai só o que o balcão já mostra — "fechou com outra loja" —, nunca preço, marca
// ou nome dela.
//
// As datas são as de São Paulo: o servidor roda em UTC, e a cotação das 22h de segunda
// não pode cair na terça (nem no mês seguinte, no último dia).

export const PERIODOS_DOS_RESULTADOS = [7, 30, 90] as const;
export type PeriodoDosResultados = (typeof PERIODOS_DOS_RESULTADOS)[number];

const MESES_DO_RESUMO = 6;
const DIA_MS = 24 * 60 * 60 * 1000;
const FUSO = "America/Sao_Paulo";

/** "2026-11-11", no dia de São Paulo. */
const formatoDoDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });
const formatoDaHora = new Intl.DateTimeFormat("en-US", { timeZone: FUSO, weekday: "short", hour: "2-digit", hourCycle: "h23" });
const DIAS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const diaEmSP = (d: Date) => formatoDoDia.format(d);

/** Dia da semana (0 = domingo) e hora, em São Paulo. */
function semanaEHora(d: Date): [number, number] {
  const partes = formatoDaHora.formatToParts(d);
  const semana = DIAS_EN.indexOf(partes.find((p) => p.type === "weekday")?.value ?? "");
  const hora = Number(partes.find((p) => p.type === "hour")?.value ?? 0) % 24;
  return [Math.max(0, semana), hora];
}

/** Pastilha de freio, "pastilha  de Freio" e "Pastilha de freio" são a mesma peça. */
function chaveDoTexto(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export type MesDoResumo = {
  /** "2026-10" */
  mes: string;
  recebidas: number;
  respondidas: number;
  pedidos: number;
  /** Peças pedidas à loja (preço da loja × quantidade), já sem o que foi devolvido. */
  valor: number;
  /** O que a loja devolveu ou abateu nas devoluções que fecharam no mês. */
  devolvido: number;
};

/**
 * O fim de cada cotação, do ponto de vista da loja — o mesmo critério do balcão
 * (`paraOBalcao`): vendeu, a oficina ainda decide, ficou sem resposta, ou a oficina
 * fechou com outra loja.
 */
export type DesfechoDoEnvio = "VENDIDA" | "ABERTA" | "SEM_RESPOSTA" | "OUTRA_LOJA";

export type NumerosDoPeriodo = {
  recebidas: number;
  respondidas: number;
  /** Cotações em que a oficina fechou alguma peça com a loja. */
  vendidas: number;
  /** Disputas que já se decidiram: vendidas mais as que foram para outra loja. */
  decididas: number;
  /** Peças pedidas à loja (preço dela × quantidade), já sem o que foi devolvido. */
  valor: number;
  /** Mediana, em minutos, entre a cotação chegar e a loja responder. */
  minutosParaResponder: number | null;
};

export type FaixaDeRapidez = { faixa: string; decididas: number; vendidas: number };

export type ResultadosDaLoja = {
  dias: PeriodoDosResultados;
  agora: NumerosDoPeriodo;
  /** O período de mesmo tamanho logo antes, para comparar. */
  antes: NumerosDoPeriodo;
  desfechos: Record<DesfechoDoEnvio, number>;
  /** Vendas por dia (por semana, no período de 90 dias), da mais antiga à de hoje. */
  serie: { inicio: string; fim: string; valor: number; vendidas: number }[];
  /** Quanto a loja ganha das disputas, conforme a rapidez da resposta. */
  porRapidez: FaixaDeRapidez[];
  /** Cotações recebidas: [dia da semana, 0 = domingo][hora, 0–23]. */
  horarios: number[][];
  maisVendidas: { descricao: string; quantidade: number; valor: number }[];
  /** Peças que a loja ofereceu e a oficina comprou em outra loja. */
  perdidas: { descricao: string; vezes: number }[];
  /** Peças que pediram e a loja respondeu sem oferta. */
  naoTinha: { descricao: string; vezes: number }[];
  marcas: { marca: string; quantidade: number; valor: number }[];
  clientes: { oficina: string; recebidas: number; vendidas: number; valor: number }[];
  equipe: { nome: string; respostas: number; minutosParaResponder: number | null; vendidas: number; valor: number }[];
  /** Do pedido até as peças chegarem, nas entregas do período. */
  entrega: { minutos: number | null; entregas: number };
  devolucoes: { pedidas: number; porMotivo: Record<MotivoDevolucao, number>; devolvido: number };
  meses: MesDoResumo[];
};

export function ehPeriodoDosResultados(n: number): n is PeriodoDosResultados {
  return (PERIODOS_DOS_RESULTADOS as readonly number[]).includes(n);
}

const FAIXAS_DE_RAPIDEZ = [
  { faixa: "Até 5 min", ate: 5 },
  { faixa: "5 a 15 min", ate: 15 },
  { faixa: "15 min a 1 h", ate: 60 },
  { faixa: "Mais de 1 h", ate: Infinity },
] as const;

type Acumulador = { recebidas: number; respondidas: number; vendidas: number; decididas: number; valor: number; tempos: number[] };
const acumulador = (): Acumulador => ({ recebidas: 0, respondidas: 0, vendidas: 0, decididas: 0, valor: 0, tempos: [] });

function fechar(a: Acumulador, devolvido: number): NumerosDoPeriodo {
  const meio = mediana(a.tempos);
  return {
    recebidas: a.recebidas,
    respondidas: a.respondidas,
    vendidas: a.vendidas,
    decididas: a.decididas,
    valor: a.valor - devolvido,
    minutosParaResponder: meio === null ? null : Math.round(meio),
  };
}

/** Soma num grupo pelo texto normalizado, guardando o primeiro jeito em que foi escrito. */
function somarNoGrupo(grupos: Map<string, { rotulo: string; n: number; valor: number }>, texto: string, n: number, valor = 0) {
  const chave = chaveDoTexto(texto);
  if (!chave) return;
  const g = grupos.get(chave) ?? { rotulo: texto.trim(), n: 0, valor: 0 };
  g.n += n;
  g.valor += valor;
  grupos.set(chave, g);
}

const LIMITE_DAS_LISTAS = 6;

export async function resultadosDaLoja(lojaId: string, dias: PeriodoDosResultados = 30): Promise<ResultadosDaLoja> {
  const agora = new Date();

  // Os dias do período (0 = hoje) e os do período anterior, como chaves de São Paulo.
  const indiceDoDia = new Map<string, number>();
  for (let i = 0; i < dias * 2; i++) indiceDoDia.set(diaEmSP(new Date(agora.getTime() - i * DIA_MS)), i);
  const periodo = (d: Date): "agora" | "antes" | null => {
    const i = indiceDoDia.get(diaEmSP(d));
    return i === undefined ? null : i < dias ? "agora" : "antes";
  };

  // Mês a mês: os últimos seis, também no calendário de São Paulo.
  const [anoHoje, mesHoje] = diaEmSP(agora).split("-").map(Number);
  const meses = new Map<string, MesDoResumo>();
  for (let i = MESES_DO_RESUMO - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(anoHoje, mesHoje - 1 - i, 1));
    const mes = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    meses.set(mes, { mes, recebidas: 0, respondidas: 0, pedidos: 0, valor: 0, devolvido: 0 });
  }
  const mesDe = (d: Date) => meses.get(diaEmSP(d).slice(0, 7));

  const desde = new Date(
    Math.min(agora.getTime() - (dias * 2 + 1) * DIA_MS, Date.UTC(anoHoje, mesHoje - MESES_DO_RESUMO, 1))
  );

  const [envios, pessoas, devolucoes] = await Promise.all([
    prisma.cotacaoLoja.findMany({
      where: { lojaId, createdAt: { gte: desde } },
      select: {
        oficinaId: true,
        createdAt: true,
        respondidaEm: true,
        entrega: true,
        entregueEm: true,
        respondidoPor: true,
        formaPagamento: true,
        debitoAVista: true,
        ofertas: { select: { id: true, pecaId: true, marca: true, preco: true, precoCredito: true } },
        cotacao: {
          select: {
            pedidoEm: true,
            orcamentoId: true,
            pecas: { select: { id: true, descricao: true, quantidade: true, ofertaId: true } },
          },
        },
      },
    }),
    prisma.usuarioLoja.findMany({ where: { lojaId }, select: { id: true, nome: true } }),
    prisma.devolucao.findMany({
      where: {
        envio: { lojaId },
        canceladaEm: null,
        OR: [{ createdAt: { gte: desde } }, { lojaRecebeuEm: { gte: desde } }],
      },
      select: { createdAt: true, motivo: true, lojaRecebeuEm: true, valorDevolvido: true },
    }),
  ]);

  // A série: um ponto por dia, ou por semana nos 90 dias. O índice 0 é o mais antigo.
  const passo = dias > 30 ? 7 : 1;
  const pontos = Math.ceil(dias / passo);
  const serie = Array.from({ length: pontos }, (_, k) => {
    const maisNovo = (pontos - 1 - k) * passo;
    const maisVelho = Math.min(dias - 1, maisNovo + passo - 1);
    return {
      inicio: diaEmSP(new Date(agora.getTime() - maisVelho * DIA_MS)),
      fim: diaEmSP(new Date(agora.getTime() - maisNovo * DIA_MS)),
      valor: 0,
      vendidas: 0,
    };
  });
  const pontoDe = (d: Date) => {
    const i = indiceDoDia.get(diaEmSP(d));
    return i === undefined || i >= dias ? null : serie[pontos - 1 - Math.floor(i / passo)];
  };

  const totais = { agora: acumulador(), antes: acumulador() };
  const desfechos: Record<DesfechoDoEnvio, number> = { VENDIDA: 0, ABERTA: 0, SEM_RESPOSTA: 0, OUTRA_LOJA: 0 };
  const porRapidez: FaixaDeRapidez[] = FAIXAS_DE_RAPIDEZ.map((f) => ({ faixa: f.faixa, decididas: 0, vendidas: 0 }));
  const horarios = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  const vendidasPorPeca = new Map<string, { rotulo: string; n: number; valor: number }>();
  const perdidasPorPeca = new Map<string, { rotulo: string; n: number; valor: number }>();
  const faltouPorPeca = new Map<string, { rotulo: string; n: number; valor: number }>();
  const porMarca = new Map<string, { rotulo: string; n: number; valor: number }>();
  const porOficina = new Map<string, { recebidas: number; vendidas: number; valor: number }>();
  const porPessoa = new Map<string, { respostas: number; tempos: number[]; vendidas: number; valor: number }>();
  const temposDeEntrega: number[] = [];
  const nomesDePessoa = new Map(pessoas.map((p) => [p.id, p.nome]));

  for (const e of envios) {
    const c = e.cotacao;
    // O valor de venda é o que a oficina pagou: o preço da forma do pedido (o do crédito,
    // quando ela pagou no cartão). Sem pedido, a forma não importa — não há valor.
    const forma = ehFormaDePagamento(e.formaPagamento) ? e.formaPagamento : "PIX";
    const minhas = new Map(
      e.ofertas.map((o) => [o.id, { ...o, preco: precoNaForma(o, forma, e.debitoAVista) }])
    );
    const ofereci = new Set(e.ofertas.map((o) => o.pecaId));
    const comigo = c.pecas.flatMap((p) => {
      const oferta = p.ofertaId ? minhas.get(p.ofertaId) : undefined;
      return oferta ? [{ peca: p, oferta }] : [];
    });

    const desfecho: DesfechoDoEnvio = e.entrega
      ? "VENDIDA"
      : !e.respondidaEm
        ? "SEM_RESPOSTA"
        : c.pedidoEm || (c.orcamentoId && comigo.length === 0)
          ? "OUTRA_LOJA"
          : "ABERTA";
    const valor = e.entrega ? comigo.reduce((s, { peca, oferta }) => s + oferta.preco * peca.quantidade, 0) : 0;
    const minutos = e.respondidaEm ? Math.max(0, (e.respondidaEm.getTime() - e.createdAt.getTime()) / 60000) : null;

    const mes = mesDe(e.createdAt);
    if (mes) {
      mes.recebidas += 1;
      if (e.respondidaEm) mes.respondidas += 1;
      if (e.entrega) mes.pedidos += 1;
      mes.valor += valor;
    }

    const qual = periodo(e.createdAt);
    if (!qual) continue;
    const t = totais[qual];
    t.recebidas += 1;
    if (minutos !== null) {
      t.respondidas += 1;
      t.tempos.push(minutos);
    }
    if (desfecho === "VENDIDA") t.vendidas += 1;
    if (desfecho === "VENDIDA" || desfecho === "OUTRA_LOJA") t.decididas += 1;
    t.valor += valor;
    if (qual === "antes") continue;

    // Daqui para baixo, só o período escolhido.
    desfechos[desfecho] += 1;
    const [semana, hora] = semanaEHora(e.createdAt);
    horarios[semana][hora] += 1;

    const ponto = pontoDe(e.createdAt);
    if (ponto && desfecho === "VENDIDA") {
      ponto.valor += valor;
      ponto.vendidas += 1;
    }

    if (minutos !== null && (desfecho === "VENDIDA" || desfecho === "OUTRA_LOJA")) {
      const f = porRapidez[FAIXAS_DE_RAPIDEZ.findIndex((x) => minutos <= x.ate)];
      f.decididas += 1;
      if (desfecho === "VENDIDA") f.vendidas += 1;
    }

    for (const { peca, oferta } of desfecho === "VENDIDA" ? comigo : []) {
      somarNoGrupo(vendidasPorPeca, peca.descricao, peca.quantidade, oferta.preco * peca.quantidade);
      somarNoGrupo(porMarca, oferta.marca.toUpperCase(), peca.quantidade, oferta.preco * peca.quantidade);
    }
    for (const p of c.pecas) {
      if (e.respondidaEm && !ofereci.has(p.id)) somarNoGrupo(faltouPorPeca, p.descricao, 1);
      // Perdida: a loja ofereceu, a oficina escolheu, e não foi a desta loja.
      const decidiu = desfecho === "VENDIDA" || desfecho === "OUTRA_LOJA";
      if (decidiu && ofereci.has(p.id) && p.ofertaId && !minhas.has(p.ofertaId)) somarNoGrupo(perdidasPorPeca, p.descricao, 1);
    }

    const oficina = porOficina.get(e.oficinaId) ?? { recebidas: 0, vendidas: 0, valor: 0 };
    oficina.recebidas += 1;
    if (desfecho === "VENDIDA") oficina.vendidas += 1;
    oficina.valor += valor;
    porOficina.set(e.oficinaId, oficina);

    if (e.respondidoPor && minutos !== null) {
      // Conta que já não existe vira uma linha só ("Alguém da loja"), não uma por id.
      const quem = nomesDePessoa.has(e.respondidoPor) ? e.respondidoPor : "";
      const pessoa = porPessoa.get(quem) ?? { respostas: 0, tempos: [], vendidas: 0, valor: 0 };
      pessoa.respostas += 1;
      pessoa.tempos.push(minutos);
      if (desfecho === "VENDIDA") pessoa.vendidas += 1;
      pessoa.valor += valor;
      porPessoa.set(quem, pessoa);
    }

    if (e.entregueEm && c.pedidoEm) temposDeEntrega.push(Math.max(0, (e.entregueEm.getTime() - c.pedidoEm.getTime()) / 60000));
  }

  // O dinheiro devolvido sai do período (e do mês) em que a peça voltou; a contagem é
  // de quando a devolução foi pedida. Na troca não volta dinheiro (`valorDevolvido` nulo).
  const porMotivo: Record<MotivoDevolucao, number> = { DEFEITO: 0, ERRADA: 0, NAO_USADA: 0 };
  const devolvido = { agora: 0, antes: 0 };
  for (const d of devolucoes) {
    if (periodo(d.createdAt) === "agora" && ehMotivoDevolucao(d.motivo)) porMotivo[d.motivo] += 1;
    if (!d.lojaRecebeuEm || !d.valorDevolvido) continue;
    const mes = mesDe(d.lojaRecebeuEm);
    if (mes) {
      mes.devolvido += d.valorDevolvido;
      mes.valor -= d.valorDevolvido;
    }
    const qual = periodo(d.lojaRecebeuEm);
    if (qual) devolvido[qual] += d.valorDevolvido;
  }

  const maiores = <T extends { rotulo: string; n: number; valor: number }>(grupos: Map<string, T>, porValor: boolean) =>
    [...grupos.values()]
      .sort((a, b) => (porValor ? b.valor - a.valor || b.n - a.n : b.n - a.n))
      .slice(0, LIMITE_DAS_LISTAS);

  const melhoresOficinas = [...porOficina.entries()]
    .sort(([, a], [, b]) => b.valor - a.valor || b.vendidas - a.vendidas || b.recebidas - a.recebidas)
    .slice(0, 5);
  const nomesDeOficina = await nomesDasOficinas(melhoresOficinas.map(([id]) => id));
  const meioDaEntrega = mediana(temposDeEntrega);

  return {
    dias,
    agora: fechar(totais.agora, devolvido.agora),
    antes: fechar(totais.antes, devolvido.antes),
    desfechos,
    serie,
    porRapidez,
    horarios,
    maisVendidas: maiores(vendidasPorPeca, true).map((g) => ({ descricao: g.rotulo, quantidade: g.n, valor: g.valor })),
    perdidas: maiores(perdidasPorPeca, false).map((g) => ({ descricao: g.rotulo, vezes: g.n })),
    naoTinha: maiores(faltouPorPeca, false).map((g) => ({ descricao: g.rotulo, vezes: g.n })),
    marcas: maiores(porMarca, true).map((g) => ({ marca: g.rotulo, quantidade: g.n, valor: g.valor })),
    clientes: melhoresOficinas.map(([id, o]) => ({ oficina: nomesDeOficina.get(id) ?? "Oficina", ...o })),
    equipe: [...porPessoa.entries()]
      .map(([id, p]) => {
        const meio = mediana(p.tempos);
        return {
          nome: nomesDePessoa.get(id) ?? "Alguém da loja",
          respostas: p.respostas,
          minutosParaResponder: meio === null ? null : Math.round(meio),
          vendidas: p.vendidas,
          valor: p.valor,
        };
      })
      .sort((a, b) => b.respostas - a.respostas),
    entrega: { minutos: meioDaEntrega === null ? null : Math.max(1, Math.round(meioDaEntrega)), entregas: temposDeEntrega.length },
    devolucoes: {
      pedidas: porMotivo.DEFEITO + porMotivo.ERRADA + porMotivo.NAO_USADA,
      porMotivo,
      devolvido: devolvido.agora,
    },
    meses: [...meses.values()],
  };
}
