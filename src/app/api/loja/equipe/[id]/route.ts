import { guardaLoja } from "@/lib/conta-loja";
import { mudarPessoa } from "@/lib/equipe-rotas";

/** Muda os acessos de alguém da loja, ou liga e desliga a pessoa. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaLoja("loja.equipe");
  if (guarda.resposta) return guarda.resposta;
  const { conta } = guarda;
  const { id } = await params;
  return mudarPessoa(request, { lojaId: conta.loja.id, acessos: conta.permissoes, criadoPor: conta.id }, id);
}
