import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getConfiguracao } from "@/lib/configuracao-db";
import { CAMPOS_TEXTO, CONFIG_ID } from "@/lib/configuracao";
import { COR_MENU_PADRAO, COR_PRIMARIA_PADRAO, corValida } from "@/lib/tema";

export async function GET() {
  return NextResponse.json(await getConfiguracao());
}

/** Texto do formulário: vazio vira null, para o campo simplesmente sumir do documento. */
function texto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo === "" ? null : limpo;
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const nome = texto(body.nome);
    if (!nome) {
      return NextResponse.json({ error: "O nome da oficina é obrigatório" }, { status: 400 });
    }

    for (const campo of ["corPrimaria", "corMenu"] as const) {
      if (body[campo] !== undefined && !corValida(body[campo])) {
        return NextResponse.json(
          { error: "Cor inválida — use o formato #rrggbb" },
          { status: 400 }
        );
      }
    }

    const validade = Number(body.validadeOrcamentoDias);
    if (!Number.isInteger(validade) || validade < 1 || validade > 365) {
      return NextResponse.json(
        { error: "A validade do orçamento deve ser de 1 a 365 dias" },
        { status: 400 }
      );
    }

    const dados = {
      ...Object.fromEntries(CAMPOS_TEXTO.map((campo) => [campo, texto(body[campo])])),
      nome,
      corPrimaria: (body.corPrimaria as string | undefined)?.toLowerCase() ?? COR_PRIMARIA_PADRAO,
      corMenu: (body.corMenu as string | undefined)?.toLowerCase() ?? COR_MENU_PADRAO,
      mostrarAssinatura: Boolean(body.mostrarAssinatura),
      validadeOrcamentoDias: validade,
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
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar as configurações" }, { status: 500 });
  }
}
