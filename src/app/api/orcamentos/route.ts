import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { orcamentoCriarSchema, valorDoItem } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";
import { produtosDosItens, vinculoDoItem } from "@/lib/estoque";

export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clienteId = searchParams.get("clienteId");

  const where: Record<string, unknown> = {};

  if (status) {
    const statusList = status.split(",").map((s) => s.trim());
    where.status = statusList.length === 1 ? statusList[0] : { in: statusList };
  }
  if (clienteId) {
    where.clienteId = clienteId;
  }

  const orcamentos = await prisma.orcamento.findMany({
    where,
    include: {
      cliente: { select: { id: true, nome: true, telefone: true, apelido: true } },
      veiculo: { select: { id: true, marca: true, modelo: true, placa: true } },
      ordem: { select: { id: true, numero: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(semFinanceiro(orcamentos, guarda.usuario.podeFinanceiro));
}

export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  // Quem não vê custo também não o define.
  const podeDefinirCusto = guarda.usuario.podeFinanceiro;

  try {
    const {
      clienteId,
      veiculoId,
      clienteNome,
      clienteTelefone,
      veiculoDesc,
      descricao,
      validade,
      obs,
      itens,
    } = await lerJson(request, orcamentoCriarSchema);

    // Rascunho: sem cliente cadastrado, basta uma identificação livre — mas alguma
    // identificação é obrigatória, senão o orçamento fica impossível de reconhecer.
    if (!clienteId && !clienteNome) {
      return NextResponse.json(
        { error: "Informe o cliente cadastrado ou ao menos um nome de referência" },
        { status: 400 }
      );
    }
    if (!descricao && itens.length === 0) {
      return NextResponse.json(
        { error: "Descreva o serviço ou adicione ao menos um item" },
        { status: 400 }
      );
    }

    const totalPecas = itens
      .filter((i) => i.tipo === "PECA")
      .reduce((sum, i) => sum + valorDoItem(i), 0);
    const totalMO = itens
      .filter((i) => i.tipo !== "PECA")
      .reduce((sum, i) => sum + valorDoItem(i), 0);
    const total = totalPecas + totalMO;

    // O orçamento guarda de onde a peça veio, mas **não** dá baixa: proposta não tira
    // nada da prateleira. O vínculo existe para a conversão em OS herdá-lo — e é lá
    // que a peça sai. Como a gravação é a mesma do item da OS, o custo da peça de
    // estoque também é o do produto quando quem lança não pode digitá-lo.
    const produtos = await produtosDosItens(itens);
    const vinculoDe = (item: { produtoId?: string | null }) => vinculoDoItem(item, produtos);

    const orcamento = await prisma.$transaction(async (tx) => {
      const seq = await tx.sequencia.upsert({
        where: { id: "orcamento" },
        update: { ultimo: { increment: 1 } },
        create: { id: "orcamento", ultimo: 1 },
      });

      return tx.orcamento.create({
        data: {
          numero: seq.ultimo,
          clienteId: clienteId ?? null,
          veiculoId: veiculoId ?? null,
          // Só guarda os dados livres quando não há cadastro — evita duas versões
          // do mesmo dado divergindo depois.
          clienteNome: clienteId ? null : clienteNome ?? null,
          clienteTelefone: clienteId ? null : clienteTelefone ?? null,
          veiculoDesc: veiculoId ? null : veiculoDesc ?? null,
          descricao: descricao ?? null,
          validade: validade ?? null,
          obs: obs ?? null,
          totalPecas,
          totalMO,
          total,
          itens: {
            create: itens.map((item) => {
              const produtoId = vinculoDe(item);
              return {
                produtoId,
                tipo: item.tipo,
                descricao: item.descricao,
                quantidade: item.quantidade,
                valorUnit: item.valorUnit,
                valorTotal: valorDoItem(item),
                // Orçamento novo: todo item é novo, então não há custo no banco a
                // preservar — o do operador simplesmente não entra, a menos que a peça
                // tenha vindo do estoque e o custo dela seja conhecido.
                custoUnit:
                  (podeDefinirCusto ? item.custoUnit ?? null : null) ??
                  (produtoId ? produtos.get(produtoId)!.custoUnit : null),
                fornecedor: item.fornecedor ?? null,
              };
            }),
          },
        },
        include: { cliente: true, veiculo: true, itens: true },
      });
    });

    return NextResponse.json(semFinanceiro(orcamento, guarda.usuario.podeFinanceiro), { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar orçamento" }, { status: 500 });
  }
}
