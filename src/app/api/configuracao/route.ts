import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import { getConfiguracao } from "@/lib/configuracao-db";
import { CAMPOS_TEXTO } from "@/lib/configuracao";
import { COR_DOCUMENTO_PADRAO } from "@/lib/cor-documento";
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
      // Coluna antiga, uso novo: é a cor dos documentos (ver configuracao-db.ts).
      corPrimaria: body.corDocumento?.toLowerCase() ?? COR_DOCUMENTO_PADRAO,
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
