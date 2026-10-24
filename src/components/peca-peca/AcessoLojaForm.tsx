"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SENHA_MIN } from "@/lib/senha-regras";

// 16px no celular: abaixo disso o iPhone dá zoom ao focar o campo.
const inputCls =
  "w-full rounded-lg border border-linha-forte px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

/** Aceitar o convite do painel da loja: nome, e-mail (só na primeira vez) e senha. */
export function AcessoLojaForm({
  token,
  novoAcesso,
  nomeSugerido,
  emailSugerido,
}: {
  token: string;
  /** "Novo acesso": a pessoa já existe, só troca a senha (o e-mail continua o mesmo). */
  novoAcesso: boolean;
  nomeSugerido: string;
  emailSugerido: string;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeSugerido);
  const [email, setEmail] = useState(emailSugerido);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const senhaCurta = senha.length > 0 && senha.length < SENHA_MIN;
  const naoConfere = confirmacao.length > 0 && senha !== confirmacao;

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha !== confirmacao) return setErro("As duas senhas não são iguais");
    setSalvando(true);
    try {
      const r = await fetch(`/api/acesso-loja/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email: novoAcesso ? null : email, senha }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) return setErro(json.error ?? "Não foi possível criar o acesso");
      router.replace("/loja");
      router.refresh();
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-4">
      {erro && (
        <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo" role="alert">
          {erro}
        </p>
      )}

      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium text-tinta-2">
          Seu nome
        </label>
        <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
      </div>

      {!novoAcesso && (
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-tinta-2">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-tinta-3">É com ele que você vai entrar daqui em diante.</p>
        </div>
      )}

      <div>
        <label htmlFor="senha" className="mb-1 block text-sm font-medium text-tinta-2">
          {novoAcesso ? "Senha nova" : "Senha"}
        </label>
        <div className="relative">
          <input
            id="senha"
            type={mostrarSenha ? "text" : "password"}
            required
            minLength={SENHA_MIN}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={`${inputCls} pr-16`}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-tinta-3 hover:text-tinta"
          >
            {mostrarSenha ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <p className={`mt-1 text-xs ${senhaCurta ? "text-perigo" : "text-tinta-3"}`}>Pelo menos {SENHA_MIN} caracteres.</p>
      </div>

      <div>
        <label htmlFor="confirmacao" className="mb-1 block text-sm font-medium text-tinta-2">
          Repita a senha
        </label>
        <input
          id="confirmacao"
          type={mostrarSenha ? "text" : "password"}
          required
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          className={inputCls}
        />
        {naoConfere && <p className="mt-1 text-xs text-perigo">As duas senhas não são iguais.</p>}
      </div>

      <button
        type="submit"
        disabled={salvando || senhaCurta || naoConfere}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
      >
        {salvando ? "Entrando..." : "Entrar no balcão"}
      </button>
    </form>
  );
}
