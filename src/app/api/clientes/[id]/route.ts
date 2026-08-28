import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OS_EM_ABERTO } from "@/lib/constants";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;

  const [cliente, agg, primeiraOS, ultimaOS, osAbertas] = await Promise.all([
    prisma.cliente.findUnique({
      where: { id },
      include: {
        veiculos: { orderBy: { createdAt: "asc" } },
        ordens: {
          include: { veiculo: true },
          orderBy: { abertura: "desc" },
          take: 20,
        },
      },
    }),
    prisma.ordemServico.aggregate({
      where: { clienteId: id, status: { not: "CANCELADA" } },
      _count: { _all: true },
      _avg: { nps: true },
      _sum: { total: true, totalMO: true, totalPecas: true, lucroReal: true, valorPago: true },
    }),
    prisma.ordemServico.findFirst({
      where: { clienteId: id, status: { not: "CANCELADA" } },
      orderBy: { abertura: "asc" },
      select: { abertura: true },
    }),
    prisma.ordemServico.findFirst({
      where: { clienteId: id, status: { not: "CANCELADA" } },
      orderBy: { abertura: "desc" },
      select: { abertura: true },
    }),
    prisma.ordemServico.count({
      where: { clienteId: id, status: { in: OS_EM_ABERTO } },
    }),
  ]);

  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const totalOS = agg._count._all;
  const totalFaturado = agg._sum.total ?? 0;
  const totalRecebido = agg._sum.valorPago ?? 0;

  const stats = {
    totalOS,
    osAbertas,
    totalFaturado,
    totalMO: agg._sum.totalMO ?? 0,
    totalPecas: agg._sum.totalPecas ?? 0,
    lucroTotal: agg._sum.lucroReal ?? 0,
    totalRecebido,
    totalPendente: totalFaturado - totalRecebido,
    ticketMedio: totalOS > 0 ? totalFaturado / totalOS : 0,
    npsMedio: agg._avg.nps,
    primeiraOS: primeiraOS?.abertura ?? null,
    ultimaOS: ultimaOS?.abertura ?? null,
  };

  return NextResponse.json(semFinanceiro({ ...cliente, stats }, guarda.usuario.papel));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { nome, telefone, cpfCnpj, email, obs, apelido, origem, profissao, telefones, cep, endereco, cidade, estado } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nome: nome.trim(),
        telefone: telefone?.trim() || null,
        cpfCnpj: cpfCnpj?.trim() || null,
        email: email?.trim() || null,
        obs: obs?.trim() || null,
        apelido: apelido?.trim() || null,
        origem: origem?.trim() || null,
        profissao: profissao?.trim() || null,
        telefones: Array.isArray(telefones) ? telefones.filter(Boolean) : [],
        cep: cep?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        estado: estado?.trim() || null,
      },
    });

    return NextResponse.json(cliente);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "CPF/CNPJ já cadastrado" }, { status: 409 });
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const osCount = await prisma.ordemServico.count({ where: { clienteId: id } });
  if (osCount > 0) {
    return NextResponse.json(
      { error: "Cliente possui ordens de serviço e não pode ser excluído" },
      { status: 409 }
    );
  }

  try {
    await prisma.cliente.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir cliente" }, { status: 500 });
  }
}
