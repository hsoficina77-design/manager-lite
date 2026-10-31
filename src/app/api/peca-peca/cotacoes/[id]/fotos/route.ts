import { NextResponse } from "next/server";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lerCotacao } from "@/lib/cotacoes";
import { apagarFotos } from "@/lib/fotos-peca-peca";
import { uploadFotoCotacao } from "@/lib/supabase-storage";
import { FORMATOS_ACEITOS, tipoRealDaImagem } from "@/lib/imagem-upload";
import { avisarSeArmazenamentoCheio } from "@/lib/armazenamento";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { fotoPecaPecaApagarSchema } from "@/lib/schemas-peca-peca";
import { FOTOS_POR_PECA, devolucaoAberta } from "@/components/peca-peca/regras";

type Params = { params: Promise<{ id: string }> };

const MAX_BYTES = 10 * 1024 * 1024; // 10MB (a compressão no cliente deixa bem abaixo disso)

/**
 * Foto de uma peça da cotação (`pecaId`) ou de uma devolução (`devolucaoId`), até duas
 * em cada. A da peça vale até o pedido — depois, a loja já separou; a da devolução,
 * enquanto ela está aberta.
 */
export async function POST(request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db, oficinaId } = guarda;
  const { id } = await params;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const pecaId = typeof form.get("pecaId") === "string" ? (form.get("pecaId") as string) : null;
    const devolucaoId = typeof form.get("devolucaoId") === "string" ? (form.get("devolucaoId") as string) : null;
    if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Arquivo muito grande (máx. 10MB)" }, { status: 400 });
    if (Boolean(pecaId) === Boolean(devolucaoId)) {
      return NextResponse.json({ error: "Diga de qual peça é a foto" }, { status: 400 });
    }

    const cotacao = await lerCotacao(db, id);
    if (!cotacao) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    const peca = pecaId ? cotacao.pecas.find((p) => p.id === pecaId) : null;
    const devolucao = devolucaoId ? cotacao.devolucoes.find((d) => d.id === devolucaoId) : null;
    if (pecaId && !peca) return NextResponse.json({ error: "Peça não encontrada" }, { status: 404 });
    if (devolucaoId && !devolucao) return NextResponse.json({ error: "Devolução não encontrada" }, { status: 404 });
    if (peca && cotacao.pedidoEm) {
      return NextResponse.json({ error: "O pedido já foi feito: a foto não chega mais à loja." }, { status: 409 });
    }
    if (devolucao && !devolucaoAberta(devolucao)) {
      return NextResponse.json({ error: "Esta devolução já terminou." }, { status: 409 });
    }
    const fotos = (peca ?? devolucao)!.fotos.filter((f) => !f.apagadaEm);
    if (fotos.length >= FOTOS_POR_PECA) {
      return NextResponse.json({ error: `No máximo ${FOTOS_POR_PECA} fotos por peça.` }, { status: 400 });
    }

    // O formato vem dos bytes, não do `file.type` — ver lib/imagem-upload.
    const bytes = await file.arrayBuffer();
    const tipo = tipoRealDaImagem(bytes);
    if (!tipo) return NextResponse.json({ error: `Formato inválido — envie ${FORMATOS_ACEITOS}` }, { status: 400 });

    // A pasta começa pela oficina: o bucket é um só para todas.
    const { path, url } = await uploadFotoCotacao(oficinaId, id, bytes, tipo);
    await db.fotoPecaPeca.create({
      data: { cotacaoId: id, pecaId, devolucaoId, path, url, tamanhoBytes: bytes.byteLength },
    });
    await avisarSeArmazenamentoCheio(db);

    const atual = await lerCotacao(db, id);
    return NextResponse.json(atual, { status: 201 });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error && err.message.includes("não configurado") ? err.message : "Erro ao enviar a foto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Apaga uma foto (`fotoId`) ou todas as da cotação. A cotação continua; só o arquivo sai. */
export async function DELETE(request: Request, { params }: Params) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  const { db } = guarda;
  const { id } = await params;

  try {
    const { fotoId } = await lerJson(request, fotoPecaPecaApagarSchema);
    const existe = await db.cotacao.findUnique({ where: { id }, select: { id: true } });
    if (!existe) return NextResponse.json({ error: "Cotação não encontrada" }, { status: 404 });
    await apagarFotos(db, fotoId ? { id: fotoId, cotacaoId: id } : { cotacaoId: id });
    return NextResponse.json(await lerCotacao(db, id));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao apagar a foto" }, { status: 500 });
  }
}
