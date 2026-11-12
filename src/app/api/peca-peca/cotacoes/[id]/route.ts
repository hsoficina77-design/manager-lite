import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { formaDa, lerCotacao } from "@/lib/cotacoes";
import { precoNaForma } from "@/components/peca-peca/regras";
import { registroNaoEncontrado } from "@/lib/db-oficina";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { cotacaoAlterarSchema } from "@/lib/schemas-peca-peca";

type Params = { params: Promise<{ id: string }> };

const naoEncontrada = () => NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

export async function GET(_request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { id } = await params;
  const cotacao = await lerCotacao(guarda.db, id);
  return cotacao ? NextResponse.json(cotacao) : naoEncontrada();
}

/**
 * O que a oficina mexe na cotação: a oferta escolhida de uma peça, "menor preço em
 * tudo", como vai pagar, e — para o orçamento do boxOS — a margem e o preço de venda
 * de uma peça.
 * Trocar a oferta de uma peça descarta o preço de venda digitado para ela — o custo
 * mudou.
 *
 * Depois do pedido a escolha trava (as lojas já estão separando aquelas peças); os
 * preços de venda seguem livres até o orçamento sair.
 */
export async function PATCH(request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;
  const { id } = await params;

  try {
    const dados = await lerJson(request, cotacaoAlterarSchema);

    const erro = await transacao(async (tx) => {
      const c = await tx.cotacao.findUnique({
        where: { id },
        select: {
          orcamentoId: true,
          pedidoEm: true,
          formaPagamento: true,
          pecas: {
            select: {
              id: true,
              ofertaId: true,
              ofertas: {
                select: { id: true, preco: true, precoCredito: true, prazoMin: true, envio: { select: { debitoAVista: true } } },
              },
            },
          },
        },
      });
      if (!c) return naoEncontrada();
      if (c.orcamentoId) {
        return NextResponse.json(
          { error: "O orçamento desta cotação já saiu. Ajuste os preços no próprio orçamento." },
          { status: 409 }
        );
      }
      if (c.pedidoEm && (dados.escolha || dados.menorPreco || dados.formaPagamento)) {
        return NextResponse.json(
          { error: "O pedido já foi feito: as lojas estão separando estas peças." },
          { status: 409 }
        );
      }

      if (dados.margem !== undefined) {
        await tx.cotacao.update({ where: { id }, data: { margem: dados.margem } });
      }

      // A forma muda o custo de cada oferta, mas não a escolha: a oficina decide se troca.
      const forma = dados.formaPagamento ?? formaDa(c.formaPagamento);
      if (dados.formaPagamento) {
        await tx.cotacao.update({ where: { id }, data: { formaPagamento: dados.formaPagamento } });
      }

      if (dados.escolha) {
        const { pecaId, ofertaId } = dados.escolha;
        const peca = c.pecas.find((p) => p.id === pecaId);
        if (!peca) return naoEncontrada();
        if (ofertaId && !peca.ofertas.some((o) => o.id === ofertaId)) {
          return NextResponse.json({ error: "Essa oferta não é desta peça" }, { status: 400 });
        }
        if (peca.ofertaId !== ofertaId) {
          await tx.cotacaoPeca.update({ where: { id: peca.id }, data: { ofertaId, vendaUnit: null } });
        }
      }

      if (dados.menorPreco) {
        for (const peca of c.pecas) {
          const custo = (o: (typeof peca.ofertas)[number]) => precoNaForma(o, forma, o.envio.debitoAVista);
          const [melhor] = [...peca.ofertas].sort((a, b) => custo(a) - custo(b) || a.prazoMin - b.prazoMin);
          if (melhor && melhor.id !== peca.ofertaId) {
            await tx.cotacaoPeca.update({ where: { id: peca.id }, data: { ofertaId: melhor.id, vendaUnit: null } });
          }
        }
      }

      if (dados.venda) {
        const { pecaId, valor } = dados.venda;
        if (!c.pecas.some((p) => p.id === pecaId)) return naoEncontrada();
        await tx.cotacaoPeca.update({ where: { id: pecaId }, data: { vendaUnit: valor && valor > 0 ? valor : null } });
      }

      return null;
    });
    if (erro) return erro;

    const cotacao = await lerCotacao(db, id);
    return cotacao ? NextResponse.json(cotacao) : naoEncontrada();
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a cotação" }, { status: 500 });
  }
}

/** Some a cotação e as respostas das lojas. O orçamento que já saiu dela continua. */
export async function DELETE(_request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { id } = await params;
  try {
    await guarda.db.cotacao.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (registroNaoEncontrado(err)) return naoEncontrada();
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir a cotação" }, { status: 500 });
  }
}
