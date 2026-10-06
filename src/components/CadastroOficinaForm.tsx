"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SENHA_MIN } from "@/lib/senha-regras";

// 16px no celular: abaixo disso o iPhone dá zoom ao focar o campo.
const inputCls =
  "w-full rounded-lg border border-linha-forte px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

/**
 * Cadastro de uma oficina e do dono dela. Serve às duas portas de entrada:
 *
 *   - instalação (`/primeiro-acesso`): sistema vazio, cria a primeira oficina;
 *   - convite (`/convite/<token>`): o link que o dono da plataforma mandou;
 *   - teste grátis (`/teste`): o link aberto da bio, que pede também o WhatsApp.
 */
export default function CadastroOficinaForm({
  convite,
  teste,
}: {
  /** Sem convite nem teste, é a instalação. */
  convite?: { token: string; nomeOficina: string | null };
  teste?: { origem: string | null };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    nomeOficina: convite?.nomeOficina ?? "",
    nome: "",
    email: "",
    senha: "",
    confirmacao: "",
    token: "",
    whatsapp: "",
    // Campo-armadilha: escondido de quem usa a tela; robô preenche e é recusado.
    site: "",
  });
  const [aceite, setAceite] = useState(false);
  // Instalação protegida por código (SETUP_TOKEN no servidor) pede mais um campo.
  const [exigeToken, setExigeToken] = useState(false);
  const endpoint = teste
    ? "/api/teste"
    : convite
      ? `/api/convite/${encodeURIComponent(convite.token)}`
      : "/api/auth/primeiro-acesso";
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const setCampo = (campo: keyof typeof form, valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  useEffect(() => {
    if (convite || teste) return;
    fetch("/api/auth/primeiro-acesso")
      .then((r) => r.json())
      .then((d) => setExigeToken(Boolean(d.exigeToken)))
      .catch(() => {});
  }, [convite, teste]);

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
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeOficina: form.nomeOficina,
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          ...(exigeToken ? { token: form.token } : {}),
          ...(teste ? { whatsapp: form.whatsapp, site: form.site, aceite, origem: teste.origem } : {}),
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
        <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo" role="alert">
          {erro}
        </p>
      )}

      {exigeToken && (
        <div>
          <label htmlFor="token" className="mb-1 block text-sm font-medium text-tinta-2">
            Código de instalação
          </label>
          <input
            id="token"
            required
            value={form.token}
            onChange={(e) => setCampo("token", e.target.value)}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-tinta-3">
            É o valor de <code>SETUP_TOKEN</code> nas variáveis de ambiente do servidor.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="nomeOficina" className="mb-1 block text-sm font-medium text-tinta-2">
          Nome da oficina
        </label>
        <input
          id="nomeOficina"
          required
          autoFocus
          maxLength={120}
          value={form.nomeOficina}
          onChange={(e) => setCampo("nomeOficina", e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-tinta-3">Sai no menu e nos documentos. Dá para mudar depois.</p>
      </div>

      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium text-tinta-2">
          Seu nome
        </label>
        <input
          id="nome"
          required
          value={form.nome}
          onChange={(e) => setCampo("nome", e.target.value)}
          className={inputCls}
        />
      </div>

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
          autoComplete="username"
          inputMode="email"
          value={form.email}
          onChange={(e) => setCampo("email", e.target.value)}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-tinta-3">É com ele que você vai entrar daqui em diante.</p>
      </div>

      {teste && (
        <div>
          <label htmlFor="whatsapp" className="mb-1 block text-sm font-medium text-tinta-2">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            type="tel"
            required
            autoComplete="tel-national"
            inputMode="tel"
            placeholder="(00) 00000-0000"
            value={form.whatsapp}
            onChange={(e) => setCampo("whatsapp", mascaraTelefone(e.target.value))}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-tinta-3">Para te ajudarmos durante o teste, se precisar.</p>
        </div>
      )}

      <div>
        <label htmlFor="senha" className="mb-1 block text-sm font-medium text-tinta-2">
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
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-tinta-3 hover:text-tinta"
          >
            {mostrarSenha ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <p className={`mt-1 text-xs ${senhaCurta ? "text-perigo" : "text-tinta-3"}`}>
          Pelo menos {SENHA_MIN} caracteres.
        </p>
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
          value={form.confirmacao}
          onChange={(e) => setCampo("confirmacao", e.target.value)}
          className={inputCls}
        />
        {naoConfere && <p className="mt-1 text-xs text-perigo">As duas senhas não são iguais.</p>}
      </div>

      {teste && (
        <>
          {/* Fora da tela e fora do Tab: só robô chega aqui. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="site">Site</label>
            <input
              id="site"
              tabIndex={-1}
              autoComplete="off"
              value={form.site}
              onChange={(e) => setCampo("site", e.target.value)}
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-tinta-2">
            <input
              type="checkbox"
              required
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span>
              Li e aceito os{" "}
              <a href="/termos" target="_blank" className="text-brand-texto underline">
                Termos de uso
              </a>{" "}
              e a{" "}
              <a href="/privacidade" target="_blank" className="text-brand-texto underline">
                Política de privacidade
              </a>
              .
            </span>
          </label>
        </>
      )}

      <button
        type="submit"
        disabled={salvando || senhaCurta || naoConfere || (Boolean(teste) && !aceite)}
        className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
      >
        {salvando ? "Criando..." : teste ? "Começar meu teste grátis" : "Criar oficina e entrar"}
      </button>
    </form>
  );
}

/** (11) 98765-4321 enquanto digita — só formatação; quem valida é o servidor. */
function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
