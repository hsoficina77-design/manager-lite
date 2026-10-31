import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { cancelarInscricao, chavePublicaPush, inscrever } from "@/lib/push";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { cancelarPushSchema, inscricaoPushSchema } from "@/lib/schemas-peca-peca";

// Aviso no celular para a oficina: a chave para o navegador se inscrever, e ligar e
// desligar neste aparelho. Ver lib/push.ts.

export async function GET() {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  return NextResponse.json({ chave: chavePublicaPush() });
}

export async function POST(request: Request) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  if (!chavePublicaPush()) return NextResponse.json({ error: "Aviso no celular desligado" }, { status: 503 });
  try {
    const inscricao = await lerJson(request, inscricaoPushSchema);
    const dono = { usuarioId: guarda.usuario.id, oficinaId: guarda.oficinaId };
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
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  try {
    const { endpoint } = await lerJson(request, cancelarPushSchema);
    await cancelarInscricao({ usuarioId: guarda.usuario.id, oficinaId: guarda.oficinaId }, endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao desligar o aviso no celular" }, { status: 500 });
  }
}
