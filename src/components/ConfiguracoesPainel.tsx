"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { compressLogo } from "@/lib/image-compress";
import {
  CONFIG_PADRAO,
  linhasDoCabecalho,
  rodapeDoDocumento,
  type Configuracao,
} from "@/lib/configuracao";
import { invalidarConfiguracao } from "@/lib/useConfiguracao";
import {
  COR_MENU_PADRAO,
  COR_PRIMARIA_PADRAO,
  MENUS_SUGERIDOS,
  PALETA_SUGERIDA,
  corValida,
  variaveisDoTema,
} from "@/lib/tema";

const inputCls =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

/** O formulário trabalha com strings; a conversão acontece no envio. */
type Form = {
  nome: string; nomeCurto: string; cnpj: string; telefone: string; whatsapp: string;
  email: string; site: string; cep: string; endereco: string; cidade: string; estado: string;
  corPrimaria: string; corMenu: string;
  rodapeDocumento: string; mensagemDocumento: string;
  mostrarAssinatura: boolean; validadeOrcamentoDias: string;
};

function paraForm(c: Configuracao): Form {
  return {
    nome: c.nome ?? "",
    nomeCurto: c.nomeCurto ?? "",
    cnpj: c.cnpj ?? "",
    telefone: c.telefone ?? "",
    whatsapp: c.whatsapp ?? "",
    email: c.email ?? "",
    site: c.site ?? "",
    cep: c.cep ?? "",
    endereco: c.endereco ?? "",
    cidade: c.cidade ?? "",
    estado: c.estado ?? "",
    corPrimaria: c.corPrimaria,
    corMenu: c.corMenu,
    rodapeDocumento: c.rodapeDocumento ?? "",
    mensagemDocumento: c.mensagemDocumento ?? "",
    mostrarAssinatura: c.mostrarAssinatura,
    validadeOrcamentoDias: String(c.validadeOrcamentoDias),
  };
}

/** Configuração equivalente ao que está no formulário — alimenta a pré-visualização. */
function paraConfig(form: Form, logoUrl: string | null): Configuracao {
  const texto = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    ...CONFIG_PADRAO,
    nome: form.nome.trim() || CONFIG_PADRAO.nome,
    nomeCurto: texto(form.nomeCurto),
    cnpj: texto(form.cnpj),
    telefone: texto(form.telefone),
    whatsapp: texto(form.whatsapp),
    email: texto(form.email),
    site: texto(form.site),
    cep: texto(form.cep),
    endereco: texto(form.endereco),
    cidade: texto(form.cidade),
    estado: texto(form.estado),
    logoUrl,
    corPrimaria: form.corPrimaria,
    corMenu: form.corMenu,
    rodapeDocumento: texto(form.rodapeDocumento),
    mensagemDocumento: texto(form.mensagemDocumento),
    mostrarAssinatura: form.mostrarAssinatura,
  };
}

export default function ConfiguracoesPainel() {
  const router = useRouter();
  const inputLogo = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>(paraForm(CONFIG_PADRAO));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    fetch("/api/configuracao")
      .then((res) => res.json())
      .then((c: Configuracao) => {
        setForm(paraForm(c));
        setLogoUrl(c.logoUrl);
      })
      .catch(() => setErro("Não foi possível carregar as configurações"))
      .finally(() => setCarregando(false));
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

  function setCampo<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setSalvo(false);
  }

  async function buscarCep() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          endereco: [data.logradouro, data.bairro].filter(Boolean).join(", ") || f.endereco,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }));
      }
    } catch {}
  }

  async function enviarLogo(file: File) {
    setErro("");
    setEnviandoLogo(true);
    try {
      const blob = await compressLogo(file);
      const dados = new FormData();
      dados.append("file", blob, file.name);
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
      if (inputLogo.current) inputLogo.current.value = "";
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
      setLogoUrl(json.logoUrl);
      setSalvo(true);
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
    return <div className="text-sm text-zinc-500">Carregando configurações...</div>;
  }

  const previa = paraConfig(form, logoUrl);

  return (
    <form onSubmit={salvar} className="pb-24 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">A sua oficina</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Identidade, marca e o que sai nos documentos entregues ao cliente.
        </p>
      </div>

      {erro && (
        <p className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="min-w-0 space-y-5">
          {/* ── Identidade ─────────────────────────────────────────── */}
          <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div>
              <h2 className="font-semibold text-zinc-800">Identidade</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Aparece no topo da OS e do orçamento que o cliente recebe.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Nome da oficina *
                </label>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setCampo("nome", e.target.value)}
                  placeholder="Ex.: Auto Center Silva"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Nome curto (menu)
                </label>
                <input
                  value={form.nomeCurto}
                  onChange={(e) => setCampo("nomeCurto", e.target.value)}
                  placeholder="Deixe vazio para usar o nome completo"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">CNPJ / CPF</label>
                <input
                  value={form.cnpj}
                  onChange={(e) => setCampo("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Telefone</label>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => setCampo("telefone", e.target.value)}
                  placeholder="(00) 0000-0000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setCampo("whatsapp", e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setCampo("email", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Site / Instagram</label>
                <input
                  value={form.site}
                  onChange={(e) => setCampo("site", e.target.value)}
                  placeholder="@suaoficina"
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* ── Endereço ───────────────────────────────────────────── */}
          <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold text-zinc-800">Endereço</h2>
            <div className="grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">CEP</label>
                <input
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) => setCampo("cep", e.target.value)}
                  onBlur={buscarCep}
                  placeholder="00000-000"
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-4">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Endereço</label>
                <input
                  value={form.endereco}
                  onChange={(e) => setCampo("endereco", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-4">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Cidade</label>
                <input
                  value={form.cidade}
                  onChange={(e) => setCampo("cidade", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700">UF</label>
                <input
                  maxLength={2}
                  value={form.estado}
                  onChange={(e) => setCampo("estado", e.target.value.toUpperCase())}
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* ── Marca ──────────────────────────────────────────────── */}
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5">
            <div>
              <h2 className="font-semibold text-zinc-800">Marca</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Logo e cores. As cores valem no sistema inteiro e nos documentos.
              </p>
            </div>

            {/* Logo */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo da oficina" className="h-20 w-20 object-contain" />
                ) : (
                  <span className="px-2 text-center text-xs text-zinc-400">Sem logo</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  ref={inputLogo}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) enviarLogo(file);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={enviandoLogo}
                    onClick={() => inputLogo.current?.click()}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
                  >
                    {enviandoLogo ? "Enviando..." : logoUrl ? "Trocar logo" : "Enviar logo"}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      disabled={enviandoLogo}
                      onClick={removerLogo}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remover
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  PNG, JPG, WebP ou SVG, até 2MB. PNG com fundo transparente fica melhor no
                  cabeçalho. A logo é salva assim que você escolhe o arquivo.
                </p>
              </div>
            </div>

            <SeletorDeCor
              titulo="Cor principal"
              ajuda="Botões, destaques e o número da OS."
              valor={form.corPrimaria}
              padrao={COR_PRIMARIA_PADRAO}
              sugestoes={PALETA_SUGERIDA}
              onChange={(cor) => setCampo("corPrimaria", cor)}
            />

            <SeletorDeCor
              titulo="Cor do menu"
              ajuda="Fundo da barra lateral."
              valor={form.corMenu}
              padrao={COR_MENU_PADRAO}
              sugestoes={MENUS_SUGERIDOS}
              onChange={(cor) => setCampo("corMenu", cor)}
            />
          </section>

          {/* ── Documentos ─────────────────────────────────────────── */}
          <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div>
              <h2 className="font-semibold text-zinc-800">Documentos</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Vale para a OS e o orçamento, na tela, na impressão e no PDF.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Recado ao cliente
              </label>
              <textarea
                rows={3}
                value={form.mensagemDocumento}
                onChange={(e) => setCampo("mensagemDocumento", e.target.value)}
                placeholder="Ex.: Garantia de 90 dias para peças e serviços, conforme o Código de Defesa do Consumidor."
                className={cn(inputCls, "resize-y")}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Impresso num quadro no fim do documento. Deixe vazio para não aparecer.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Rodapé</label>
              <input
                value={form.rodapeDocumento}
                onChange={(e) => setCampo("rodapeDocumento", e.target.value)}
                placeholder={rodapeDoDocumento({ ...previa, rodapeDocumento: null })}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-zinc-500">
                Vazio usa o nome da oficina e o telefone.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Validade padrão do orçamento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    inputMode="numeric"
                    value={form.validadeOrcamentoDias}
                    onChange={(e) => setCampo("validadeOrcamentoDias", e.target.value)}
                    className={cn(inputCls, "w-24")}
                  />
                  <span className="text-sm text-zinc-500">dias</span>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.mostrarAssinatura}
                  onChange={(e) => setCampo("mostrarAssinatura", e.target.checked)}
                  className="h-4 w-4 accent-brand-600"
                />
                Espaço para assinatura do cliente
              </label>
            </div>
          </section>
        </div>

        {/* ── Pré-visualização ─────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Topo da OS
            </p>
            <div className="rounded-lg border border-zinc-200 p-4">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-12 w-12 shrink-0 object-contain" />
                )}
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-sm font-black uppercase tracking-wider">
                    {previa.nome}
                  </p>
                  {linhasDoCabecalho(previa).map((linha) => (
                    <p key={linha} className="mt-0.5 truncate text-[10px] text-zinc-500">
                      {linha}
                    </p>
                  ))}
                </div>
                {logoUrl && <div aria-hidden className="h-12 w-12 shrink-0" />}
              </div>
              <div className="my-3 h-0.5" style={{ backgroundColor: form.corPrimaria }} />
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                    Ordem de Serviço
                  </p>
                  <p className="text-xl font-black" style={{ color: form.corPrimaria }}>
                    #128
                  </p>
                </div>
                <p className="text-[10px] text-zinc-400">{rodapeDoDocumento(previa)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Sistema
            </p>
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <div className="flex">
                <div className="w-20 shrink-0 space-y-1 bg-menu p-2">
                  <div className="rounded bg-brand-700 px-2 py-1 text-[10px] font-medium text-brand-fg">
                    Menu
                  </div>
                  <div className="px-2 py-1 text-[10px] text-menu-texto">Clientes</div>
                  <div className="px-2 py-1 text-[10px] text-menu-texto">OS</div>
                </div>
                <div className="flex-1 space-y-2 bg-gray-100 p-3">
                  <div className="rounded bg-brand-600 px-2 py-1.5 text-center text-[10px] font-medium text-brand-fg">
                    Nova OS
                  </div>
                  <div className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-[10px] text-brand-600">
                    Link de exemplo
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              As cores já estão aplicadas na tela. Sair sem salvar desfaz.
            </p>
          </div>
        </aside>
      </div>

      {/* Barra de ação — fixa no celular, no fluxo em telas grandes */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        {salvo && <span className="text-sm text-green-600">Configurações salvas</span>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

/** Campo de cor: amostra clicável, hex digitável e atalhos prontos. */
function SeletorDeCor({
  titulo,
  ajuda,
  valor,
  padrao,
  sugestoes,
  onChange,
}: {
  titulo: string;
  ajuda: string;
  valor: string;
  padrao: string;
  sugestoes: readonly { nome: string; cor: string }[];
  onChange: (cor: string) => void;
}) {
  // O campo de texto guarda o que está sendo digitado; só cor válida vira tema.
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <label className="text-sm font-medium text-zinc-700">{titulo}</label>
        <span className="text-xs text-zinc-500">{ajuda}</span>
        {valor.toLowerCase() !== padrao && (
          <button
            type="button"
            onClick={() => onChange(padrao)}
            className="ml-auto text-xs text-zinc-400 underline hover:text-zinc-600"
          >
            Restaurar padrão
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          aria-label={titulo}
          className="h-10 w-14 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
        />
        <input
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (corValida(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setTexto(valor)}
          spellCheck={false}
          className={cn(inputCls, "w-28 font-mono uppercase")}
        />
        <div className="flex flex-wrap gap-1.5">
          {sugestoes.map((s) => (
            <button
              key={s.cor}
              type="button"
              title={s.nome}
              aria-label={s.nome}
              onClick={() => onChange(s.cor)}
              style={{ backgroundColor: s.cor }}
              className={cn(
                "h-7 w-7 rounded-full border transition-transform hover:scale-110",
                valor.toLowerCase() === s.cor ? "border-zinc-900 ring-2 ring-zinc-300" : "border-zinc-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
