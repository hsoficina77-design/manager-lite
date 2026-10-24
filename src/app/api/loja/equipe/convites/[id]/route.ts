import { guardaLoja } from "@/lib/conta-loja";
import { cancelarConvite } from "@/lib/equipe-rotas";

/** Cancela um convite ainda aberto (o link para de valer na hora). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaLoja("loja.equipe");
  if (guarda.resposta) return guarda.resposta;
  const { conta } = guarda;
  const { id } = await params;
  return cancelarConvite({ lojaId: conta.loja.id, acessos: conta.permissoes, criadoPor: conta.id }, id);
}
