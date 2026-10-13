import type { Db } from "@/lib/db-oficina";

/**
 * Quantas contas a receber estão em aberto: OS entregues sem pagamento completo mais
 * dívidas avulsas. É o número do contador vermelho do menu e do atalho de Contas a
 * receber na tela inicial — os dois têm de bater.
 */
export async function contarPendencias(db: Db): Promise<number> {
  const [osPendentes, dividasPendentes] = await Promise.all([
    db.ordemServico.count({ where: { pago: false, status: "ENTREGUE" } }),
    db.dividaAvulsa.count({ where: { pago: false } }),
  ]);
  return osPendentes + dividasPendentes;
}
