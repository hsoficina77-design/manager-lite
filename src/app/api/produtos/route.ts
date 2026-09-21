import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { produtoCriarSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";
import { normalizarBusca, textoDeBusca } from "@/lib/estoque";

/**
 * Lista e busca do estoque.
 *
 * É a mesma rota que alimenta a tela do estoque e o campo de peça da OS — o que muda
 * são os filtros. A busca é feita no banco, e não na tela: a lista de peças de uma
 * oficina só cresce, e baixar o catálogo inteiro a cada abertura de OS é exatamente o
 * que deixou a lista de OS lenta antes de ela ser paginada.
 *
 * Filtros: `q` (nome, código ou fornecedor), `ativo`, `baixo` (só o que precisa
 * repor), `limite`.
 */
export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { searchParams } = new URL(request.url);
  const q = normalizarBusca(searchParams.get("q") ?? "");
  const ativo = searchParams.get("ativo");
  const baixo = searchParams.get("baixo") === "true";
  const limite = Math.min(Math.max(Number(searchParams.get("limite")) || 200, 1), 500);

  const where: Record<string, unknown> = {};
  if (ativo === "true") where.ativo = true;
  if (ativo === "false") where.ativo = false;
  // `busca` já está sem acento e em minúsculo (ver lib/estoque), do mesmo jeito que o
  // termo — então aqui basta o `contains` cru.
  if (q) where.busca = { contains: q };

  const produtos = await prisma.produto.findMany({
    where,
    orderBy: { nome: "asc" },
    take: limite,
  });

  // "Precisa repor" compara duas colunas, e o Prisma não faz isso no `where` sem SQL
  // cru. São poucas linhas (o próprio `take` limita), então o recorte sai aqui.
  const lista = baixo
    ? produtos.filter((p) => p.quantidade <= 0 || (p.estoqueMinimo > 0 && p.quantidade <= p.estoqueMinimo))
    : produtos;

  return NextResponse.json(semFinanceiro(lista, guarda.usuario.podeFinanceiro));
}

export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  try {
    const dados = await lerJson(request, produtoCriarSchema);

    // Quem não vê custo também não o define — mesma regra do item da OS. O produto
    // nasce com custo zero e quem tem financeiro preenche depois.
    const custoUnit = guarda.usuario.podeFinanceiro ? dados.custoUnit ?? 0 : 0;
    const quantidade = dados.quantidade ?? 0;

    const produto = await prisma.$transaction(async (tx) => {
      const criado = await tx.produto.create({
        data: {
          nome: dados.nome,
          codigo: dados.codigo ?? null,
          busca: textoDeBusca(dados),
          unidade: dados.unidade,
          custoUnit,
          valorVenda: dados.valorVenda ?? 0,
          quantidade,
          estoqueMinimo: dados.estoqueMinimo ?? 0,
          fornecedor: dados.fornecedor ?? null,
          obs: dados.obs ?? null,
        },
      });

      // O saldo inicial vira movimento, e não um número que apareceu do nada: o
      // histórico do produto precisa somar o que está na tela desde a primeira linha.
      if (quantidade > 0) {
        await tx.movimentoEstoque.create({
          data: {
            produtoId: criado.id,
            tipo: "ENTRADA",
            quantidade,
            saldoDepois: quantidade,
            custoUnit,
            motivo: "Saldo inicial do cadastro",
            usuarioNome: guarda.usuario.nome,
          },
        });
      }

      return criado;
    });

    return NextResponse.json(semFinanceiro(produto, guarda.usuario.podeFinanceiro), { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (temCodigo(err, "P2002")) {
      return NextResponse.json({ error: "Já existe um produto com esse código" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao cadastrar o produto" }, { status: 500 });
  }
}

function temCodigo(err: unknown, codigo: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === codigo;
}
