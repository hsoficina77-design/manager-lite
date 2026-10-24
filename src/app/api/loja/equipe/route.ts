import { guardaLoja } from "@/lib/conta-loja";
import { convidar, listarEquipe } from "@/lib/equipe-rotas";

// Equipe da loja, no painel dela: só quem tem o acesso "Cuidar da equipe".

export async function GET() {
  const guarda = await guardaLoja("loja.equipe");
  if (guarda.resposta) return guarda.resposta;
  return listarEquipe(guarda.conta.loja.id);
}

export async function POST(request: Request) {
  const guarda = await guardaLoja("loja.equipe");
  if (guarda.resposta) return guarda.resposta;
  const { conta } = guarda;
  return convidar(request, { lojaId: conta.loja.id, acessos: conta.permissoes, criadoPor: conta.id });
}
