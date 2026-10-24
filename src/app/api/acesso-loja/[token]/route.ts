import { NextResponse } from "next/server";
import { hashSenha, validarSenha } from "@/lib/senha";
import { abrirSessaoLoja, usarConviteLoja } from "@/lib/conta-loja";
import { REGRAS, consumir, ipDaRequisicao, respostaDeLimite } from "@/lib/limite-requisicoes";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { acessoLojaSchema } from "@/lib/schemas-peca-peca";

// Aceitar o convite para o painel da loja (ou o "novo acesso", que troca a senha).
// Pública: quem chega ainda não tem conta. O segredo é o link, de uso único.

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  // Antes do corpo, do banco e do scrypt — como o cadastro aberto.
  const espera = consumir(`acesso-loja:${ipDaRequisicao(request)}`, REGRAS.primeiroAcesso);
  if (espera > 0) return respostaDeLimite(espera);

  const { token } = await params;
  try {
    const dados = await lerJson(request, acessoLojaSchema);
    const problema = validarSenha(dados.senha);
    if (problema) return NextResponse.json({ error: problema }, { status: 400 });

    const resultado = await usarConviteLoja(token, {
      nome: dados.nome,
      email: dados.email?.toLowerCase() ?? null,
      senhaHash: await hashSenha(dados.senha),
    });
    if (resultado === "invalido") {
      return NextResponse.json(
        { error: "Este link não vale mais. Peça um novo a quem cuida da equipe da loja." },
        { status: 410 }
      );
    }
    if (resultado === "email") {
      return NextResponse.json(
        { error: "Este e-mail já tem acesso no Peça Peça ou no boxOS. Use outro e-mail." },
        { status: 409 }
      );
    }

    await abrirSessaoLoja(resultado, request);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    if (err instanceof Error && /Unique constraint|could not serialize|P2034/i.test(err.message)) {
      return NextResponse.json({ error: "Não deu certo agora. Tente de novo." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o acesso" }, { status: 500 });
  }
}
