import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { conferirSenha, hashSenha } from "@/lib/senha";
import { DURACAO_MS, assinarToken, novoIdDeSessao, opcoesDoCookie, COOKIE_SESSAO } from "@/lib/sessao";
import { chaveDaRequisicao, esperaRestante, limparFalhas, registrarFalha } from "@/lib/tentativas";
import { REGRAS, consumir, esquecer, ipDaRequisicao, respostaDeLimite } from "@/lib/limite-requisicoes";
import { lerJsonCru, respostaDeValidacao } from "@/lib/validacao";

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
    // Antes de qualquer coisa — antes de ler o corpo, de ir ao banco e, principalmente,
    // antes do scrypt. Conta toda tentativa, certa ou errada: o freio por e-mail (mais
    // abaixo) não pega quem varia o e-mail a cada requisição, e cada uma dessas custa
    // ~100ms de CPU e 16MB de RAM. Sem este teto, umas dezenas por segundo derrubam o
    // container sem precisar acertar senha nenhuma.
    const ip = ipDaRequisicao(request);
    const chaveIp = `login:${ip}`;
    const esperaIp = consumir(chaveIp, REGRAS.loginPorIp);
    if (esperaIp > 0) {
      return respostaDeLimite(esperaIp, {
        mensagem: "Muitas tentativas de entrada deste aparelho. Espere alguns minutos.",
      });
    }

    // `?.` porque um corpo `null` ou `"texto"` é JSON válido: desestruturar direto
    // viraria TypeError e 500 onde o certo é 400.
    const corpo = (await lerJsonCru(request)) as Record<string, unknown> | null;
    const email = corpo?.email;
    const senha = corpo?.senha;

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
    // Entrou: o IP não carrega mais o histórico. Sem isto, uma oficina com vários
    // funcionários no mesmo Wi-Fi poderia se trancar sozinha num dia de troca de
    // aparelho — e quem acerta a senha não é o caso que este teto persegue.
    esquecer(chaveIp);

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

    const ehDono = usuario.papel === "ADMIN";
    const token = await assinarToken(
      sessaoId,
      expiraEm,
      usuario.papel,
      ehDono || usuario.podeFinanceiro,
      ehDono || usuario.podeExcluir
    );
    (await cookies()).set(COOKIE_SESSAO, token, opcoesDoCookie(expiraEm));

    return NextResponse.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
    });
  } catch (err) {
    // Corpo grande demais ou JSON quebrado é erro de quem chamou, não do servidor.
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;

    console.error(err);
    // Sem AUTH_SECRET ninguém entra — e a causa precisa aparecer, senão vira
    // "login não funciona" sem pista nenhuma.
    if (err instanceof Error && err.message.includes("AUTH_SECRET")) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Erro ao entrar" }, { status: 500 });
  }
}
