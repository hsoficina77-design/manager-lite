"use client";

import { useEffect, useState } from "react";
import { cn, formatDatetime } from "@/lib/utils";
import { PAPEIS, labelPapel, type Papel } from "@/lib/permissoes";
import { SENHA_MIN } from "@/lib/senha-regras";
import { useUsuario } from "@/components/UsuarioProvider";

const inputCls =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
  ultimoAcesso: string | null;
  createdAt: string;
};

const NOVO = { nome: "", email: "", senha: "", papel: "OPERADOR" as Papel };

export default function UsuariosPainel() {
  const eu = useUsuario();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const [modalNovo, setModalNovo] = useState(false);
  const [novo, setNovo] = useState(NOVO);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const [modalSenha, setModalSenha] = useState<Usuario | null>(null);
  const [senhaNova, setSenhaNova] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = () =>
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((d) => setUsuarios(Array.isArray(d) ? d : []))
      .catch(() => setErro("Não foi possível carregar os acessos"))
      .finally(() => setCarregando(false));

  useEffect(() => {
    carregar();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvandoNovo(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novo),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Erro ao criar o acesso");
        return;
      }
      setModalNovo(false);
      setNovo(NOVO);
      setAviso(`Acesso de ${json.nome} criado. Passe a senha para a pessoa.`);
      await carregar();
    } finally {
      setSalvandoNovo(false);
    }
  }

  async function alterar(usuario: Usuario, dados: Record<string, unknown>, mensagem?: string) {
    setErro("");
    setAviso("");
    setOcupado(usuario.id);
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Erro ao salvar");
        return false;
      }
      if (mensagem) setAviso(mensagem);
      await carregar();
      return true;
    } finally {
      setOcupado(null);
    }
  }

  async function definirSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!modalSenha) return;
    setSalvandoSenha(true);
    try {
      const ok = await alterar(
        modalSenha,
        { senha: senhaNova },
        `Senha de ${modalSenha.nome} redefinida. As sessões abertas dessa pessoa foram encerradas.`
      );
      if (ok) {
        setModalSenha(null);
        setSenhaNova("");
      }
    } finally {
      setSalvandoSenha(false);
    }
  }

  async function excluir(usuario: Usuario) {
    if (!confirm(`Excluir o acesso de ${usuario.nome}? Esta ação não pode ser desfeita.`)) return;
    setErro("");
    setOcupado(usuario.id);
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setErro(json.error || "Erro ao excluir");
        return;
      }
      setAviso(`Acesso de ${usuario.nome} excluído.`);
      await carregar();
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Acessos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Quem entra no sistema e o que cada um enxerga.
          </p>
        </div>
        <button
          onClick={() => {
            setErro("");
            setModalNovo(true);
          }}
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700"
        >
          Novo acesso
        </button>
      </div>

      {erro && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}
      {aviso && (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{aviso}</p>
      )}

      <div className="mb-5 rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">O que cada papel vê</p>
        <dl className="mt-2 space-y-1.5">
          {PAPEIS.map((p) => (
            <div key={p.value} className="flex flex-wrap gap-x-2 text-sm">
              <dt className="font-medium text-zinc-800">{p.label}:</dt>
              <dd className="text-zinc-500">{p.ajuda}</dd>
            </div>
          ))}
        </dl>
      </div>

      {carregando ? (
        <p className="text-sm text-zinc-400">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => {
            const souEu = u.id === eu?.id;
            const travado = ocupado === u.id;
            return (
              <div
                key={u.id}
                className={cn(
                  "rounded-xl border border-zinc-200 bg-white p-4",
                  !u.ativo && "opacity-60"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-900">{u.nome}</p>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        {labelPapel(u.papel)}
                      </span>
                      {souEu && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                          você
                        </span>
                      )}
                      {!u.ativo && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          desativado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">{u.email}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {u.ultimoAcesso
                        ? `Último acesso: ${formatDatetime(u.ultimoAcesso)}`
                        : "Nunca entrou"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    <select
                      value={u.papel}
                      disabled={travado || souEu}
                      onChange={(e) => alterar(u, { papel: e.target.value })}
                      title={souEu ? "Você não pode mudar o próprio papel" : "Mudar o papel"}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                    >
                      {PAPEIS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        setSenhaNova("");
                        setModalSenha(u);
                      }}
                      disabled={travado}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Definir senha
                    </button>

                    {!souEu && (
                      <button
                        onClick={() =>
                          alterar(
                            u,
                            { ativo: !u.ativo },
                            u.ativo
                              ? `Acesso de ${u.nome} desativado — as sessões abertas foram encerradas.`
                              : `Acesso de ${u.nome} reativado.`
                          )
                        }
                        disabled={travado}
                        className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        {u.ativo ? "Desativar" : "Reativar"}
                      </button>
                    )}

                    {!souEu && (
                      <button
                        onClick={() => excluir(u)}
                        disabled={travado}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Novo acesso */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <form
            onSubmit={criar}
            className="my-auto w-full max-w-sm space-y-4 rounded-xl bg-white p-5 shadow-xl"
          >
            <h2 className="font-semibold text-zinc-900">Novo acesso</h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Nome</label>
              <input
                required
                autoFocus
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">E-mail</label>
              <input
                type="email"
                required
                inputMode="email"
                value={novo.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Papel</label>
              <select
                value={novo.papel}
                onChange={(e) => setNovo({ ...novo, papel: e.target.value as Papel })}
                className={inputCls}
              >
                {PAPEIS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} — {p.ajuda}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Senha inicial</label>
              <input
                type="text"
                required
                minLength={SENHA_MIN}
                value={novo.senha}
                onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Mínimo de {SENHA_MIN} caracteres. Fica visível para você copiar e passar à
                pessoa — depois ela pode pedir a troca.
              </p>
            </div>

            {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalNovo(false)}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoNovo}
                className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
              >
                {salvandoNovo ? "Criando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Definir senha */}
      {modalSenha && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <form
            onSubmit={definirSenha}
            className="my-auto w-full max-w-sm space-y-4 rounded-xl bg-white p-5 shadow-xl"
          >
            <div>
              <h2 className="font-semibold text-zinc-900">Definir senha</h2>
              <p className="mt-0.5 text-sm text-zinc-500">{modalSenha.nome}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Nova senha</label>
              <input
                type="text"
                required
                autoFocus
                minLength={SENHA_MIN}
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-zinc-500">
                {modalSenha.id === eu?.id
                  ? "Suas outras sessões serão encerradas; esta continua aberta."
                  : "As sessões abertas dessa pessoa serão encerradas na hora."}
              </p>
            </div>

            {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalSenha(null)}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvandoSenha}
                className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
              >
                {salvandoSenha ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
