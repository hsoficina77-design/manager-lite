"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { labelStatus, corStatus, ORIGENS, anoVeiculo } from "@/lib/constants";
import CopiarVeiculo from "@/components/CopiarVeiculo";
import VeiculoCampos, { VEICULO_FORM_VAZIO, veiculoFormDe, type VeiculoForm } from "@/components/VeiculoCampos";
import { useEhDono } from "@/components/UsuarioProvider";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Esqueleto, FaixaMetricas, Metrica, Vazio } from "@/components/ui/Dados";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Fechar, Mais, Voltar } from "@/components/ui/Icones";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type Veiculo = {
  id: string; marca: string; modelo: string; ano: number | null; placa: string | null;
  cor: string | null; km: number | null; motorizacao: string | null; valvulas: string | null;
  anoFabricacao: number | null; anoModelo: number | null; combustivel: string | null;
  combustivelEmUso: string | null;
};
type OS = {
  id: string; numero: number; status: string; descricao: string; total: number;
  pago: boolean; abertura: string;
  veiculo: { marca: string; modelo: string; placa: string | null };
};
type ClienteStats = {
  totalOS: number; osAbertas: number; totalFaturado: number; totalMO: number;
  totalPecas: number; totalRecebido: number; totalPendente: number;
  lucroTotal?: number; // ausente para o operador (ver src/lib/permissoes.ts)
  ticketMedio: number; npsMedio: number | null; primeiraOS: string | null; ultimaOS: string | null;
};
type Cliente = {
  id: string; nome: string; telefone: string | null; cpfCnpj: string | null;
  email: string | null; obs: string | null; apelido: string | null; origem: string | null;
  profissao: string | null; telefones: string[]; cep: string | null; endereco: string | null;
  cidade: string | null; estado: string | null; createdAt: string;
  veiculos: Veiculo[]; ordens: OS[]; stats: ClienteStats;
};

function tempoDesde(dateStr: string): string {
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (dias < 30) return `${dias} dia${dias !== 1 ? "s" : ""}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `${meses} ${meses !== 1 ? "meses" : "mês"}`;
  const anos = Math.floor(meses / 12);
  const restoMeses = meses % 12;
  return `${anos} ano${anos !== 1 ? "s" : ""}${restoMeses > 0 ? ` e ${restoMeses} ${restoMeses !== 1 ? "meses" : "mês"}` : ""}`;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] || "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const inputCls = "w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ehDono = useEhDono();
  const confirmar = useConfirmar();
  const avisar = useAvisar();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nome: "", telefone: "", cpfCnpj: "", email: "", obs: "",
    apelido: "", profissao: "", origem: "",
    cep: "", endereco: "", cidade: "", estado: "",
  });
  const [telefones, setTelefones] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Um formulário só para cadastrar e editar: `veiculoEditando` guarda o id
  // quando é edição (null = veículo novo).
  const [showVeiculoForm, setShowVeiculoForm] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState<string | null>(null);
  const [veiculoForm, setVeiculoForm] = useState<VeiculoForm>(VEICULO_FORM_VAZIO);
  const [veiculoErro, setVeiculoErro] = useState("");
  const [savingVeiculo, setSavingVeiculo] = useState(false);
  const veiculoFormRef = useRef<HTMLFormElement>(null);

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const load = () =>
    fetch(`/api/clientes/${id}`)
      .then((r) => r.json())
      .then((data: Cliente) => {
        setCliente(data);
        setForm({
          nome: data.nome || "", telefone: data.telefone || "",
          cpfCnpj: data.cpfCnpj || "", email: data.email || "", obs: data.obs || "",
          apelido: data.apelido || "", profissao: data.profissao || "",
          origem: data.origem || "", cep: data.cep || "", endereco: data.endereco || "",
          cidade: data.cidade || "", estado: data.estado || "",
        });
        setTelefones(data.telefones || []);
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  async function handleCepBlur() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          endereco: data.logradouro || f.endereco,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }));
      }
    } catch {}
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, telefones: telefones.filter(Boolean) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro"); return; }
      setEditing(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteCliente() {
    if (!cliente) return;
    const ok = await confirmar({
      titulo: `Excluir ${cliente.nome}?`,
      texto:
        cliente.stats.totalOS > 0
          ? `Este cliente tem ${cliente.stats.totalOS} OS no histórico. Enquanto houver OS ligada a ele, a exclusão é recusada.`
          : "O cadastro e os veículos vinculados saem do sistema. Não há como desfazer.",
      acao: "Excluir cliente",
      perigo: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      avisar(d.error || "Não foi possível excluir o cliente.", "erro");
      return;
    }
    router.push("/clientes");
  }

  function abrirNovoVeiculo() {
    setVeiculoEditando(null);
    setVeiculoForm(VEICULO_FORM_VAZIO);
    setVeiculoErro("");
    setShowVeiculoForm(true);
  }

  function abrirEdicaoVeiculo(v: Veiculo) {
    setVeiculoEditando(v.id);
    setVeiculoForm(veiculoFormDe(v));
    setVeiculoErro("");
    setShowVeiculoForm(true);
    // No celular a lista é longa: leva o formulário para a tela em vez de
    // deixar o usuário procurar onde o carro abriu para edição.
    requestAnimationFrame(() =>
      veiculoFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  }

  function fecharVeiculoForm() {
    setShowVeiculoForm(false);
    setVeiculoEditando(null);
    setVeiculoErro("");
  }

  async function saveVeiculo(e: React.FormEvent) {
    e.preventDefault();
    setVeiculoErro("");
    setSavingVeiculo(true);
    try {
      const res = await fetch(
        veiculoEditando ? `/api/veiculos/${veiculoEditando}` : "/api/veiculos",
        {
          method: veiculoEditando ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...veiculoForm, clienteId: id }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setVeiculoErro(data.error || "Erro ao salvar veículo"); return; }
      fecharVeiculoForm();
      load();
    } finally {
      setSavingVeiculo(false);
    }
  }

  async function deleteVeiculo(v: Veiculo) {
    const ok = await confirmar({
      titulo: "Excluir este veículo?",
      texto: `${v.marca} ${v.modelo}${v.placa ? ` · ${v.placa}` : ""} sai do cadastro do cliente. OS já abertas para ele continuam existindo.`,
      acao: "Excluir veículo",
      perigo: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/veiculos/${v.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      avisar(d.error || "Não foi possível excluir o veículo.", "erro");
      return;
    }
    avisar("Veículo excluído.");
    load();
  }


  if (loading)
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        <Esqueleto className="h-24 w-full" />
        <Esqueleto className="h-32 w-full" />
        <Esqueleto className="h-48 w-full" />
      </div>
    );
  if (!cliente) return <div className="p-6 text-tinta-3 text-sm">Cliente não encontrado.</div>;

  const stats = cliente.stats;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/clientes"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tinta-3 hover:text-tinta-2"
        >
          <Voltar tamanho={16} /> Clientes
        </Link>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-linha bg-superficie p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-brand-fg">
              {iniciais(cliente.nome)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-tinta truncate">{cliente.nome}</h1>
                {cliente.apelido && (
                  <span className="rounded-full bg-superficie-3 px-2.5 py-0.5 text-sm text-tinta-3">{cliente.apelido}</span>
                )}
              </div>
              <p className="text-sm text-tinta-3 mt-0.5">
                Cliente há {tempoDesde(cliente.createdAt)}
                {stats.ultimaOS && ` · última visita em ${formatDate(stats.ultimaOS)}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(!editing)} className="rounded-lg border border-linha-forte bg-superficie px-3 py-1.5 text-sm font-medium text-tinta-2 hover:bg-superficie-2">
              {editing ? "Cancelar" : "Editar"}
            </button>
            <button onClick={deleteCliente} className="rounded-lg border border-perigo-linha bg-superficie px-3 py-1.5 text-sm font-medium text-perigo hover:bg-perigo-fraco">
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Scorecard: quão bom é este cliente */}
      <div>
        <h2 className="font-semibold text-tinta mb-3">Histórico com o cliente</h2>
        {stats.totalOS === 0 ? (
          <div className="rounded-xl border border-linha bg-superficie py-8 text-center text-sm text-tinta-3">
            Ainda sem ordens de serviço registradas.
          </div>
        ) : (
          <>
            <FaixaMetricas colunas={4}>
              <Metrica rotulo="Total faturado" valor={formatCurrency(stats.totalFaturado)} />
              {ehDono && (
                <Metrica
                  rotulo="Lucro bruto"
                  valor={formatCurrency(stats.lucroTotal ?? 0)}
                  tom={(stats.lucroTotal ?? 0) >= 0 ? "ok" : "perigo"}
                />
              )}
              <Metrica rotulo="Ticket médio" valor={formatCurrency(stats.ticketMedio)} />
              <Metrica
                rotulo="Ordens de serviço"
                valor={String(stats.totalOS)}
                sub={stats.osAbertas > 0 ? `${stats.osAbertas} em aberto` : "nenhuma em aberto"}
              />
              <Metrica rotulo="Mão de obra" valor={formatCurrency(stats.totalMO)} />
              <Metrica rotulo="Peças" valor={formatCurrency(stats.totalPecas)} />
              <Metrica
                rotulo="Recebido"
                valor={formatCurrency(stats.totalRecebido)}
                tom={stats.totalRecebido > 0 ? "ok" : "neutro"}
              />
              <Metrica
                rotulo="Pendente"
                valor={formatCurrency(stats.totalPendente)}
                tom={stats.totalPendente > 0 ? "perigo" : "neutro"}
              />
            </FaixaMetricas>
            {stats.npsMedio != null && (
              <p className="text-xs text-tinta-3 mt-3">
                NPS médio das ordens avaliadas: <span className="font-medium text-tinta-2">{stats.npsMedio.toFixed(1)}</span>
              </p>
            )}
          </>
        )}
      </div>

      {/* Info / Edit */}
      <div className="bg-superficie rounded-xl border border-linha p-5">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-4">
            <h3 className="font-medium text-tinta">Dados pessoais</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Nome */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-tinta-3 mb-1">Nome *</label>
                <input value={form.nome} onChange={(e) => setField("nome", e.target.value)} required className={inputCls} />
              </div>
              {/* 2. Telefone */}
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">Telefone</label>
                <input type="tel" value={form.telefone} onChange={(e) => setField("telefone", e.target.value)} placeholder="(00) 00000-0000" className={inputCls} />
              </div>
              {/* 3. Profissão */}
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">Profissão</label>
                <input value={form.profissao} onChange={(e) => setField("profissao", e.target.value)} className={inputCls} />
              </div>
              {/* 4. Origem */}
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">Origem</label>
                <select value={form.origem} onChange={(e) => setField("origem", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {ORIGENS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {/* Apelido */}
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">Apelido</label>
                <input value={form.apelido} onChange={(e) => setField("apelido", e.target.value)} className={inputCls} />
              </div>
              {/* CPF / CNPJ */}
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">CPF / CNPJ</label>
                <input value={form.cpfCnpj} onChange={(e) => setField("cpfCnpj", e.target.value)} className={inputCls} />
              </div>
              {/* E-mail */}
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="space-y-2">
              {telefones.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input type="tel" value={t} onChange={(e) => setTelefones(telefones.map((x, j) => j === i ? e.target.value : x))} placeholder={`Telefone extra ${i + 1}`} className={inputCls} />
                  <button
                    type="button"
                    onClick={() => setTelefones(telefones.filter((_, j) => j !== i))}
                    aria-label={`Remover telefone extra ${i + 1}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-perigo hover:bg-perigo-fraco"
                  >
                    <Fechar tamanho={16} />
                  </button>
                </div>
              ))}
              {telefones.length < 3 && (
                <button type="button" onClick={() => setTelefones([...telefones, ""])} className="text-sm text-brand-600 hover:underline">+ Adicionar telefone</button>
              )}
            </div>

            {/* 5. Observação */}
            <div>
              <label className="block text-xs font-medium text-tinta-3 mb-1">Observação</label>
              <textarea value={form.obs} onChange={(e) => setField("obs", e.target.value)} rows={2} className="w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>

            <h3 className="font-medium text-tinta pt-2">Endereço</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">CEP</label>
                <input value={form.cep} onChange={(e) => setField("cep", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" maxLength={9} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-tinta-3 mb-1">Endereço</label>
                <input value={form.endereco} onChange={(e) => setField("endereco", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">Cidade</label>
                <input value={form.cidade} onChange={(e) => setField("cidade", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-tinta-3 mb-1">Estado</label>
                <select value={form.estado} onChange={(e) => setField("estado", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-perigo">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-linha-forte px-4 py-2 text-sm font-medium text-tinta-2 hover:bg-superficie-2">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoRow label="Telefone" value={cliente.telefone} />
            {cliente.telefones?.length > 0 && (
              <div className="col-span-2">
                <dt className="text-xs text-tinta-3">Telefones extras</dt>
                <dd className="text-tinta">{cliente.telefones.join(" · ")}</dd>
              </div>
            )}
            <InfoRow label="CPF / CNPJ" value={cliente.cpfCnpj} />
            <InfoRow label="E-mail" value={cliente.email} />
            <InfoRow label="Profissão" value={cliente.profissao} />
            <InfoRow label="Origem" value={ORIGENS.find((o) => o.value === cliente.origem)?.label || cliente.origem} />
            {(cliente.endereco || cliente.cidade) && (
              <div className="col-span-2">
                <dt className="text-xs text-tinta-3">Endereço</dt>
                <dd className="text-tinta">
                  {[cliente.endereco, cliente.cidade, cliente.estado].filter(Boolean).join(", ")}
                  {cliente.cep ? ` (${cliente.cep})` : ""}
                </dd>
              </div>
            )}
            {cliente.obs && (
              <div className="col-span-2">
                <dt className="text-xs text-tinta-3">Obs</dt>
                <dd className="text-tinta">{cliente.obs}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Veículos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-tinta">Veículos</h2>
          <button onClick={abrirNovoVeiculo} className="text-sm text-brand-600 hover:underline">
            + Adicionar
          </button>
        </div>

        {showVeiculoForm && (
          <form ref={veiculoFormRef} onSubmit={saveVeiculo} className="mb-4 rounded-xl border border-linha bg-superficie-2 p-4 space-y-3">
            <h3 className="font-medium text-tinta">
              {veiculoEditando ? "Editar veículo" : "Novo veículo"}
            </h3>
            <VeiculoCampos value={veiculoForm} onChange={setVeiculoForm} obrigatorio />
            {veiculoErro && <p className="text-sm text-perigo bg-perigo-fraco rounded-lg px-3 py-2">{veiculoErro}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={savingVeiculo} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50">
                {savingVeiculo ? "Salvando..." : veiculoEditando ? "Salvar alterações" : "Salvar Veículo"}
              </button>
              <button type="button" onClick={fecharVeiculoForm} className="rounded-lg border border-linha-forte px-4 py-2 text-sm text-tinta-2 hover:bg-superficie">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cliente.veiculos.length === 0 ? (
          <Vazio
            titulo="Nenhum veículo cadastrado"
            texto="Sem veículo não dá para abrir OS para este cliente."
            acao={
              <Botao variante="secundario" onClick={abrirNovoVeiculo}>
                <Mais tamanho={16} /> Adicionar veículo
              </Botao>
            }
            compacto
          />
        ) : (
          <div className="space-y-2">
            {cliente.veiculos.map((v) => (
              <div key={v.id} className="flex flex-col gap-2 rounded-xl border border-linha bg-superficie px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-tinta">
                    {v.marca} {v.modelo}
                    {v.motorizacao ? ` ${v.motorizacao}` : ""}
                    {v.valvulas ? ` ${v.valvulas}` : ""}
                    {v.cor ? ` · ${v.cor}` : ""}
                  </p>
                  <p className="text-sm text-tinta-3">
                    {v.placa ? `Placa: ${v.placa}` : "Sem placa"}
                    {anoVeiculo(v) ? ` · ${anoVeiculo(v)}` : ""}
                    {v.km ? ` · ${v.km.toLocaleString("pt-BR")} km` : ""}
                    {v.combustivel ? ` · ${v.combustivel}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <CopiarVeiculo veiculo={v} label="Copiar" />
                  <button onClick={() => abrirEdicaoVeiculo(v)} className="text-sm text-brand-600 hover:underline">Editar</button>
                  <Link href={`/os/nova?clienteId=${cliente.id}&veiculoId=${v.id}`} className="text-sm text-brand-600 hover:underline">Nova OS</Link>
                  <button onClick={() => deleteVeiculo(v)} className="text-sm text-perigo hover:underline">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ordens de serviço */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-tinta">Ordens de serviço</h2>
          <Link href={`/os/nova?clienteId=${cliente.id}`} className="text-sm text-brand-600 hover:underline">+ Nova OS</Link>
        </div>

        {cliente.ordens.length === 0 ? (
          <Vazio
            titulo="Nenhuma OS registrada"
            texto="Quando o carro deste cliente entrar, a OS aparece aqui."
            acao={
              cliente.veiculos.length > 0 ? (
                <BotaoLink href={`/os/nova?clienteId=${cliente.id}`}>
                  <Mais tamanho={16} /> Abrir OS
                </BotaoLink>
              ) : undefined
            }
            compacto
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-linha bg-superficie divide-y divide-linha">
            {cliente.ordens.map((os) => (
              <Link key={os.id} href={`/os/${os.id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-superficie-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-tinta truncate">
                    OS #{os.numero} · {os.veiculo.marca} {os.veiculo.modelo}
                    {os.veiculo.placa ? ` (${os.veiculo.placa})` : ""}
                  </p>
                  <p className="text-sm text-tinta-3 truncate">{os.descricao}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 sm:ml-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${corStatus(os.status)}`}>
                    {labelStatus(os.status)}
                  </span>
                  <div className="text-right text-xs">
                    <p className="font-medium text-tinta">{formatCurrency(os.total)}</p>
                    <p className={os.pago ? "text-ok" : "text-perigo"}>{os.pago ? "Pago" : "Pendente"}</p>
                  </div>
                  <p className="text-xs text-tinta-3 hidden sm:block">{formatDate(os.abertura)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-tinta-3">{label}</dt>
      <dd className="text-tinta">{value}</dd>
    </div>
  );
}
