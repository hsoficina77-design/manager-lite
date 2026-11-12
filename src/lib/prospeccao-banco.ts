// Prospecção: leitura e gravação do CRM do painel admin. As regras ficam em
// `prospeccao.ts` (puro); aqui só o banco.
//
// Usa o cliente Prisma cru: as tabelas do CRM são do sistema, como `Convite`, e não
// pertencem a oficina nenhuma. Da oficina só chega a casca, e por `listarOficinas`
// (sistema.ts): nome, situação, contagens. Por isso o arquivo está na lista curta de
// `scripts/checar-isolamento.mjs`.

import { prisma } from "@/lib/prisma";
import { listarOficinas } from "@/lib/sistema";
import {
  ligarContas,
  planejarImportacao,
  type ContaDoLead,
  type Cumprida,
  type DadosDoLead,
  type EtapaManual,
  type LeadExistente,
} from "@/lib/prospeccao";

/** Endereços que entram nas mensagens. */
export function urlsDoBoxOS() {
  const base = (process.env.APP_URL ?? "https://www.boxos.app.br").replace(/\/$/, "");
  return { teste: `${base}/teste`, assinatura: `${base}/assinatura` };
}

/** As contas do boxOS, já no formato que a ligação com o lead usa. */
async function contasDoBoxOS() {
  const oficinas = await listarOficinas();
  return oficinas
    .filter((o) => o.usaBoxOS)
    .map((o) => ({
      id: o.id,
      nome: o.nome,
      ativa: o.ativa,
      criadaEm: o.criadaEm,
      situacao: o.situacao,
      testeAte: o.testeAte,
      pagoAte: o.pagoAte,
      ordens: o.ordens,
      ordens30d: o.ordens30d,
      clientes: o.clientes,
      ultimoAcesso: o.ultimoAcesso,
      whatsapp: o.whatsapp,
      origem: o.origem,
    }));
}

/** Campos leves de cada lead: o que a lista, os filtros e as tarefas precisam. */
const CAMPOS_DA_LISTA = {
  id: true,
  loteId: true,
  publico: true,
  nome: true,
  categoria: true,
  telefone: true,
  tipoTelefone: true,
  temWhatsapp: true,
  bairro: true,
  cidade: true,
  uf: true,
  nota: true,
  avaliacoes: true,
  pctNegativas: true,
  sinaisDeDor: true,
  abreSeg: true,
  etapa: true,
  naoContatar: true,
  oficinaId: true,
  ultimoContato: true,
  createdAt: true,
} as const;

/**
 * Tudo o que as telas do CRM precisam de uma vez: os leads, a conta ligada a cada um e
 * as mensagens que já cumpriram uma regra (para as tarefas do dia).
 */
export async function carregarProspeccao() {
  const [leads, cumpridasLista, lotes, contas] = await Promise.all([
    prisma.lead.findMany({ select: CAMPOS_DA_LISTA, orderBy: { createdAt: "desc" } }),
    prisma.interacaoLead.findMany({
      where: { regra: { not: null }, tipo: { in: ["MENSAGEM", "PULOU"] } },
      select: { leadId: true, regra: true, tipo: true, createdAt: true },
    }),
    prisma.loteProspeccao.findMany({ orderBy: { createdAt: "desc" } }),
    contasDoBoxOS(),
  ]);

  const cumpridas = new Map<string, Cumprida[]>();
  for (const c of cumpridasLista) {
    const lista = cumpridas.get(c.leadId) ?? [];
    lista.push({ regra: c.regra!, createdAt: c.createdAt, tipo: c.tipo });
    cumpridas.set(c.leadId, lista);
  }

  return { leads, contas: ligarContas(leads, contas), cumpridas, lotes };
}

export type LeadDaLista = Awaited<ReturnType<typeof carregarProspeccao>>["leads"][number];

/** A ficha completa de um lead, com o histórico e a conta ligada. `null` se não existe. */
export async function fichaDoLead(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      lote: { select: { nome: true, createdAt: true } },
      interacoes: { orderBy: { createdAt: "desc" }, take: 200 },
    },
  });
  if (!lead) return null;
  const contas = await contasDoBoxOS();
  const conta: ContaDoLead | null = ligarContas([lead], contas).get(lead.id) ?? null;
  const cumpridas: Cumprida[] = lead.interacoes
    .filter((i) => i.regra && (i.tipo === "MENSAGEM" || i.tipo === "PULOU"))
    .map((i) => ({ regra: i.regra!, createdAt: i.createdAt, tipo: i.tipo }));
  // Para ligar à mão: as contas em teste ou vencidas, que é onde um lead novo cai.
  const paraVincular = contas
    .filter((o) => o.situacao === "TESTE" || o.situacao === "SOMENTE_LEITURA" || o.id === lead.oficinaId)
    .map((o) => ({ id: o.id, nome: o.nome }));
  return { lead, conta, cumpridas, paraVincular };
}

// ─── Importação ──────────────────────────────────────────────────────────────

type Escolha = { excluir: string[]; incluir: string[] };

async function planoContraOBanco(linhas: Record<string, string>[], escolha?: Escolha) {
  const [existentes, contas] = await Promise.all([
    prisma.lead.findMany({
      select: {
        id: true, naoContatar: true, placeId: true, publico: true, nome: true, categoria: true, telefone: true,
        tipoTelefone: true, email: true, site: true, instagram: true, facebook: true, rua: true, bairro: true,
        cidade: true, cep: true, uf: true, latitude: true, longitude: true, linkMaps: true, nota: true,
        avaliacoes: true, pctNegativas: true, horario: true, abreSeg: true, sinaisDeDor: true,
        avaliacoesRuins: true, fotoUrl: true,
      },
    }),
    contasDoBoxOS(),
  ]);
  const whatsapps = new Set(contas.map((c) => c.whatsapp).filter((w): w is string => !!w));
  return planejarImportacao(linhas, existentes as LeadExistente[], whatsapps, escolha);
}

/** Prévia: o que a importação faria, sem gravar nada. */
export async function previaDaImportacao(linhas: Record<string, string>[], escolha?: Escolha) {
  const plano = await planoContraOBanco(linhas, escolha);
  return { linhas: plano.linhas, categorias: plano.categorias, resumo: plano.resumo, exemplosDescartados: plano.exemplosDescartados };
}

/**
 * Grava a importação: refaz o plano agora (o banco pode ter mudado desde a prévia), cria
 * o lote, os leads novos e as atualizações — tudo ou nada.
 */
export async function gravarImportacao(
  linhas: Record<string, string>[],
  escolha: Escolha,
  lote: { nome: string; arquivo: string | null },
  criadoPor: string
) {
  const plano = await planoContraOBanco(linhas, escolha);
  const descartados = plano.linhas - plano.novos.length - plano.resumo.jaExistiam;

  const criado = await prisma.$transaction(
    async (tx) => {
      const novoLote = await tx.loteProspeccao.create({
        data: {
          nome: lote.nome,
          arquivo: lote.arquivo,
          linhas: plano.linhas,
          novos: plano.novos.length,
          atualizados: plano.atualizacoes.length,
          descartados,
          criadoPor,
        },
      });
      if (plano.novos.length > 0) {
        await tx.lead.createMany({
          data: plano.novos.map((l: DadosDoLead) => ({ ...l, loteId: novoLote.id })),
          skipDuplicates: true,
        });
      }
      for (const a of plano.atualizacoes) {
        await tx.lead.update({ where: { id: a.id }, data: a.dados });
      }
      return novoLote;
    },
    { timeout: 60_000 }
  );

  return { loteId: criado.id, resumo: plano.resumo };
}

// ─── Ficha: mudanças e histórico ─────────────────────────────────────────────

export type MudancaDoLead = {
  etapa?: EtapaManual;
  motivoPerda?: string | null;
  naoContatar?: boolean;
  temWhatsapp?: boolean | null;
  oficinaId?: string | null;
};

const ROTULO_MANUAL: Record<EtapaManual, string> = {
  NOVO: "Novo",
  ABORDADO: "Abordado",
  RESPONDEU: "Respondeu",
  PERDIDO: "Perdido",
};

/** Muda o lead e deixa no histórico o que mudou de etapa. */
export async function atualizarLead(id: string, mudanca: MudancaDoLead, autor: string) {
  return prisma.$transaction(async (tx) => {
    const antes = await tx.lead.findUniqueOrThrow({ where: { id }, select: { etapa: true, naoContatar: true } });
    const lead = await tx.lead.update({ where: { id }, data: mudanca });

    const registros: string[] = [];
    if (mudanca.etapa && mudanca.etapa !== antes.etapa) {
      registros.push(
        `Etapa: ${ROTULO_MANUAL[mudanca.etapa]}` +
          (mudanca.etapa === "PERDIDO" && mudanca.motivoPerda ? ` (${mudanca.motivoPerda})` : "")
      );
    }
    if (mudanca.naoContatar !== undefined && mudanca.naoContatar !== antes.naoContatar) {
      registros.push(mudanca.naoContatar ? "Marcado para não contatar" : "Voltou a poder ser contatado");
    }
    if (mudanca.oficinaId !== undefined) {
      registros.push(mudanca.oficinaId ? "Ligado à conta do boxOS à mão" : "Ligação com a conta desfeita");
    }
    for (const texto of registros) {
      await tx.interacaoLead.create({ data: { leadId: id, tipo: "ETAPA", texto, criadoPor: autor } });
    }
    return lead;
  });
}

/**
 * Anotação, mensagem enviada ou tarefa pulada. Mensagem enviada a um lead "Novo" o
 * passa a "Abordado"; e se o número era fixo sem conferência, fica sabido que tem
 * WhatsApp.
 */
export async function registrarInteracao(
  id: string,
  dados: { tipo: "NOTA" | "MENSAGEM" | "PULOU"; texto: string; regra: string | null },
  autor: string
) {
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUniqueOrThrow({ where: { id }, select: { etapa: true, temWhatsapp: true } });
    const interacao = await tx.interacaoLead.create({
      data: { leadId: id, tipo: dados.tipo, texto: dados.texto, regra: dados.regra, criadoPor: autor },
    });
    if (dados.tipo === "MENSAGEM") {
      await tx.lead.update({
        where: { id },
        data: {
          ultimoContato: new Date(),
          ...(lead.etapa === "NOVO" ? { etapa: "ABORDADO" } : {}),
          ...(lead.temWhatsapp == null ? { temWhatsapp: true } : {}),
        },
      });
    }
    return interacao;
  });
}
