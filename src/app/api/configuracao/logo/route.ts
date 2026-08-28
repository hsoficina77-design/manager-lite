import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFotos, uploadLogo } from "@/lib/supabase-storage";
import { getConfiguracao } from "@/lib/configuracao-db";
import { CONFIG_ID } from "@/lib/configuracao";
import { FORMATOS_ACEITOS, tipoRealDaImagem } from "@/lib/imagem-upload";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB — logo é arte pequena, não foto de serviço

/** Remove do Storage a logo que estava no lugar (best-effort). */
async function descartarAnterior(logoPath: string | null | undefined) {
  if (logoPath) await deleteFotos([logoPath]);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo muito grande (máx. 2MB)" }, { status: 400 });
    }

    // O formato vem dos bytes, não do `file.type` — ver lib/imagem-upload.
    const bytes = await file.arrayBuffer();
    const tipo = tipoRealDaImagem(bytes);
    if (!tipo) {
      return NextResponse.json(
        { error: `Formato inválido — envie ${FORMATOS_ACEITOS}` },
        { status: 400 }
      );
    }

    const anterior = await prisma.configuracao.findUnique({
      where: { id: CONFIG_ID },
      select: { logoPath: true },
    });

    const { path, url } = await uploadLogo(bytes, tipo);

    await prisma.configuracao.upsert({
      where: { id: CONFIG_ID },
      update: { logoUrl: url, logoPath: path },
      create: { id: CONFIG_ID, logoUrl: url, logoPath: path },
    });

    await descartarAnterior(anterior?.logoPath);

    return NextResponse.json(await getConfiguracao());
  } catch (err) {
    console.error(err);
    const msg =
      err instanceof Error && err.message.includes("não configurado")
        ? err.message
        : "Erro ao enviar a logo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const anterior = await prisma.configuracao.findUnique({
      where: { id: CONFIG_ID },
      select: { logoPath: true },
    });

    await prisma.configuracao.upsert({
      where: { id: CONFIG_ID },
      update: { logoUrl: null, logoPath: null },
      create: { id: CONFIG_ID },
    });

    await descartarAnterior(anterior?.logoPath);

    return NextResponse.json(await getConfiguracao());
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao remover a logo" }, { status: 500 });
  }
}
