// Conversa do Peça Peça — a oficina e uma loja falando sobre UMA cotação (o envio).
//
// Serve para tirar dúvida da aplicação antes de a loja responder, confirmar a peça e
// combinar a entrega: é o que evita a peça errada e a devolução. Não é guardada: as
// mensagens são apagadas quando a entrega fecha (ou quando o pedido vai para outra
// loja), e número de telefone sai escondido do texto.
//
// Os dois lados passam pelas mesmas funções, cada um com o seu banco:
//
//   - a oficina, pelo `Db` (as três travas valem), achando o envio pela cotação dela;
//   - a loja, pelo cliente cru — como em lib/balcao.ts, e por isso este arquivo está na
//     lista curta de `scripts/checar-isolamento.mjs` —, achando o envio pelo `lojaId`
//     da sessão. Toda leitura parte do envio, e a mensagem que a loja grava leva o
//     `oficinaId` dele; o gatilho do banco recusa vínculo com outra oficina.
//
// Escala: a tela aberta pergunta "o que chegou depois de `seq`" a cada poucos
// segundos — uma leitura pelo índice (envioId, seq) que quase sempre volta vazia. Os
// contadores de não lidas ficam no próprio envio, então as caixas de entrada e o
// número no menu não leem mensagem nenhuma.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Db } from "@/lib/db-oficina";
import { nomesDasOficinas, todasAsLojas } from "@/lib/balcao";
import { avisarLoja, avisarOficina } from "@/lib/push";
import {
  MENSAGENS_POR_PAGINA,
  descricaoDoVeiculo,
  esconderTelefone,
  situacaoDaConversa,
  type ConversaNaLista,
  type ConversaVista,
  type LadoDaConversa,
  type MensagemVista,
} from "@/components/peca-peca/regras";

/** O que a conversa usa do banco — o cliente cru (loja) ou o da oficina. */
type Banco = Pick<Prisma.TransactionClient, "mensagem" | "cotacaoLoja">;

/** Como achar o envio: pela cotação da oficina, ou pela loja da sessão. */
type OndeEsta = { id: string; cotacaoId: string } | { id: string; lojaId: string };

const CAMPOS_DA_MENSAGEM = {
  id: true,
  seq: true,
  autor: true,
  autorNome: true,
  texto: true,
  createdAt: true,
} satisfies Prisma.MensagemSelect;

const CAMPOS_DO_ENVIO = {
  id: true,
  oficinaId: true,
  cotacaoId: true,
  lojaId: true,
  entrega: true,
  oficinaRecebeuEm: true,
  conversaFechadaEm: true,
  lidoOficinaAte: true,
  lidoLojaAte: true,
  cotacao: { select: { numero: true, pedidoEm: true, marca: true, modelo: true, ano: true } },
} satisfies Prisma.CotacaoLojaSelect;

type EnvioDaConversa = Prisma.CotacaoLojaGetPayload<{ select: typeof CAMPOS_DO_ENVIO }>;

function vista(m: Prisma.MensagemGetPayload<{ select: typeof CAMPOS_DA_MENSAGEM }>): MensagemVista {
  return {
    id: m.id,
    seq: m.seq,
    autor: m.autor === "LOJA" ? "LOJA" : "OFICINA",
    autorNome: m.autorNome,
    texto: m.texto,
    em: m.createdAt.toISOString(),
  };
}

const outroLado = (lado: LadoDaConversa): LadoDaConversa => (lado === "OFICINA" ? "LOJA" : "OFICINA");

function situacao(envio: EnvioDaConversa) {
  return situacaoDaConversa({ ...envio, pedidoEm: envio.cotacao.pedidoEm });
}

function acharEnvio(banco: Banco, onde: OndeEsta) {
  return banco.cotacaoLoja.findFirst({ where: onde, select: CAMPOS_DO_ENVIO });
}

// ─── Ler ────────────────────────────────────────────────────────────────────

export type PaginaDaConversa = { depois?: number; antes?: number };

/**
 * As mensagens do envio. Com `depois`, só as que chegaram depois daquele `seq` (é o
 * que a tela aberta pede a toda hora); com `antes`, a página anterior à mais antiga que
 * a tela tem; sem nada, as últimas. Envio que não é de quem pergunta: `null`.
 */
async function lerConversa(
  banco: Banco,
  onde: OndeEsta,
  lado: LadoDaConversa,
  pagina: PaginaDaConversa
): Promise<ConversaVista | null> {
  const envio = await acharEnvio(banco, onde);
  if (!envio) return null;
  const s = situacao(envio);
  const base = {
    lidoPeloOutroAte: lado === "OFICINA" ? envio.lidoLojaAte : envio.lidoOficinaAte,
    lidoPorMimAte: lado === "OFICINA" ? envio.lidoOficinaAte : envio.lidoLojaAte,
    aberta: s.aberta,
    motivoFechada: s.motivo,
  };

  if (pagina.depois !== undefined) {
    const novas = await banco.mensagem.findMany({
      where: { envioId: envio.id, seq: { gt: pagina.depois } },
      orderBy: { seq: "asc" },
      take: 200,
      select: CAMPOS_DA_MENSAGEM,
    });
    // As mais antigas não mudam com o que chegou agora: a tela guarda o que já sabia.
    return { ...base, mensagens: novas.map(vista), maisAntigas: false };
  }

  const lista = await banco.mensagem.findMany({
    where: { envioId: envio.id, ...(pagina.antes !== undefined ? { seq: { lt: pagina.antes } } : {}) },
    orderBy: { seq: "desc" },
    take: MENSAGENS_POR_PAGINA + 1,
    select: CAMPOS_DA_MENSAGEM,
  });
  return {
    ...base,
    mensagens: lista.slice(0, MENSAGENS_POR_PAGINA).reverse().map(vista),
    maisAntigas: lista.length > MENSAGENS_POR_PAGINA,
  };
}

// ─── Escrever ───────────────────────────────────────────────────────────────

export type MensagemNova = { texto: string; idCliente: string };
export type Autor = { id: string | null; nome: string };

export type ResultadoDoEnvio =
  | { ok: true; mensagem: MensagemVista; nova: boolean; envio: EnvioDaConversa }
  | { ok: false; status: 404 | 409; erro: string };

/**
 * Grava a mensagem e atualiza o resumo do envio na mesma transação: a última mensagem
 * (para as listas), +1 nas não lidas do outro lado e "li tudo" do meu — quem escreve
 * leu o que veio antes.
 *
 * O mesmo `idCliente` de novo (o aparelho reenviou com sinal ruim) devolve a mensagem
 * que já existe, sem duplicar.
 */
async function gravarMensagem(
  executar: <T>(fn: (banco: Banco) => Promise<T>) => Promise<T>,
  onde: OndeEsta,
  lado: LadoDaConversa,
  autor: Autor,
  nova: MensagemNova
): Promise<ResultadoDoEnvio> {
  return executar(async (banco): Promise<ResultadoDoEnvio> => {
    const envio = await acharEnvio(banco, onde);
    if (!envio) return { ok: false, status: 404, erro: "Cotação não encontrada" };

    const repetida = await banco.mensagem.findUnique({
      where: { envioId_idCliente: { envioId: envio.id, idCliente: nova.idCliente } },
      select: CAMPOS_DA_MENSAGEM,
    });
    if (repetida) return { ok: true, mensagem: vista(repetida), nova: false, envio };

    const s = situacao(envio);
    if (!s.aberta) return { ok: false, status: 409, erro: s.motivo };

    const texto = esconderTelefone(nova.texto.trim());
    const criada = await banco.mensagem.create({
      data: {
        // Explícito para a loja (cliente cru, sem oficina na transação); na oficina é o
        // mesmo valor do default, e o filtro do `Db` confere.
        oficinaId: envio.oficinaId,
        envioId: envio.id,
        autor: lado,
        autorId: autor.id,
        autorNome: autor.nome,
        texto,
        idCliente: nova.idCliente,
      },
      select: CAMPOS_DA_MENSAGEM,
    });

    await banco.cotacaoLoja.update({
      where: { id: envio.id },
      data: {
        ultimaMensagemEm: criada.createdAt,
        ultimaMensagem: texto.slice(0, 140),
        ultimaMensagemDe: lado,
        ...(lado === "OFICINA"
          ? { lidoOficinaAte: criada.seq, naoLidasOficina: 0, naoLidasLoja: { increment: 1 } }
          : { lidoLojaAte: criada.seq, naoLidasLoja: 0, naoLidasOficina: { increment: 1 } }),
      },
    });
    return { ok: true, mensagem: vista(criada), nova: true, envio };
  });
}

/**
 * Avisa o outro lado no celular, depois da resposta (`after` na rota). `nome` é como o
 * outro lado conhece quem escreveu: a loja, ou a oficina pelo nome do menu. Não lança —
 * o aviso não desfaz a mensagem gravada.
 */
export async function avisarOOutroLado(
  r: Extract<ResultadoDoEnvio, { ok: true }>,
  lado: LadoDaConversa,
  nome: string
) {
  if (!r.nova) return;
  const { envio, mensagem } = r;
  const corpo = mensagem.texto.length > 140 ? `${mensagem.texto.slice(0, 139)}…` : mensagem.texto;
  const tag = `conversa-${envio.id}`;
  try {
    if (lado === "LOJA") {
      await avisarOficina(envio.oficinaId, {
        titulo: `${nome} · cotação #${envio.cotacao.numero}`,
        corpo,
        link: `/peca-peca/${envio.cotacaoId}?conversa=${envio.id}`,
        tag,
      });
    } else {
      const carro = descricaoDoVeiculo({
        marca: envio.cotacao.marca ?? "",
        modelo: envio.cotacao.modelo,
        ano: envio.cotacao.ano ?? "",
      });
      await avisarLoja(envio.lojaId, { titulo: `${nome} · ${carro}`, corpo, link: `/loja/balcao/${envio.id}?conversa=1`, tag });
    }
  } catch (err) {
    console.error("Falha ao avisar o outro lado da conversa:", err);
  }
}

/** `?depois=` ou `?antes=` da URL da conversa, em número inteiro; o resto é ignorado. */
export function paginaDaUrl(request: Request): PaginaDaConversa {
  const busca = new URL(request.url).searchParams;
  const numero = (nome: string) => {
    const v = busca.get(nome);
    if (v === null || !/^\d{1,10}$/.test(v)) return undefined;
    return Number(v);
  };
  return { depois: numero("depois"), antes: numero("antes") };
}

/**
 * "Li até `ate`": o meu lado leu até aquela mensagem. As não lidas são recontadas a
 * partir dali — o que chegou do outro lado depois continua contando.
 *
 * Uma mensagem que chegue entre a contagem e a gravação pode ficar fora da conta; a
 * tela está aberta (é ela que marca), mostra a mensagem, e marca de novo em seguida.
 */
async function marcarLido(banco: Banco, onde: OndeEsta, lado: LadoDaConversa, ate: number): Promise<boolean> {
  const envio = await acharEnvio(banco, onde);
  if (!envio) return false;
  const jaLido = lado === "OFICINA" ? envio.lidoOficinaAte : envio.lidoLojaAte;
  if (ate <= jaLido) return true;

  // Não dá para marcar como lida mensagem que nem existe: o "visto" do outro lado mentiria.
  const { _max } = await banco.mensagem.aggregate({ where: { envioId: envio.id }, _max: { seq: true } });
  const limite = Math.min(ate, _max.seq ?? 0);
  if (limite <= jaLido) return true;

  const naoLidas = await banco.mensagem.count({
    where: { envioId: envio.id, autor: outroLado(lado), seq: { gt: limite } },
  });
  const mudanca: Prisma.CotacaoLojaUpdateManyArgs =
    lado === "OFICINA"
      ? { where: { id: envio.id, lidoOficinaAte: { lt: limite } }, data: { lidoOficinaAte: limite, naoLidasOficina: naoLidas } }
      : { where: { id: envio.id, lidoLojaAte: { lt: limite } }, data: { lidoLojaAte: limite, naoLidasLoja: naoLidas } };
  await banco.cotacaoLoja.updateMany(mudanca);
  return true;
}

// ─── Lado da oficina ────────────────────────────────────────────────────────
//
// O `Db` tem as mesmas operações do cliente cru, com o filtro e a RLS da oficina por
// baixo; o tipo dele é outro (é um cliente estendido), daí a conversão.

const comoBanco = (db: Db) => db as unknown as Banco;

export function conversaDaOficina(db: Db, cotacaoId: string, envioId: string, pagina: PaginaDaConversa) {
  return lerConversa(comoBanco(db), { id: envioId, cotacaoId }, "OFICINA", pagina);
}

export function mensagemDaOficina(
  transacao: <T>(fn: (tx: Db) => Promise<T>) => Promise<T>,
  cotacaoId: string,
  envioId: string,
  autor: Autor,
  nova: MensagemNova
) {
  return gravarMensagem((fn) => transacao((tx) => fn(comoBanco(tx))), { id: envioId, cotacaoId }, "OFICINA", autor, nova);
}

export function oficinaLeu(db: Db, cotacaoId: string, envioId: string, ate: number) {
  return marcarLido(comoBanco(db), { id: envioId, cotacaoId }, "OFICINA", ate);
}

/**
 * A conversa acaba: as mensagens são apagadas e o resumo zerado. Chamado na transação
 * de quem fecha — a oficina confirmando a entrega, ou o pedido indo para outras lojas.
 */
export async function fecharConversas(tx: Db, envioIds: string[]) {
  if (envioIds.length === 0) return;
  await tx.mensagem.deleteMany({ where: { envioId: { in: envioIds } } });
  await tx.cotacaoLoja.updateMany({
    where: { id: { in: envioIds } },
    data: {
      conversaFechadaEm: new Date(),
      ultimaMensagemEm: null,
      ultimaMensagem: null,
      ultimaMensagemDe: null,
      naoLidasOficina: 0,
      naoLidasLoja: 0,
    },
  });
}

/** As conversas da oficina, da mais recente para trás — a caixa "Conversas". */
export async function conversasDaOficina(db: Db): Promise<ConversaNaLista[]> {
  const [envios, lojas] = await Promise.all([
    db.cotacaoLoja.findMany({
      where: { ultimaMensagemEm: { not: null } },
      orderBy: { ultimaMensagemEm: "desc" },
      take: 50,
      select: {
        id: true,
        cotacaoId: true,
        lojaId: true,
        naoLidasOficina: true,
        ultimaMensagem: true,
        ultimaMensagemDe: true,
        ultimaMensagemEm: true,
        cotacao: { select: { numero: true, marca: true, modelo: true, ano: true } },
      },
    }),
    todasAsLojas(),
  ]);
  return envios.map((e) => {
    const carro = descricaoDoVeiculo({ marca: e.cotacao.marca ?? "", modelo: e.cotacao.modelo, ano: e.cotacao.ano ?? "" });
    return {
      envioId: e.id,
      link: `/peca-peca/${e.cotacaoId}?conversa=${e.id}`,
      titulo: lojas.get(e.lojaId)?.nome ?? "Loja",
      subtitulo: `Cotação #${e.cotacao.numero} · ${carro}`,
      ultima: e.ultimaMensagem,
      ultimaDe: e.ultimaMensagemDe === "LOJA" ? "LOJA" : "OFICINA",
      em: (e.ultimaMensagemEm ?? new Date()).toISOString(),
      naoLidas: e.naoLidasOficina,
      api: `/api/peca-peca/cotacoes/${e.cotacaoId}/conversa/${e.id}`,
      cotacao: { id: e.cotacaoId, numero: e.cotacao.numero, carro },
    };
  });
}

/** Quantas mensagens das lojas a oficina não leu — o número no menu. */
export async function naoLidasDaOficina(db: Db): Promise<number> {
  const { _sum } = await db.cotacaoLoja.aggregate({
    where: { naoLidasOficina: { gt: 0 } },
    _sum: { naoLidasOficina: true },
  });
  return _sum.naoLidasOficina ?? 0;
}

// ─── Lado da loja ───────────────────────────────────────────────────────────

const transacaoCrua = <T>(fn: (banco: Banco) => Promise<T>) => prisma.$transaction((tx) => fn(tx));

export function conversaDaLoja(lojaId: string, envioId: string, pagina: PaginaDaConversa) {
  return lerConversa(prisma, { id: envioId, lojaId }, "LOJA", pagina);
}

export function mensagemDaLoja(lojaId: string, envioId: string, autor: Autor, nova: MensagemNova) {
  return gravarMensagem(transacaoCrua, { id: envioId, lojaId }, "LOJA", autor, nova);
}

export function lojaLeu(lojaId: string, envioId: string, ate: number) {
  return marcarLido(prisma, { id: envioId, lojaId }, "LOJA", ate);
}

/**
 * As conversas da loja, da mais recente para trás. `telas` é o prefixo da tela de cada
 * cotação no balcão (o painel com login ou o link antigo).
 */
export async function conversasDaLoja(lojaId: string, telas: string): Promise<ConversaNaLista[]> {
  const envios = await prisma.cotacaoLoja.findMany({
    where: { lojaId, ultimaMensagemEm: { not: null } },
    orderBy: { ultimaMensagemEm: "desc" },
    take: 50,
    select: {
      id: true,
      oficinaId: true,
      naoLidasLoja: true,
      ultimaMensagem: true,
      ultimaMensagemDe: true,
      ultimaMensagemEm: true,
      cotacao: { select: { marca: true, modelo: true, ano: true, motor: true } },
    },
  });
  const nomes = await nomesDasOficinas([...new Set(envios.map((e) => e.oficinaId))]);
  return envios.map((e) => ({
    envioId: e.id,
    link: `${telas}/${e.id}?conversa=1`,
    titulo: nomes.get(e.oficinaId) ?? "Oficina",
    subtitulo: [
      descricaoDoVeiculo({ marca: e.cotacao.marca ?? "", modelo: e.cotacao.modelo, ano: e.cotacao.ano ?? "" }),
      e.cotacao.motor,
    ]
      .filter(Boolean)
      .join(" · "),
    ultima: e.ultimaMensagem,
    ultimaDe: e.ultimaMensagemDe === "LOJA" ? "LOJA" : "OFICINA",
    em: (e.ultimaMensagemEm ?? new Date()).toISOString(),
    naoLidas: e.naoLidasLoja,
  }));
}

/** Quantas mensagens das oficinas a loja não leu — o número no menu. */
export async function naoLidasDaLoja(lojaId: string): Promise<number> {
  const { _sum } = await prisma.cotacaoLoja.aggregate({
    where: { lojaId, naoLidasLoja: { gt: 0 } },
    _sum: { naoLidasLoja: true },
  });
  return _sum.naoLidasLoja ?? 0;
}

// ─── Faxina ─────────────────────────────────────────────────────────────────
//
// Conversa de cotação que ficou parada (o cliente nunca respondeu, a oficina desistiu
// sem excluir) não fecha pela entrega. Depois de 30 dias sem mensagem nova, o texto é
// apagado do mesmo jeito; a conversa continua aberta, vazia, se a cotação voltar a andar.
// Roda no máximo uma vez por hora, puxada por quem abre as conversas — sem job.

const DIAS_PARADA = 30;
const INTERVALO_FAXINA_MS = 60 * 60 * 1000;
let ultimaFaxina = 0;

export function faxinaDasConversas() {
  const agora = Date.now();
  if (agora - ultimaFaxina < INTERVALO_FAXINA_MS) return;
  ultimaFaxina = agora;
  const limite = new Date(agora - DIAS_PARADA * 24 * 60 * 60 * 1000);
  void (async () => {
    const paradas = await prisma.cotacaoLoja.findMany({
      where: { ultimaMensagemEm: { lt: limite } },
      select: { id: true },
      take: 500,
    });
    if (paradas.length === 0) return;
    const ids = paradas.map((p) => p.id);
    await prisma.$transaction([
      prisma.mensagem.deleteMany({ where: { envioId: { in: ids } } }),
      prisma.cotacaoLoja.updateMany({
        where: { id: { in: ids } },
        data: { ultimaMensagemEm: null, ultimaMensagem: null, ultimaMensagemDe: null, naoLidasOficina: 0, naoLidasLoja: 0 },
      }),
    ]);
  })().catch((err: unknown) => console.error("Falha na faxina das conversas:", err));
}
