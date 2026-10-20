import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { atualizarLoja } from "@/lib/balcao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { lojaAlterarSchema } from "@/lib/schemas-peca-peca";

/**
 * Edita o cadastro, ou liga e desliga a loja. Loja desligada some da tela de cotação
 * das oficinas e o link do balcão para de abrir; as cotações antigas continuam.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;
  const { id } = await params;
  try {
    const dados = await lerJson(request, lojaAlterarSchema);
    const loja = await atualizarLoja(id, dados);
    if (!loja) return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    return NextResponse.json(loja);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a loja" }, { status: 500 });
  }
}
