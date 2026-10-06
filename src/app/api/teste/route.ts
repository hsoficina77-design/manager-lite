import { NextResponse } from "next/server";
import { hashSenha } from "@/lib/senha";
import { abrirSessao, cadastroTesteAberto, criarOficinaDeTeste, validarCadastroOficina } from "@/lib/sistema";
import { normalizarWhatsapp } from "@/lib/plano";
import { REGRAS, consumir, ipDaRequisicao, respostaDeLimite } from "@/lib/limite-requisicoes";
import { lerJsonCru, respostaDeValidacao } from "@/lib/validacao";

// Teste grátis — a porta aberta do link da bio. Diferente do convite, aqui não há
// segredo nenhum: qualquer um com o endereço cria uma oficina. Os freios são o limite
// por IP, o campo-armadilha contra robôs, um teste por e-mail e por WhatsApp, e a
// chave `CADASTRO_TESTE_ABERTO` para fechar a porta sem deploy se aparecer abuso.

const MENSAGEM_PAUSADO = "Os cadastros de teste estão pausados no momento. Tente de novo mais tarde.";

export async function POST(request: Request) {
  if (!cadastroTesteAberto()) {
    return NextResponse.json({ error: MENSAGEM_PAUSADO }, { status: 503 });
  }

  // Antes do corpo, do banco e do scrypt.
  const espera = consumir(`teste:${ipDaRequisicao(request)}`, REGRAS.cadastroTeste);
  if (espera > 0) return respostaDeLimite(espera);

  try {
    const corpo = (await lerJsonCru(request)) as Record<string, unknown> | null;

    // Campo-armadilha: invisível para gente, preenchido por robô que sai completando
    // todo input. A resposta finge erro genérico para não ensinar o robô.
    if (typeof corpo?.site === "string" && corpo.site.trim()) {
      return NextResponse.json({ error: "Não foi possível criar o acesso" }, { status: 400 });
    }

    const { erro, dados } = validarCadastroOficina(corpo);
    if (!dados) return NextResponse.json({ error: erro }, { status: 400 });

    const whatsapp = typeof corpo?.whatsapp === "string" ? normalizarWhatsapp(corpo.whatsapp) : null;
    if (!whatsapp) {
      return NextResponse.json({ error: "Informe um WhatsApp com DDD" }, { status: 400 });
    }
    if (corpo?.aceite !== true) {
      return NextResponse.json({ error: "É preciso aceitar os Termos de uso" }, { status: 400 });
    }

    // Só letras, números e hífen — vira etiqueta no painel, não texto livre.
    const origem =
      typeof corpo?.origem === "string" ? corpo.origem.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || null : null;

    const criada = await criarOficinaDeTeste({
      nomeOficina: dados.nomeOficina,
      nome: dados.nome,
      email: dados.email,
      senhaHash: await hashSenha(dados.senha),
      whatsapp,
      origem,
    });

    if (criada === "email") {
      return NextResponse.json(
        { error: "Este e-mail já tem acesso ao boxOS. Entre pela tela de login." },
        { status: 409 }
      );
    }
    if (criada === "whatsapp") {
      return NextResponse.json(
        { error: "Este WhatsApp já fez um teste grátis. Para continuar usando, fale com a gente." },
        { status: 409 }
      );
    }

    await abrirSessao(criada.usuario, request);

    return NextResponse.json({ oficina: { id: criada.oficina.id, nome: criada.oficina.nome } }, { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;

    // Dois envios ao mesmo tempo: o Serializable ou a chave única do e-mail barra o segundo.
    if (err instanceof Error && /Unique constraint|could not serialize|P2034/i.test(err.message)) {
      return NextResponse.json({ error: "Este e-mail já tem acesso ao boxOS." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o acesso de teste" }, { status: 500 });
  }
}
