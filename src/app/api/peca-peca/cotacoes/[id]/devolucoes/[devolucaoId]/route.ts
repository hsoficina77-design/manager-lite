import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { CAMPOS_DA_DEVOLUCAO, TIPO_AVISO_DEVOLUCAO, devolucaoVista } from "@/lib/balcao";
import { lerCotacao } from "@/lib/cotacoes";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { devolucaoOficinaSchema } from "@/lib/schemas-peca-peca";
import { ehTroca, oficinaPrecisaAgir, situacaoDaDevolucao } from "@/components/peca-peca/regras";

type Params = { params: Promise<{ id: string; devolucaoId: string }> };

const recusa = (error: string) => NextResponse.json({ error }, { status: 409 });

/**
 * O que a oficina faz depois de pedir a devolução:
 *
 *   - cancelar: desistiu, enquanto a peça não voltou e a troca não saiu;
 *   - aceitar-preco / recusar-preco: a troca ficou mais cara — manda assim, ou volta a
 *     ser devolução do dinheiro;
 *   - recebi-troca: a peça nova chegou. Vale antes de a loja marcar que ela saiu, como
 *     na confirmação do recebimento.
 */
export async function PATCH(request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao } = guarda;
  const { id, devolucaoId } = await params;

  try {
    const { acao } = await lerJson(request, devolucaoOficinaSchema);

    const r = await transacao(async (tx): Promise<NextResponse | null> => {
      const linha = await tx.devolucao.findFirst({
        where: { id: devolucaoId, envio: { cotacaoId: id } },
        select: CAMPOS_DA_DEVOLUCAO,
      });
      if (!linha) return NextResponse.json({ error: "Devolução não encontrada" }, { status: 404 });
      const d = devolucaoVista(linha);
      const situacao = situacaoDaDevolucao(d);
      const agora = new Date();
      // O estado que a pessoa viu vai na condição: a loja respondendo no mesmo instante
      // não é atropelada.
      const aberta = { id: d.id, recusadaEm: null, canceladaEm: null };
      let count = 0;

      if (acao === "cancelar") {
        if (situacao === "CONCLUIDA" || situacao === "RECUSADA" || situacao === "CANCELADA") {
          return recusa("Esta devolução já terminou.");
        }
        if (d.lojaRecebeuEm) return recusa("A peça já voltou para a loja.");
        if (d.trocaSaiuEm) return recusa("A peça da troca já saiu com o motoboy. Combine com a loja.");
        ({ count } = await tx.devolucao.updateMany({
          where: { ...aberta, lojaRecebeuEm: null, trocaSaiuEm: null },
          data: { canceladaEm: agora },
        }));
      } else if (acao === "aceitar-preco" || acao === "recusar-preco") {
        if (situacao !== "PRECO_NOVO") return recusa("A loja não mudou o preço desta troca.");
        ({ count } = await tx.devolucao.updateMany({
          where: { ...aberta, precoAceitoEm: null },
          data:
            acao === "aceitar-preco"
              ? { precoAceitoEm: agora }
              : // Sem a troca, volta a ser devolução do dinheiro — já aceita pela loja.
                { querTroca: false, trocaMarca: null, trocaPreco: null },
        }));
      } else {
        if (!ehTroca(d)) return recusa("Esta devolução não tem troca.");
        if (situacao === "PEDIDA") return recusa("A loja ainda não aceitou a troca.");
        if (situacao === "PRECO_NOVO") return recusa("Diga antes se a loja pode mandar pelo preço novo.");
        if (d.oficinaRecebeuTrocaEm) return null;
        ({ count } = await tx.devolucao.updateMany({
          where: { ...aberta, aceitaEm: { not: null }, oficinaRecebeuTrocaEm: null },
          data: { oficinaRecebeuTrocaEm: agora, ...(d.trocaSaiuEm ? {} : { trocaSaiuEm: agora }) },
        }));
      }
      if (count === 0) return recusa("Esta devolução mudou enquanto isso. Veja como ela está agora.");

      // Sem devolução desta cotação esperando a oficina, os avisos dela saem do sino.
      const daCotacao = await tx.devolucao.findMany({ where: { envio: { cotacaoId: id } }, select: CAMPOS_DA_DEVOLUCAO });
      if (!daCotacao.map(devolucaoVista).some(oficinaPrecisaAgir)) {
        await tx.notificacao.updateMany({
          where: { tipo: TIPO_AVISO_DEVOLUCAO, link: `/peca-peca/${id}`, lida: false },
          data: { lida: true, lidaEm: agora },
        });
      }
      return null;
    });
    if (r) return r;

    const cotacao = await lerCotacao(db, id);
    return cotacao ? NextResponse.json(cotacao) : NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a devolução" }, { status: 500 });
  }
}
