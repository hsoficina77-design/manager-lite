import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const clientes = await prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { apelido: { contains: q, mode: "insensitive" } },
            { telefone: { contains: q } },
            { cpfCnpj: { contains: q } },
          ],
        }
      : undefined,
    include: {
      _count: { select: { veiculos: true, ordens: true } },
    },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, telefone, cpfCnpj, email, obs, apelido, origem, profissao, telefones, cep, endereco, cidade, estado, veiculo } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
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
        ...(veiculo?.marca?.trim() && veiculo?.modelo?.trim()
          ? {
              veiculos: {
                create: {
                  marca: veiculo.marca.trim(),
                  modelo: veiculo.modelo.trim(),
                  placa: veiculo.placa?.trim().toUpperCase() || null,
                  cor: veiculo.cor?.trim() || null,
                  ano: veiculo.ano ? Number(veiculo.ano) : null,
                  motorizacao: veiculo.cilindrada?.trim() || null,
                  combustivel: veiculo.combustivel?.trim() || null,
                  combustivelEmUso: veiculo.combustivelEmUso?.trim() || null,
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "CPF/CNPJ já cadastrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
