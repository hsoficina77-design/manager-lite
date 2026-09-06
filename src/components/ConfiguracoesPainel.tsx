"use client";

// Painel de configurações.
//
// O conteúdo em si mora em `./configuracoes/secoes.tsx`; aqui fica só a casca:
// navegação, busca, estado do formulário e o botão de salvar. A divisão existe
// porque a lista de configurações vai crescer, e uma tela só com tudo empilhado
// obriga a rolar procurando — o que já estava acontecendo com quatro blocos.
//
// A navegação muda de forma com o tamanho da tela, mas é o mesmo estado:
//   • computador (lg+): trilha fixa à esquerda, conteúdo à direita.
//   • celular/tablet: índice de seções; tocar abre a seção, com voltar no topo.
// A seção aberta vai no endereço (`/configuracoes#marca`), então dá para mandar
// o link direto e o botão "voltar" do aparelho funciona como o esperado.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { compressLogo } from "@/lib/image-compress";
import { CONFIG_PADRAO, type Configuracao } from "@/lib/configuracao";
import { invalidarConfiguracao } from "@/lib/useConfiguracao";
import { variaveisDoTema } from "@/lib/tema";
import { Icone } from "./configuracoes/campos";
import { PreviaDocumento, PreviaSistema } from "./configuracoes/previa";
import { SECOES, acharSecao, gruposDeSecoes, type Secao } from "./configuracoes/secoes";
import { mudou, paraConfig, paraForm, type Form } from "./configuracoes/form";

/** A busca só aparece quando a lista fica grande o bastante para valer o espaço. */
const SECOES_ATE_MOSTRAR_BUSCA = 5;

export default function ConfiguracoesPainel() {
  const router = useRouter();
  const topo = useRef<HTMLDivElement>(null);
  // A seção foi aberta a partir do índice desta visita? Decide se "voltar" é o
  // voltar do histórico ou uma volta forçada — quem chega por link direto numa
  // seção não tem o índice atrás de si e sairia do sistema.
  const veioDoIndice = useRef(false);

  const [form, setForm] = useState<Form>(paraForm(CONFIG_PADRAO));
  const [original, setOriginal] = useState<Form>(paraForm(CONFIG_PADRAO));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erro, setErro] = useState("");
  const [salvoAgora, setSalvoAgora] = useState(false);

  // `null` = índice (celular). No computador o índice não existe, então cai na primeira seção.
  const [ativa, setAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const sujo = mudou(form, original);
  const secao = acharSecao(ativa) ?? SECOES[0];
  const grupos = useMemo(() => gruposDeSecoes(busca), [busca]);
  const achados = grupos.flatMap((g) => g.itens);

  useEffect(() => {
    fetch("/api/configuracao")
      .then((res) => res.json())
      .then((c: Configuracao) => {
        setForm(paraForm(c));
        setOriginal(paraForm(c));
        setLogoUrl(c.logoUrl);
      })
      .catch(() => setErro("Não foi possível carregar as configurações"))
      .finally(() => setCarregando(false));
  }, []);

  // A seção aberta vive no endereço. `hashchange` cobre o voltar do navegador e
  // do aparelho, e também quem cola `/configuracoes#marca` direto na barra.
  useEffect(() => {
    const daHash = () => {
      const id = window.location.hash.replace("#", "");
      const existe = !!acharSecao(id);
      if (!existe) veioDoIndice.current = false;
      setAtiva(existe ? id : null);
    };
    daHash();
    window.addEventListener("hashchange", daHash);
    return () => window.removeEventListener("hashchange", daHash);
  }, []);

  // Pré-visualização ao vivo: as cores escolhidas valem no app inteiro (menu
  // incluído) enquanto esta tela está aberta. Sair sem salvar desfaz sozinho,
  // porque a limpeza remove as variáveis e o tema volta ao que veio do banco.
  useEffect(() => {
    if (carregando) return;
    const raiz = document.documentElement;
    const vars = variaveisDoTema({ corPrimaria: form.corPrimaria, corMenu: form.corMenu });
    for (const [chave, valor] of Object.entries(vars)) raiz.style.setProperty(chave, valor);
    return () => {
      for (const chave of Object.keys(vars)) raiz.style.removeProperty(chave);
    };
  }, [form.corPrimaria, form.corMenu, carregando]);

  // Fechar a aba com edição pendente pede confirmação: cor e texto digitados aqui
  // não têm rascunho salvo em lugar nenhum.
  useEffect(() => {
    if (!sujo) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sujo]);

  const setCampo = useCallback(<K extends keyof Form>(campo: K, valor: Form[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setSalvoAgora(false);
  }, []);

  function abrir(id: string) {
    // Entrar pelo índice empilha no histórico, para o voltar do aparelho devolver
    // a lista. Trocar de seção pela trilha só reescreve o endereço, senão o voltar
    // do computador viraria um desfazer de cliques.
    if (ativa === null) {
      window.history.pushState(null, "", `#${id}`);
      veioDoIndice.current = true;
    } else {
      window.history.replaceState(null, "", `#${id}`);
    }
    setAtiva(id);
    setBusca("");
    topo.current?.scrollIntoView({ block: "start" });
  }

  function voltarAoIndice() {
    if (veioDoIndice.current) {
      veioDoIndice.current = false;
      window.history.back(); // o `hashchange` devolve o índice
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    setAtiva(null);
    topo.current?.scrollIntoView({ block: "start" });
  }

  async function enviarLogo(arquivo: File) {
    setErro("");
    setEnviandoLogo(true);
    try {
      const blob = await compressLogo(arquivo);
      const dados = new FormData();
      dados.append("file", blob, arquivo.name);
      const res = await fetch("/api/configuracao/logo", { method: "POST", body: dados });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao enviar a logo");
      setLogoUrl(json.logoUrl);
      invalidarConfiguracao();
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar a logo");
    } finally {
      setEnviandoLogo(false);
    }
  }

  async function removerLogo() {
    setErro("");
    setEnviandoLogo(true);
    try {
      const res = await fetch("/api/configuracao/logo", { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover a logo");
      setLogoUrl(null);
      invalidarConfiguracao();
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover a logo");
    } finally {
      setEnviandoLogo(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!sujo || salvando) return;
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/configuracao", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          validadeOrcamentoDias: Number(form.validadeOrcamentoDias) || 7,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      setForm(paraForm(json));
      setOriginal(paraForm(json));
      setLogoUrl(json.logoUrl);
      setSalvoAgora(true);
      invalidarConfiguracao();
      // Recarrega o layout do servidor para o menu e o tema virem do banco.
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="p-6 text-sm text-tinta-3">Carregando configurações...</div>;
  }

  const previa = paraConfig(form, logoUrl);
  const propsDaSecao = {
    form,
    setCampo,
    setForm,
    previa,
    logoUrl,
    enviandoLogo,
    aoEnviarLogo: enviarLogo,
    aoRemoverLogo: removerLogo,
  };
  const Conteudo = secao.Conteudo;
  const mostrarBusca = SECOES.length > SECOES_ATE_MOSTRAR_BUSCA;

  const campoDeBusca = (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3">
        <Icone tamanho={16}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </Icone>
      </span>
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={(e) => {
          // Enter dentro do formulário salvaria; aqui ele abre o primeiro resultado.
          if (e.key !== "Enter") return;
          e.preventDefault();
          if (achados[0]) abrir(achados[0].id);
        }}
        placeholder="Buscar configuração"
        aria-label="Buscar configuração"
        className="w-full rounded-lg border border-linha-forte bg-superficie py-2 pl-9 pr-3 text-sm placeholder:text-tinta-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />
    </div>
  );

  return (
    <form onSubmit={salvar}>
      <div ref={topo} />

      {/* ── Barra de título: fica grudada no topo, então salvar está sempre à mão ── */}
      <header className="sticky top-14 z-10 border-b border-linha bg-fundo/90 px-4 py-2.5 backdrop-blur md:top-0 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {ativa && (
            <button
              type="button"
              onClick={voltarAoIndice}
              aria-label="Voltar para a lista de configurações"
              className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-tinta-2 hover:bg-superficie-3 active:bg-superficie-3 lg:hidden"
            >
              <Icone tamanho={20}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </Icone>
            </button>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold text-tinta">
              <span className="lg:hidden">{ativa ? secao.titulo : "Configurações"}</span>
              <span className="hidden lg:inline">Configurações</span>
            </h1>
            <p className="hidden truncate text-xs text-tinta-3 sm:block">
              {ativa ? secao.descricao : "Identidade, marca e o que sai nos documentos."}
            </p>
          </div>

          {sujo && (
            <button
              type="button"
              onClick={() => {
                setForm(original);
                setSalvoAgora(false);
              }}
              className="hidden shrink-0 rounded-lg px-3 py-2 text-sm text-tinta-3 hover:bg-superficie-3 hover:text-tinta sm:block"
            >
              Descartar
            </button>
          )}
          {salvoAgora && !sujo && (
            <span className="flex shrink-0 items-center gap-1.5 text-sm text-ok">
              <Icone tamanho={16}>
                <polyline points="20 6 9 17 4 12" />
              </Icone>
              <span className="hidden sm:inline">Salvo</span>
            </span>
          )}
          <button
            type="submit"
            disabled={!sujo || salvando}
            className={cn(
              "min-h-10 shrink-0 rounded-lg px-4 text-sm font-medium transition-colors",
              sujo
                ? "bg-brand-600 text-brand-fg hover:bg-brand-700"
                : "cursor-default bg-superficie-3 text-tinta-3"
            )}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </header>

      <div className="px-4 pb-16 pt-5 sm:px-6">
        {erro && (
          <p className="mb-5 rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>
        )}

        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
          {/* ── Trilha do computador ────────────────────────────────────── */}
          <nav aria-label="Seções das configurações" className="hidden lg:block">
            {/* Rola por dentro quando a lista passar da altura da tela. */}
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] space-y-5 overflow-y-auto pb-2">
              {mostrarBusca && campoDeBusca}
              {grupos.map((grupo) => (
                <div key={grupo.nome}>
                  <h2 className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-tinta-3">
                    {grupo.nome}
                  </h2>
                  <div className="space-y-0.5">
                    {grupo.itens.map((s) => (
                      <ItemDaTrilha
                        key={s.id}
                        secao={s}
                        ativo={s.id === secao.id}
                        onClick={() => abrir(s.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {grupos.length === 0 && (
                <p className="px-3 text-sm text-tinta-3">Nada encontrado.</p>
              )}
            </div>
          </nav>

          <div className="min-w-0">
            {/* ── Índice do celular ─────────────────────────────────────── */}
            <div className={cn("space-y-6 lg:hidden", ativa && "hidden")}>
              {mostrarBusca && campoDeBusca}
              {grupos.map((grupo) => (
                <div key={grupo.nome}>
                  <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-tinta-3">
                    {grupo.nome}
                  </h2>
                  <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
                    {grupo.itens.map((s) => (
                      <ItemDoIndice key={s.id} secao={s} onClick={() => abrir(s.id)} />
                    ))}
                  </div>
                </div>
              ))}
              {grupos.length === 0 && (
                <p className="rounded-xl border border-linha bg-superficie p-6 text-center text-sm text-tinta-3">
                  Nada encontrado para “{busca}”.
                </p>
              )}
            </div>

            {/* ── A seção aberta ────────────────────────────────────────── */}
            <div className={cn(!ativa && "hidden lg:block")}>
              <div className="mb-4 hidden lg:block">
                <h2 className="text-lg font-bold text-tinta">{secao.titulo}</h2>
                <p className="mt-0.5 text-sm text-tinta-3">{secao.descricao}</p>
              </div>

              <div
                className={cn(
                  "grid gap-5",
                  secao.previa && "xl:grid-cols-[minmax(0,1fr)_17rem]"
                )}
              >
                <div className="min-w-0 space-y-5">
                  <Conteudo {...propsDaSecao} />
                </div>

                {secao.previa && (
                  <aside>
                    <div className="space-y-4 xl:sticky xl:top-24">
                      <PreviaDocumento config={previa} />
                      {secao.previa === "marca" && <PreviaSistema />}
                    </div>
                  </aside>
                )}
              </div>

              {/* Continuar sem voltar ao índice: no celular economiza dois toques. */}
              <ProximaSecao atual={secao} onIr={abrir} />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function ItemDaTrilha({
  secao,
  ativo,
  onClick,
}: {
  secao: Secao;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        ativo
          ? "bg-brand-50 font-medium text-brand-700"
          : "text-tinta-2 hover:bg-superficie-3/70 hover:text-tinta"
      )}
    >
      <span className={cn(ativo ? "text-brand-600" : "text-tinta-3")}>{secao.icone}</span>
      <span className="min-w-0 truncate">{secao.titulo}</span>
    </button>
  );
}

function ItemDoIndice({ secao, onClick }: { secao: Secao; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-superficie-2 active:bg-superficie-3"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {secao.icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-tinta">{secao.titulo}</span>
        <span className="block truncate text-xs text-tinta-3">{secao.descricao}</span>
      </span>
      <span className="shrink-0 text-tinta-3">
        <Icone>
          <polyline points="9 18 15 12 9 6" />
        </Icone>
      </span>
    </button>
  );
}

/** Atalho para a seção seguinte, no fim da tela — leitura em ordem sem voltar. */
function ProximaSecao({ atual, onIr }: { atual: Secao; onIr: (id: string) => void }) {
  const proxima = SECOES[SECOES.findIndex((s) => s.id === atual.id) + 1];
  if (!proxima) return null;
  return (
    <button
      type="button"
      onClick={() => onIr(proxima.id)}
      className="mt-5 flex w-full items-center gap-3 rounded-xl border border-linha bg-superficie px-4 py-3 text-left transition-colors hover:border-linha-forte hover:bg-superficie-2"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-tinta-3">Próximo</span>
        <span className="block truncate text-sm font-medium text-tinta">{proxima.titulo}</span>
      </span>
      <span className="shrink-0 text-tinta-3">
        <Icone>
          <polyline points="9 18 15 12 9 6" />
        </Icone>
      </span>
    </button>
  );
}
