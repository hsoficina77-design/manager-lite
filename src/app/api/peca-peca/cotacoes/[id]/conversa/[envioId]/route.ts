import { NextResponse, after } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import {
  avisarOOutroLado,
  conversaDaOficina,
  faxinaDasConversas,
  mensagemDaOficina,
  oficinaLeu,
  paginaDaUrl,
} from "@/lib/conversa";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { conversaLidaSchema, mensagemSchema } from "@/lib/schemas-peca-peca";

// A conversa da oficina com uma loja da cotação: ler (inteira, a página anterior ou só
// o que chegou depois de um `seq`), mandar mensagem e marcar como lida.

type Params = { params: Promise<{ id: string; envioId: string }> };

const naoEncontrada = () => NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

export async function GET(request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { id, envioId } = await params;
  faxinaDasConversas();
  const conversa = await conversaDaOficina(guarda.db, id, envioId, paginaDaUrl(request));
  return conversa ? NextResponse.json(conversa) : naoEncontrada();
}

export async function POST(request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { id, envioId } = await params;
  try {
    const nova = await lerJson(request, mensagemSchema);
    const autor = { id: guarda.usuario.id, nome: guarda.usuario.nome };
    const r = await mensagemDaOficina(guarda.transacao, id, envioId, autor, nova);
    if (!r.ok) return NextResponse.json({ error: r.erro }, { status: r.status });
    // A loja conhece a oficina pelo nome do menu, não pelo de quem escreveu.
    after(async () => avisarOOutroLado(r, "OFICINA", nomeDoMenu(await getConfiguracao(guarda))));
    return NextResponse.json(r.mensagem, { status: r.nova ? 201 : 200 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao mandar a mensagem" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { id, envioId } = await params;
  try {
    const { ate } = await lerJson(request, conversaLidaSchema);
    return (await oficinaLeu(guarda.db, id, envioId, ate)) ? NextResponse.json({ ok: true }) : naoEncontrada();
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao marcar a conversa como lida" }, { status: 500 });
  }
}
