import { NextResponse } from "next/server";
import { OS_EM_ABERTO } from "@/lib/constants";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { clienteAtualizarSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";
import { registrarExclusao } from "@/lib/exclusoes";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const { id } = await params;

  const [cliente, agg, primeiraOS, ultimaOS, osAbertas] = await Promise.all([
    db.cliente.findUnique({
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
    db.ordemServico.aggregate({
      where: { clienteId: id, status: { not: "CANCELADA" } },
      _count: { _all: true },
      _avg: { nps: true },
      _sum: { total: true, totalMO: true, totalPecas: true, lucroReal: true, valorPago: true },
    }),
    db.ordemServico.findFirst({
      where: { clienteId: id, status: { not: "CANCELADA" } },
      orderBy: { abertura: "asc" },
      select: { abertura: true },
    }),
    db.ordemServico.findFirst({
      where: { clienteId: id, status: { not: "CANCELADA" } },
      orderBy: { abertura: "desc" },
      select: { abertura: true },
    }),
    db.ordemServico.count({
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

  return NextResponse.json(semFinanceiro({ ...cliente, stats }, guarda.usuario.podeFinanceiro));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const { id } = await params;
  try {
    const { nome, telefone, cpfCnpj, email, obs, apelido, origem, profissao, telefones, cep, endereco, cidade, estado } =
      await lerJson(request, clienteAtualizarSchema);

    const cliente = await db.cliente.update({
      where: { id },
      data: {
        nome,
        telefone: telefone ?? null,
        cpfCnpj: cpfCnpj ?? null,
        email: email ?? null,
        obs: obs ?? null,
        apelido: apelido ?? null,
        origem: origem ?? null,
        profissao: profissao ?? null,
        telefones: telefones ?? [],
        cep: cep ?? null,
        endereco: endereco ?? null,
        cidade: cidade ?? null,
        estado: estado ?? null,
      },
    });

    return NextResponse.json(cliente);
  } catch (err: any) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
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
  const guarda = await guardaApi({ exclusao: true });
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const { id } = await params;

  const osCount = await db.ordemServico.count({ where: { clienteId: id } });
  if (osCount > 0) {
    return NextResponse.json(
      { error: "Cliente possui ordens de serviço e não pode ser excluído" },
      { status: 409 }
    );
  }

  try {
    const cliente = await db.cliente.findUnique({ where: { id }, select: { nome: true } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    await db.cliente.delete({ where: { id } });
    await registrarExclusao(db, "Cliente", cliente.nome, guarda.usuario);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir cliente" }, { status: 500 });
  }
}
