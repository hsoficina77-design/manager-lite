import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lojasQueAtendem } from "@/lib/balcao";
import { getConfiguracao } from "@/lib/configuracao-db";
import { listarCotacoes } from "@/lib/cotacoes";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { cotacaoCriarSchema } from "@/lib/schemas-peca-peca";
import { normalizarPlaca } from "@/components/peca-peca/regras";

export async function GET() {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  return NextResponse.json(await listarCotacoes(guarda.db));
}

export async function POST(request: Request) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { transacao, oficinaId } = guarda;

  try {
    const dados = await lerJson(request, cotacaoCriarSchema);

    // Só vai para loja ativa que atende a cidade da oficina — a mesma lista da tela.
    const { cidade, estado } = await getConfiguracao(guarda);
    const daRegiao = new Set((await lojasQueAtendem(cidade, estado)).map((l) => l.id));
    const lojas = [...new Set(dados.lojas)].filter((l) => daRegiao.has(l));
    if (lojas.length === 0) {
      return NextResponse.json({ error: "Escolha ao menos uma loja que atenda a sua cidade" }, { status: 400 });
    }

    // Um carro, uma cotação: cada uma tem número, orçamento e entrega próprios.
    // Tudo numa transação só — ou saem todas, ou nenhuma.
    const criadas = await transacao(async (tx) => {
      const feitas: { id: string; numero: number }[] = [];
      for (const carro of dados.carros) {
        const v = carro.veiculo;
        // O carro achado pela placa só entra se for desta oficina — o filtro devolve
        // nulo para id de outra, e aí a cotação segue só com os dados digitados.
        const doCadastro = carro.veiculoId
          ? await tx.veiculo.findUnique({ where: { id: carro.veiculoId }, select: { id: true, clienteId: true } })
          : null;

        const seq = await tx.sequencia.upsert({
          where: { oficinaId_id: { oficinaId, id: "cotacao" } },
          update: { ultimo: { increment: 1 } },
          create: { id: "cotacao", ultimo: 1 },
        });

        feitas.push(
          await tx.cotacao.create({
            data: {
              numero: seq.ultimo,
              placa: normalizarPlaca(v.placa) || null,
              marca: v.marca,
              modelo: v.modelo,
              ano: v.ano,
              motor: v.motor,
              observacao: carro.observacao || null,
              formaPagamento: dados.formaPagamento,
              veiculoId: doCadastro?.id ?? null,
              clienteId: doCadastro?.clienteId ?? null,
              pecas: {
                create: carro.pecas.map((p, ordem) => ({ ordem, descricao: p.descricao, quantidade: p.quantidade })),
              },
              envios: { create: lojas.map((lojaId) => ({ lojaId })) },
            },
            select: { id: true, numero: true },
          })
        );
      }
      return feitas;
    });

    // `id` e `numero` da primeira continuam no topo para quem manda um carro só.
    return NextResponse.json({ ...criadas[0], cotacoes: criadas }, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar a cotação" }, { status: 500 });
  }
}
