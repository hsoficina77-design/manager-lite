import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { todasAsLojas } from "@/lib/balcao";
import { confirmarRecebimento, lerCotacao, medirSeEntregou } from "@/lib/cotacoes";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { devolucaoCriarSchema } from "@/lib/schemas-peca-peca";
import { MOTIVOS_DEVOLUCAO, podeDevolver, prazoParaDevolver, quantasDaParaDevolver } from "@/components/peca-peca/regras";

/**
 * A oficina pede para devolver uma peça que a loja entregou. Pedir a devolução também
 * confirma o recebimento, se a oficina ainda não tinha confirmado: a peça chegou.
 *
 * Peça sem uso respeita o prazo da loja; defeito e peça errada não têm prazo no app —
 * a loja aceita ou recusa.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;
  const { id } = await params;

  try {
    const dados = await lerJson(request, devolucaoCriarSchema);
    const motivo = MOTIVOS_DEVOLUCAO.find((m) => m.value === dados.motivo)!;
    if (motivo.pergunta && !dados.detalhe) {
      return NextResponse.json({ error: `${motivo.pergunta} Conte para a loja.` }, { status: 400 });
    }
    const lojas = await todasAsLojas();

    const r = await transacao(async (tx): Promise<NextResponse | { entregou: string | null }> => {
      const envio = await tx.cotacaoLoja.findFirst({
        where: { id: dados.envioId, cotacaoId: id },
        select: {
          id: true,
          lojaId: true,
          entrega: true,
          oficinaRecebeuEm: true,
          entregueEm: true,
          ofertas: { select: { id: true, preco: true } },
          devolucoes: { select: { pecaId: true, quantidade: true, recusadaEm: true, canceladaEm: true } },
        },
      });
      if (!envio) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
      if (!podeDevolver(envio)) {
        return NextResponse.json({ error: "As peças desta loja ainda não chegaram." }, { status: 400 });
      }

      const peca = await tx.cotacaoPeca.findFirst({
        where: { id: dados.pecaId, cotacaoId: id },
        select: { id: true, quantidade: true, ofertaId: true },
      });
      const oferta = envio.ofertas.find((o) => o.id === peca?.ofertaId);
      if (!peca || !oferta) return NextResponse.json({ error: "Esta peça não veio desta loja." }, { status: 400 });

      const resta = quantasDaParaDevolver(peca, envio.devolucoes);
      if (dados.quantidade > resta) {
        return NextResponse.json(
          { error: resta === 0 ? "Esta peça já está sendo devolvida." : `Dá para devolver no máximo ${resta}.` },
          { status: 400 }
        );
      }

      const loja = lojas.get(envio.lojaId);
      if (dados.motivo === "NAO_USADA") {
        const prazo = prazoParaDevolver({
          entregueEm: envio.entregueEm?.toISOString() ?? null,
          // Sem data nenhuma (a loja marcou "entregue" antes da medição existir), conta de agora.
          oficinaRecebeuEm: envio.oficinaRecebeuEm?.toISOString() ?? new Date().toISOString(),
          prazoDevolucao: loja?.prazoDevolucao ?? 0,
        });
        if (!prazo) {
          return NextResponse.json(
            { error: `A ${loja?.nome ?? "loja"} não aceita devolução de peça sem uso.` },
            { status: 400 }
          );
        }
        if (Date.now() > prazo.getTime()) {
          return NextResponse.json(
            { error: `O prazo da loja para devolver peça sem uso acabou em ${prazo.toLocaleDateString("pt-BR")}.` },
            { status: 400 }
          );
        }
      }

      const entregou = await confirmarRecebimento(tx, id, envio);
      await tx.devolucao.create({
        data: {
          envioId: envio.id,
          pecaId: peca.id,
          quantidade: dados.quantidade,
          motivo: dados.motivo,
          detalhe: dados.detalhe || null,
          // Peça sem uso volta por dinheiro: não há "a certa" para mandar no lugar.
          querTroca: dados.motivo === "NAO_USADA" ? false : dados.querTroca,
          valor: Math.round(oferta.preco * dados.quantidade * 100) / 100,
        },
      });
      return { entregou };
    });
    if (r instanceof NextResponse) return r;
    await medirSeEntregou(r.entregou);

    const cotacao = await lerCotacao(db, id);
    return cotacao
      ? NextResponse.json(cotacao, { status: 201 })
      : NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao pedir a devolução" }, { status: 500 });
  }
}
