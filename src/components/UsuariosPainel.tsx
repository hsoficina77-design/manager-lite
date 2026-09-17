"use client";

import { useEffect, useState } from "react";
import { cn, formatDatetime } from "@/lib/utils";
import { PAPEIS, labelPapel, type Papel } from "@/lib/permissoes";
import { SENHA_MIN } from "@/lib/senha-regras";
import { useUsuario } from "@/components/UsuarioProvider";
import { useConfirmar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { Entrada, Selecao } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { EsqueletoLista } from "@/components/ui/Dados";

const inputCls =
  "w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  podeFinanceiro: boolean;
  podeExcluir: boolean;
  ativo: boolean;
  ultimoAcesso: string | null;
  createdAt: string;
};

type Exclusao = {
  id: string;
  tipo: string;
  descricao: string;
  usuarioNome: string;
  createdAt: string;
};

const NOVO = {
  nome: "",
  email: "",
  senha: "",
  papel: "OPERADOR" as Papel,
  podeFinanceiro: false,
  podeExcluir: false,
};

export default function UsuariosPainel() {
  const eu = useUsuario();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const confirmar = useConfirmar();
  const [aviso, setAviso] = useState("");

  const [exclusoes, setExclusoes] = useState<Exclusao[]>([]);
  const [carregandoExclusoes, setCarregandoExclusoes] = useState(true);

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
    fetch("/api/exclusoes")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setExclusoes(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setCarregandoExclusoes(false));
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
    const ok = await confirmar({
      titulo: `Excluir o acesso de ${usuario.nome}?`,
      texto: "A pessoa perde o login imediatamente e as sessões abertas são encerradas. Não há como desfazer.",
      acao: "Excluir acesso",
      perigo: true,
    });
    if (!ok) return;
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
          <h1 className="text-2xl font-bold text-tinta">Acessos</h1>
          <p className="mt-1 text-sm text-tinta-3">
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

      {erro && <p className="mb-4 rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>}
      {aviso && (
        <p className="mb-4 rounded-lg bg-ok-fraco px-3 py-2 text-sm text-ok">{aviso}</p>
      )}

      <div className="mb-5 rounded-xl border border-linha bg-superficie p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-tinta-3">O que cada papel vê</p>
        <dl className="mt-2 space-y-1.5">
          {PAPEIS.map((p) => (
            <div key={p.value} className="flex flex-wrap gap-x-2 text-sm">
              <dt className="font-medium text-tinta">{p.label}:</dt>
              <dd className="text-tinta-3">{p.ajuda}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-tinta-3">
          Cada operador pode ganhar financeiro e/ou exclusão marcando as caixas abaixo do nome dele.
        </p>
      </div>

      {carregando ? (
        <EsqueletoLista linhas={3} />
      ) : (
        <div className="space-y-2">
          {usuarios.map((u) => {
            const souEu = u.id === eu?.id;
            const travado = ocupado === u.id;
            return (
              <div
                key={u.id}
                className={cn(
                  "rounded-xl border border-linha bg-superficie p-4",
                  !u.ativo && "opacity-60"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-tinta">{u.nome}</p>
                      <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs font-medium text-tinta-2">
                        {labelPapel(u.papel)}
                      </span>
                      {souEu && (
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                          você
                        </span>
                      )}
                      {!u.ativo && (
                        <span className="rounded-full bg-perigo-fraco px-2 py-0.5 text-xs font-medium text-perigo">
                          desativado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-tinta-3">{u.email}</p>
                    <p className="mt-0.5 text-xs text-tinta-3">
                      {u.ultimoAcesso
                        ? `Último acesso: ${formatDatetime(u.ultimoAcesso)}`
                        : "Nunca entrou"}
                    </p>

                    {/* Dono já tem tudo; o ajuste fino só faz sentido para operador. */}
                    {u.papel === "OPERADOR" && (
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                        <label className="flex min-h-6 items-center gap-1.5 text-xs text-tinta-2">
                          <input
                            type="checkbox"
                            checked={u.podeFinanceiro}
                            disabled={travado}
                            onChange={(e) => alterar(u, { podeFinanceiro: e.target.checked })}
                            className="h-4 w-4 rounded border-linha-forte accent-brand-600"
                          />
                          Financeiro (caixa, despesas, contas a receber)
                        </label>
                        <label className="flex min-h-6 items-center gap-1.5 text-xs text-tinta-2">
                          <input
                            type="checkbox"
                            checked={u.podeExcluir}
                            disabled={travado}
                            onChange={(e) => alterar(u, { podeExcluir: e.target.checked })}
                            className="h-4 w-4 rounded border-linha-forte accent-brand-600"
                          />
                          Excluir OS, clientes, orçamentos e veículos
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:shrink-0">
                    <select
                      value={u.papel}
                      disabled={travado || souEu}
                      onChange={(e) => alterar(u, { papel: e.target.value })}
                      title={souEu ? "Você não pode mudar o próprio papel" : "Mudar o papel"}
                      className="min-h-11 rounded-lg border border-linha-forte bg-superficie px-2.5 text-xs text-tinta outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 sm:min-h-9"
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
                      className="min-h-11 rounded-lg border border-linha-forte px-2.5 text-xs text-tinta-2 hover:bg-superficie-2 disabled:opacity-50 sm:min-h-9"
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
                        className="min-h-11 rounded-lg border border-linha-forte px-2.5 text-xs text-tinta-2 hover:bg-superficie-2 disabled:opacity-50 sm:min-h-9"
                      >
                        {u.ativo ? "Desativar" : "Reativar"}
                      </button>
                    )}

                    {!souEu && (
                      <button
                        onClick={() => excluir(u)}
                        disabled={travado}
                        className="min-h-11 rounded-lg border border-perigo-linha px-2.5 text-xs text-perigo hover:bg-perigo-fraco disabled:opacity-50 sm:min-h-9"
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
        <Modal
          titulo="Novo acesso"
          descricao="A pessoa entra com este e-mail e a senha inicial."
          largura="max-w-sm"
          onFechar={() => setModalNovo(false)}
          rodape={
            <div className="flex gap-2">
              <Botao type="submit" form="form-novo-acesso" className="flex-1" disabled={salvandoNovo}>
                {salvandoNovo ? "Criando..." : "Criar acesso"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => setModalNovo(false)}>
                Cancelar
              </Botao>
            </div>
          }
        >
          <form id="form-novo-acesso" onSubmit={criar} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta-2" htmlFor="novo-nome">
                Nome
              </label>
              <Entrada
                id="novo-nome"
                required
                data-foco-inicial
                value={novo.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-tinta-2" htmlFor="novo-email">
                E-mail
              </label>
              <Entrada
                id="novo-email"
                type="email"
                required
                inputMode="email"
                value={novo.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-tinta-2" htmlFor="novo-papel">
                Papel
              </label>
              <Selecao
                id="novo-papel"
                value={novo.papel}
                onChange={(e) => setNovo({ ...novo, papel: e.target.value as Papel })}
              >
                {PAPEIS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} — {p.ajuda}
                  </option>
                ))}
              </Selecao>
            </div>

            {novo.papel === "OPERADOR" && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-tinta-2">Acessos extras</p>
                <label className="flex min-h-6 items-center gap-1.5 text-sm text-tinta-2">
                  <input
                    type="checkbox"
                    checked={novo.podeFinanceiro}
                    onChange={(e) => setNovo({ ...novo, podeFinanceiro: e.target.checked })}
                    className="h-4 w-4 rounded border-linha-forte accent-brand-600"
                  />
                  Financeiro (caixa, despesas, contas a receber)
                </label>
                <label className="flex min-h-6 items-center gap-1.5 text-sm text-tinta-2">
                  <input
                    type="checkbox"
                    checked={novo.podeExcluir}
                    onChange={(e) => setNovo({ ...novo, podeExcluir: e.target.checked })}
                    className="h-4 w-4 rounded border-linha-forte accent-brand-600"
                  />
                  Excluir OS, clientes, orçamentos e veículos
                </label>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-tinta-2" htmlFor="novo-senha">
                Senha inicial
              </label>
              <Entrada
                id="novo-senha"
                type="text"
                required
                minLength={SENHA_MIN}
                value={novo.senha}
                onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
              />
              <p className="mt-1 text-xs text-tinta-3">
                Mínimo de {SENHA_MIN} caracteres. Fica visível para você copiar e passar à pessoa —
                depois ela pode pedir a troca.
              </p>
            </div>

            {erro && <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>}
          </form>
        </Modal>
      )}

      {/* Definir senha */}
      {modalSenha && (
        <Modal
          titulo="Definir senha"
          descricao={modalSenha.nome}
          largura="max-w-sm"
          onFechar={() => setModalSenha(null)}
          rodape={
            <div className="flex gap-2">
              <Botao type="submit" form="form-senha" className="flex-1" disabled={salvandoSenha}>
                {salvandoSenha ? "Salvando..." : "Salvar senha"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => setModalSenha(null)}>
                Cancelar
              </Botao>
            </div>
          }
        >
          <form id="form-senha" onSubmit={definirSenha} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-tinta-2" htmlFor="senha-nova">
                Nova senha
              </label>
              <Entrada
                id="senha-nova"
                type="text"
                required
                data-foco-inicial
                minLength={SENHA_MIN}
                value={senhaNova}
                onChange={(e) => setSenhaNova(e.target.value)}
              />
              <p className="mt-1 text-xs text-tinta-3">
                {modalSenha.id === eu?.id
                  ? "Suas outras sessões serão encerradas; esta continua aberta."
                  : "As sessões abertas dessa pessoa serão encerradas na hora."}
              </p>
            </div>

            {erro && <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>}
          </form>
        </Modal>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-tinta">Exclusões recentes</h2>
        <p className="mt-1 text-sm text-tinta-3">
          Rastro de quem apagou OS, cliente, orçamento ou veículo — o registro em si some, isto fica.
        </p>

        {carregandoExclusoes ? (
          <div className="mt-3">
            <EsqueletoLista linhas={3} />
          </div>
        ) : exclusoes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-linha bg-superficie p-4 text-sm text-tinta-3">
            Nenhuma exclusão registrada ainda.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {exclusoes.map((ex) => (
              <div
                key={ex.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-linha bg-superficie px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs font-medium text-tinta-2">
                    {ex.tipo}
                  </span>
                  <span className="ml-2 text-tinta">{ex.descricao}</span>
                </div>
                <p className="shrink-0 text-xs text-tinta-3">
                  {ex.usuarioNome} · {formatDatetime(ex.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
