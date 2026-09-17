// Backlog de exclusões: OS, cliente, orçamento e veículo somem do banco ao serem
// excluídos, então este é o único rastro que sobra de quem apagou o quê.

import { prisma } from "@/lib/prisma";

/** Não lança: a exclusão em si não pode falhar por causa do log. */
export async function registrarExclusao(
  tipo: string,
  descricao: string,
  usuario: { id: string; nome: string }
) {
  try {
    await prisma.registroExclusao.create({
      data: { tipo, descricao, usuarioId: usuario.id, usuarioNome: usuario.nome },
    });
  } catch (err) {
    console.error("Falha ao registrar exclusão:", err);
  }
}
