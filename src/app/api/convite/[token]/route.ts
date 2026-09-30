import { NextResponse } from "next/server";
import { hashSenha, validarSenha } from "@/lib/senha";
import { abrirSessao, emailEmUso, lerConvite, usarConvite } from "@/lib/sistema";
import { REGRAS, consumir, ipDaRequisicao, respostaDeLimite } from "@/lib/limite-requisicoes";
import { lerJsonCru, respostaDeValidacao } from "@/lib/validacao";

// Porta de entrada de uma oficina nova. Pública (quem chega ainda não tem conta), mas
// só funciona com o segredo do link — que o dono da plataforma gerou e mandou.

const MENSAGEM_SITUACAO = {
  usado: "Este convite já foi usado. Se a oficina já foi criada, entre pela tela de login.",
  vencido: "Este convite venceu. Peça um novo a quem te convidou.",
  inexistente: "Convite não encontrado. Confira se o link foi copiado inteiro.",
} as const;

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const espera = consumir(`convite-get:${ipDaRequisicao(request)}`, REGRAS.primeiroAcessoLeitura);
  if (espera > 0) return respostaDeLimite(espera);

  const { token } = await params;
  const { situacao, convite } = await lerConvite(token);
  return NextResponse.json({
    situacao,
    // O nome sugerido só aparece para convite válido — é o único dado que o link revela.
    nomeOficina: situacao === "valido" ? convite?.nomeOficina ?? null : null,
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  // Antes do corpo, do banco e do scrypt: é também por aqui que alguém tentaria
  // adivinhar um link de convite.
  const espera = consumir(`convite:${ipDaRequisicao(request)}`, REGRAS.primeiroAcesso);
  if (espera > 0) return respostaDeLimite(espera);

  try {
    const { token } = await params;
    const { situacao } = await lerConvite(token);
    if (situacao !== "valido") {
      return NextResponse.json({ error: MENSAGEM_SITUACAO[situacao] }, { status: 410 });
    }

    const corpo = (await lerJsonCru(request)) as Record<string, unknown> | null;
    const { nomeOficina, nome, email, senha } = corpo ?? {};

    if (typeof nomeOficina !== "string" || !nomeOficina.trim()) {
      return NextResponse.json({ error: "Informe o nome da oficina" }, { status: 400 });
    }
    if (typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json({ error: "Informe seu nome" }, { status: 400 });
    }
    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Informe um e-mail válido" }, { status: 400 });
    }
    if (typeof senha !== "string") {
      return NextResponse.json({ error: "Informe uma senha" }, { status: 400 });
    }
    const problema = validarSenha(senha);
    if (problema) return NextResponse.json({ error: problema }, { status: 400 });

    const emailLimpo = email.trim().toLowerCase();
    // O e-mail é a chave do login no sistema inteiro — não pode repetir entre oficinas.
    if (await emailEmUso(emailLimpo)) {
      return NextResponse.json(
        { error: "Este e-mail já tem acesso ao sistema. Use outro, ou entre pela tela de login." },
        { status: 409 }
      );
    }

    const criada = await usarConvite(token, {
      nomeOficina: nomeOficina.trim().slice(0, 120),
      nome: nome.trim(),
      email: emailLimpo,
      senhaHash: await hashSenha(senha),
    });

    // Outro clique no mesmo link chegou antes (ou o convite venceu no meio do caminho).
    if (!criada) {
      return NextResponse.json({ error: MENSAGEM_SITUACAO.usado }, { status: 410 });
    }

    await abrirSessao(criada.usuario, request);

    return NextResponse.json(
      { oficina: { id: criada.oficina.id, nome: criada.oficina.nome } },
      { status: 201 }
    );
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;

    // Dois cadastros com o mesmo e-mail ao mesmo tempo: o segundo cai na chave única.
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Este e-mail já tem acesso ao sistema." }, { status: 409 });
    }
    console.error(err);
    if (err instanceof Error && err.message.includes("AUTH_SECRET")) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro ao criar a oficina" }, { status: 500 });
  }
}
