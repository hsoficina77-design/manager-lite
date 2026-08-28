"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function LoginForm({ destino }: { destino: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEntrando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Não foi possível entrar");
        setSenha("");
        return;
      }
      // `refresh` antes do `push` para o layout já vir com o usuário carregado.
      router.replace(destino);
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="senha" className="mb-1 block text-sm font-medium text-zinc-700">
          Senha
        </label>
        <div className="relative">
          <input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={`${inputCls} pr-16`}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800"
          >
            {mostrarSenha ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={entrando}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
      >
        {entrando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
