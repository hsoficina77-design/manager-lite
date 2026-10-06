import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { definirOficinaAtiva, estenderTeste, liberarCortesia } from "@/lib/sistema";
import { lerJsonCru, respostaDeValidacao } from "@/lib/validacao";
import { registroNaoEncontrado } from "@/lib/db-oficina";

/**
 * Ações do dono da plataforma sobre uma oficina:
 *
 *   { ativa: boolean }                    suspende ou reativa (suspender tira todo mundo na hora)
 *   { acao: "estenderTeste", dias: n }    mais n dias de teste grátis
 *   { acao: "cortesia" }                  tira o prazo — liberada, como as oficinas antigas
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const { id } = await params;
    const corpo = (await lerJsonCru(request)) as Record<string, unknown> | null;

    if (corpo?.acao === "estenderTeste") {
      const dias = Number(corpo.dias);
      if (!Number.isInteger(dias) || dias < 1 || dias > 60) {
        return NextResponse.json({ error: "Informe de 1 a 60 dias" }, { status: 400 });
      }
      const oficina = await estenderTeste(id, dias);
      return NextResponse.json({ id: oficina.id, testeAte: oficina.testeAte });
    }
    if (corpo?.acao === "cortesia") {
      const oficina = await liberarCortesia(id);
      return NextResponse.json({ id: oficina.id });
    }

    if (typeof corpo?.ativa !== "boolean") {
      return NextResponse.json({ error: "Informe se a oficina fica ativa" }, { status: 400 });
    }

    const oficina = await definirOficinaAtiva(id, corpo.ativa, guarda.oficinaId);
    return NextResponse.json({ id: oficina.id, ativa: oficina.ativa });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (err instanceof Error && err.message.includes("própria oficina")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (registroNaoEncontrado(err)) {
      return NextResponse.json({ error: "Oficina não encontrada" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a oficina" }, { status: 500 });
  }
}
