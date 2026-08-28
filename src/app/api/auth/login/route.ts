import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { conferirSenha, hashSenha } from "@/lib/senha";
import { DURACAO_MS, assinarToken, novoIdDeSessao, opcoesDoCookie, COOKIE_SESSAO } from "@/lib/sessao";
import { chaveDaRequisicao, esperaRestante, limparFalhas, registrarFalha } from "@/lib/tentativas";

// Uma mensagem só para e-mail inexistente e para senha errada: dizer "este e-mail não
// existe" entregaria de graça quais contas existem na oficina.
const CREDENCIAL_INVALIDA = "E-mail ou senha incorretos";

// Hash de uma senha aleatória, conferido quando o e-mail não existe. Sem ele, a
// resposta instantânea para e-mail desconhecido denunciaria — pelo tempo — quais
// contas existem. Calculado uma vez e reaproveitado.
let hashDeReferencia: Promise<string> | null = null;
function hashFalso(): Promise<string> {
  hashDeReferencia ??= hashSenha(randomBytes(32).toString("hex"));
  return hashDeReferencia;
}

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();

    if (typeof email !== "string" || typeof senha !== "string" || !email.trim() || !senha) {
      return NextResponse.json({ error: "Informe e-mail e senha" }, { status: 400 });
    }

    const emailLimpo = email.trim().toLowerCase();
    const chave = chaveDaRequisicao(request, emailLimpo);

    const espera = esperaRestante(chave);
    if (espera > 0) {
      const minutos = Math.ceil(espera / 60);
      return NextResponse.json(
        { error: `Muitas tentativas. Tente de novo em ${minutos} minuto${minutos > 1 ? "s" : ""}.` },
        { status: 429 }
      );
    }

    const usuario = await prisma.usuario.findUnique({ where: { email: emailLimpo } });

    const senhaConfere = await conferirSenha(senha, usuario?.senhaHash ?? (await hashFalso()));

    if (!usuario || !senhaConfere) {
      registrarFalha(chave);
      return NextResponse.json({ error: CREDENCIAL_INVALIDA }, { status: 401 });
    }

    if (!usuario.ativo) {
      registrarFalha(chave);
      return NextResponse.json(
        { error: "Este acesso foi desativado. Fale com o dono da oficina." },
        { status: 403 }
      );
    }

    limparFalhas(chave);

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
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() },
    });

    // Faxina barata das sessões vencidas, aproveitando que já estamos no banco.
    prisma.sessao
      .deleteMany({ where: { expiraEm: { lt: new Date() } } })
      .catch((err: unknown) => console.error("Falha ao limpar sessões vencidas:", err));

    const token = await assinarToken(sessaoId, expiraEm, usuario.papel);
    (await cookies()).set(COOKIE_SESSAO, token, opcoesDoCookie(expiraEm));

    return NextResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    });
  } catch (err) {
    console.error(err);
    // Sem AUTH_SECRET ninguém entra — e a causa precisa aparecer, senão vira
    // "login não funciona" sem pista nenhuma.
    if (err instanceof Error && err.message.includes("AUTH_SECRET")) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro ao entrar" }, { status: 500 });
  }
}
