import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { movimentoEstoqueSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  const movimentos = await prisma.movimentoEstoque.findMany({
    where: { produtoId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(semFinanceiro(movimentos, guarda.usuario.podeFinanceiro));
}

/**
 * Movimento feito à mão: a compra que chegou, a perda, o acerto de contagem.
 *
 * A baixa da OS **não** passa por aqui — ela é consequência da gravação da OS, e sai
 * de `lib/estoque`. Esta rota é o outro lado: como a peça entra na prateleira e como
 * se corrige o que a contagem desmentiu.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  try {
    const { tipo, quantidade, custoUnit, motivo } = await lerJson(request, movimentoEstoqueSchema);

    const resultado = await prisma.$transaction(async (tx) => {
      const produto = await tx.produto.findUnique({
        where: { id },
        select: { quantidade: true, custoUnit: true },
      });
      if (!produto) return null;

      // No ajuste, o que chega é o saldo CONTADO, não a diferença: quem está com a
      // peça na mão conta "sobraram 7" e não deveria ter que calcular "então tire 3".
      const variacao =
        tipo === "AJUSTE"
          ? quantidade - produto.quantidade
          : tipo === "ENTRADA"
            ? quantidade
            : -quantidade;

      // Compra a preço novo atualiza o custo do produto — é ele que a próxima OS vai
      // herdar. Substitui em vez de fazer média ponderada de propósito: o dono precisa
      // reconhecer na tela o número da nota que acabou de digitar.
      const novoCusto =
        guarda.usuario.podeFinanceiro && tipo === "ENTRADA" && custoUnit != null
          ? custoUnit
          : produto.custoUnit;

      const atualizado = await tx.produto.update({
        where: { id },
        data: { quantidade: { increment: variacao }, custoUnit: novoCusto },
        select: { quantidade: true, custoUnit: true },
      });

      const movimento = await tx.movimentoEstoque.create({
        data: {
          produtoId: id,
          tipo,
          quantidade: variacao,
          saldoDepois: atualizado.quantidade,
          custoUnit: atualizado.custoUnit,
          motivo: motivo ?? null,
          usuarioNome: guarda.usuario.nome,
        },
      });

      return movimento;
    });

    if (!resultado) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    return NextResponse.json(semFinanceiro(resultado, guarda.usuario.podeFinanceiro), {
      status: 201,
    });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao movimentar o estoque" }, { status: 500 });
  }
}
