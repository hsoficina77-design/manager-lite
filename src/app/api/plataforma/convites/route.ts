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

    // O link é montado a partir do endereço que o próprio dono está usando, então
    // funciona igual no computador local e em produção.
    const origem = new URL(request.url).origin;
    return NextResponse.json(
      { id: convite.id, expiraEm: convite.expiraEm, link: `${origem}/convite/${token}` },
      { status: 201 }
    );
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o convite" }, { status: 500 });
  }
}
