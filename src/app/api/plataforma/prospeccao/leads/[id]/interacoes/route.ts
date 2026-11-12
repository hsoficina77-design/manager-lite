import { NextResponse } from "next/server";
import { z } from "zod";
import { guardaApi } from "@/lib/auth";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { registroNaoEncontrado } from "@/lib/db-oficina";
import { REGRAS } from "@/lib/prospeccao";
import { registrarInteracao } from "@/lib/prospeccao-banco";

const IDS_DAS_REGRAS = REGRAS.map((r) => r.id) as [string, ...string[]];

const corpo = z.object({
  tipo: z.enum(["NOTA", "MENSAGEM", "PULOU"]),
  texto: z.string().trim().min(1, "Escreva alguma coisa").max(5000),
  regra: z.enum(IDS_DAS_REGRAS).nullable().default(null),
});

/** Anotação, mensagem enviada (cumprindo ou não uma tarefa do dia) ou tarefa pulada. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const { id } = await params;
    const dados = await lerJson(request, corpo);
    const interacao = await registrarInteracao(id, dados, guarda.usuario.email);
    return NextResponse.json({ id: interacao.id });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (registroNaoEncontrado(err)) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao registrar" }, { status: 500 });
  }
}
