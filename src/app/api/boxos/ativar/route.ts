import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { ativarBoxOS } from "@/lib/sistema";
import { urlBoxOS } from "@/lib/produto";

/**
 * A oficina só do Peça Peça ativa o boxOS: começa o teste grátis de sempre, com o mesmo
 * login, e as cotações continuam lá. Só o dono decide — é a conta da oficina que muda.
 */
export async function POST() {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  if (guarda.usuario.usaBoxOS) {
    return NextResponse.json({ error: "A sua oficina já tem o boxOS." }, { status: 409 });
  }
  const ativou = await ativarBoxOS(guarda.oficinaId);
  if (!ativou) return NextResponse.json({ error: "A sua oficina já tem o boxOS." }, { status: 409 });

  // Para onde a tela leva a pessoa: o boxOS, no endereço dele (lá ela entra de novo).
  return NextResponse.json({ ok: true, enderecoDoBoxOS: urlBoxOS() || null });
}
