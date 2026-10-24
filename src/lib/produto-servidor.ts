// O produto da requisição, do lado do servidor (páginas, layout, metadados).
//
// Vem do cabeçalho que o proxy grava; onde o proxy não passa (o manifesto, por
// exemplo), sai do próprio host. As regras moram em lib/produto.ts.

import { headers } from "next/headers";
import { HEADER_PRODUTO, ehProduto, hostDaRequisicao, produtoDoHost, type Produto } from "@/lib/produto";

export async function produtoDaRequisicao(): Promise<Produto> {
  const cabecalhos = await headers();
  const doProxy = cabecalhos.get(HEADER_PRODUTO);
  return ehProduto(doProxy) ? doProxy : produtoDoHost(hostDaRequisicao(cabecalhos));
}
