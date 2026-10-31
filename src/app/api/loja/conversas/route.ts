import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { conversasDaLoja, faxinaDasConversas, naoLidasDaLoja } from "@/lib/conversa";
import { CAMINHOS_DO_PAINEL } from "@/components/peca-peca/caminhos";

/**
 * A caixa "Conversas" da loja. Com `?total=1`, só quantas mensagens das oficinas a loja
 * não leu — é o que o menu pergunta de tempos em tempos.
 */
export async function GET(request: Request) {
  const guarda = await guardaLoja();
  if (guarda.resposta) return guarda.resposta;
  const lojaId = guarda.conta.loja.id;
  const total = await naoLidasDaLoja(lojaId);
  if (new URL(request.url).searchParams.get("total")) return NextResponse.json({ total });
  faxinaDasConversas();
  return NextResponse.json({ total, conversas: await conversasDaLoja(lojaId, CAMINHOS_DO_PAINEL.telas) });
}
