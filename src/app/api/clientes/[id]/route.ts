import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      veiculos: { orderBy: { createdAt: "asc" } },
      ordens: {
        include: { veiculo: true },
        orderBy: { abertura: "desc" },
        take: 20,
      },
    },
  });

  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(cliente);
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
