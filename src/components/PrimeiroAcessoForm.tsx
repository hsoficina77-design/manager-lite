"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SENHA_MIN } from "@/lib/senha-regras";

const inputCls =
  "w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function PrimeiroAcessoForm() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmacao: "", token: "" });
  // Instalação protegida por código (SETUP_TOKEN no servidor) pede mais um campo.
  const [exigeToken, setExigeToken] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const setCampo = (campo: keyof typeof form, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  useEffect(() => {
    fetch("/api/auth/primeiro-acesso")
      .then((r) => r.json())
      .then((d) => setExigeToken(Boolean(d.exigeToken)))
      .catch(() => {});
  }, []);

  const senhaCurta = form.senha.length > 0 && form.senha.length < SENHA_MIN;
  const naoConfere = form.confirmacao.length > 0 && form.senha !== form.confirmacao;

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (form.senha !== form.confirmacao) {
      setErro("As duas senhas não são iguais");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/auth/primeiro-acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          ...(exigeToken ? { token: form.token } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error || "Não foi possível criar o acesso");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={criar} className="space-y-4">
      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {erro}
        </p>
      )}

      {exigeToken && (
        <div>
          <label htmlFor="token" className="mb-1 block text-sm font-medium text-zinc-700">
            Código de instalação
          </label>
          <input
            id="token"
            required
            value={form.token}
            onChange={(e) => setCampo("token", e.target.value)}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-zinc-500">
            É o valor de <code>SETUP_TOKEN</code> nas variáveis de ambiente do servidor.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium text-zinc-700">
          Seu nome
        </label>
        <input
          id="nome"
          required
          autoFocus
          value={form.nome}
          onChange={(e) => setCampo("nome", e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          value={form.email}
          onChange={(e) => setCampo("email", e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-zinc-500">É com ele que você vai entrar daqui em diante.</p>
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
            minLength={SENHA_MIN}
            autoComplete="new-password"
            value={form.senha}
            onChange={(e) => setCampo("senha", e.target.value)}
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
        <p className={`mt-1 text-xs ${senhaCurta ? "text-red-600" : "text-zinc-500"}`}>
          Pelo menos {SENHA_MIN} caracteres.
        </p>
      </div>

      <div>
        <label htmlFor="confirmacao" className="mb-1 block text-sm font-medium text-zinc-700">
          Repita a senha
        </label>
        <input
          id="confirmacao"
          type={mostrarSenha ? "text" : "password"}
          required
          autoComplete="new-password"
          value={form.confirmacao}
          onChange={(e) => setCampo("confirmacao", e.target.value)}
          className={inputCls}
        />
        {naoConfere && <p className="mt-1 text-xs text-red-600">As duas senhas não são iguais.</p>}
      </div>

      <button
        type="submit"
        disabled={salvando || senhaCurta || naoConfere}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
      >
        {salvando ? "Criando..." : "Criar acesso e entrar"}
      </button>
    </form>
  );
}
