import { NextResponse } from "next/server";
import { z } from "zod";
import { guardaApi } from "@/lib/auth";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { MAX_LINHAS_IMPORTACAO } from "@/lib/prospeccao";
import { gravarImportacao, previaDaImportacao } from "@/lib/prospeccao-banco";

/** O CSV chega já lido pela tela, só com as colunas que o importador usa. */
const CORPO_MAX_BYTES = 8 * 1024 * 1024;

const corpo = z.object({
  modo: z.enum(["previa", "gravar"]),
  linhas: z
    .array(z.record(z.string().max(5000)))
    .min(1, "O arquivo não tem linhas")
    .max(MAX_LINHAS_IMPORTACAO, `Máximo de ${MAX_LINHAS_IMPORTACAO} linhas por importação`),
  excluir: z.array(z.string().max(200)).max(500).default([]),
  incluir: z.array(z.string().max(200)).max(500).default([]),
  nome: z.string().trim().max(120).optional(),
  arquivo: z.string().trim().max(200).nullable().optional(),
});

/**
 * Importação do CSV do scraper.
 *
 *   { modo: "previa", linhas, excluir?, incluir? }   o que entraria, sem gravar
 *   { modo: "gravar", linhas, excluir, incluir, nome } grava o lote
 */
export async function POST(request: Request) {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return guarda.resposta;

  try {
    const dados = await lerJson(request, corpo, CORPO_MAX_BYTES);
    const escolha = { excluir: dados.excluir, incluir: dados.incluir };

    if (dados.modo === "previa") {
      return NextResponse.json(await previaDaImportacao(dados.linhas, escolha));
    }

    const nome = dados.nome?.trim();
    if (!nome) return NextResponse.json({ error: "Dê um nome ao lote" }, { status: 400 });
    const resultado = await gravarImportacao(
      dados.linhas,
      escolha,
      { nome, arquivo: dados.arquivo ?? null },
      guarda.usuario.email
    );
    return NextResponse.json(resultado);
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao importar o arquivo" }, { status: 500 });
  }
}
