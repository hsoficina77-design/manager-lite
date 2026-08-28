import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFotos } from "@/lib/supabase-storage";
import { OS_CONCLUIDA } from "@/lib/constants";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";
import { custosParaSalvar, type ItemEntrada } from "@/lib/custos";

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
      itens: { orderBy: { createdAt: "asc" } },
      pagamentos: { orderBy: { data: "desc" } },
      fotos: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!os) {
    return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
  }

  // Some com custo unitário dos itens, lucro e margem quando quem pede não é dono.
  return NextResponse.json(semFinanceiro(os, guarda.usuario.papel));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;
  try {
    const body = await request.json();
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
    } = body;

    const current = await prisma.ordemServico.findUnique({
      where: { id },
      select: { totalPecas: true, totalMO: true, desconto: true, custoTotalPecas: true, valorPago: true, status: true },
    });

    if (!current) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    // Quando os itens são enviados (edição completa), recalcula os totais a partir deles.
    const temItens = Array.isArray(itens);
    let totalPecas = current.totalPecas;
    let totalMO = current.totalMO;
    let custoTotalPecas = current.custoTotalPecas;

    // Custo dos itens: do payload quando é o dono, do banco quando é o operador —
    // que não recebe custo na leitura e, sem isto, zeraria o lucro ao salvar.
    const custos = temItens
      ? await custosParaSalvar(itens as ItemEntrada[], guarda.usuario.papel, { os: id })
      : [];

    if (temItens) {
      const lista = itens as any[];
      const valorDoItem = (i: any) => Number(i.valorTotal ?? Number(i.quantidade) * Number(i.valorUnit));
      totalPecas = lista.filter((i) => i.tipo === "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      totalMO = lista.filter((i) => i.tipo !== "PECA").reduce((s, i) => s + valorDoItem(i), 0);
      custoTotalPecas = lista.reduce(
        (s, i, idx) => (i.tipo === "PECA" ? s + (custos[idx] ?? 0) * Number(i.quantidade) : s),
        0
      );
    }

    const novoDesconto = desconto !== undefined ? Number(desconto) : current.desconto;
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

    if (temItens) {
      data.totalPecas = totalPecas;
      data.totalMO = totalMO;
      data.custoTotalPecas = custoTotalPecas;
      // O total mudou — recalcula se a OS está quitada.
      data.pago = current.valorPago >= total;
    }

    if (status !== undefined) data.status = status;
    if (clienteId !== undefined) data.clienteId = clienteId;
    if (veiculoId !== undefined) data.veiculoId = veiculoId;
    if (descricao !== undefined) data.descricao = descricao.trim();
    if (defeitoRelatado !== undefined) data.defeitoRelatado = defeitoRelatado?.trim() || null;
    if (kmEntrada !== undefined) data.kmEntrada = kmEntrada ? Number(kmEntrada) : null;
    if (kmSaida !== undefined) data.kmSaida = kmSaida ? Number(kmSaida) : null;
    if (obs !== undefined) data.obs = obs?.trim() || null;
    if (formaPagamento !== undefined) data.formaPagamento = formaPagamento || null;
    if (mecanicoId !== undefined) {
      data.mecanicoId = mecanicoId || null;
      const mec = mecanicoId
        ? await prisma.mecanico.findUnique({ where: { id: mecanicoId }, select: { nome: true } })
        : null;
      data.mecanico = mec?.nome ?? null;
    }
    if (nivelCombustivel !== undefined) data.nivelCombustivel = nivelCombustivel || null;
    if (combustivelEmUso !== undefined) data.combustivelEmUso = combustivelEmUso || null;
    if (nps !== undefined) data.nps = nps ? Number(nps) : null;

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

    if (temItens) {
      const lista = itens as any[];
      await prisma.$transaction(async (tx) => {
        await tx.itemOrdem.deleteMany({ where: { ordemId: id } });
        if (lista.length > 0) {
          await tx.itemOrdem.createMany({
            data: lista.map((i, idx) => ({
              ordemId: id,
              tipo: i.tipo || "PECA",
              descricao: String(i.descricao).trim(),
              quantidade: Number(i.quantidade),
              valorUnit: Number(i.valorUnit),
              valorTotal: Number(i.valorTotal ?? Number(i.quantidade) * Number(i.valorUnit)),
              custoUnit: custos[idx],
              fornecedor: i.fornecedor?.trim() || null,
            })),
          });
        }
        await tx.ordemServico.update({ where: { id }, data });
      });
    } else {
      await prisma.ordemServico.update({ where: { id }, data });
    }

    const os = await prisma.ordemServico.findUnique({ where: { id } });
    return NextResponse.json(semFinanceiro(os, guarda.usuario.papel));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar OS" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const fotos = await prisma.fotoOS.findMany({ where: { ordemId: id }, select: { path: true } });
    await prisma.ordemServico.delete({ where: { id } });
    await deleteFotos(fotos.map((f) => f.path));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir OS" }, { status: 500 });
  }
}
