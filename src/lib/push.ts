// Aviso no celular (Web Push) quando chega mensagem na conversa do Peça Peça.
//
// O balconista não fica olhando a tela, e a oficina está embaixo do carro: sem o aviso
// com o app fechado, a dúvida da loja espera até alguém abrir o app.
//
// Do sistema, como balcao.ts — e por isso com o cliente cru (está na lista curta de
// `scripts/checar-isolamento.mjs`): a mensagem da loja avisa a oficina, e quem manda
// não está logado no lado de quem recebe. Não lê nada de oficina além de quem pode ver
// o Peça Peça nela.
//
// Sem as chaves no ambiente (VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY), tudo aqui vira nada:
// a tela não oferece o aviso e a conversa funciona igual, só sem o celular tocar.
// Gerar as chaves: `npx web-push generate-vapid-keys`.

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function chaves() {
  const publica = process.env.VAPID_PUBLIC_KEY?.trim();
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publica || !privada) return null;
  // O serviço de push do navegador usa este contato se o envio der problema.
  return { publica, privada, contato: process.env.VAPID_SUBJECT?.trim() || "mailto:contato.boxos77@gmail.com" };
}

/** A chave que o navegador precisa para se inscrever. Nula = aviso no celular desligado. */
export function chavePublicaPush(): string | null {
  return chaves()?.publica ?? null;
}

export type InscricaoDoNavegador = { endpoint: string; keys: { p256dh: string; auth: string } };

/** De quem é o aparelho: alguém da oficina ou alguém da loja. */
export type DonoDaInscricao =
  | { usuarioId: string; oficinaId: string }
  | { usuarioLojaId: string; lojaId: string };

/**
 * Guarda (ou renova) a inscrição do aparelho. O endereço é único: o aparelho que trocou
 * de conta passa a avisar só a conta nova.
 */
export async function inscrever(dono: DonoDaInscricao, inscricao: InscricaoDoNavegador, userAgent: string | null) {
  const dados = {
    p256dh: inscricao.keys.p256dh,
    auth: inscricao.keys.auth,
    usuarioId: "usuarioId" in dono ? dono.usuarioId : null,
    oficinaId: "oficinaId" in dono ? dono.oficinaId : null,
    usuarioLojaId: "usuarioLojaId" in dono ? dono.usuarioLojaId : null,
    lojaId: "lojaId" in dono ? dono.lojaId : null,
    userAgent: userAgent?.slice(0, 300) ?? null,
  };
  await prisma.inscricaoPush.upsert({
    where: { endpoint: inscricao.endpoint },
    create: { endpoint: inscricao.endpoint, ...dados },
    update: dados,
  });
}

/** Desliga o aviso neste aparelho — só se o aparelho é mesmo de quem pede. */
export async function cancelarInscricao(dono: DonoDaInscricao, endpoint: string) {
  await prisma.inscricaoPush.deleteMany({
    where:
      "usuarioId" in dono
        ? { endpoint, usuarioId: dono.usuarioId }
        : { endpoint, usuarioLojaId: dono.usuarioLojaId },
  });
}

/** O que aparece na notificação. `tag` junta as notificações da mesma conversa numa só. */
export type AvisoPush = { titulo: string; corpo: string; link: string; tag: string };

type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string };

const SELECAO = { id: true, endpoint: true, p256dh: true, auth: true } as const;

async function enviar(inscricoes: Inscricao[], aviso: AvisoPush) {
  const c = chaves();
  if (!c || inscricoes.length === 0) return;
  const corpo = JSON.stringify(aviso);
  await Promise.all(
    inscricoes.map(async (i) => {
      try {
        await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, corpo, {
          vapidDetails: { subject: c.contato, publicKey: c.publica, privateKey: c.privada },
          // Mensagem de uma hora atrás já não ajuda: o serviço de push pode descartar.
          TTL: 60 * 60,
          urgency: "high",
        });
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410: o navegador cancelou a inscrição (desinstalou, limpou os dados).
        if (status === 404 || status === 410) {
          await prisma.inscricaoPush.deleteMany({ where: { id: i.id } }).catch(() => {});
        } else {
          console.error("Falha ao enviar aviso no celular:", status ?? err);
        }
      }
    })
  );
}

/**
 * Avisa quem, na oficina, usa o Peça Peça: o dono e quem tem o financeiro (o preço da
 * loja é custo — a mesma regra de `vePecaPeca`). Acesso desligado não recebe mais.
 */
export async function avisarOficina(oficinaId: string, aviso: AvisoPush) {
  const inscricoes = await prisma.inscricaoPush.findMany({
    where: {
      oficinaId,
      usuario: { ativo: true, oficina: { ativa: true }, OR: [{ papel: "ADMIN" }, { podeFinanceiro: true }] },
    },
    select: SELECAO,
  });
  await enviar(inscricoes, aviso);
}

/** Avisa quem, na loja, pode conversar com as oficinas. */
export async function avisarLoja(lojaId: string, aviso: AvisoPush) {
  const inscricoes = await prisma.inscricaoPush.findMany({
    where: {
      lojaId,
      usuarioLoja: { ativo: true, loja: { ativa: true }, permissoes: { has: "balcao.conversa" } },
    },
    select: SELECAO,
  });
  await enviar(inscricoes, aviso);
}
