import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encerrarSessoesDoUsuario, guardaApi } from "@/lib/auth";
import { hashSenha, validarSenha } from "@/lib/senha";
import { ehPapelValido } from "@/lib/permissoes";

const CAMPOS = {
  id: true, nome: true, email: true, papel: true, ativo: true,
  ultimoAcesso: true, createdAt: true,
} as const;

/** Sobraria algum dono ativo depois desta mudança? */
async function restaDono(idAlterado: string, continuaDonoAtivo: boolean): Promise<boolean> {
  if (continuaDonoAtivo) return true;
  const outros = await prisma.usuario.count({
    where: { papel: "ADMIN", ativo: true, id: { not: idAlterado } },
  });
  return outros > 0;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;

  try {
    const alvo = await prisma.usuario.findUnique({ where: { id } });
    if (!alvo) return NextResponse.json({ error: "Acesso não encontrado" }, { status: 404 });

    const body = await request.json();
    const dados: Record<string, unknown> = {};
    // Trocar senha, papel ou desativar derruba as sessões abertas daquela pessoa.
    let derrubarSessoes = false;

    if (typeof body.nome === "string" && body.nome.trim()) dados.nome = body.nome.trim();

    if (typeof body.email === "string" && body.email.trim()) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email.trim())) {
        return NextResponse.json({ error: "Informe um e-mail válido" }, { status: 400 });
      }
      dados.email = body.email.trim().toLowerCase();
    }

    if (body.papel !== undefined) {
      if (!ehPapelValido(body.papel)) {
        return NextResponse.json({ error: "Papel inválido" }, { status: 400 });
      }
      // Rebaixar a si mesmo tira do próprio usuário a tela onde ele está.
      if (id === guarda.usuario.id && body.papel !== "ADMIN") {
        return NextResponse.json(
          { error: "Você não pode tirar o próprio acesso de dono" },
          { status: 400 }
        );
      }
      if (body.papel !== alvo.papel) {
        dados.papel = body.papel;
        derrubarSessoes = true;
      }
    }

    if (body.ativo !== undefined) {
      const ativo = Boolean(body.ativo);
      if (id === guarda.usuario.id && !ativo) {
        return NextResponse.json({ error: "Você não pode desativar o próprio acesso" }, { status: 400 });
      }
      if (ativo !== alvo.ativo) {
        dados.ativo = ativo;
        if (!ativo) derrubarSessoes = true;
      }
    }

    if (body.senha !== undefined) {
      if (typeof body.senha !== "string") {
        return NextResponse.json({ error: "Senha inválida" }, { status: 400 });
      }
      const problema = validarSenha(body.senha);
      if (problema) return NextResponse.json({ error: problema }, { status: 400 });
      dados.senhaHash = await hashSenha(body.senha);
      derrubarSessoes = true;
    }

    // Sem dono ativo ninguém configura nada nem cadastra ninguém — o sistema ficaria
    // trancado por fora.
    const papelFinal = (dados.papel as string) ?? alvo.papel;
    const ativoFinal = (dados.ativo as boolean) ?? alvo.ativo;
    if (!(await restaDono(id, papelFinal === "ADMIN" && ativoFinal))) {
      return NextResponse.json(
        { error: "É preciso manter pelo menos um dono ativo" },
        { status: 400 }
      );
    }

    if (Object.keys(dados).length === 0) {
      return NextResponse.json(await prisma.usuario.findUnique({ where: { id }, select: CAMPOS }));
    }

    const usuario = await prisma.usuario.update({ where: { id }, data: dados, select: CAMPOS });

    // Derruba as outras sessões, mas poupa a atual: quem acabou de trocar a própria
    // senha não deveria ser expulso da tela em que está.
    if (derrubarSessoes) {
      await encerrarSessoesDoUsuario(id, id === guarda.usuario.id ? guarda.usuario.sessaoId : undefined);
    }

    return NextResponse.json(usuario);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Já existe um acesso com este e-mail" }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar o acesso" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  const { id } = await params;

  if (id === guarda.usuario.id) {
    return NextResponse.json({ error: "Você não pode excluir o próprio acesso" }, { status: 400 });
  }

  try {
    const alvo = await prisma.usuario.findUnique({ where: { id } });
    if (!alvo) return NextResponse.json({ error: "Acesso não encontrado" }, { status: 404 });

    if (!(await restaDono(id, false))) {
      return NextResponse.json(
        { error: "É preciso manter pelo menos um dono ativo" },
        { status: 400 }
      );
    }

    // As sessões vão junto pela FK (onDelete: Cascade).
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao excluir o acesso" }, { status: 500 });
  }
}
