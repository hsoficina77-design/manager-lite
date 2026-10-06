import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";

/**
 * Tudo o que o cliente já pagou ou ainda deve — OS e dívidas avulsas, quitadas
 * ou não — para o extrato que vai para ele no WhatsApp.
 *
 * Diferente de /api/contas-receber, que só enxerga o que está em aberto: aqui o
 * ponto é justamente poder mostrar, ao lado do saldo, o serviço que acabou de
 * ser quitado.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const { id } = await params;
  const pagamentoSelect = {
    select: { id: true, valor: true, formaPagamento: true, data: true, obs: true },
    orderBy: { data: "desc" as const },
  };

  const [cliente, ordens, dividas] = await Promise.all([
    db.cliente.findUnique({ where: { id }, select: { id: true, nome: true } }),
    db.ordemServico.findMany({
      where: { clienteId: id, status: { not: "CANCELADA" } },
      select: {
        id: true, numero: true, status: true, desconto: true, total: true, valorPago: true,
        pago: true, abertura: true, fechamento: true,
        veiculo: { select: { marca: true, modelo: true, placa: true } },
        pagamentos: pagamentoSelect,
      },
      orderBy: { abertura: "desc" },
    }),
    db.dividaAvulsa.findMany({
      where: { clienteId: id },
      select: {
        id: true, descricao: true, valor: true, valorPago: true, pago: true, createdAt: true,
        pagamentos: pagamentoSelect,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  // OS zerada e sem pagamento (orçada e nunca cobrada) só faria volume na lista.
  const ordensComValor = ordens.filter((o) => o.total > 0 || o.pagamentos.length > 0);

  return NextResponse.json({ cliente, ordens: ordensComValor, dividas });
}
