import { NextResponse, after } from "next/server";
import { MENSAGEM_BALCAO_COM_LOGIN, lojaPeloToken } from "@/lib/balcao";
import { avisarOOutroLado, conversaDaLoja, faxinaDasConversas, lojaLeu, mensagemDaLoja, paginaDaUrl } from "@/lib/conversa";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { conversaLidaSchema, mensagemSchema } from "@/lib/schemas-peca-peca";

// A conversa no link antigo do balcão (sem conta): quem tem o link fala pela loja.

type Params = { params: Promise<{ token: string; envioId: string }> };

const naoEncontrada = () => NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });

/** A loja do link, ou a resposta pronta (link inválido, ou a loja já tem login). */
async function lojaDoLink(token: string) {
  const loja = await lojaPeloToken(token);
  if (!loja) return { resposta: NextResponse.json({ error: "Balcão não encontrado" }, { status: 404 }) };
  if (loja.comLogin) return { resposta: NextResponse.json({ error: MENSAGEM_BALCAO_COM_LOGIN }, { status: 410 }) };
  return { loja };
}

export async function GET(request: Request, { params }: Params) {
  const { token, envioId } = await params;
  const { loja, resposta } = await lojaDoLink(token);
  if (!loja) return resposta;
  faxinaDasConversas();
  const conversa = await conversaDaLoja(loja.id, envioId, paginaDaUrl(request));
  return conversa ? NextResponse.json(conversa) : naoEncontrada();
}

export async function POST(request: Request, { params }: Params) {
  const { token, envioId } = await params;
  const { loja, resposta } = await lojaDoLink(token);
  if (!loja) return resposta;
  try {
    const nova = await lerJson(request, mensagemSchema);
    // Sem conta, não há pessoa: quem escreve é o balcão da loja.
    const r = await mensagemDaLoja(loja.id, envioId, { id: null, nome: `Balcão ${loja.nome}` }, nova);
    if (!r.ok) return NextResponse.json({ error: r.erro }, { status: r.status });
    after(() => avisarOOutroLado(r, "LOJA", loja.nome));
    return NextResponse.json(r.mensagem, { status: r.nova ? 201 : 200 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao mandar a mensagem" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { token, envioId } = await params;
  const { loja, resposta } = await lojaDoLink(token);
  if (!loja) return resposta;
  try {
    const { ate } = await lerJson(request, conversaLidaSchema);
    return (await lojaLeu(loja.id, envioId, ate)) ? NextResponse.json({ ok: true }) : naoEncontrada();
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao marcar a conversa como lida" }, { status: 500 });
  }
}
