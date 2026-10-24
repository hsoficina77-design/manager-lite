import { guardaDaPlataforma, novoAcesso } from "@/lib/equipe-rotas";

type Params = { params: Promise<{ id: string; pessoaId: string }> };

/** "Novo acesso" dado pela plataforma — o dono da loja que esqueceu a senha. */
export async function POST(_request: Request, { params }: Params) {
  const { id, pessoaId } = await params;
  const guarda = await guardaDaPlataforma(id);
  if (guarda.resposta) return guarda.resposta;
  return novoAcesso(guarda.quem, pessoaId);
}
