"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
const ORIGENS = [
  { value: "INDICACAO", label: "Indicação" },
  { value: "GOOGLE", label: "Google" },
  { value: "CHATGPT", label: "ChatGPT" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "FAIXADA", label: "Faixada" },
  { value: "OUTRO", label: "Outro" },
];
const COMBUSTIVEIS = [
  { value: "GASOLINA", label: "Gasolina" },
  { value: "ETANOL", label: "Etanol" },
  { value: "FLEX", label: "Flex" },
  { value: "DIESEL", label: "Diesel" },
  { value: "ELETRICO", label: "Elétrico" },
  { value: "HIBRIDO", label: "Híbrido" },
  { value: "GNV", label: "GNV" },
];
const VALVULAS = ["8V","12V","16V","20V","24V"];

const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta", EM_ANDAMENTO: "Em Andamento", AGUARDANDO_PECA: "Ag. Peça",
  PRONTA: "Pronta", FECHADA: "Fechada", ENTREGUE: "Entregue", CANCELADA: "Cancelada",
};
const STATUS_COLOR: Record<string, string> = {
  ABERTA: "bg-zinc-200 text-zinc-700",
  EM_ANDAMENTO: "bg-zinc-800 text-zinc-100",
  AGUARDANDO_PECA: "bg-zinc-300 text-zinc-800",
  PRONTA: "bg-zinc-900 text-white",
  FECHADA: "bg-zinc-600 text-white",
  ENTREGUE: "bg-zinc-100 text-zinc-500",
  CANCELADA: "bg-red-100 text-red-700",
};

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
  totalPecas: number; lucroTotal: number; totalRecebido: number; totalPendente: number;
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

const inputCls = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500";

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
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
  const [showVeiculoForm, setShowVeiculoForm] = useState(false);
  const [veiculoForm, setVeiculoForm] = useState({
    marca: "", modelo: "", ano: "", placa: "", cor: "", km: "",
    motorizacao: "", valvulas: "", anoFabricacao: "", anoModelo: "",
    combustivel: "", combustivelEmUso: "",
  });
  const [savingVeiculo, setSavingVeiculo] = useState(false);

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
    if (!confirm("Excluir este cliente?")) return;
    const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Não foi possível excluir."); return; }
    router.push("/clientes");
  }

  async function saveVeiculo(e: React.FormEvent) {
    e.preventDefault();
    setSavingVeiculo(true);
    try {
      const res = await fetch("/api/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...veiculoForm, clienteId: id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Erro ao salvar veículo"); return; }
      setShowVeiculoForm(false);
      setVeiculoForm({ marca: "", modelo: "", ano: "", placa: "", cor: "", km: "", motorizacao: "", valvulas: "", anoFabricacao: "", anoModelo: "", combustivel: "", combustivelEmUso: "" });
      load();
    } finally {
      setSavingVeiculo(false);
    }
  }

  async function deleteVeiculo(veiculoId: string) {
    if (!confirm("Excluir este veículo?")) return;
    const res = await fetch(`/api/veiculos/${veiculoId}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Não foi possível excluir."); return; }
    load();
  }

  if (loading) return <div className="p-6 text-zinc-400 text-sm">Carregando...</div>;
  if (!cliente) return <div className="p-6 text-zinc-400 text-sm">Cliente não encontrado.</div>;

  const showCombUso = ["FLEX","HIBRIDO"].includes(veiculoForm.combustivel);

  const stats = cliente.stats;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/clientes" className="text-sm text-zinc-500 hover:text-zinc-700">← Clientes</Link>
      </div>

      {/* Hero */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white">
              {iniciais(cliente.nome)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900 truncate">{cliente.nome}</h1>
                {cliente.apelido && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm text-zinc-500">{cliente.apelido}</span>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-0.5">
                Cliente há {tempoDesde(cliente.createdAt)}
                {stats.ultimaOS && ` · última visita em ${formatDate(stats.ultimaOS)}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(!editing)} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              {editing ? "Cancelar" : "Editar"}
            </button>
            <button onClick={deleteCliente} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Scorecard: quão bom é este cliente */}
      <div>
        <h2 className="font-semibold text-zinc-800 mb-3">Histórico com o cliente</h2>
        {stats.totalOS === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-sm text-zinc-400">
            Ainda sem ordens de serviço registradas.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Total faturado" value={formatCurrency(stats.totalFaturado)} />
              <MetricCard
                label="Lucro bruto"
                value={formatCurrency(stats.lucroTotal)}
                highlight={stats.lucroTotal > 0 ? "green" : stats.lucroTotal < 0 ? "red" : undefined}
              />
              <MetricCard label="Ticket médio" value={formatCurrency(stats.ticketMedio)} />
              <MetricCard label="Ordens de serviço" value={String(stats.totalOS)} sub={stats.osAbertas > 0 ? `${stats.osAbertas} em aberto` : "nenhuma em aberto"} />
              <MetricCard label="Mão de obra" value={formatCurrency(stats.totalMO)} />
              <MetricCard label="Peças" value={formatCurrency(stats.totalPecas)} />
              <MetricCard
                label="Recebido"
                value={formatCurrency(stats.totalRecebido)}
                highlight={stats.totalRecebido > 0 ? "green" : undefined}
              />
              <MetricCard
                label="Pendente"
                value={formatCurrency(stats.totalPendente)}
                highlight={stats.totalPendente > 0 ? "red" : undefined}
              />
            </div>
            {stats.npsMedio != null && (
              <p className="text-xs text-zinc-400 mt-3">
                NPS médio das ordens avaliadas: <span className="font-medium text-zinc-600">{stats.npsMedio.toFixed(1)}</span>
              </p>
            )}
          </>
        )}
      </div>

      {/* Info / Edit */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        {editing ? (
          <form onSubmit={saveEdit} className="space-y-4">
            <h3 className="font-medium text-zinc-800">Dados pessoais</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Nome */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Nome *</label>
                <input value={form.nome} onChange={(e) => setField("nome", e.target.value)} required className={inputCls} />
              </div>
              {/* 2. Telefone */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Telefone</label>
                <input type="tel" value={form.telefone} onChange={(e) => setField("telefone", e.target.value)} placeholder="(00) 00000-0000" className={inputCls} />
              </div>
              {/* 3. Profissão */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Profissão</label>
                <input value={form.profissao} onChange={(e) => setField("profissao", e.target.value)} className={inputCls} />
              </div>
              {/* 4. Origem */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Origem</label>
                <select value={form.origem} onChange={(e) => setField("origem", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {ORIGENS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {/* Apelido */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Apelido</label>
                <input value={form.apelido} onChange={(e) => setField("apelido", e.target.value)} className={inputCls} />
              </div>
              {/* CPF / CNPJ */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">CPF / CNPJ</label>
                <input value={form.cpfCnpj} onChange={(e) => setField("cpfCnpj", e.target.value)} className={inputCls} />
              </div>
              {/* E-mail */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="space-y-2">
              {telefones.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <input type="tel" value={t} onChange={(e) => setTelefones(telefones.map((x, j) => j === i ? e.target.value : x))} placeholder={`Telefone extra ${i + 1}`} className={inputCls} />
                  <button type="button" onClick={() => setTelefones(telefones.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
                </div>
              ))}
              {telefones.length < 3 && (
                <button type="button" onClick={() => setTelefones([...telefones, ""])} className="text-sm text-red-600 hover:underline">+ Adicionar telefone</button>
              )}
            </div>

            {/* 5. Observação */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Observação</label>
              <textarea value={form.obs} onChange={(e) => setField("obs", e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>

            <h3 className="font-medium text-zinc-800 pt-2">Endereço</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">CEP</label>
                <input value={form.cep} onChange={(e) => setField("cep", e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" maxLength={9} className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Endereço</label>
                <input value={form.endereco} onChange={(e) => setField("endereco", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Cidade</label>
                <input value={form.cidade} onChange={(e) => setField("cidade", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Estado</label>
                <select value={form.estado} onChange={(e) => setField("estado", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoRow label="Telefone" value={cliente.telefone} />
            {cliente.telefones?.length > 0 && (
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">Telefones extras</dt>
                <dd className="text-zinc-900">{cliente.telefones.join(" · ")}</dd>
              </div>
            )}
            <InfoRow label="CPF / CNPJ" value={cliente.cpfCnpj} />
            <InfoRow label="E-mail" value={cliente.email} />
            <InfoRow label="Profissão" value={cliente.profissao} />
            <InfoRow label="Origem" value={ORIGENS.find((o) => o.value === cliente.origem)?.label || cliente.origem} />
            {(cliente.endereco || cliente.cidade) && (
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">Endereço</dt>
                <dd className="text-zinc-900">
                  {[cliente.endereco, cliente.cidade, cliente.estado].filter(Boolean).join(", ")}
                  {cliente.cep ? ` (${cliente.cep})` : ""}
                </dd>
              </div>
            )}
            {cliente.obs && (
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500">Obs</dt>
                <dd className="text-zinc-900">{cliente.obs}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Veículos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-800">Veículos</h2>
          <button onClick={() => setShowVeiculoForm(!showVeiculoForm)} className="text-sm text-red-600 hover:underline">
            + Adicionar
          </button>
        </div>

        {showVeiculoForm && (
          <form onSubmit={saveVeiculo} className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Marca */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Marca *</label>
                <input value={veiculoForm.marca} onChange={(e) => setVeiculoForm({ ...veiculoForm, marca: e.target.value })} required placeholder="Ex: Chevrolet" className={inputCls} />
              </div>
              {/* 2. Modelo */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Modelo *</label>
                <input value={veiculoForm.modelo} onChange={(e) => setVeiculoForm({ ...veiculoForm, modelo: e.target.value })} required placeholder="Ex: Onix" className={inputCls} />
              </div>
              {/* 3. Placa */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Placa</label>
                <input value={veiculoForm.placa} onChange={(e) => setVeiculoForm({ ...veiculoForm, placa: e.target.value.toUpperCase() })} placeholder="ABC1D23" maxLength={8} className={inputCls} />
              </div>
              {/* 4. Cor */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Cor</label>
                <input value={veiculoForm.cor} onChange={(e) => setVeiculoForm({ ...veiculoForm, cor: e.target.value })} placeholder="Ex: Prata" className={inputCls} />
              </div>
              {/* 5. Ano Fabricação */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Ano Fabricação</label>
                <input type="number" value={veiculoForm.anoFabricacao} onChange={(e) => setVeiculoForm({ ...veiculoForm, anoFabricacao: e.target.value })} placeholder="2019" className={inputCls} />
              </div>
              {/* 6. Ano Modelo */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Ano Modelo</label>
                <input type="number" value={veiculoForm.anoModelo} onChange={(e) => setVeiculoForm({ ...veiculoForm, anoModelo: e.target.value })} placeholder="2020" className={inputCls} />
              </div>
              {/* 7. Cilindrada */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Cilindrada</label>
                <input value={veiculoForm.motorizacao} onChange={(e) => setVeiculoForm({ ...veiculoForm, motorizacao: e.target.value })} placeholder="Ex: 1.0" className={inputCls} />
              </div>
              {/* 8. Válvulas */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Válvulas</label>
                <select value={veiculoForm.valvulas} onChange={(e) => setVeiculoForm({ ...veiculoForm, valvulas: e.target.value })} className={inputCls}>
                  <option value="">Selecione...</option>
                  {VALVULAS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              {/* 9. Combustível */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Combustível</label>
                <select value={veiculoForm.combustivel} onChange={(e) => setVeiculoForm({ ...veiculoForm, combustivel: e.target.value, combustivelEmUso: "" })} className={inputCls}>
                  <option value="">Selecione...</option>
                  {COMBUSTIVEIS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {/* 10. Combustível em uso (Flex/Híbrido) */}
              {showCombUso && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1">Combustível em uso</label>
                  <select value={veiculoForm.combustivelEmUso} onChange={(e) => setVeiculoForm({ ...veiculoForm, combustivelEmUso: e.target.value })} className={inputCls}>
                    <option value="">Selecione...</option>
                    <option value="GASOLINA">Gasolina</option>
                    <option value="ETANOL">Álcool</option>
                    <option value="GNV">GNV</option>
                  </select>
                </div>
              )}
              {/* KM */}
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">KM</label>
                <input type="number" value={veiculoForm.km} onChange={(e) => setVeiculoForm({ ...veiculoForm, km: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingVeiculo} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {savingVeiculo ? "Salvando..." : "Salvar Veículo"}
              </button>
              <button type="button" onClick={() => setShowVeiculoForm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-white">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {cliente.veiculos.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhum veículo cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {cliente.veiculos.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-zinc-900">
                    {v.marca} {v.modelo}
                    {v.motorizacao ? ` ${v.motorizacao}` : ""}
                    {v.valvulas ? ` ${v.valvulas}` : ""}
                    {v.cor ? ` · ${v.cor}` : ""}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {v.placa ? `Placa: ${v.placa}` : "Sem placa"}
                    {v.anoFabricacao ? ` · ${v.anoFabricacao}/${v.anoModelo || ""}` : v.ano ? ` · ${v.ano}` : ""}
                    {v.km ? ` · ${v.km.toLocaleString("pt-BR")} km` : ""}
                    {v.combustivel ? ` · ${v.combustivel}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/os/nova?clienteId=${cliente.id}&veiculoId=${v.id}`} className="text-xs text-red-600 hover:underline">Nova OS</Link>
                  <button onClick={() => deleteVeiculo(v.id)} className="text-xs text-red-500 hover:underline">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ordens de Serviço */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-zinc-800">Ordens de Serviço</h2>
          <Link href={`/os/nova?clienteId=${cliente.id}`} className="text-sm text-red-600 hover:underline">+ Nova OS</Link>
        </div>

        {cliente.ordens.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma OS registrada.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {cliente.ordens.map((os) => (
              <Link key={os.id} href={`/os/${os.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50">
                <div>
                  <p className="font-medium text-zinc-900">
                    OS #{os.numero} · {os.veiculo.marca} {os.veiculo.modelo}
                    {os.veiculo.placa ? ` (${os.veiculo.placa})` : ""}
                  </p>
                  <p className="text-sm text-zinc-500 truncate max-w-xs">{os.descricao}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[os.status] || "bg-zinc-100 text-zinc-600"}`}>
                    {STATUS_LABEL[os.status] || os.status}
                  </span>
                  <div className="text-right text-xs">
                    <p className="font-medium text-zinc-900">{formatCurrency(os.total)}</p>
                    <p className={os.pago ? "text-green-600" : "text-red-500"}>{os.pago ? "Pago" : "Pendente"}</p>
                  </div>
                  <p className="text-xs text-zinc-400 hidden sm:block">{formatDate(os.abertura)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "green" | "red";
}) {
  const valueColor =
    highlight === "green" ? "text-green-600" : highlight === "red" ? "text-red-600" : "text-zinc-900";
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-lg font-bold mt-1 ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="text-zinc-900">{value}</dd>
    </div>
  );
}
