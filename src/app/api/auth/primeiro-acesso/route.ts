import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashSenha, validarSenha } from "@/lib/senha";
import { DURACAO_MS, assinarToken, novoIdDeSessao, opcoesDoCookie, COOKIE_SESSAO } from "@/lib/sessao";

/**
 * Trava opcional do primeiro acesso.
 *
 * Entre o deploy e o cadastro do dono existe uma janela em que o endereço está no ar
 * com a tabela de usuários vazia — quem chegar primeiro vira dono. Definindo
 * `SETUP_TOKEN` no ambiente, essa janela fecha: só cria o dono quem tiver o código,
 * que fica visível apenas para quem administra o servidor.
 *
 * Sem a variável, o cadastro segue aberto (é o caso do desenvolvimento local).
 */
function tokenExigido(): string | null {
  const token = process.env.SETUP_TOKEN?.trim();
  return token ? token : null;
}

/** Estado da instalação — a tela usa para saber se deve pedir o código. */
export async function GET() {
  try {
    return NextResponse.json({
      disponivel: (await prisma.usuario.count()) === 0,
      exigeToken: tokenExigido() !== null,
    });
  } catch {
    return NextResponse.json({ disponivel: false, exigeToken: false });
  }
}

/**
 * Cria o primeiro dono e já o deixa logado.
 *
 * Só funciona com a tabela de usuários vazia. Depois do primeiro cadastro esta rota
 * responde 409 para sempre — é o que impede alguém de chegar em `/primeiro-acesso` num
 * sistema já em uso e sair como dono.
 */
export async function POST(request: Request) {
  try {
    const { nome, email, senha, token: codigo } = await request.json();

    const esperado = tokenExigido();
    if (esperado && codigo !== esperado) {
      return NextResponse.json(
        { error: "Código de instalação inválido" },
        { status: 403 }
      );
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

    const senhaHash = await hashSenha(senha);

    // Serializable: dois cadastros disparados ao mesmo tempo não podem virar dois
    // donos — o segundo vê a tabela já preenchida e é recusado.
    const usuario = await prisma.$transaction(
      async (tx) => {
        if ((await tx.usuario.count()) > 0) return null;
        return tx.usuario.create({
          data: {
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            senhaHash,
            papel: "ADMIN",
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    if (!usuario) {
      return NextResponse.json(
        { error: "Este sistema já tem um dono cadastrado. Entre pela tela de login." },
        { status: 409 }
      );
    }

    const sessaoId = novoIdDeSessao();
    const expiraEm = new Date(Date.now() + DURACAO_MS);
    await prisma.sessao.create({
      data: {
        id: sessaoId,
        usuarioId: usuario.id,
        expiraEm,
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });

    const token = await assinarToken(sessaoId, expiraEm, usuario.papel);
    (await cookies()).set(COOKIE_SESSAO, token, opcoesDoCookie(expiraEm));

    return NextResponse.json({ id: usuario.id, nome: usuario.nome, papel: usuario.papel }, { status: 201 });
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message.includes("AUTH_SECRET")) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro ao criar o acesso" }, { status: 500 });
  }
}
