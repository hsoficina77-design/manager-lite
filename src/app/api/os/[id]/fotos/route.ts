import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFoto } from "@/lib/supabase-storage";
import { comUrlAssinada } from "@/lib/fotos";
import { FOTO_LEGENDA_MAX, FOTO_TIPO_PADRAO, FOTO_TIPO_VALUES } from "@/lib/constants";
import { FORMATOS_ACEITOS, tipoRealDaImagem } from "@/lib/imagem-upload";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB (a compressão no cliente deixa bem abaixo disso)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const os = await prisma.ordemServico.findUnique({ where: { id }, select: { id: true } });
    if (!os) {
      return NextResponse.json({ error: "OS não encontrada" }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Arquivo muito grande (máx. 10MB)" }, { status: 400 });
    }

    // O formato vem dos bytes, não do `file.type` — ver lib/imagem-upload.
    const bytes = await file.arrayBuffer();
    const tipoArquivo = tipoRealDaImagem(bytes);
    if (!tipoArquivo) {
      return NextResponse.json(
        { error: `Formato inválido — envie ${FORMATOS_ACEITOS}` },
        { status: 400 }
      );
    }

    const legenda =
      (form.get("legenda") as string | null)?.trim().slice(0, FOTO_LEGENDA_MAX) || null;
    const tipo = (form.get("tipo") as string | null) ?? FOTO_TIPO_PADRAO;
    if (!FOTO_TIPO_VALUES.includes(tipo)) {
      return NextResponse.json({ error: "Momento da foto inválido" }, { status: 400 });
    }

    const { path, url } = await uploadFoto(id, bytes, tipoArquivo);

    const foto = await prisma.fotoOS.create({
      data: { ordemId: id, path, url, legenda, tipo },
    });

    const [comAssinatura] = await comUrlAssinada([foto]);
    return NextResponse.json(comAssinatura, { status: 201 });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error && err.message.includes("não configurado")
      ? err.message
      : "Erro ao enviar foto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
