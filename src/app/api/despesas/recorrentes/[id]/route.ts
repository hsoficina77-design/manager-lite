import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { despesaRecorrenteAtualizarSchema } from "@/lib/schemas";
import { INCLUDE_CATEGORIA, regraValeNoMes } from "@/lib/despesas";
import { competenciaDe, diaDaCompetencia } from "@/lib/periodo";

/**
 * Edita a despesa fixa e acerta os lançamentos que ela já tinha gerado.
 *
 * Duas coisas acontecem depois de salvar, e as duas só valem do mês corrente para a
 * frente — mês fechado é histórico e não se reescreve:
 *
 *   1. `propagar` leva o valor novo para os lançamentos ainda não pagos. É o caso do
 *      aluguel que reajustou: sem isso, o dono corrigiria a regra e continuaria vendo
 *      o preço velho no mês aberto.
 *   2. Mudar início, fim, periodicidade ou desativar apaga os lançamentos futuros que
 *      a regra deixou de produzir. Sem isso, encerrar uma conta deixaria o boleto dela
 *      pendurado nos meses seguintes.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const dados = await lerJson(request, despesaRecorrenteAtualizarSchema);

    const atual = await prisma.despesaRecorrente.findUnique({ where: { id } });
    if (!atual) {
      return NextResponse.json({ error: "Despesa fixa não encontrada" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    for (const campo of [
      "categoriaId",
      "descricao",
      "valor",
      "fornecedor",
      "diaVencimento",
      "periodicidade",
      "inicio",
      "ativa",
      "observacao",
    ] as const) {
      if (dados[campo] !== undefined) data[campo] = dados[campo];
    }
    if (dados.fim !== undefined) data.fim = dados.fim;

    const regra = { ...atual, ...(data as Partial<typeof atual>) };
    if (regra.fim && regra.fim < regra.inicio) {
      return NextResponse.json(
        { error: "O mês final não pode ser anterior ao mês de início" },
        { status: 400 }
      );
    }

    const desteMes = competenciaDe(new Date());

    const atualizada = await prisma.$transaction(async (tx) => {
      const salva = await tx.despesaRecorrente.update({
        where: { id },
        data,
        include: INCLUDE_CATEGORIA,
      });

      const futuros = await tx.despesa.findMany({
        where: { recorrenteId: id, competencia: { gte: desteMes }, pago: false },
        select: { id: true, competencia: true, cancelado: true },
      });

      const orfaos = futuros.filter((l) => !regraValeNoMes(salva, l.competencia));
      if (orfaos.length > 0) {
        await tx.despesa.deleteMany({ where: { id: { in: orfaos.map((l) => l.id) } } });
      }

      if (dados.propagar) {
        // Um a um porque o vencimento depende do mês (dia 31 vira 28 em fevereiro) —
        // não é o mesmo valor para todas as linhas.
        for (const l of futuros) {
          if (l.cancelado || orfaos.some((o) => o.id === l.id)) continue;
          await tx.despesa.update({
            where: { id: l.id },
            data: {
              categoriaId: salva.categoriaId,
              descricao: salva.descricao,
              valor: salva.valor,
              fornecedor: salva.fornecedor,
              vencimento: diaDaCompetencia(l.competencia, salva.diaVencimento),
            },
          });
        }
      }

      return salva;
    });

    return NextResponse.json(atualizada);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar a despesa fixa" }, { status: 500 });
  }
}

/**
 * Apaga a regra.
 *
 * Os lançamentos que ela gerou e ainda não foram pagos, do mês corrente para a frente,
 * vão junto — a conta deixou de existir. Os já pagos ficam como gasto avulso: o
 * dinheiro saiu, e mês fechado não muda de total porque uma regra foi apagada.
 *
 * Para só parar de gerar sem mexer em nada, o caminho é desativar.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const desteMes = competenciaDe(new Date());

    await prisma.$transaction(async (tx) => {
      await tx.despesa.deleteMany({
        where: { recorrenteId: id, competencia: { gte: desteMes }, pago: false },
      });
      // A foreign key é ON DELETE SET NULL: o que sobrou vira avulso sozinho.
      await tx.despesaRecorrente.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Despesa fixa não encontrada" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir a despesa fixa" }, { status: 500 });
  }
}
