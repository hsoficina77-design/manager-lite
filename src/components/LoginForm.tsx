"use client";

import { useState } from "react";

// 16px no celular: abaixo disso o iPhone dá zoom ao focar o campo.
const inputCls =
  "w-full rounded-lg border border-linha-forte px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function LoginForm({ destino }: { destino: string }) {
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
        setEntrando(false);
        return;
      }
      // Quem trabalha numa autopeça vai para o painel da loja — a não ser que já viesse
      // para uma tela dele.
      const para = json.tipo === "loja" && !destino.startsWith("/loja") ? "/loja" : destino;
      // Carregamento completo, e não `router.replace` + `refresh`: entrar troca a moldura
      // inteira (menu da oficina, painel admin, painel da loja), que mora no layout raiz.
      // E o layout raiz redireciona — a conta da plataforma vai de "/" para "/admin". Numa
      // navegação do Next esse redirect é pego acima do layout, a página toda vira nada e
      // a tela fica preta até a pessoa recarregar. Assim quem redireciona é o servidor.
      // O botão segue em "Entrando..." até a próxima tela abrir.
      window.location.replace(para);
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
      setEntrando(false);
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
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-tinta-2">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
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
        <label htmlFor="senha" className="mb-1 block text-sm font-medium text-tinta-2">
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
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-tinta-3 hover:text-tinta"
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
