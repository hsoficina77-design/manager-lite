import { NextResponse } from "next/server";
import { z } from "zod";
import { guardaPecaPeca } from "@/lib/peca-peca";
import { lojasQueAtendem } from "@/lib/balcao";
import { municipioOficial } from "@/lib/municipios-servidor";
import { LIMITES, lerJson, nulavel, obrigatorio, respostaDeValidacao } from "@/lib/validacao";

const schema = z.object({
  cidade: obrigatorio("Cidade da oficina", LIMITES.cidade),
  estado: nulavel("Estado", LIMITES.estado).optional(),
});

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
    const dados = await lerJson(request, schema);
    const municipio = municipioOficial(dados.cidade, dados.estado);
    if (!municipio) return NextResponse.json({ error: "Escolha a cidade na lista" }, { status: 400 });
    const campos = { cidade: municipio.nome, estado: municipio.uf };
    await guarda.db.configuracao.upsert({ where: { oficinaId: guarda.oficinaId }, update: campos, create: campos });
    return NextResponse.json({ ...campos, lojas: await lojasQueAtendem(municipio.nome, municipio.uf) });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar a cidade" }, { status: 500 });
  }
}
