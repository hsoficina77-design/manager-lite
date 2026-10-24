"use client";

import { createContext, useContext } from "react";
import type { Produto } from "@/lib/produto";

// Em qual dos dois produtos a tela está (boxOS ou Peça Peça), e o endereço de cada um —
// o layout lê do servidor (ver lib/produto.ts) e passa para cá.

type ProdutoCliente = {
  produto: Produto;
  /** Endereço público do boxOS; vazio quando não configurado. */
  urlBoxOS: string;
};

const Contexto = createContext<ProdutoCliente>({ produto: "boxos", urlBoxOS: "" });

export function ProdutoProvider({ valor, children }: { valor: ProdutoCliente; children: React.ReactNode }) {
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useProduto(): Produto {
  return useContext(Contexto).produto;
}

/**
 * Link para uma tela do boxOS (orçamento, OS). No endereço do Peça Peça ela não existe:
 * o link vai para o endereço do boxOS, onde a pessoa entra com o mesmo e-mail e senha.
 */
export function useLinkDoBoxOS(): (caminho: string) => string {
  const { produto, urlBoxOS } = useContext(Contexto);
  return (caminho) => (produto === "peca-peca" && urlBoxOS ? `${urlBoxOS}${caminho}` : caminho);
}
