// Fotos do Peça Peça: a peça velha, a etiqueta, o defeito.
//
// Ajudam o balconista a acertar a peça e só valem enquanto a cotação está viva. Por
// isso se apagam sozinhas 30 dias depois que ela fecha, e a oficina pode apagar antes.
// Apagar tira só o arquivo do Storage: a linha fica, com `apagadaEm`, e a tela mostra
// "foto apagada" no lugar.
//
// Sem cron: a limpeza roda, no melhor esforço, quando a oficina cria uma cotação —
// quem não cota mais também não junta foto nova.

import type { Prisma } from "@prisma/client";
import type { Db } from "@/lib/db-oficina";
import { URL_TTL_SEGUNDOS, deleteFotos, urlsAssinadas } from "@/lib/supabase-storage";
import { DIAS_PARA_APAGAR_FOTOS, type FotoVista } from "@/components/peca-peca/regras";

export const CAMPOS_DA_FOTO = {
  id: true,
  path: true,
  url: true,
  apagadaEm: true,
} satisfies Prisma.FotoPecaPecaSelect;

type FotoDoBanco = Prisma.FotoPecaPecaGetPayload<{ select: typeof CAMPOS_DA_FOTO }>;

/**
 * URLs já assinadas, reaproveitadas enquanto valem. As telas da cotação e do balcão se
 * releem a cada 4 s: assinar de novo a cada leitura trocaria a URL — a foto piscaria e
 * o Storage levaria uma chamada por tela aberta a cada 4 s.
 */
const assinadasAntes = new Map<string, { url: string; ate: number }>();
const REAPROVEITAR_MS = (URL_TTL_SEGUNDOS - 10 * 60) * 1000;

/**
 * As URLs temporárias das fotos que ainda existem, caminho → URL. Falhou a assinatura
 * (Storage fora do ar), cada foto cai na URL gravada — ver lib/fotos.ts.
 */
export async function assinarFotos(fotos: FotoDoBanco[]): Promise<Map<string, string>> {
  const agora = Date.now();
  const mapa = new Map<string, string>();
  const faltam: string[] = [];
  for (const f of fotos) {
    if (f.apagadaEm) continue;
    const antes = assinadasAntes.get(f.path);
    if (antes && antes.ate > agora) mapa.set(f.path, antes.url);
    else faltam.push(f.path);
  }
  if (faltam.length === 0) return mapa;
  if (assinadasAntes.size > 5000) assinadasAntes.clear();
  for (const [path, url] of await urlsAssinadas(faltam)) {
    assinadasAntes.set(path, { url, ate: agora + REAPROVEITAR_MS });
    mapa.set(path, url);
  }
  return mapa;
}

export function fotoVista(f: FotoDoBanco, assinadas: Map<string, string>): FotoVista {
  return {
    id: f.id,
    url: f.apagadaEm ? null : (assinadas.get(f.path) ?? f.url),
    apagadaEm: f.apagadaEm?.toISOString() ?? null,
  };
}

/** Apaga os arquivos e marca as linhas. Devolve quantas fotos foram apagadas. */
export async function apagarFotos(db: Db, where: Prisma.FotoPecaPecaWhereInput): Promise<number> {
  const fotos = await db.fotoPecaPeca.findMany({ where: { ...where, apagadaEm: null }, select: { id: true, path: true } });
  if (fotos.length === 0) return 0;
  await deleteFotos(fotos.map((f) => f.path));
  await db.fotoPecaPeca.updateMany({ where: { id: { in: fotos.map((f) => f.id) } }, data: { apagadaEm: new Date() } });
  return fotos.length;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Quando a cotação fechou, ou nulo se ainda não fechou: sem pedido, conta da criação;
 * com pedido, da última coisa que aconteceu — a última entrega conferida ou a última
 * devolução que terminou. Loja ainda entregando ou devolução aberta: não fechou.
 */
function fechouEm(c: {
  createdAt: Date;
  pedidoEm: Date | null;
  envios: {
    entrega: string | null;
    oficinaRecebeuEm: Date | null;
    devolucoes: { updatedAt: Date; lojaRecebeuEm: Date | null; recusadaEm: Date | null; canceladaEm: Date | null }[];
  }[];
}): Date | null {
  if (!c.pedidoEm) return c.createdAt;
  const doPedido = c.envios.filter((e) => e.entrega);
  if (doPedido.some((e) => !e.oficinaRecebeuEm)) return null;
  const devolucoes = doPedido.flatMap((e) => e.devolucoes);
  // Aberta = nem voltou, nem foi recusada, nem cancelada (a troca que só falta a oficina
  // receber também fecha logo: a peça nova chega no mesmo dia).
  if (devolucoes.some((d) => !d.lojaRecebeuEm && !d.recusadaEm && !d.canceladaEm)) return null;
  const datas = [...doPedido.map((e) => e.oficinaRecebeuEm!), ...devolucoes.map((d) => d.updatedAt)];
  return new Date(Math.max(...datas.map((d) => d.getTime())));
}

/** Apaga as fotos das cotações fechadas há mais de 30 dias. */
export async function apagarFotosVencidas(db: Db): Promise<number> {
  const limite = new Date(Date.now() - DIAS_PARA_APAGAR_FOTOS * DIA_MS);
  const cotacoes = await db.cotacao.findMany({
    where: { createdAt: { lt: limite }, fotos: { some: { apagadaEm: null } } },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      pedidoEm: true,
      envios: {
        select: {
          entrega: true,
          oficinaRecebeuEm: true,
          devolucoes: { select: { updatedAt: true, lojaRecebeuEm: true, recusadaEm: true, canceladaEm: true } },
        },
      },
    },
  });
  const vencidas = cotacoes.filter((c) => {
    const fechou = fechouEm(c);
    return fechou !== null && fechou < limite;
  });
  if (vencidas.length === 0) return 0;
  return apagarFotos(db, { cotacaoId: { in: vencidas.map((c) => c.id) } });
}
