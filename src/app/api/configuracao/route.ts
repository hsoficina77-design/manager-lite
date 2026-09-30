import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { getConfiguracao } from "@/lib/configuracao-db";
import { CAMPOS_TEXTO } from "@/lib/configuracao";
import { COR_MENU_PADRAO, COR_PRIMARIA_PADRAO } from "@/lib/tema";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { configuracaoSchema } from "@/lib/schemas";

export async function GET() {
  const guarda = await guardaApi();
  if (guarda.resposta) return guarda.resposta;
  return NextResponse.json(await getConfiguracao(guarda));
}

export async function PUT(request: Request) {
  const guarda = await guardaApi({ dono: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const body = await lerJson(request, configuracaoSchema);

    const dados = {
      // O painel manda o formulário inteiro: campo ausente é campo apagado.
      ...Object.fromEntries(CAMPOS_TEXTO.map((campo) => [campo, body[campo] ?? null])),
      nome: body.nome,
      corPrimaria: body.corPrimaria?.toLowerCase() ?? COR_PRIMARIA_PADRAO,
      corMenu: body.corMenu?.toLowerCase() ?? COR_MENU_PADRAO,
      mostrarAssinatura: body.mostrarAssinatura ?? false,
      validadeOrcamentoDias: body.validadeOrcamentoDias,
      reservaLucroAtiva: body.reservaLucroAtiva ?? false,
      reservaLucroPercentual: body.reservaLucroPercentual,
    };

    // Upsert: a linha nasce junto com a oficina, mas um banco restaurado de backup
    // antigo pode não tê-la — nesse caso a primeira gravação já a cria.
    await guarda.db.configuracao.upsert({
      where: { oficinaId: guarda.oficinaId },
      update: dados,
      create: dados,
    });

    return NextResponse.json(await getConfiguracao(guarda));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar as configurações" }, { status: 500 });
  }
}
