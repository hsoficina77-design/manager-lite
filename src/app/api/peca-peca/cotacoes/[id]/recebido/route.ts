import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lerCotacao } from "@/lib/cotacoes";
import { TIPO_AVISO_ENTREGA, medirEntregasDaLoja } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { cotacaoRecebidoSchema } from "@/lib/schemas-peca-peca";

/**
 * A oficina confirma que as peças de uma loja chegaram. É o que fecha a entrega: vale
 * com a loja já tendo marcado "entregue" ou não — se não marcou, a etapa dela pula
 * para "entregue" junto, e o balcão para de pedir para avançar.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;
  const { id } = await params;

  try {
    const { envioId } = await lerJson(request, cotacaoRecebidoSchema);

    // Devolve a resposta de erro, ou a loja cuja entrega acabou de fechar (para medir).
    const r = await transacao(async (tx): Promise<NextResponse | { entregou: string | null }> => {
      const envio = await tx.cotacaoLoja.findFirst({
        where: { id: envioId, cotacaoId: id },
        select: { lojaId: true, entrega: true, oficinaRecebeuEm: true, entregueEm: true },
      });
      if (!envio) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
      if (!envio.entrega) return NextResponse.json({ error: "Esta loja não está no pedido" }, { status: 400 });
      if (envio.oficinaRecebeuEm) return { entregou: null };

      const agora = new Date();
      await tx.cotacaoLoja.updateMany({
        where: { id: envioId, oficinaRecebeuEm: null },
        // A loja não marcou "entregue": as peças chegaram agora, e é aqui que a
        // entrega dela termina para o tempo de entrega.
        data: { oficinaRecebeuEm: agora, entrega: "ENTREGUE", entregueEm: envio.entregueEm ?? agora },
      });
      // Sem outra loja esperando conferência, o aviso de "a loja entregou" sai do sino.
      const faltaConferir = await tx.cotacaoLoja.count({
        where: { cotacaoId: id, entrega: "ENTREGUE", oficinaRecebeuEm: null },
      });
      if (faltaConferir === 0) {
        await tx.notificacao.updateMany({
          where: { tipo: TIPO_AVISO_ENTREGA, link: `/peca-peca/${id}`, lida: false },
          data: { lida: true, lidaEm: new Date() },
        });
      }
      return { entregou: envio.entregueEm ? null : envio.lojaId };
    });
    if (r instanceof NextResponse) return r;
    // O tempo da loja é do sistema (lib/balcao.ts), fora da transação da oficina. Falhar
    // aqui não desfaz a confirmação: a próxima entrega da loja refaz a conta.
    if (r.entregou) {
      await medirEntregasDaLoja(r.entregou).catch((err: unknown) =>
        console.error("Falha ao medir o tempo de entrega da loja:", err)
      );
    }

    const cotacao = await lerCotacao(db, id);
    return cotacao ? NextResponse.json(cotacao) : NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao confirmar o recebimento" }, { status: 500 });
  }
}
