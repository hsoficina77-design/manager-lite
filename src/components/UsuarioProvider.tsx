"use client";

import { createContext, useContext } from "react";
import type { Papel } from "@/lib/permissoes";
import type { Situacao } from "@/lib/plano";

/** Plano da oficina, como a tela recebe (datas em texto ISO — vêm do servidor). */
export type PlanoCliente = {
  situacao: Situacao;
  testeAte: string | null;
  pagoAte: string | null;
  somenteLeitura: boolean;
};

/** O que as telas de cliente sabem de quem está logado. Sem id de sessão. */
export type UsuarioCliente = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  podeFinanceiro: boolean;
  podeExcluir: boolean;
  /** Dono da plataforma — só decide se a aba "Plataforma" aparece. */
  administraPlataforma: boolean;
  plano: PlanoCliente;
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

/**
 * Plano da oficina. `somenteLeitura` serve para a tela avisar **antes** (esconder um
 * formulário que não vai poder ser salvo) — quem barra de verdade é `guardaApi`.
 */
export function usePlano(): PlanoCliente | null {
  return useContext(Contexto)?.plano ?? null;
}
