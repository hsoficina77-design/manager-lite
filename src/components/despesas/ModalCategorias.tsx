"use client";

import { useState } from "react";
import { Aviso, Botao, Entrada, Modal } from "./campos";
import { enviar, mensagemDoErro } from "./api";
import type { Categoria } from "./tipos";

const CORES = [
  "#6366f1", "#0ea5e9", "#14b8a6", "#22c55e", "#84cc16",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#71717a",
];

/**
 * Como a oficina organiza os próprios gastos.
 *
 * Categoria com histórico não pode ser apagada — ela é desativada: some dos
 * formulários e os meses já fechados continuam somando o mesmo. Quem explica isso é a
 * resposta da API, e a mensagem dela vai direto para a tela.
 */
export function ModalCategorias({
  categorias,
  onFechar,
  onMudou,
}: {
  categorias: Categoria[];
  onFechar: () => void;
  onMudou: () => void;
}) {
  const [nova, setNova] = useState({ nome: "", cor: CORES[0] });
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState({ nome: "", cor: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function acao(fn: () => Promise<unknown>) {
    setErro(null);
    setOcupado(true);
    try {
      await fn();
      onMudou();
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setOcupado(false);
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!nova.nome.trim()) return;
    await acao(async () => {
      await enviar("/api/despesas/categorias", "POST", nova);
      setNova({ nome: "", cor: CORES[(categorias.length + 1) % CORES.length] });
    });
  }

  return (
    <Modal
      titulo="Categorias de gasto"
      descricao="Renomeie, mude a cor, crie as suas. A cor é a que aparece no gráfico do mês."
      largura="max-w-lg"
      onFechar={onFechar}
    >
      <div className="space-y-4">
        <form onSubmit={criar} className="flex items-center gap-2">
          <PaletaCor valor={nova.cor} onMudar={(cor) => setNova({ ...nova, cor })} />
          <Entrada
            value={nova.nome}
            onChange={(e) => setNova({ ...nova, nome: e.target.value })}
            placeholder="Nova categoria (ex.: Contador)"
            maxLength={60}
          />
          <Botao type="submit" disabled={ocupado || !nova.nome.trim()} className="shrink-0">
            Criar
          </Botao>
        </form>

        <Aviso>{erro}</Aviso>

        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {categorias.map((c) => {
            const emEdicao = editando === c.id;
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                {emEdicao ? (
                  <>
                    <PaletaCor
                      valor={rascunho.cor}
                      onMudar={(cor) => setRascunho({ ...rascunho, cor })}
                    />
                    <Entrada
                      value={rascunho.nome}
                      onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })}
                      maxLength={60}
                      className="min-w-32 flex-1"
                      autoFocus
                    />
                    <Botao
                      className="shrink-0"
                      disabled={ocupado}
                      onClick={() =>
                        acao(async () => {
                          await enviar(`/api/despesas/categorias/${c.id}`, "PUT", rascunho);
                          setEditando(null);
                        })
                      }
                    >
                      Salvar
                    </Botao>
                    <Botao
                      variante="secundario"
                      className="shrink-0"
                      onClick={() => setEditando(null)}
                    >
                      Cancelar
                    </Botao>
                  </>
                ) : (
                  <>
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: c.cor }}
                    />
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${c.ativa ? "text-zinc-900" : "text-zinc-400 line-through"}`}
                    >
                      {c.nome}
                    </span>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => {
                        setEditando(c.id);
                        setRascunho({ nome: c.nome, cor: c.cor });
                      }}
                      className="shrink-0 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() =>
                        acao(() =>
                          enviar(`/api/despesas/categorias/${c.id}`, "PUT", { ativa: !c.ativa })
                        )
                      }
                      className="shrink-0 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
                    >
                      {c.ativa ? "Desativar" : "Reativar"}
                    </button>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => {
                        if (!confirm(`Excluir a categoria "${c.nome}"?`)) return;
                        acao(() => enviar(`/api/despesas/categorias/${c.id}`, "DELETE"));
                      }}
                      className="shrink-0 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-zinc-400">
          Categoria já usada em algum gasto não pode ser excluída — desative para parar de
          usá-la sem apagar o histórico.
        </p>
      </div>
    </Modal>
  );
}

function PaletaCor({ valor, onMudar }: { valor: string; onMudar: (cor: string) => void }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Escolher cor"
        onClick={() => setAberta((v) => !v)}
        className="h-9 w-9 rounded-lg border border-zinc-300"
        style={{ backgroundColor: valor }}
      />
      {aberta && (
        <div className="absolute left-0 top-11 z-10 grid w-40 grid-cols-6 gap-1.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
          {CORES.map((cor) => (
            <button
              key={cor}
              type="button"
              aria-label={`Cor ${cor}`}
              onClick={() => {
                onMudar(cor);
                setAberta(false);
              }}
              className="h-5 w-5 rounded-full ring-offset-1 hover:ring-2 hover:ring-zinc-300"
              style={{ backgroundColor: cor }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
