// Como gravar a lista de itens recebida sobre a que já está no banco.
//
// A gravação antiga apagava todos os itens e recriava — simples, e errado por um
// motivo que só aparece na segunda gravação: o id de cada item mudava a cada save.
//
// Isso quebra a recuperação de custo de `lib/custos.ts`, que é o que impede o
// operador (que não recebe custo na leitura) de zerar o lucro do dono ao salvar. Ela
// funciona casando o `id` que o formulário devolve com a linha do banco; se os ids
// rodaram desde que a tela carregou, nada casa, e o custo vira null em silêncio —
// sem erro, sem aviso, e só o dono percebe, dias depois, olhando a margem.
//
// Daí este plano: item que já existe é atualizado no lugar e mantém o id. Só entra
// linha nova quem é novo de verdade.
//
// Puro de propósito (sem Prisma): OS e orçamento gravam em tabelas diferentes, então
// cada rota executa o plano com o seu próprio delegate tipado.

import { valorDoItem, type ItemValidado } from "@/lib/schemas";

export type DadosItem = {
  tipo: string;
  descricao: string;
  quantidade: number;
  valorUnit: number;
  valorTotal: number;
  custoUnit: number | null;
  fornecedor: string | null;
};

export type PlanoDeItens = {
  /** Itens que já existiam: atualizar no lugar, preservando o id. */
  atualizar: { id: string; dados: DadosItem }[];
  /** Itens novos. */
  criar: DadosItem[];
  /** Ids que sobrevivem — o resto da OS/orçamento sai fora. */
  manter: string[];
};

/**
 * Monta o plano de gravação.
 *
 * `custos` vem de `custosParaSalvar()` e é posicional: o custo de `itens[i]` está em
 * `custos[i]`. `idsNoBanco` limita o que conta como "já existe" aos itens do próprio
 * documento — id de outra OS enviado de propósito é tratado como item novo.
 */
export function planoDeItens(
  itens: ItemValidado[],
  custos: (number | null)[],
  idsNoBanco: Set<string>
): PlanoDeItens {
  const plano: PlanoDeItens = { atualizar: [], criar: [], manter: [] };

  itens.forEach((item, idx) => {
    const dados: DadosItem = {
      tipo: item.tipo,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valorUnit: item.valorUnit,
      valorTotal: valorDoItem(item),
      custoUnit: custos[idx] ?? null,
      fornecedor: item.fornecedor ?? null,
    };

    if (item.id && idsNoBanco.has(item.id)) {
      plano.atualizar.push({ id: item.id, dados });
      plano.manter.push(item.id);
    } else {
      plano.criar.push(dados);
    }
  });

  return plano;
}
