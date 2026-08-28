import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConfiguracao } from "@/lib/configuracao-db";
import { CAMPOS_TEXTO, CONFIG_ID } from "@/lib/configuracao";
import { COR_MENU_PADRAO, COR_PRIMARIA_PADRAO } from "@/lib/tema";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { configuracaoSchema } from "@/lib/schemas";

export async function GET() {
  return NextResponse.json(await getConfiguracao());
}

export async function PUT(request: Request) {
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
    };

    // Upsert: a linha é criada pela migração, mas um banco restaurado de backup
    // antigo pode não tê-la — nesse caso a primeira gravação já a cria.
    await prisma.configuracao.upsert({
      where: { id: CONFIG_ID },
      update: dados,
      create: { id: CONFIG_ID, ...dados },
    });

    return NextResponse.json(await getConfiguracao());
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar as configurações" }, { status: 500 });
  }
}
