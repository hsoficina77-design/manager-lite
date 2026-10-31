import { NextResponse, after } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { avisarOOutroLado, conversaDaLoja, faxinaDasConversas, lojaLeu, mensagemDaLoja, paginaDaUrl } from "@/lib/conversa";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { conversaLidaSchema, mensagemSchema } from "@/lib/schemas-peca-peca";

// A conversa da loja com a oficina sobre uma cotação, no painel com login. Ler é de
// todo mundo do balcão; escrever e marcar como lida é de quem conversa com as oficinas
// — senão quem só acompanha apagaria o aviso de quem precisa responder.

type Params = { params: Promise<{ envioId: string }> };

const naoEncontrada = () => NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

export async function GET(request: Request, { params }: Params) {
  const guarda = await guardaLoja();
  if (guarda.resposta) return guarda.resposta;
  const { envioId } = await params;
  faxinaDasConversas();
  const conversa = await conversaDaLoja(guarda.conta.loja.id, envioId, paginaDaUrl(request));
  return conversa ? NextResponse.json(conversa) : naoEncontrada();
}

export async function POST(request: Request, { params }: Params) {
  const guarda = await guardaLoja("balcao.conversa");
  if (guarda.resposta) return guarda.resposta;
  const { conta } = guarda;
  const { envioId } = await params;
  try {
    const nova = await lerJson(request, mensagemSchema);
    const r = await mensagemDaLoja(conta.loja.id, envioId, { id: conta.id, nome: conta.nome }, nova);
    if (!r.ok) return NextResponse.json({ error: r.erro }, { status: r.status });
    after(() => avisarOOutroLado(r, "LOJA", conta.loja.nome));
    return NextResponse.json(r.mensagem, { status: r.nova ? 201 : 200 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao mandar a mensagem" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const guarda = await guardaLoja("balcao.conversa");
  if (guarda.resposta) return guarda.resposta;
  const { envioId } = await params;
  try {
    const { ate } = await lerJson(request, conversaLidaSchema);
    return (await lojaLeu(guarda.conta.loja.id, envioId, ate)) ? NextResponse.json({ ok: true }) : naoEncontrada();
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao marcar a conversa como lida" }, { status: 500 });
  }
}
