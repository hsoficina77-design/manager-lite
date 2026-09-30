import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { criarConvite, listarConvites } from "@/lib/sistema";
import { lerJsonCru, respostaDeValidacao } from "@/lib/validacao";

// Convites para oficinas novas. Só o dono da plataforma — o flag vem do banco, na
// sessão, e não do cookie: o proxy não tem como saber, então a guarda é aqui.

export async function GET() {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  return NextResponse.json(await listarConvites());
}

export async function POST(request: Request) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const corpo = (await lerJsonCru(request)) as Record<string, unknown> | null;
    const nomeOficina = typeof corpo?.nomeOficina === "string" ? corpo.nomeOficina.slice(0, 120) : null;
    const email = typeof corpo?.email === "string" ? corpo.email.slice(0, 200) : null;

    const { convite, token } = await criarConvite({
      criadoPor: guarda.usuario.id,
      nomeOficina,
      email,
    });

    // Só o caminho: quem monta o link completo é a tela, com o endereço que está no
    // navegador. O servidor não sabe o próprio endereço público — no Railway, atrás do
    // proxy, `request.url` é `localhost:8080`, e o link saía apontando para lá.
    return NextResponse.json(
      { id: convite.id, expiraEm: convite.expiraEm, caminho: `/convite/${token}` },
      { status: 201 }
    );
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o convite" }, { status: 500 });
  }
}
