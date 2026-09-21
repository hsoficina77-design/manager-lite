import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { produtoAtualizarSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";
import { textoDeBusca } from "@/lib/estoque";
import { registrarExclusao } from "@/lib/exclusoes";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  const produto = await prisma.produto.findUnique({
    where: { id },
    include: {
      movimentos: { orderBy: { createdAt: "desc" }, take: 30 },
      _count: { select: { itensOrdem: true } },
    },
  });

  if (!produto) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }
  return NextResponse.json(semFinanceiro(produto, guarda.usuario.podeFinanceiro));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  try {
    const dados = await lerJson(request, produtoAtualizarSchema);

    const atual = await prisma.produto.findUnique({
      where: { id },
      select: { nome: true, codigo: true, fornecedor: true },
    });
    if (!atual) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (dados.nome !== undefined) data.nome = dados.nome;
    if (dados.codigo !== undefined) data.codigo = dados.codigo;
    if (dados.unidade !== undefined) data.unidade = dados.unidade;
    if (dados.valorVenda !== undefined) data.valorVenda = dados.valorVenda;
    if (dados.estoqueMinimo !== undefined) data.estoqueMinimo = dados.estoqueMinimo;
    if (dados.fornecedor !== undefined) data.fornecedor = dados.fornecedor;
    if (dados.obs !== undefined) data.obs = dados.obs;
    if (dados.ativo !== undefined) data.ativo = dados.ativo;

    // O operador não recebe `custoUnit` na leitura, então o formulário dele o devolve
    // vazio: aceitar esse vazio zeraria o custo da peça e inflaria o lucro do dono —
    // o mesmo buraco que lib/custos fecha no item da OS.
    if (dados.custoUnit !== undefined && guarda.usuario.podeFinanceiro) {
      data.custoUnit = dados.custoUnit;
    }

    // O texto da busca acompanha os três campos que o compõem, venha um ou venham
    // todos — senão renomear a peça a tiraria do campo de peça da OS.
    //
    // A comparação é com `undefined`, e não `??`: um campo limpo chega como null, e
    // `??` o trocaria pelo valor antigo — o código apagado continuaria encontrando a
    // peça na busca depois de ter sumido da tela.
    data.busca = textoDeBusca({
      nome: dados.nome !== undefined ? dados.nome : atual.nome,
      codigo: dados.codigo !== undefined ? dados.codigo : atual.codigo,
      fornecedor: dados.fornecedor !== undefined ? dados.fornecedor : atual.fornecedor,
    });

    const produto = await prisma.produto.update({ where: { id }, data });
    return NextResponse.json(semFinanceiro(produto, guarda.usuario.podeFinanceiro));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (temCodigo(err, "P2002")) {
      return NextResponse.json({ error: "Já existe um produto com esse código" }, { status: 409 });
    }
    if (temCodigo(err, "P2025")) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar o produto" }, { status: 500 });
  }
}

/**
 * Exclusão definitiva.
 *
 * As OS que já usaram a peça não são tocadas: o item perde o vínculo e continua com a
 * descrição e o preço cobrados (onDelete: SetNull na migração). O que some é o
 * cadastro e o histórico de prateleira dele — por isso a tela oferece "desativar"
 * primeiro, que tira da busca sem apagar nada.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ exclusao: true });
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  try {
    const produto = await prisma.produto.findUnique({
      where: { id },
      select: { nome: true, codigo: true },
    });
    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    await prisma.produto.delete({ where: { id } });
    await registrarExclusao(
      "Produto",
      `${produto.nome}${produto.codigo ? ` (${produto.codigo})` : ""}`,
      guarda.usuario
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir o produto" }, { status: 500 });
  }
}

function temCodigo(err: unknown, codigo: string): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === codigo;
}
