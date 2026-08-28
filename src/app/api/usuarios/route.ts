import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardaApi } from "@/lib/auth";
import { hashSenha, validarSenha } from "@/lib/senha";
import { ehPapelValido } from "@/lib/permissoes";

// `senhaHash` nunca sai daqui.
const CAMPOS = {
  id: true, nome: true, email: true, papel: true, ativo: true,
  ultimoAcesso: true, createdAt: true,
} as const;

export async function GET() {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  const usuarios = await prisma.usuario.findMany({
    select: CAMPOS,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const { nome, email, senha, papel } = await request.json();

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

    const usuario = await prisma.usuario.create({
      data: {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senhaHash: await hashSenha(senha),
        papel,
      },
      select: CAMPOS,
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Já existe um acesso com este e-mail" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o acesso" }, { status: 500 });
  }
}
