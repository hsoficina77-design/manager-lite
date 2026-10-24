import { guardaDaPlataforma, mudarPessoa } from "@/lib/equipe-rotas";

type Params = { params: Promise<{ id: string; pessoaId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, pessoaId } = await params;
  const guarda = await guardaDaPlataforma(id);
  if (guarda.resposta) return guarda.resposta;
  return mudarPessoa(request, guarda.quem, pessoaId);
}
