import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { confirmarRecebimento, lerCotacao, medirSeEntregou } from "@/lib/cotacoes";
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
        select: { id: true, lojaId: true, entrega: true, oficinaRecebeuEm: true, entregueEm: true },
      });
      if (!envio) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
      if (!envio.entrega) return NextResponse.json({ error: "Esta loja não está no pedido" }, { status: 400 });
      return { entregou: await confirmarRecebimento(tx, id, envio) };
    });
    if (r instanceof NextResponse) return r;
    await medirSeEntregou(r.entregou);

    const cotacao = await lerCotacao(db, id);
    return cotacao ? NextResponse.json(cotacao) : NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao confirmar o recebimento" }, { status: 500 });
  }
}
