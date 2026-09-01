// Chamadas de escrita do controle de gastos.
//
// A rota devolve `{ error }` com uma mensagem escrita para o dono ler ("Já existe uma
// categoria com esse nome"). Jogar isso na tela é melhor do que um "erro ao salvar"
// genérico — foi por não fazer isso que a tela antiga falhava em silêncio quando o
// POST voltava 400.

export async function enviar<T = unknown>(
  url: string,
  metodo: "POST" | "PUT" | "DELETE",
  corpo?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method: metodo,
    headers: corpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  const dados = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (dados as { error?: string } | null)?.error ?? "Não foi possível salvar. Tente de novo."
    );
  }
  return dados as T;
}

export function mensagemDoErro(err: unknown): string {
  return err instanceof Error ? err.message : "Não foi possível salvar. Tente de novo.";
}
