import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { listarLojas } from "@/lib/balcao";
import { lerCotacao } from "@/lib/cotacoes";
import { respostaSimulada } from "@/components/peca-peca/regras";

/**
 * Responde no lugar das lojas que ainda não responderam — para testar a comparação
 * sem abrir os balcões. As ofertas entram como se a loja tivesse mandado.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;
  const { id } = await params;

  const cotacao = await lerCotacao(db, id);
  if (!cotacao) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  if (cotacao.orcamento) {
    return NextResponse.json({ error: "O orçamento desta cotação já saiu" }, { status: 409 });
  }

  const lojas = new Map((await listarLojas()).map((l) => [l.id, l]));
  const pendentes = cotacao.envios.filter((e) => !e.respondidaEm);

  await transacao(async (tx) => {
    for (const envio of pendentes) {
      const entrega = lojas.get(envio.lojaId) ?? { entregaMin: 30, entregaMax: 50 };
      const itens = respostaSimulada(cotacao.pecas, entrega);
      const ofertas = Object.entries(itens).flatMap(([pecaId, lista]) =>
        lista.map((o) => ({ envioId: envio.id, pecaId, ...o }))
      );
      // Só grava se a loja não respondeu de verdade enquanto isso.
      const marcado = await tx.cotacaoLoja.updateMany({
        where: { id: envio.id, respondidaEm: null },
        data: { respondidaEm: new Date() },
      });
      if (marcado.count > 0 && ofertas.length > 0) await tx.oferta.createMany({ data: ofertas });
    }
  });

  return NextResponse.json(await lerCotacao(db, id));
}
