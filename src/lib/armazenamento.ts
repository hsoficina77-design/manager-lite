// Uso de armazenamento de fotos, para o limite do plano (ex.: 1GB no plano de entrada).
//
// Calculado ao vivo por SUM em vez de mantido em contador: apagar uma OS, um
// orçamento ou uma foto avulsa já reflete no próximo cálculo, sem precisar caçar
// todo ponto que chama `deleteFotos` para descontar um contador manualmente.

import type { Db } from "@/lib/db-oficina";

const MB = 1024 * 1024;

/** Limite do plano em bytes, por oficina. Fica em env var — é o tier de cobrança, não algo que a
 *  oficina deveria poder editar sozinha em Configurações. Padrão: 1GB. */
export const PLANO_LIMITE_BYTES = (Number(process.env.PLANO_LIMITE_MB) || 1024) * MB;

export const LIMIAR_AVISO = 0.8;
export const LIMIAR_CRITICO = 0.95;

/** Espaço ocupado pelas fotos da oficina do `db`. */
export async function bytesUsados(db: Db): Promise<number> {
  const { _sum } = await db.fotoOS.aggregate({ _sum: { tamanhoBytes: true } });
  return _sum.tamanhoBytes ?? 0;
}

export async function statusArmazenamento(db: Db): Promise<{
  usados: number;
  limite: number;
  percentual: number;
}> {
  const usados = await bytesUsados(db);
  return { usados, limite: PLANO_LIMITE_BYTES, percentual: usados / PLANO_LIMITE_BYTES };
}

/** Verifica o uso após um upload e, se estiver perto do limite, registra o aviso
 *  (deduplicado). Nunca lança — falhar aqui não pode derrubar o upload da foto. */
export async function avisarSeArmazenamentoCheio(db: Db) {
  try {
    const { criarNotificacaoUnica } = await import("@/lib/notificacoes");
    const status = await statusArmazenamento(db);
    const usadoMb = Math.round(status.usados / MB);
    const limiteMb = Math.round(status.limite / MB);

    if (status.percentual >= LIMIAR_CRITICO) {
      await criarNotificacaoUnica(db, {
        tipo: "ARMAZENAMENTO",
        titulo: "Armazenamento quase cheio",
        mensagem: `Você já usou ${usadoMb} MB de ${limiteMb} MB (${Math.round(status.percentual * 100)}%). Fotos novas podem parar de ser aceitas em breve.`,
        link: "/configuracoes",
        publico: "ADMIN",
        janelaDias: 7,
      });
    } else if (status.percentual >= LIMIAR_AVISO) {
      await criarNotificacaoUnica(db, {
        tipo: "ARMAZENAMENTO",
        titulo: "Armazenamento chegando ao limite",
        mensagem: `Você já usou ${usadoMb} MB de ${limiteMb} MB (${Math.round(status.percentual * 100)}%) do espaço para fotos.`,
        link: "/configuracoes",
        publico: "ADMIN",
        janelaDias: 14,
      });
    }
  } catch (err) {
    console.error("Falha ao checar uso de armazenamento:", err);
  }
}
