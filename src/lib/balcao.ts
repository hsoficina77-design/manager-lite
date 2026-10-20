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
import {
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

/** As lojas da prévia, em Suzano. Viram cadastro de verdade quando o piloto começar. */
const LOJAS_DA_PREVIA = [
  { nome: "Yoshio", cidade: "Suzano", entregaMin: 30, entregaMax: 50 },
  { nome: "Bom Preço", cidade: "Suzano", entregaMin: 20, entregaMax: 40 },
];

function novoToken() {
  return randomBytes(24).toString("base64url");
}

/** Cria as lojas da prévia na primeira vez. A trava evita duas criações ao mesmo tempo. */
export async function garantirLojasDaPrevia() {
  if ((await prisma.loja.count()) > 0) return;
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(771977)`;
    if ((await tx.loja.count()) > 0) return;
    await tx.loja.createMany({ data: LOJAS_DA_PREVIA.map((l) => ({ ...l, tokenBalcao: novoToken() })) });
  });
}

const CAMPOS_DA_LOJA = { id: true, nome: true, cidade: true, entregaMin: true, entregaMax: true } as const;

export async function listarLojas(): Promise<LojaVista[]> {
  return prisma.loja.findMany({ where: { ativa: true }, orderBy: { createdAt: "asc" }, select: CAMPOS_DA_LOJA });
}

/** Com o link do balcão — só para a tela da prévia, que abre o balcão em outra aba. */
export async function lojasComLink(): Promise<LojaVista[]> {
  const lojas = await prisma.loja.findMany({
    where: { ativa: true },
    orderBy: { createdAt: "asc" },
    select: { ...CAMPOS_DA_LOJA, tokenBalcao: true },
  });
  return lojas.map(({ tokenBalcao, ...l }) => ({ ...l, link: `/balcao/${tokenBalcao}` }));
}

export async function lojaPeloToken(token: string | undefined | null) {
  // Token de verdade tem 32 caracteres; qualquer coisa muito diferente nem vai ao banco.
  if (!token || token.length < 16 || token.length > 64) return null;
  const loja = await prisma.loja.findUnique({
    where: { tokenBalcao: token },
    select: { ...CAMPOS_DA_LOJA, ativa: true },
  });
  return loja?.ativa ? loja : null;
}

// ─── Caixa de entrada ───────────────────────────────────────────────────────

const SELECAO_DO_ENVIO = {
  id: true,
  oficinaId: true,
  createdAt: true,
  respondidaEm: true,
  entrega: true,
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
    travada,
    veiculo: {
      placa: c.placa ?? "",
      marca: c.marca ?? "",
      modelo: c.modelo,
      ano: c.ano ?? "",
      motor: c.motor ?? "",
    },
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

export async function caixaDaLoja(loja: NonNullable<Awaited<ReturnType<typeof lojaPeloToken>>>): Promise<CaixaDoBalcao> {
  const envios = await lerEnvios({ lojaId: loja.id });
  const nomes = await nomesDasOficinas([...new Set(envios.map((e) => e.oficinaId))]);
  return {
    loja: { nome: loja.nome, cidade: loja.cidade, entregaMin: loja.entregaMin, entregaMax: loja.entregaMax },
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
  itens: Record<string, (OfertaNova & { id?: string | null })[]>
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
    await tx.cotacaoLoja.update({ where: { id: envio.id }, data: { respondidaEm: new Date() } });
    return "ok";
  });
}

/** O balconista avança a entrega: recebido → separando → saiu com o motoboy → entregue. */
export async function avancarEntrega(
  lojaId: string,
  envioId: string
): Promise<ResultadoDoBalcao | EtapaEntrega> {
  const envio = await prisma.cotacaoLoja.findFirst({ where: { id: envioId, lojaId }, select: { id: true, entrega: true } });
  if (!envio) return "nao-encontrado";
  if (!ehEtapaEntrega(envio.entrega)) return "sem-pedido";
  const proxima = proximaEtapa(envio.entrega);
  if (!proxima) return envio.entrega;
  // A condição na etapa atual impede que dois cliques pulem uma etapa.
  await prisma.cotacaoLoja.updateMany({ where: { id: envio.id, entrega: envio.entrega }, data: { entrega: proxima } });
  return proxima;
}
