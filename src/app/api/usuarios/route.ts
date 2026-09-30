import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { hashSenha, validarSenha } from "@/lib/senha";
import { ehPapelValido } from "@/lib/permissoes";

// `senhaHash` nunca sai daqui.
const CAMPOS = {
  id: true, nome: true, email: true, papel: true,
  podeFinanceiro: true, podeExcluir: true, ativo: true,
  ultimoAcesso: true, createdAt: true,
} as const;

export async function GET() {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  // Só os acessos da oficina de quem pede — o `db` já vem filtrado.
  const usuarios = await guarda.db.usuario.findMany({
    select: CAMPOS,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const { nome, email, senha, papel, podeFinanceiro, podeExcluir } = await request.json();

    if (typeof nome !== "string" || !nome.trim()) {
      return NextResponse.json({ error: "Informe o nome" }, { status: 400 });
    }
    if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Informe um e-mail válido" }, { status: 400 });
    }
    if (!ehPapelValido(papel)) {
      return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
    }
    if (typeof senha !== "string") {
      return NextResponse.json({ error: "Informe uma senha" }, { status: 400 });
    }
    const problema = validarSenha(senha);
    if (problema) return NextResponse.json({ error: problema }, { status: 400 });

    // Dono não precisa de checkbox (já tem tudo); operador nasce com o que for
    // marcado no formulário, e sem marcação nasce sem financeiro nem exclusão. A
    // oficina vem da transação (default da coluna): o acesso nasce na oficina do dono.
    const usuario = await guarda.db.usuario.create({
      data: {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senhaHash: await hashSenha(senha),
        papel,
        podeFinanceiro: papel === "ADMIN" ? true : Boolean(podeFinanceiro),
        podeExcluir: papel === "ADMIN" ? true : Boolean(podeExcluir),
      },
      select: CAMPOS,
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (err) {
    // O e-mail é único no sistema inteiro (é ele que identifica a oficina no login),
    // então pode estar em uso por alguém de outra oficina.
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Este e-mail já é usado por outro acesso no sistema" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o acesso" }, { status: 500 });
  }
}
