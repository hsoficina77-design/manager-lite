// Notificações persistentes — o que fica marcado para quando o usuário voltar,
// diferente do toast de `Avisos.tsx`, que some em segundos.
//
// Sem `usuarioId`: a leitura é filtrada por papel (ver `publico`), não por pessoa —
// mesma filosofia de linha única de `Configuracao` para uma escala de 1-3 acessos.

import { prisma } from "@/lib/prisma";
import type { Papel } from "@/lib/permissoes";

type Publico = "ADMIN" | "TODOS";

function filtroVisibilidade(papel: Papel) {
  return papel === "ADMIN" ? {} : { publico: "TODOS" as const };
}

/** Não lança: uma notificação que falha não pode derrubar o fluxo que a disparou. */
export async function criarNotificacao(dados: {
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
  publico?: Publico;
}) {
  try {
    await prisma.notificacao.create({
      data: {
        tipo: dados.tipo,
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        link: dados.link,
        publico: dados.publico ?? "ADMIN",
      },
    });
  } catch (err) {
    console.error("Falha ao criar notificação:", err);
  }
}

/**
 * Como `criarNotificacao`, mas evita duplicar: se já existe uma não lida do mesmo
 * `tipo` criada dentro de `janelaDias`, não cria de novo. É o que impede um aviso de
 * armazenamento de nascer a cada foto enviada enquanto o uso segue acima do limiar.
 */
export async function criarNotificacaoUnica(dados: {
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
  publico?: Publico;
  janelaDias: number;
}) {
  try {
    const desde = new Date(Date.now() - dados.janelaDias * 24 * 60 * 60 * 1000);
    const existente = await prisma.notificacao.findFirst({
      where: { tipo: dados.tipo, lida: false, createdAt: { gte: desde } },
      select: { id: true },
    });
    if (existente) return;

    await prisma.notificacao.create({
      data: {
        tipo: dados.tipo,
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        link: dados.link,
        publico: dados.publico ?? "ADMIN",
      },
    });
  } catch (err) {
    console.error("Falha ao criar notificação:", err);
  }
}

export function contarNaoLidas(papel: Papel) {
  return prisma.notificacao.count({ where: { lida: false, ...filtroVisibilidade(papel) } });
}

export function listarNotificacoes(papel: Papel) {
  return prisma.notificacao.findMany({
    where: filtroVisibilidade(papel),
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
