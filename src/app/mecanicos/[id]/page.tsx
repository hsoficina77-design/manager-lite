"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { labelStatus } from "@/lib/constants";

type Meta = { id: string; ano: number; mes: number; valorAlvo: number };
type Mecanico = {
  id: string; nome: string; telefone: string | null; especialidade: string | null;
  ativo: boolean; metas: Meta[]; _count: { ordens: number };
};
type OS = {
  id: string; numero: number; status: string; descricao: string; total: number;
  totalMO: number; pago: boolean; abertura: string; lucroReal: number; nps: number | null;
  cliente: { nome: string }; veiculo: { marca: string; modelo: string; placa: string | null };
};

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(0)}%`;
}
function fmtNps(v: number | null): string {
  return v === null ? "—" : v.toFixed(1);
}


const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function MecanicoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const now = new Date();

  const [mecanico, setMecanico] = useState<Mecanico | null>(null);
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [metaInput, setMetaInput] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  // Edição do cadastro
  const [editing, setEditing] = useState(false);
  const [fNome, setFNome] = useState("");
  const [fTelefone, setFTelefone] = useState("");
  const [fEspecialidade, setFEspecialidade] = useState("");

  const loadMecanico = useCallback(() => {
    return fetch(`/api/mecanicos/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((m: Mecanico) => {
        setMecanico(m);
        setFNome(m.nome);
        setFTelefone(m.telefone ?? "");
        setFEspecialidade(m.especialidade ?? "");
      });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadMecanico(),
      fetch(`/api/os?mecanicoId=${id}`).then((r) => r.json()).then(setOrdens),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [id, loadMecanico]);

  // OS do mês/ano selecionados (exclui canceladas dos números)
  const ordensDoMes = useMemo(
    () => ordens.filter((o) => {
      const d = new Date(o.abertura);
      return d.getFullYear() === ano && d.getMonth() + 1 === mes && o.status !== "CANCELADA";
    }),
    [ordens, ano, mes]
  );

  const nOS = ordensDoMes.length;
  const faturamento = ordensDoMes.reduce((s, o) => s + o.total, 0);
  const maoDeObra = ordensDoMes.reduce((s, o) => s + o.totalMO, 0);
  const lucroReal = ordensDoMes.reduce((s, o) => s + o.lucroReal, 0);
  const margem = faturamento > 0 ? (lucroReal / faturamento) * 100 : null;
  const npsValores = ordensDoMes.map((o) => o.nps).filter((n): n is number => n != null);
  const npsMedio = npsValores.length > 0 ? npsValores.reduce((s, n) => s + n, 0) / npsValores.length : null;
  const ticketMedio = nOS > 0 ? faturamento / nOS : 0;

  const metaAtual = mecanico?.metas.find((m) => m.ano === ano && m.mes === mes);
  const progresso = metaAtual && metaAtual.valorAlvo > 0 ? (faturamento / metaAtual.valorAlvo) * 100 : null;

  useEffect(() => {
    setMetaInput(metaAtual ? String(metaAtual.valorAlvo) : "");
  }, [metaAtual]);

  async function salvarMeta() {
    setSavingMeta(true);
    try {
      await fetch("/api/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mecanicoId: id, ano, mes, valorAlvo: Number(metaInput) }),
      });
      await loadMecanico();
    } finally {
      setSavingMeta(false);
    }
  }

  async function salvarCadastro(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/mecanicos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: fNome, telefone: fTelefone, especialidade: fEspecialidade }),
    });
    setEditing(false);
    await loadMecanico();
  }

  async function toggleAtivo() {
    if (!mecanico) return;
    await fetch(`/api/mecanicos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !mecanico.ativo }),
    });
    await loadMecanico();
  }

  async function excluir() {
    if (!confirm("Excluir este mecânico?")) return;
    const res = await fetch(`/api/mecanicos/${id}`, { method: "DELETE" });
    if (res.ok) { router.push("/mecanicos"); return; }
    const data = await res.json();
    alert(data.error || "Não foi possível excluir.");
  }

  const inputCls = "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  if (loading) return <div className="p-6 text-sm text-zinc-400">Carregando...</div>;
  if (!mecanico) return <div className="p-6 text-sm text-zinc-400">Mecânico não encontrado.</div>;

  // Opções de ano: atual e dois anteriores
  const anos = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <Link href="/mecanicos" className="text-sm text-zinc-500 hover:text-zinc-700">← Mecânicos</Link>

      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        {editing ? (
          <form onSubmit={salvarCadastro} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={fNome} onChange={(e) => setFNome(e.target.value)} placeholder="Nome" className={inputCls} />
              <input value={fTelefone} onChange={(e) => setFTelefone(e.target.value)} placeholder="Telefone" className={inputCls} />
              <input value={fEspecialidade} onChange={(e) => setFEspecialidade(e.target.value)} placeholder="Especialidade" className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700">Salvar</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">{mecanico.nome}</h1>
                {!mecanico.ativo && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Inativo</span>}
              </div>
              <p className="text-sm text-zinc-500 mt-1">
                {mecanico.especialidade || "Sem especialidade"}
                {mecanico.telefone ? ` · ${mecanico.telefone}` : ""}
                {` · ${mecanico._count.ordens} OS no total`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button onClick={() => setEditing(true)} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">Editar</button>
              <button onClick={toggleAtivo} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
                {mecanico.ativo ? "Desativar" : "Reativar"}
              </button>
              {mecanico._count.ordens === 0 && (
                <button onClick={excluir} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Excluir</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Seletor de período */}
      <div className="flex items-center gap-2">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {MESES.map((nome, i) => <option key={i} value={i + 1}>{nome}</option>)}
        </select>
        <select value={ano} onChange={(e) => setAno(Number(e.target.value))} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Métricas de produtividade */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Faturamento" value={formatCurrency(faturamento)} />
        <Metric label="Lucro real" value={formatCurrency(lucroReal)} highlight />
        <Metric label="Margem" value={fmtPct(margem)} />
        <Metric label="Mão de obra" value={formatCurrency(maoDeObra)} />
        <Metric label="Ticket médio" value={formatCurrency(ticketMedio)} />
        <Metric label="OS no mês" value={String(nOS)} />
        <Metric label="NPS médio" value={fmtNps(npsMedio)} />
      </div>

      {/* Meta do mês */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-800">Meta de faturamento · {MESES[mes - 1]}/{ano}</h2>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-40">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Valor da meta (R$)</label>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={metaInput} onChange={(e) => setMetaInput(e.target.value)} placeholder="0,00" className={inputCls} />
          </div>
          <button onClick={salvarMeta} disabled={savingMeta} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
            {savingMeta ? "Salvando..." : "Salvar meta"}
          </button>
        </div>
        {progresso !== null && metaAtual && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-zinc-600">
              <span>{formatCurrency(faturamento)} de {formatCurrency(metaAtual.valorAlvo)}</span>
              <span className={cn("font-semibold", progresso >= 100 ? "text-green-600" : "text-zinc-700")}>{progresso.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", progresso >= 100 ? "bg-green-500" : "bg-red-500")}
                style={{ width: `${Math.min(progresso, 100)}%` }}
              />
            </div>
          </div>
        )}
        {progresso === null && <p className="text-sm text-zinc-400">Defina uma meta para acompanhar o progresso.</p>}
      </div>

      {/* Rastreabilidade: OS do mecânico no mês */}
      <div>
        <h2 className="font-semibold text-zinc-800 mb-2">Ordens de Serviço · {MESES[mes - 1]}/{ano}</h2>
        {ordensDoMes.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white py-8 text-center text-sm text-zinc-400">
            Nenhuma OS deste mecânico no período.
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 overflow-hidden">
            {ordensDoMes.map((os) => (
              <Link key={os.id} href={`/os/${os.id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-zinc-50 transition-colors sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 sm:contents">
                  <div className="shrink-0 text-center w-10 sm:w-12">
                    <p className="text-xs text-zinc-400">OS</p>
                    <p className="font-bold text-zinc-900">#{os.numero}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{os.cliente.nome}</p>
                    <p className="text-sm text-zinc-500 truncate">
                      {os.veiculo.marca} {os.veiculo.modelo}{os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""} · {os.descricao}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-xs text-zinc-400 hidden sm:block">{labelStatus(os.status)}</div>
                <div className="text-right text-sm w-24 shrink-0">
                  <p className="font-semibold text-zinc-900">{formatCurrency(os.total)}</p>
                  <p className="text-xs text-zinc-400">{formatDate(os.abertura)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border p-4", highlight ? "border-green-200 bg-green-50" : "border-zinc-200 bg-white")}>
      <p className={cn("text-xs", highlight ? "text-green-700" : "text-zinc-500")}>{label}</p>
      <p className={cn("text-lg font-bold mt-1", highlight ? "text-green-700" : "text-zinc-900")}>{value}</p>
    </div>
  );
}
