import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lerCotacao } from "@/lib/cotacoes";
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
 * O que a oficina mexe antes do orçamento: margem, a oferta escolhida de uma peça, o
 * preço de venda de uma peça, ou "menor preço em tudo". Trocar a oferta de uma peça
 * descarta o preço de venda digitado para ela — o custo mudou.
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
          pecas: {
            select: { id: true, ofertaId: true, ofertas: { select: { id: true, preco: true, prazoMin: true } } },
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

      if (dados.margem !== undefined) {
        await tx.cotacao.update({ where: { id }, data: { margem: dados.margem } });
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
          const [melhor] = [...peca.ofertas].sort((a, b) => a.preco - b.preco || a.prazoMin - b.prazoMin);
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
