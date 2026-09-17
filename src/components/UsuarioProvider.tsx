"use client";

import { createContext, useContext } from "react";
import type { Papel } from "@/lib/permissoes";

/** O que as telas de cliente sabem de quem está logado. Sem id de sessão. */
export type UsuarioCliente = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  podeFinanceiro: boolean;
  podeExcluir: boolean;
};

const Contexto = createContext<UsuarioCliente | null>(null);

export function UsuarioProvider({
  usuario,
  children,
}: {
  usuario: UsuarioCliente | null;
  children: React.ReactNode;
}) {
  return <Contexto.Provider value={usuario}>{children}</Contexto.Provider>;
}

export function useUsuario(): UsuarioCliente | null {
  return useContext(Contexto);
}

/**
 * O usuário enxerga custo, lucro e margem (dono, ou operador com o checkbox
 * "Financeiro")?
 *
 * Serve para **esconder** o que ele não deve ver — nunca como a única barreira. O que
 * protege de verdade é o proxy, que barra a rota, e a API, que apaga os campos
 * financeiros antes de responder.
 */
export function usePodeFinanceiro(): boolean {
  return useContext(Contexto)?.podeFinanceiro ?? false;
}

/** O usuário pode excluir OS, cliente, orçamento ou veículo (dono, ou checkbox "Excluir")? */
export function usePodeExcluir(): boolean {
  return useContext(Contexto)?.podeExcluir ?? false;
}
