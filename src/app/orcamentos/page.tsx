"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate, cn, nomeCliente, descricaoVeiculo, ehRascunho } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente", APROVADO: "Aprovado", RECUSADO: "Recusado", CONVERTIDO: "Convertido",
};
const STATUS_COLOR: Record<string, string> = {
  PENDENTE: "bg-zinc-200 text-zinc-700",
  APROVADO: "bg-green-100 text-green-700",
  RECUSADO: "bg-red-100 text-red-700",
  CONVERTIDO: "bg-zinc-900 text-white",
};

const TABS = [
  { label: "Todos", value: "" },
  { label: "Pendentes", value: "PENDENTE" },
  { label: "Aprovados", value: "APROVADO" },
  { label: "Recusados", value: "RECUSADO" },
  { label: "Convertidos", value: "CONVERTIDO" },
];

type Orcamento = {
  id: string; numero: number; status: string; descricao: string | null;
  total: number; validade: string | null; createdAt: string;
  clienteId: string | null;
  cliente: { id: string; nome: string; apelido: string | null } | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  veiculo: { marca: string; modelo: string; placa: string | null } | null;
  veiculoDesc: string | null;
  ordem: { id: string; numero: number } | null;
};

function OrcamentosContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") || "";
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/orcamentos")
      .then((r) => r.json())
      .then(setOrcamentos)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orcamentos.filter((o) => {
    if (statusParam && o.status !== statusParam) return false;
    if (q) {
      const text = q.toLowerCase();
      // Rascunhos não têm cadastro: a busca também precisa varrer os campos livres.
      const alvo = [
        nomeCliente(o),
        o.cliente?.apelido ?? "",
        o.clienteTelefone ?? "",
        o.veiculo?.placa ?? "",
        o.veiculoDesc ?? "",
        String(o.numero),
      ].join(" ").toLowerCase();
      if (!alvo.includes(text)) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Orçamentos</h1>
        <Link href="/orcamentos/novo" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">
          + Novo Orçamento
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1 w-fit">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/orcamentos?status=${tab.value}` : "/orcamentos"}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                statusParam === tab.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar nome, apelido, placa, #..."
          className="flex-1 min-w-48 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
          Nenhum orçamento encontrado.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 overflow-hidden">
          {filtered.map((o) => (
            <Link key={o.id} href={`/orcamentos/${o.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 transition-colors">
              <div className="shrink-0 text-center w-12">
                <p className="text-xs text-zinc-400">Orç</p>
                <p className="font-bold text-zinc-900">#{o.numero}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900 truncate">{nomeCliente(o)}</p>
                  {o.cliente?.apelido && (
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{o.cliente.apelido}</span>
                  )}
                  {ehRascunho(o) && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Rascunho</span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 truncate">
                  {[descricaoVeiculo(o), o.descricao].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {o.ordem && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">OS #{o.ordem.numero}</span>
                )}
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLOR[o.status] || "bg-zinc-100 text-zinc-600")}>
                  {STATUS_LABEL[o.status] || o.status}
                </span>
                <div className="text-right text-xs w-24">
                  <p className="font-semibold text-zinc-900">{formatCurrency(o.total)}</p>
                  <p className="text-zinc-400">{formatDate(o.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrcamentosPage() {
  return (
    <Suspense>
      <OrcamentosContent />
    </Suspense>
  );
}
