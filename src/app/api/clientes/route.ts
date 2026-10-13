import { NextResponse } from "next/server";
import { dadosVeiculo, erroVeiculo } from "@/lib/veiculo";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { clienteCriarSchema } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";

export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  const clientes = await db.cliente.findMany({
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
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;

  try {
    const { nome, telefone, cpfCnpj, email, obs, apelido, origem, profissao, telefones, cep, endereco, cidade, estado, veiculo } =
      await lerJson(request, clienteCriarSchema);

    const dadosNovoVeiculo = veiculo ? dadosVeiculo(veiculo) : null;
    if (dadosNovoVeiculo && erroVeiculo(dadosNovoVeiculo)) {
      return NextResponse.json({ error: erroVeiculo(dadosNovoVeiculo) }, { status: 400 });
    }

    // A placa não se repete na oficina, e o cadastro rápido da OS traz cliente e carro
    // juntos. Confere antes porque, se a trava do banco estourar, o Prisma não diz qual
    // campo repetiu (`target` vem nulo) — e a única resposta possível seria "CPF/CNPJ já
    // cadastrado" para quem nem informou CPF.
    if (dadosNovoVeiculo?.placa) {
      const mesmaPlaca = await db.veiculo.findFirst({
        where: { placa: dadosNovoVeiculo.placa },
        select: { id: true },
      });
      if (mesmaPlaca) {
        return NextResponse.json(
          { error: "Essa placa já está cadastrada em outro cliente. Procure pela placa em Clientes." },
          { status: 409 }
        );
      }
    }

    const cliente = await db.cliente.create({
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
        // Veículo é opcional aqui; sem marca/modelo o cliente entra sozinho.
        ...(dadosNovoVeiculo ? { veiculos: { create: dadosNovoVeiculo } } : {}),
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (err: any) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (err.code === "P2002") {
      return NextResponse.json({ error: "CPF/CNPJ já cadastrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
