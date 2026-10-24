import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { itensDoOrcamento, lerCotacao } from "@/lib/cotacoes";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { cotacaoOrcamentoSchema } from "@/lib/schemas-peca-peca";
import { CODIGO_SEM_BOXOS } from "@/lib/permissoes";
import { CODIGO_SOMENTE_LEITURA, MENSAGEM_SOMENTE_LEITURA } from "@/lib/plano";
import { descricaoDoVeiculo } from "@/components/peca-peca/regras";

/**
 * Gera o orçamento da cotação — um orçamento comum do boxOS, com o mesmo número, a
 * mesma tela e a mesma conversão em OS. Os preços saem do servidor (escolhas, margem e
 * preços digitados gravados na cotação), não do que a tela mandar.
 *
 * É a parte do boxOS dentro do Peça Peça: só para a oficina que tem o boxOS, e fora do
 * modo só leitura — o resto do Peça Peça é grátis e passa pelo bloqueio, esta não.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, transacao, oficinaId, usuario } = guarda;
  const { id } = await params;

  if (!usuario.usaBoxOS) {
    return NextResponse.json(
      { error: "O orçamento para o cliente é do boxOS, que ainda não está ativo na sua oficina.", codigo: CODIGO_SEM_BOXOS },
      { status: 403 }
    );
  }
  if (usuario.somenteLeitura) {
    return NextResponse.json({ error: MENSAGEM_SOMENTE_LEITURA, codigo: CODIGO_SOMENTE_LEITURA }, { status: 402 });
  }

  try {
    const dados = await lerJson(request, cotacaoOrcamentoSchema);
    const c = await lerCotacao(db, id);
    if (!c) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    if (c.orcamento) {
      return NextResponse.json({ error: `Esta cotação já virou o orçamento #${c.orcamento.numero}` }, { status: 409 });
    }

    const pecas = itensDoOrcamento(c);
    if (pecas.length === 0) {
      return NextResponse.json({ error: "Escolha ao menos uma peça" }, { status: 400 });
    }
    if (!c.clienteId && !dados.clienteNome) {
      return NextResponse.json({ error: "Escreva o nome do cliente" }, { status: 400 });
    }

    const maoDeObra = dados.maoDeObra ?? 0;
    const totalPecas = pecas.reduce((s, i) => s + i.valorTotal, 0);
    const v = c.veiculo;
    const veiculoDesc = [descricaoDoVeiculo(v), v.motor, v.placa && `placa ${v.placa}`].filter(Boolean).join(" · ");

    const orcamento = await transacao(async (tx) => {
      // Dois cliques em "Criar" não podem gerar dois orçamentos: só marca a cotação quem
      // a encontrar ainda sem orçamento; o outro desfaz a transação inteira (ver abaixo).
      const seq = await tx.sequencia.upsert({
        where: { oficinaId_id: { oficinaId, id: "orcamento" } },
        update: { ultimo: { increment: 1 } },
        create: { id: "orcamento", ultimo: 1 },
      });
      const criado = await tx.orcamento.create({
        data: {
          numero: seq.ultimo,
          clienteId: c.clienteId,
          veiculoId: c.veiculoId,
          clienteNome: c.clienteId ? null : dados.clienteNome ?? null,
          veiculoDesc: c.veiculoId ? null : veiculoDesc,
          totalPecas,
          totalMO: maoDeObra,
          total: totalPecas + maoDeObra,
          itens: {
            create: [
              ...pecas,
              ...(maoDeObra > 0
                ? [{ tipo: "MAO_DE_OBRA", descricao: "Mão de obra", quantidade: 1, valorUnit: maoDeObra, valorTotal: maoDeObra }]
                : []),
            ],
          },
        },
        select: { id: true, numero: true },
      });
      const marcada = await tx.cotacao.updateMany({
        where: { id, orcamentoId: null },
        data: { orcamentoId: criado.id },
      });
      if (marcada.count === 0) throw new CotacaoJaFechada();
      return criado;
    });

    return NextResponse.json(orcamento, { status: 201 });
  } catch (err) {
    if (err instanceof CotacaoJaFechada) {
      return NextResponse.json({ error: "Esta cotação já virou orçamento" }, { status: 409 });
    }
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o orçamento" }, { status: 500 });
  }
}

class CotacaoJaFechada extends Error {}
