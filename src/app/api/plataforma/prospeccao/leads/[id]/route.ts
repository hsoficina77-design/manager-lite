import { NextResponse } from "next/server";
import { z } from "zod";
import { guardaApi } from "@/lib/auth";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { registroNaoEncontrado } from "@/lib/db-oficina";
import { ETAPAS_MANUAIS } from "@/lib/prospeccao";
import { atualizarLead } from "@/lib/prospeccao-banco";

const corpo = z
  .object({
    etapa: z.enum(ETAPAS_MANUAIS),
    motivoPerda: z.string().trim().max(300).nullable(),
    naoContatar: z.boolean(),
    temWhatsapp: z.boolean().nullable(),
    oficinaId: z.string().max(60).nullable(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, "Nada para mudar");

/** Etapa, "não contatar", conferência do WhatsApp e ligação manual com a conta. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const { id } = await params;
    const dados = await lerJson(request, corpo);
    const lead = await atualizarLead(id, dados, guarda.usuario.email);
    return NextResponse.json({ id: lead.id });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (registroNaoEncontrado(err)) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar o lead" }, { status: 500 });
  }
}
