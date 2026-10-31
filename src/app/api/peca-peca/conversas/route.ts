import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { conversasDaOficina, faxinaDasConversas, naoLidasDaOficina } from "@/lib/conversa";

/**
 * A caixa "Conversas" da oficina. Com `?total=1`, só quantas mensagens das lojas ela não
 * leu — é o que o menu pergunta de tempos em tempos, e não lê mensagem nenhuma.
 */
export async function GET(request: Request) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const total = await naoLidasDaOficina(guarda.db);
  if (new URL(request.url).searchParams.get("total")) return NextResponse.json({ total });
  faxinaDasConversas();
  return NextResponse.json({ total, conversas: await conversasDaOficina(guarda.db) });
}
