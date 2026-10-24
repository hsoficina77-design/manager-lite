import { cancelarConvite, guardaDaPlataforma } from "@/lib/equipe-rotas";

type Params = { params: Promise<{ id: string; conviteId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, conviteId } = await params;
  const guarda = await guardaDaPlataforma(id);
  if (guarda.resposta) return guarda.resposta;
  return cancelarConvite(guarda.quem, conviteId);
}
