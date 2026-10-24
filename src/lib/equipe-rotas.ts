// Rotas da equipe de uma autopeça — as mesmas para quem cuida da equipe no painel da
// loja (`/api/loja/equipe`) e para a plataforma no painel admin
// (`/api/plataforma/lojas/<id>/equipe`). Muda só quem mexe: a pessoa da loja, com os
// acessos dela, ou a plataforma, com todos (ver lib/acessos-loja.ts).

import { NextResponse } from "next/server";
import { guardaApi } from "@/lib/auth";
import {
  alterarPessoaDaLoja,
  cancelarConviteLoja,
  criarConviteLoja,
  equipeDaLoja,
  lojaExiste,
  pessoaDaLoja,
} from "@/lib/conta-loja";
import { ACESSOS_DA_PLATAFORMA, type PermissaoLoja } from "@/lib/acessos-loja";
import { urlPecaPeca } from "@/lib/produto";
import { lerJson, respostaDeValidacao } from "@/lib/validacao";
import { conviteLojaSchema, pessoaDaLojaSchema } from "@/lib/schemas-peca-peca";

/** Quem está mexendo na equipe e em nome de quem. */
export type QuemMexe = {
  lojaId: string;
  /** O que quem mexe pode — ninguém dá nem tira o que não tem. */
  acessos: readonly PermissaoLoja[];
  /** "plataforma", ou o id de quem trabalha na loja. */
  criadoPor: string;
};

/**
 * A plataforma mexendo na equipe de uma loja (painel admin): só a conta da plataforma,
 * com todos os acessos — é ela que destrava uma loja que ficou sem ninguém na equipe.
 */
export async function guardaDaPlataforma(
  lojaId: string
): Promise<{ quem: QuemMexe; resposta?: never } | { quem?: never; resposta: NextResponse }> {
  const guarda = await guardaApi({ dono: true, plataforma: true });
  if (guarda.resposta) return { resposta: guarda.resposta };
  if (!(await lojaExiste(lojaId))) {
    return { resposta: NextResponse.json({ error: "Loja não encontrada" }, { status: 404 }) };
  }
  return { quem: { lojaId, acessos: ACESSOS_DA_PLATAFORMA, criadoPor: "plataforma" } };
}

/**
 * O link vai para o endereço do Peça Peça, que é onde a pessoa entra. Sem ele
 * configurado, a tela completa com o endereço do próprio navegador.
 */
function linkDoConvite(caminho: string) {
  return { caminho, endereco: urlPecaPeca() || null };
}

export async function listarEquipe(lojaId: string) {
  return NextResponse.json(await equipeDaLoja(lojaId));
}

export async function convidar(request: Request, quem: QuemMexe) {
  try {
    const dados = await lerJson(request, conviteLojaSchema);
    const { caminho } = await criarConviteLoja({
      lojaId: quem.lojaId,
      criadoPor: quem.criadoPor,
      deQuemConvida: quem.acessos,
      perfil: dados.perfil,
      nome: dados.nome ?? null,
      email: dados.email?.toLowerCase() ?? null,
    });
    return NextResponse.json(linkDoConvite(caminho), { status: 201 });
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar o convite" }, { status: 500 });
  }
}

export async function mudarPessoa(request: Request, quem: QuemMexe, pessoaId: string) {
  try {
    const mudanca = await lerJson(request, pessoaDaLojaSchema);
    const resultado = await alterarPessoaDaLoja(quem.lojaId, pessoaId, mudanca, quem.acessos);
    if (resultado === "nao-encontrado") {
      return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 });
    }
    if (resultado === "ultimo-responsavel") {
      return NextResponse.json(
        {
          error:
            "A loja precisa de ao menos uma pessoa que cuide da equipe. Dê esse acesso a outra pessoa antes.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(await equipeDaLoja(quem.lojaId));
  } catch (err) {
    const invalido = respostaDeValidacao(err);
    if (invalido) return invalido;
    console.error(err);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

/** "Novo acesso": um link de uso único para a pessoa definir outra senha. */
export async function novoAcesso(quem: QuemMexe, pessoaId: string) {
  const pessoa = await pessoaDaLoja(quem.lojaId, pessoaId);
  if (!pessoa) return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 });
  const { caminho } = await criarConviteLoja({
    lojaId: quem.lojaId,
    criadoPor: quem.criadoPor,
    deQuemConvida: quem.acessos,
    perfil: "VENDEDOR",
    usuarioLojaId: pessoa.id,
  });
  return NextResponse.json(linkDoConvite(caminho), { status: 201 });
}

export async function cancelarConvite(quem: QuemMexe, conviteId: string) {
  const ok = await cancelarConviteLoja(quem.lojaId, conviteId);
  if (!ok) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  return NextResponse.json(await equipeDaLoja(quem.lojaId));
}
