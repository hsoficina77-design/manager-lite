import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { osCriarSchema, valorDoItem } from "@/lib/schemas";
import { guardaApi } from "@/lib/auth";
import { semFinanceiro } from "@/lib/permissoes";

export async function GET(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const pendente = searchParams.get("pendente") === "true";
  const clienteId = searchParams.get("clienteId");
  const mecanicoId = searchParams.get("mecanicoId");

  // --- filtros da lista -----------------------------------------------------
  // Antes a tela baixava todas as OS e filtrava em memória: funcionava com cem,
  // e virava uma resposta enorme no 4G do pátio com dois mil. A busca, o recorte
  // por mecânico, as datas e a ordenação passam a acontecer no banco, com página.
  const q = (searchParams.get("q") ?? "").trim();
  const mecanicoNome = searchParams.get("mecanico");
  const de = searchParams.get("de");
  const ate = searchParams.get("ate");
  const ordenar = searchParams.get("ordenar") ?? "recentes";
  const paginado = searchParams.get("paginado") === "true";
  const limite = Math.min(Math.max(Number(searchParams.get("limite")) || 40, 1), 200);
  const pagina = Math.max(Number(searchParams.get("pagina")) || 0, 0);

  const where: Record<string, unknown> = {};

  if (status) {
    const statusList = status.split(",").map((s) => s.trim());
    where.status = statusList.length === 1 ? statusList[0] : { in: statusList };
  }
  if (pendente) {
    where.pago = false;
    where.status = { not: "CANCELADA" };
  }
  if (clienteId) {
    where.clienteId = clienteId;
  }
  if (mecanicoId) {
    where.mecanicoId = mecanicoId;
  }
  if (mecanicoNome) {
    where.mecanico = mecanicoNome;
  }
  if (de || ate) {
    where.abertura = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(`${ate}T23:59:59`) } : {}),
    };
  }
  if (q) {
    // O número da OS entra na busca só quando o termo é numérico — senão o Prisma
    // recebe NaN e a consulta inteira falha.
    const numero = /^\d+$/.test(q) ? Number(q) : null;
    where.OR = [
      { cliente: { nome: { contains: q, mode: "insensitive" } } },
      { cliente: { apelido: { contains: q, mode: "insensitive" } } },
      { veiculo: { placa: { contains: q, mode: "insensitive" } } },
      { veiculo: { modelo: { contains: q, mode: "insensitive" } } },
      { mecanico: { contains: q, mode: "insensitive" } },
      { descricao: { contains: q, mode: "insensitive" } },
      ...(numero !== null ? [{ numero }] : []),
    ];
  }

  const ORDENS: Record<string, Record<string, "asc" | "desc">> = {
    recentes: { abertura: "desc" },
    lucro_desc: { lucroReal: "desc" },
    lucro_asc: { lucroReal: "asc" },
    valor_desc: { total: "desc" },
  };
  // Ordenar por lucro é informação de dono; para o operador cai no padrão.
  const podeOrdenarPorLucro = guarda.usuario.papel === "ADMIN";
  const orderBy =
    (podeOrdenarPorLucro || !ordenar.startsWith("lucro") ? ORDENS[ordenar] : null) ??
    ORDENS.recentes;

  const consulta = {
    where,
    include: {
      cliente: { select: { id: true, nome: true, telefone: true, apelido: true } },
      veiculo: { select: { id: true, marca: true, modelo: true, placa: true } },
    },
    orderBy,
  };

  // Sem `paginado` a resposta continua sendo o array de sempre — é o que os
  // outros consumidores da rota esperam.
  if (!paginado) {
    const ordens = await prisma.ordemServico.findMany(consulta);
    return NextResponse.json(semFinanceiro(ordens, guarda.usuario.papel));
  }

  const [ordens, total, agregado] = await Promise.all([
    prisma.ordemServico.findMany({ ...consulta, skip: pagina * limite, take: limite }),
    prisma.ordemServico.count({ where }),
    // O resumo é do filtro inteiro, não da página em tela: somar só o que veio
    // daria um faturamento que muda conforme a pessoa rola.
    prisma.ordemServico.aggregate({
      where: { ...where, status: { not: "CANCELADA" } },
      _sum: { total: true, lucroReal: true },
      _count: true,
    }),
  ]);

  const faturamento = agregado._sum.total ?? 0;
  const lucro = agregado._sum.lucroReal ?? 0;

  return NextResponse.json({
    itens: semFinanceiro(ordens, guarda.usuario.papel),
    total,
    temMais: (pagina + 1) * limite < total,
    resumo: {
      quantidade: agregado._count,
      faturamento,
      ...(guarda.usuario.papel === "ADMIN"
        ? { lucro, margem: faturamento > 0 ? (lucro / faturamento) * 100 : null }
        : {}),
    },
  });
}

export async function POST(request: Request) {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;

  // Operador não vê custo — logo, também não define custo. OS aberta por ele nasce
  // sem custo de peça, e o dono preenche depois.
  const podeDefinirCusto = guarda.usuario.papel === "ADMIN";
  const custoDoItem = (item: { custoUnit?: unknown }) =>
    podeDefinirCusto && item.custoUnit != null && item.custoUnit !== ""
      ? Number(item.custoUnit)
      : null;

  try {
    const {
      clienteId,
      veiculoId,
      descricao,
      defeitoRelatado,
      kmEntrada,
      obs,
      mecanicoId,
      nivelCombustivel,
      combustivelEmUso,
      itens,
    } = await lerJson(request, osCriarSchema);

    // Resolve o nome do mecânico para gravar denormalizado (compat com PDF/listas).
    let mecanicoNome: string | null = null;
    if (mecanicoId) {
      const mec = await prisma.mecanico.findUnique({
        where: { id: mecanicoId },
        select: { nome: true },
      });
      mecanicoNome = mec?.nome ?? null;
    }

    const totalPecas = itens
      .filter((i) => i.tipo === "PECA")
      .reduce((sum, i) => sum + valorDoItem(i), 0);

    const totalMO = itens
      .filter((i) => i.tipo !== "PECA")
      .reduce((sum, i) => sum + valorDoItem(i), 0);

    const custoTotalPecas = itens
      .filter((i) => i.tipo === "PECA")
      .reduce((sum, i) => sum + (custoDoItem(i) ?? 0) * i.quantidade, 0);

    const total = totalPecas + totalMO;
    const lucroReal = total - custoTotalPecas;
    const margemPecas = totalPecas > 0 ? ((totalPecas - custoTotalPecas) / totalPecas) * 100 : 0;

    const os = await prisma.$transaction(async (tx) => {
      const seq = await tx.sequencia.upsert({
        where: { id: "os" },
        update: { ultimo: { increment: 1 } },
        create: { id: "os", ultimo: 1 },
      });

      return tx.ordemServico.create({
        data: {
          numero: seq.ultimo,
          clienteId,
          veiculoId,
          descricao,
          defeitoRelatado: defeitoRelatado ?? null,
          kmEntrada: kmEntrada ?? null,
          obs: obs ?? null,
          mecanicoId: mecanicoId ?? null,
          mecanico: mecanicoNome,
          nivelCombustivel: nivelCombustivel ?? null,
          combustivelEmUso: combustivelEmUso ?? null,
          totalPecas,
          totalMO,
          total,
          custoTotalPecas,
          lucroReal,
          margemPecas,
          itens: {
            create: itens.map((item) => ({
              tipo: item.tipo,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valorUnit: item.valorUnit,
              valorTotal: valorDoItem(item),
              custoUnit: custoDoItem(item),
              fornecedor: item.fornecedor ?? null,
            })),
          },
        },
        include: {
          cliente: true,
          veiculo: true,
          itens: true,
        },
      });
    });

    return NextResponse.json(semFinanceiro(os, guarda.usuario.papel), { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar OS" }, { status: 500 });
  }
}
