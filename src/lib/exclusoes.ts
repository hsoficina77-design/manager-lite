// Backlog de exclusões: OS, cliente, orçamento e veículo somem do banco ao serem
// excluídos, então este é o único rastro que sobra de quem apagou o quê.

import type { Db } from "@/lib/db-oficina";

/** Não lança: a exclusão em si não pode falhar por causa do log. */
export async function registrarExclusao(
  db: Db,
  tipo: string,
  descricao: string,
  usuario: { id: string; nome: string }
) {
  try {
    await db.registroExclusao.create({
      data: { tipo, descricao, usuarioId: usuario.id, usuarioNome: usuario.nome },
    });
  } catch (err) {
    console.error("Falha ao registrar exclusão:", err);
  }
}
