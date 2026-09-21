import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFotos } from "@/lib/supabase-storage";
import { comUrlAssinada } from "@/lib/fotos";
import { OS_CONCLUIDA, consomeEstoque } from "@/lib/constants";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { osAtualizarSchema, valorDoItem } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";
import { custosParaSalvar } from "@/lib/custos";
import { planoDeItens } from "@/lib/itens";
import { registrarExclusao } from "@/lib/exclusoes";
import { aplicarConsumo, consumoLiquido, produtosDosItens, vinculoDoItem } from "@/lib/estoque";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;

  const os = await prisma.ordemServico.findUnique({
    where: { id },
    include: {
      cliente: true,
      veiculo: true,
      // O produto vem junto para a tela de edição saber que aquela peça veio da
      // prateleira — e mostrar o saldo de lá ao mexer na quantidade.
      itens: {
        orderBy: { createdAt: "asc" },
        include: {
          produto: { select: { id: true, nome: true, unidade: true, quantidade: true } },
        },
      },
      pagamentos: { orderBy: { data: "desc" } },
      fotos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!os) {
    return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
  }

  // Duas filtragens na saída: as fotos vão com URL assinada e temporária (lib/fotos),
  // e custo unitário, lucro e margem somem quando quem pede não é dono (lib/permissoes).
  return NextResponse.json(
    semFinanceiro({ ...os, fotos: await comUrlAssinada(os.fotos) }, guarda.usuario.podeFinanceiro)
  );
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  try {
    const {
      status,
      clienteId,
      veiculoId,
      descricao,
      defeitoRelatado,
      kmEntrada,
      kmSaida,
      desconto,
      obs,
      formaPagamento,
      mecanicoId,
      nivelCombustivel,
      combustivelEmUso,
      nps,
      itens,
    } = await lerJson(request, osAtualizarSchema);

    const current = await prisma.ordemServico.findUnique({
      where: { id },
      select: { numero: true, totalPecas: true, totalMO: true, desconto: true, custoTotalPecas: true, valorPago: true, status: true },
    });

    if (!current) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    // Peças da prateleira citadas na lista nova. `vinculos` é posicional, como
    // `custos`: id de produto que não existe mais chega como null e o item fica sem
    // vínculo, em vez de derrubar a gravação inteira com erro de chave estrangeira.
    const produtos = itens ? await produtosDosItens(itens) : new Map();
    const vinculos = itens ? itens.map((i) => vinculoDoItem(i, produtos)) : [];

    // Quando os itens são enviados (edição completa), recalcula os totais a partir deles.
    let totalPecas = current.totalPecas;
    let totalMO = current.totalMO;
    let custoTotalPecas = current.custoTotalPecas;

    // Custo dos itens: do payload quando é o dono, do banco quando é o operador —
    // que não recebe custo na leitura e, sem isto, zeraria o lucro ao salvar.
    const custos = itens ? await custosParaSalvar(itens, guarda.usuario.podeFinanceiro, { os: id }) : [];

    if (itens) {
      totalPecas = itens.filter((i) => i.tipo === "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      totalMO = itens.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      custoTotalPecas = itens.reduce(
        (s, i, idx) => (i.tipo === "PECA" ? s + (custos[idx] ?? 0) * i.quantidade : s),
        0
      );
    }

    const novoDesconto = desconto !== undefined ? desconto : current.desconto;
    const total = totalPecas + totalMO - novoDesconto;
    const lucroReal = total - custoTotalPecas;
    const margemPecas = totalPecas > 0
      ? ((totalPecas - custoTotalPecas) / totalPecas) * 100
      : 0;

    const data: Record<string, unknown> = {
      desconto: novoDesconto,
      total,
      lucroReal,
      margemPecas,
    };

    if (itens) {
      data.totalPecas = totalPecas;
      data.totalMO = totalMO;
      data.custoTotalPecas = custoTotalPecas;
      // O total mudou — recalcula se a OS está quitada.
      data.pago = current.valorPago >= total;
    }

    if (status !== undefined) data.status = status;
    if (clienteId !== undefined) data.clienteId = clienteId;
    if (veiculoId !== undefined) data.veiculoId = veiculoId;
    if (descricao !== undefined) data.descricao = descricao;
    if (defeitoRelatado !== undefined) data.defeitoRelatado = defeitoRelatado;
    if (kmEntrada !== undefined) data.kmEntrada = kmEntrada;
    if (kmSaida !== undefined) data.kmSaida = kmSaida;
    if (obs !== undefined) data.obs = obs;
    if (formaPagamento !== undefined) data.formaPagamento = formaPagamento || null;
    if (mecanicoId !== undefined) {
      data.mecanicoId = mecanicoId;
      const mec = mecanicoId
        ? await prisma.mecanico.findUnique({ where: { id: mecanicoId }, select: { nome: true } })
        : null;
      data.mecanico = mec?.nome ?? null;
    }
    if (nivelCombustivel !== undefined) data.nivelCombustivel = nivelCombustivel;
    if (combustivelEmUso !== undefined) data.combustivelEmUso = combustivelEmUso;
    if (nps !== undefined) data.nps = nps;

    // `fechamento` é a data de entrega, e é ela que decide em que semana/mês a OS conta
    // como produção. Por isso só muda na transição: reescrevê-la a cada PATCH faria uma
    // OS entregue semana passada migrar para o período atual do dashboard só por ter
    // recebido uma correção de valor hoje.
    if (status !== undefined) {
      const eraConcluida = OS_CONCLUIDA.includes(current.status);
      const viraConcluida = OS_CONCLUIDA.includes(status);
      if (viraConcluida && !eraConcluida) {
        data.fechamento = new Date();
      } else if (!viraConcluida && eraConcluida) {
        // Voltou para o pátio — deixa de ter data de fechamento.
        data.fechamento = null;
      }
    }

    // O que o estoque mexeu nesta gravação, para a tela poder confirmar a baixa em vez
    // de o saldo mudar em silêncio.
    let estoque = { baixados: 0, devolvidos: 0 };

    // Uma transação só, e não apenas quando a lista de itens vem junto: cancelar a OS
    // devolve as peças para a prateleira, e a devolução não pode acontecer separada da
    // mudança de status.
    await prisma.$transaction(async (tx) => {
      if (itens !== undefined || status !== undefined) {
        // Item que já existe é atualizado no lugar, e não recriado: trocar o id a cada
        // gravação quebraria a recuperação de custo do operador — ver lib/itens.
        const noBanco = await tx.itemOrdem.findMany({
          where: { ordemId: id },
          select: { id: true, produtoId: true, quantidade: true },
        });

        // O estoque enxerga a OS como "o que ela segura da prateleira", e só a
        // DIFERENÇA é escrita: salvar duas vezes seguidas não baixa a peça duas vezes,
        // trocar 2 por 3 tira 1, e apagar o item devolve os 2. OS cancelada não segura
        // nada — daí o `consomeEstoque` dos dois lados.
        const antes = consomeEstoque(current.status) ? noBanco : [];
        const listaNova = itens
          ? itens.map((item, idx) => ({ produtoId: vinculos[idx], quantidade: item.quantidade }))
          : noBanco;
        const depois = consomeEstoque(status ?? current.status) ? listaNova : [];

        estoque = await aplicarConsumo(tx, consumoLiquido(antes, depois), {
          ordemId: id,
          ordemNumero: current.numero,
          usuarioNome: guarda.usuario.nome,
        });

        if (itens) {
          const plano = planoDeItens(itens, custos, new Set(noBanco.map((i) => i.id)), vinculos);

          for (const { id: itemId, dados } of plano.atualizar) {
            await tx.itemOrdem.update({ where: { id: itemId }, data: dados });
          }

          // Antes de criar os novos: `manter` não os conhece, e apagar depois levaria
          // junto o que acabou de entrar.
          await tx.itemOrdem.deleteMany({ where: { ordemId: id, id: { notIn: plano.manter } } });

          if (plano.criar.length > 0) {
            await tx.itemOrdem.createMany({
              data: plano.criar.map((dados) => ({ ordemId: id, ...dados })),
            });
          }
        }
      }

      await tx.ordemServico.update({ where: { id }, data });
    });

    const os = await prisma.ordemServico.findUnique({ where: { id } });
    return NextResponse.json({
      ...semFinanceiro(os, guarda.usuario.podeFinanceiro),
      estoque,
    });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar OS" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi({ exclusao: true });
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  try {
    const os = await prisma.ordemServico.findUnique({
      where: { id },
      select: {
        numero: true,
        status: true,
        cliente: { select: { nome: true } },
        itens: { select: { produtoId: true, quantidade: true } },
      },
    });
    if (!os) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    const fotos = await prisma.fotoOS.findMany({
      where: { ordemId: id },
      select: { id: true, path: true, orcamentoId: true },
    });

    // Foto que veio do orçamento fica com ele: desliga da OS antes, senão o cascade
    // apagaria a imagem de um documento que continua existindo.
    const doOrcamento = fotos.filter((f) => f.orcamentoId);
    if (doOrcamento.length > 0) {
      await prisma.fotoOS.updateMany({
        where: { id: { in: doOrcamento.map((f) => f.id) } },
        data: { ordemId: null },
      });
    }

    await prisma.$transaction(async (tx) => {
      // A OS some, mas a peça que ela segurava não evaporou: volta para a prateleira
      // antes da exclusão. O movimento fica sem `ordemId` de propósito — a OS não vai
      // mais existir —, e `ordemNumero` é o que mantém o rastro legível.
      await aplicarConsumo(
        tx,
        consumoLiquido(consomeEstoque(os.status) ? os.itens : [], []),
        {
          ordemNumero: os.numero,
          usuarioNome: guarda.usuario.nome,
          motivo: `Devolução — OS #${os.numero} excluída`,
        }
      );
      await tx.ordemServico.delete({ where: { id } });
    });

    await deleteFotos(fotos.filter((f) => !f.orcamentoId).map((f) => f.path));
    await registrarExclusao(
      "OS",
      `OS #${os.numero} — ${os.cliente.nome}`,
      guarda.usuario
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir OS" }, { status: 500 });
  }
}
