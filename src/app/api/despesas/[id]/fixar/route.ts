import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaFixarSchema } from "@/lib/schemas";
import { INCLUDE_CATEGORIA, regraValeNoMes } from "@/lib/despesas";

/**
 * Transforma um gasto avulso em despesa fixa.
 *
 * O caminho normal é cadastrar a regra antes e deixar os lançamentos nascerem dela. Mas
 * o aluguel costuma ser lançado como gasto do mês algumas vezes antes de alguém perceber
 * que aquilo é uma conta fixa — e até aqui a única saída era cadastrar a regra e apagar
 * os lançamentos na mão, um por mês.
 *
 * Duas coisas fazem esta rota não duplicar nada:
 *
 *  1. O lançamento de origem passa a ser o lançamento da regra no mês dele
 *     (`recorrenteId`). Sem isso, a próxima abertura do mês criaria um segundo "Aluguel"
 *     ao lado do que já estava lá.
 *  2. `adotarSemelhantes` faz o mesmo com os avulsos de mesma descrição dos meses
 *     seguintes, que sofreriam exatamente o mesmo problema.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const dados = await lerJson(request, despesaFixarSchema);

    const gasto = await prisma.despesa.findUnique({ where: { id } });
    if (!gasto) {
      return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
    }
    if (gasto.recorrenteId) {
      return NextResponse.json(
        { error: "Este gasto já vem de uma despesa fixa" },
        { status: 409 }
      );
    }

    // A regra começa no mês do lançamento — ver o schema para o porquê de não ser escolha.
    const inicio = gasto.competencia;
    if (dados.fim && dados.fim < inicio) {
      return NextResponse.json(
        { error: "O mês final não pode ser anterior ao mês do gasto" },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const regra = await tx.despesaRecorrente.create({
        data: {
          categoriaId: gasto.categoriaId,
          descricao: gasto.descricao,
          valor: dados.valor ?? gasto.valor,
          fornecedor: gasto.fornecedor,
          diaVencimento: dados.diaVencimento,
          periodicidade: dados.periodicidade,
          inicio,
          fim: dados.fim ?? null,
          observacao: gasto.observacao,
        },
        include: INCLUDE_CATEGORIA,
      });

      // O vencimento do lançamento de origem não é reescrito: o dia novo vale para os
      // meses que ainda vão nascer da regra. Mês em andamento já tem o boleto dele.
      await tx.despesa.update({ where: { id }, data: { recorrenteId: regra.id } });

      let adotados = 0;
      if (dados.adotarSemelhantes) {
        const candidatos = await tx.despesa.findMany({
          where: {
            id: { not: id },
            recorrenteId: null,
            cancelado: false,
            competencia: { gt: inicio },
            descricao: { equals: gasto.descricao, mode: "insensitive" },
          },
          orderBy: [{ competencia: "asc" }, { vencimento: "asc" }],
          select: { id: true, competencia: true },
        });

        const mesesJaLigados = new Set<number>();
        const adotar: string[] = [];
        for (const candidato of candidatos) {
          if (!regraValeNoMes(regra, candidato.competencia)) continue;
          // Dois avulsos iguais no mesmo mês: só um pode ser o lançamento da regra (a
          // chave é recorrenteId+competencia). O outro continua avulso, à vista na tela.
          const mes = candidato.competencia.getTime();
          if (mesesJaLigados.has(mes)) continue;
          mesesJaLigados.add(mes);
          adotar.push(candidato.id);
        }

        if (adotar.length > 0) {
          await tx.despesa.updateMany({
            where: { id: { in: adotar } },
            data: { recorrenteId: regra.id },
          });
        }
        adotados = adotar.length;
      }

      return { regra, adotados };
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao transformar o gasto em despesa fixa" },
      { status: 500 }
    );
  }
}

/**
 * Os gastos avulsos de mesma descrição nos meses seguintes.
 *
 * A tela usa isto para dizer, antes de confirmar, quantos lançamentos a regra vai
 * absorver — e quantos duplicariam se ela não absorvesse. Devolve todos os meses
 * posteriores; quais deles a regra realmente cobre depende da periodicidade que a
 * pessoa ainda está escolhendo, então esse filtro é feito na tela.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gasto = await prisma.despesa.findUnique({
    where: { id },
    select: { descricao: true, competencia: true, recorrenteId: true },
  });
  if (!gasto) {
    return NextResponse.json({ error: "Gasto não encontrado" }, { status: 404 });
  }
  if (gasto.recorrenteId) return NextResponse.json({ semelhantes: [] });

  const semelhantes = await prisma.despesa.findMany({
    where: {
      id: { not: id },
      recorrenteId: null,
      cancelado: false,
      competencia: { gt: gasto.competencia },
      descricao: { equals: gasto.descricao, mode: "insensitive" },
    },
    orderBy: { competencia: "asc" },
    select: { id: true, competencia: true, valor: true },
  });

  return NextResponse.json({ semelhantes });
}
