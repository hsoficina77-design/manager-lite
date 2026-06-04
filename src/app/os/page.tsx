"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

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

const GRUPOS = [
  { key: "patio", label: "Pátio", statuses: ["ABERTA", "EM_ANDAMENTO", "AGUARDANDO_PECA"], bg: "bg-zinc-50" },
  { key: "afechar", label: "A Fechar", statuses: ["PRONTA"], bg: "bg-zinc-100" },
  { key: "fechadas", label: "Fechadas", statuses: ["FECHADA"], bg: "bg-zinc-200" },
  { key: "entregues", label: "Entregues", statuses: ["ENTREGUE"], bg: "bg-zinc-100" },
];

const TABS = [
  { label: "Todas", value: "" },
  { label: "Pátio", value: "patio" },
  { label: "A Fechar", value: "afechar" },
  { label: "Fechadas", value: "fechadas" },
  { label: "Entregues", value: "entregues" },
];

type OS = {
  id: string; numero: number; status: string; descricao: string;
  total: number; pago: boolean; abertura: string; mecanico: string | null;
  cliente: { id: string; nome: string; apelido: string | null };
  veiculo: { marca: string; modelo: string; placa: string | null };
};

function OSListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("status") || "";
  const q = searchParams.get("q") || "";
  const mecanico = searchParams.get("mecanico") || "";
  const de = searchParams.get("de") || "";
  const ate = searchParams.get("ate") || "";

  const [ordens, setOrdens] = useState<OS[]>([]);
  const [mecanicos, setMecanicos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFiltros, setShowFiltros] = useState(false);
  const [localQ, setLocalQ] = useState(q);
  const [localMecanico, setLocalMecanico] = useState(mecanico);
  const [localDe, setLocalDe] = useState(de);
  const [localAte, setLocalAte] = useState(ate);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/os")
      .then((r) => r.json())
      .then(setOrdens)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch("/api/mecanicos").then((r) => r.json()).then(setMecanicos); }, []);

  function applyFilters() {
    const params = new URLSearchParams();
    if (tabParam) params.set("status", tabParam);
    if (localQ) params.set("q", localQ);
    if (localMecanico) params.set("mecanico", localMecanico);
    if (localDe) params.set("de", localDe);
    if (localAte) params.set("ate", localAte);
    router.push(`/os?${params.toString()}`);
  }

  function clearFilters() {
    setLocalQ(""); setLocalMecanico(""); setLocalDe(""); setLocalAte("");
    router.push("/os");
  }

  // Filtrar localmente
  const filtered = ordens.filter((os) => {
    // Filtro por aba (grupo)
    if (tabParam) {
      const grupo = GRUPOS.find((g) => g.key === tabParam);
      if (grupo && !grupo.statuses.includes(os.status)) return false;
    }
    // Busca livre
    if (q) {
      const text = q.toLowerCase();
      if (
        !os.cliente.nome.toLowerCase().includes(text) &&
        !(os.cliente.apelido?.toLowerCase().includes(text)) &&
        !(os.veiculo.placa?.toLowerCase().includes(text)) &&
        !(os.mecanico?.toLowerCase().includes(text)) &&
        !String(os.numero).includes(text)
      ) return false;
    }
    // Mecânico
    if (mecanico && os.mecanico !== mecanico) return false;
    // Datas
    if (de && new Date(os.abertura) < new Date(de)) return false;
    if (ate && new Date(os.abertura) > new Date(ate + "T23:59:59")) return false;
    return true;
  });

  // Agrupar por grupo
  const renderGrupos = tabParam
    ? [GRUPOS.find((g) => g.key === tabParam)!].filter(Boolean)
    : GRUPOS;

  const gruposComOS = renderGrupos.map((g) => ({
    ...g,
    items: filtered.filter((os) => g.statuses.includes(os.status)),
  }));

  const canceladas = filtered.filter((os) => os.status === "CANCELADA");

  const hasFilters = q || mecanico || de || ate;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Ordens de Serviço</h1>
        <Link href="/os/nova" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
          + Nova OS
        </Link>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-4 bg-zinc-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/os?status=${tab.value}` : "/os"}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              tabParam === tab.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Filtros avançados */}
      <div className="mb-4">
        <button onClick={() => setShowFiltros(!showFiltros)} className="text-sm text-zinc-500 hover:text-zinc-700 mb-2 flex items-center gap-1">
          {showFiltros ? "▲" : "▼"} Filtros avançados {hasFilters && <span className="bg-red-100 text-red-700 rounded-full px-2 text-xs">ativo</span>}
        </button>
        {showFiltros && (
          <div className="flex flex-wrap gap-2 bg-zinc-50 rounded-xl border border-zinc-200 p-3">
            <input
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="Buscar nome, apelido, placa, mecânico, #OS..."
              className="flex-1 min-w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <select
              value={localMecanico}
              onChange={(e) => setLocalMecanico(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos mecânicos</option>
              {mecanicos.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="date" value={localDe} onChange={(e) => setLocalDe(e.target.value)} title="De" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            <input type="date" value={localAte} onChange={(e) => setLocalAte(e.target.value)} title="Até" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            <button onClick={applyFilters} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700">Aplicar</button>
            <button onClick={clearFilters} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Limpar filtros</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : (
        <div className="space-y-5">
          {gruposComOS.map((grupo) =>
            grupo.items.length === 0 ? null : (
              <div key={grupo.key}>
                <div className={cn("flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-semibold text-zinc-700", grupo.bg)}>
                  {grupo.label}
                  <span className="rounded-full bg-white bg-opacity-70 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {grupo.items.length}
                  </span>
                </div>
                <div className="rounded-b-xl border border-t-0 border-zinc-200 bg-white divide-y divide-zinc-100 overflow-hidden">
                  {grupo.items.map((os) => (
                    <OSRow key={os.id} os={os} />
                  ))}
                </div>
              </div>
            )
          )}

          {canceladas.length > 0 && !tabParam && (
            <div>
              <div className="flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-semibold text-zinc-500 bg-zinc-100">
                Canceladas <span className="rounded-full bg-white bg-opacity-70 px-2 py-0.5 text-xs">{canceladas.length}</span>
              </div>
              <div className="rounded-b-xl border border-t-0 border-zinc-200 bg-white divide-y divide-zinc-100 overflow-hidden">
                {canceladas.map((os) => <OSRow key={os.id} os={os} />)}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
              Nenhuma OS encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OSRow({ os }: { os: OS }) {
  return (
    <Link href={`/os/${os.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors">
      <div className="shrink-0 text-center w-12">
        <p className="text-xs text-zinc-400">OS</p>
        <p className="font-bold text-zinc-900">#{os.numero}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-zinc-900 truncate">{os.cliente.nome}</p>
          {os.cliente.apelido && (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{os.cliente.apelido}</span>
          )}
        </div>
        <p className="text-sm text-zinc-500 truncate">
          {os.veiculo.marca} {os.veiculo.modelo}
          {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
          {" · "}{os.descricao}
        </p>
      </div>
      <div className="shrink-0 text-sm text-zinc-500 hidden md:block">
        {os.mecanico || <span className="text-zinc-300">—</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLOR[os.status] || "bg-zinc-100 text-zinc-600")}>
          {STATUS_LABEL[os.status] || os.status}
        </span>
        <div className="text-right text-xs w-24">
          <p className="font-semibold text-zinc-900">{formatCurrency(os.total)}</p>
          <p className={os.pago ? "text-green-600" : "text-red-500"}>{os.pago ? "Pago" : "Pendente"}</p>
        </div>
        <p className="text-xs text-zinc-400 hidden sm:block">{formatDate(os.abertura)}</p>
      </div>
    </Link>
  );
}

export default function OSPage() {
  return (
    <Suspense>
      <OSListContent />
    </Suspense>
  );
}
