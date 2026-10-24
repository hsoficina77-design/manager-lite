import { guardaLoja } from "@/lib/conta-loja";
import { novoAcesso } from "@/lib/equipe-rotas";

/** "Novo acesso": link de uso único para a pessoa definir outra senha (esqueceu a dela). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaLoja("loja.equipe");
  if (guarda.resposta) return guarda.resposta;
  const { conta } = guarda;
  const { id } = await params;
  return novoAcesso({ lojaId: conta.loja.id, acessos: conta.permissoes, criadoPor: conta.id }, id);
}
