import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFotoOrcamento } from "@/lib/supabase-storage";
import { comUrlAssinada } from "@/lib/fotos";
import { FOTO_LEGENDA_MAX, FOTO_TIPO_ORCAMENTO, FOTO_TIPO_VALUES } from "@/lib/constants";
import { FORMATOS_ACEITOS, tipoRealDaImagem } from "@/lib/imagem-upload";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB (a compressão no cliente deixa bem abaixo disso)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orcamento = await prisma.orcamento.findUnique({
      where: { id },
      select: { id: true, ordemId: true },
    });
    if (!orcamento) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    // Depois de convertido o orçamento é histórico: foto nova entra pela OS.
    if (orcamento.ordemId) {
      return NextResponse.json(
        { error: "Orçamento já convertido — anexe a foto na OS" },
        { status: 409 }
      );
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
    // A tela do orçamento não pergunta o momento, mas o campo continua existindo:
    // é ele que coloca a foto na seção certa quando o orçamento virar OS.
    const tipo = (form.get("tipo") as string | null) ?? FOTO_TIPO_ORCAMENTO;
    if (!FOTO_TIPO_VALUES.includes(tipo)) {
      return NextResponse.json({ error: "Momento da foto inválido" }, { status: 400 });
    }

    const { path, url } = await uploadFotoOrcamento(id, bytes, tipoArquivo);

    const foto = await prisma.fotoOS.create({
      data: { orcamentoId: id, path, url, legenda, tipo },
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
