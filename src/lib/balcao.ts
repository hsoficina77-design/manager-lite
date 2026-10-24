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

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { bancoDaOficina } from "@/lib/db-oficina";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";
import { ErroDeEntrada } from "@/lib/validacao";
import { mesmaCidade, rotuloDoMunicipio } from "@/lib/municipios";
import { municipioOficial } from "@/lib/municipios-servidor";
import {
  ENTREGAS_PARA_MEDIA,
  ehEtapaEntrega,
  proximaEtapa,
  type CaixaDoBalcao,
  type EnvioNoBalcao,
  type EtapaEntrega,
  type LojaVista,
  type OfertaNova,
  type SituacaoNoBalcao,
} from "@/components/peca-peca/regras";

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
  const [lojas, respondidas, pedidos] = await Promise.all([
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
  ]);
  const contar = (lista: { lojaId: string; _count: { _all: number } }[], id: string) =>
    lista.find((x) => x.lojaId === id)?._count._all ?? 0;

  return lojas.map(({ tokenBalcao, createdAt, _count, ...l }) => ({
    ...l,
    link: `/balcao/${tokenBalcao}`,
    contas: _count.usuarios,
    criadaEm: createdAt.toISOString(),
    cotacoes: _count.envios,
    respondidas: contar(respondidas, l.id),
    pedidos: contar(pedidos, l.id),
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
export async function atualizarLoja(id: string, dados: Partial<DadosDaLoja> & { ativa?: boolean }) {
  const atual = await prisma.loja.findUnique({ where: { id }, select: { cidade: true, uf: true, atende: true } });
  if (!atual) return null;
  const mexeNaCidade = dados.cidade !== undefined || dados.uf !== undefined || dados.atende !== undefined;
  return prisma.loja.update({
    where: { id },
    data: {
      ...dados,
      ...(mexeNaCidade
        ? conferirCidades(dados.cidade ?? atual.cidade ?? "", dados.uf ?? atual.uf ?? "", dados.atende ?? atual.atende)
        : {}),
    },
    select: { id: true },
  });
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

// ─── Caixa de entrada ───────────────────────────────────────────────────────

const SELECAO_DO_ENVIO = {
  id: true,
  oficinaId: true,
  createdAt: true,
  respondidaEm: true,
  entrega: true,
  oficinaRecebeuEm: true,
  ofertas: {
    orderBy: { createdAt: "asc" },
    select: { id: true, pecaId: true, marca: true, preco: true, prazoMin: true },
  },
  cotacao: {
    select: {
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

/** Nome da oficina, o mesmo que ela vê no menu. É tudo o que a loja sabe de quem pediu. */
async function nomesDasOficinas(ids: string[]) {
  const nomes = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => nomes.set(id, nomeDoMenu(await getConfiguracao(bancoDaOficina(id)))))
  );
  return nomes;
}

function paraOBalcao(e: EnvioDoBanco, oficina: string): EnvioNoBalcao {
  const c = e.cotacao;
  const minhas = new Map(e.ofertas.map((o) => [o.id, o]));
  const fechouComigo = c.pecas.some((p) => p.ofertaId && minhas.has(p.ofertaId));
  const travada = Boolean(c.orcamentoId || c.pedidoEm);

  let situacao: SituacaoNoBalcao;
  if (c.pedidoEm) situacao = e.entrega ? "PEDIDO" : "OUTRA_LOJA";
  else if (c.orcamentoId) situacao = !e.respondidaEm ? "ENCERRADA" : fechouComigo ? "COM_O_CLIENTE" : "OUTRA_LOJA";
  else situacao = e.respondidaEm ? "OFICINA_DECIDINDO" : "RESPONDER";

  return {
    id: e.id,
    oficina,
    recebidoEm: e.createdAt.toISOString(),
    respondidaEm: e.respondidaEm?.toISOString() ?? null,
    situacao,
    entrega: ehEtapaEntrega(e.entrega) ? e.entrega : null,
    oficinaRecebeuEm: e.oficinaRecebeuEm?.toISOString() ?? null,
    travada,
    veiculo: {
      placa: c.placa ?? "",
      marca: c.marca ?? "",
      modelo: c.modelo,
      ano: c.ano ?? "",
      motor: c.motor ?? "",
    },
    observacao: c.observacao ?? "",
    pecas: c.pecas.map((p) => ({
      id: p.id,
      descricao: p.descricao,
      quantidade: p.quantidade,
      ofertas: e.ofertas
        .filter((o) => o.pecaId === p.id)
        .map(({ id, marca, preco, prazoMin }) => ({ id, marca, preco, prazoMin })),
      pedida: c.pedidoEm && p.ofertaId ? (minhas.get(p.ofertaId)?.marca ?? null) : null,
    })),
  };
}

export async function caixaDaLoja(
  loja: Pick<LojaVista, "id" | "nome" | "cidade" | "entregaMedia">
): Promise<CaixaDoBalcao> {
  const envios = await lerEnvios({ lojaId: loja.id });
  const nomes = await nomesDasOficinas([...new Set(envios.map((e) => e.oficinaId))]);
  return {
    loja: { nome: loja.nome, cidade: loja.cidade, entregaMedia: loja.entregaMedia },
    envios: envios.map((e) => paraOBalcao(e, nomes.get(e.oficinaId) ?? "Oficina")),
  };
}

export async function envioDaLoja(lojaId: string, envioId: string): Promise<EnvioNoBalcao | null> {
  const [envio] = await lerEnvios({ lojaId, id: envioId });
  if (!envio) return null;
  const nomes = await nomesDasOficinas([envio.oficinaId]);
  return paraOBalcao(envio, nomes.get(envio.oficinaId) ?? "Oficina");
}

// ─── O que a loja grava ─────────────────────────────────────────────────────

export type ResultadoDoBalcao = "ok" | "nao-encontrado" | "travada" | "sem-pedido";

/**
 * Resposta da loja: as ofertas de cada peça (lista vazia = não tenho).
 *
 * Oferta que já existia (veio com o `id`) é atualizada no lugar — assim a escolha que a
 * oficina já fez nela continua valendo. A que sumiu da resposta é apagada, e a escolha
 * nela cai junto (a chave estrangeira zera). Se o preço de uma oferta escolhida mudou,
 * o preço de venda digitado pela oficina para aquela peça deixa de valer.
 */
export async function responderEnvio(
  lojaId: string,
  envioId: string,
  itens: Record<string, (OfertaNova & { id?: string | null })[]>,
  /** Quem respondeu, no painel com login; nulo no link antigo. */
  respondidoPor: string | null = null
): Promise<ResultadoDoBalcao> {
  return prisma.$transaction(async (tx) => {
    const envio = await tx.cotacaoLoja.findFirst({
      where: { id: envioId, lojaId },
      select: {
        id: true,
        oficinaId: true,
        ofertas: { select: { id: true, preco: true } },
        cotacao: { select: { orcamentoId: true, pedidoEm: true, pecas: { select: { id: true } } } },
      },
    });
    if (!envio) return "nao-encontrado";
    if (envio.cotacao.orcamentoId || envio.cotacao.pedidoEm) return "travada";

    const precoAntes = new Map(envio.ofertas.map((o) => [o.id, o.preco]));
    const pecasDaCotacao = new Set(envio.cotacao.pecas.map((p) => p.id));
    const manter: string[] = [];
    const atualizar: { id: string; dados: OfertaNova }[] = [];
    const criar: { pecaId: string; dados: OfertaNova }[] = [];
    const precoMudou: string[] = [];

    for (const [pecaId, ofertas] of Object.entries(itens)) {
      if (!pecasDaCotacao.has(pecaId)) continue;
      for (const { id, ...dados } of ofertas) {
        if (id && precoAntes.has(id) && !manter.includes(id)) {
          manter.push(id);
          atualizar.push({ id, dados });
          if (precoAntes.get(id) !== dados.preco) precoMudou.push(id);
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
    await tx.cotacaoLoja.update({ where: { id: envio.id }, data: { respondidaEm: new Date(), respondidoPor } });
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

// ─── Resumo da loja ─────────────────────────────────────────────────────────
//
// O que o dono da autopeça vê do próprio balcão: quantas cotações chegaram, quantas a
// loja respondeu e em quanto tempo, quantas viraram pedido e quanto valeram. Tudo a
// partir dos envios para esta loja — nada de outra loja nem de dentro da oficina.

const MESES_DO_RESUMO = 6;

export type MesDoResumo = {
  /** "2026-10" */
  mes: string;
  recebidas: number;
  respondidas: number;
  pedidos: number;
  /** Soma das peças pedidas à loja (preço da loja × quantidade). */
  valor: number;
};

export type ResumoDaLoja = {
  /** Últimos 30 dias. */
  recebidas: number;
  respondidas: number;
  pedidos: number;
  valor: number;
  /** Mediana, em minutos, entre a cotação chegar e a loja responder. */
  minutosParaResponder: number | null;
  meses: MesDoResumo[];
  /** Quem respondeu nos últimos 30 dias (no painel com login). */
  quemRespondeu: { nome: string; respostas: number }[];
};

export async function resumoDaLoja(lojaId: string): Promise<ResumoDaLoja> {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth() - (MESES_DO_RESUMO - 1), 1);
  const ha30dias = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [envios, pessoas] = await Promise.all([
    prisma.cotacaoLoja.findMany({
      where: { lojaId, createdAt: { gte: inicio } },
      select: {
        createdAt: true,
        respondidaEm: true,
        entrega: true,
        respondidoPor: true,
        ofertas: { select: { id: true, preco: true } },
        cotacao: { select: { pecas: { select: { ofertaId: true, quantidade: true } } } },
      },
    }),
    prisma.usuarioLoja.findMany({ where: { lojaId }, select: { id: true, nome: true } }),
  ]);

  const valorDoPedido = (e: (typeof envios)[number]) => {
    if (!e.entrega) return 0;
    const preco = new Map(e.ofertas.map((o) => [o.id, o.preco]));
    return e.cotacao.pecas.reduce((s, p) => s + (p.ofertaId ? (preco.get(p.ofertaId) ?? 0) * p.quantidade : 0), 0);
  };

  const meses = new Map<string, MesDoResumo>();
  for (let i = 0; i < MESES_DO_RESUMO; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.set(mes, { mes, recebidas: 0, respondidas: 0, pedidos: 0, valor: 0 });
  }

  let recebidas = 0;
  let respondidas = 0;
  let pedidos = 0;
  let valor = 0;
  const tempos: number[] = [];
  const respostasPorPessoa = new Map<string, number>();

  for (const e of envios) {
    const mes = meses.get(`${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, "0")}`);
    const v = valorDoPedido(e);
    if (mes) {
      mes.recebidas += 1;
      if (e.respondidaEm) mes.respondidas += 1;
      if (e.entrega) mes.pedidos += 1;
      mes.valor += v;
    }
    if (e.createdAt < ha30dias) continue;
    recebidas += 1;
    if (e.respondidaEm) {
      respondidas += 1;
      tempos.push((e.respondidaEm.getTime() - e.createdAt.getTime()) / 60000);
    }
    if (e.entrega) pedidos += 1;
    valor += v;
    if (e.respondidoPor) respostasPorPessoa.set(e.respondidoPor, (respostasPorPessoa.get(e.respondidoPor) ?? 0) + 1);
  }

  const nomes = new Map(pessoas.map((p) => [p.id, p.nome]));
  const meio = mediana(tempos);
  return {
    recebidas,
    respondidas,
    pedidos,
    valor,
    minutosParaResponder: meio === null ? null : Math.round(meio),
    meses: [...meses.values()],
    quemRespondeu: [...respostasPorPessoa.entries()]
      .map(([id, respostas]) => ({ nome: nomes.get(id) ?? "Alguém da loja", respostas }))
      .sort((a, b) => b.respostas - a.respostas),
  };
}
