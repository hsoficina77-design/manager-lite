import { NextResponse } from "next/server";
import { z } from "zod";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { grafiaDaCidade, lojasQueAtendem } from "@/lib/balcao";
import { LIMITES, lerJson, obrigatorio, respostaDeValidacao } from "@/lib/validacao";

const schema = z.object({ cidade: obrigatorio("Cidade da oficina", LIMITES.cidade) });

/**
 * Grava só a cidade da oficina — para quem se cadastrou antes de ela ser pedida. A
 * rota de configurações não serve aqui: ela regrava o formulário inteiro, e mandar só
 * a cidade apagaria o resto. É o mesmo campo de Configurações e do cabeçalho da OS.
 */
export async function PUT(request: Request) {
  const guarda = await guardaPecaPeca();
  if (guarda.resposta) return guarda.resposta;
  if (guarda.usuario.papel !== "ADMIN") {
    return NextResponse.json({ error: "Só o dono da oficina muda a cidade" }, { status: 403 });
  }

  try {
    const { cidade } = await lerJson(request, schema);
    const grafia = await grafiaDaCidade(cidade);
    await guarda.db.configuracao.upsert({
      where: { oficinaId: guarda.oficinaId },
      update: { cidade: grafia },
      create: { cidade: grafia },
    });
    return NextResponse.json({ cidade: grafia, lojas: await lojasQueAtendem(grafia, true) });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a cidade" }, { status: 500 });
  }
}
