import { NextResponse } from "next/server";
import { guardaLoja } from "@/lib/conta-loja";
import { cancelarInscricao, chavePublicaPush, inscrever } from "@/lib/push";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { cancelarPushSchema, inscricaoPushSchema } from "@/lib/schemas-peca-peca";

// Aviso no celular para quem trabalha na loja: a chave para o navegador se inscrever, e
// ligar e desligar neste aparelho. Só avisa quem pode conversar com as oficinas (o
// filtro é no envio, em lib/push.ts: o acesso pode mudar depois da inscrição).

export async function GET() {
  const guarda = await guardaLoja();
  if (guarda.resposta) return guarda.resposta;
  return NextResponse.json({ chave: chavePublicaPush() });
}

export async function POST(request: Request) {
  const guarda = await guardaLoja();
  if (guarda.resposta) return guarda.resposta;
  if (!chavePublicaPush()) return NextResponse.json({ error: "Aviso no celular desligado" }, { status: 503 });
  try {
    const inscricao = await lerJson(request, inscricaoPushSchema);
    const dono = { usuarioLojaId: guarda.conta.id, lojaId: guarda.conta.loja.id };
    await inscrever(dono, inscricao, request.headers.get("user-agent"));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao ligar o aviso no celular" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const guarda = await guardaLoja();
  if (guarda.resposta) return guarda.resposta;
  try {
    const { endpoint } = await lerJson(request, cancelarPushSchema);
    await cancelarInscricao({ usuarioLojaId: guarda.conta.id, lojaId: guarda.conta.loja.id }, endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao desligar o aviso no celular" }, { status: 500 });
  }
}
