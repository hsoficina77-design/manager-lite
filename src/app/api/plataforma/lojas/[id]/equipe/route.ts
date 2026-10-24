import { convidar, guardaDaPlataforma, listarEquipe } from "@/lib/equipe-rotas";

// Equipe de uma loja, pelo painel admin: a plataforma convida o dono e destrava o que
// for preciso. As mesmas rotas do painel da loja, com todos os acessos.

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const guarda = await guardaDaPlataforma(id);
  if (guarda.resposta) return guarda.resposta;
  return listarEquipe(id);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const guarda = await guardaDaPlataforma(id);
  if (guarda.resposta) return guarda.resposta;
  return convidar(request, guarda.quem);
}
