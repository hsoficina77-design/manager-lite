"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import { Mais } from "@/components/ui/Icones";

type Mecanico = {
  id: string;
  nome: string;
  telefone: string | null;
  especialidade: string | null;
  ativo: boolean;
  _count: { ordens: number };
};

export default function MecanicosPage() {
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/mecanicos")
      .then((r) => r.json())
      .then(setMecanicos)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setError("Informe o nome."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/mecanicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, especialidade }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao salvar"); return; }
      setNome(""); setTelefone(""); setEspecialidade("");
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const ativos = mecanicos.filter((m) => m.ativo);
  const inativos = mecanicos.filter((m) => !m.ativo);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-tinta">Mecânicos</h1>
        <div className="flex gap-2">
          <Link href="/produtividade" className="flex-1 rounded-lg border border-linha-forte px-4 py-2 text-center text-sm font-medium text-tinta-2 hover:bg-superficie-2 transition-colors sm:flex-none">
            Produtividade
          </Link>
          <button onClick={() => setShowForm((v) => !v)} className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 transition-colors sm:flex-none">
            {showForm ? "Cancelar" : "+ Novo mecânico"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-superficie rounded-xl border border-linha p-5 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-tinta-2 mb-1">Nome *</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-tinta-2 mb-1">Telefone</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-tinta-2 mb-1">Especialidade</label>
              <input value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} placeholder="Ex: Motor, Suspensão" className={inputCls} />
            </div>
          </div>
          {error && <p className="text-sm text-perigo">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700 disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar mecânico"}
          </button>
        </form>
      )}

      {loading ? (
        <EsqueletoLista linhas={3} />
      ) : mecanicos.length === 0 ? (
        <Vazio
          titulo="Nenhum mecânico cadastrado"
          texto="Com mecânico cadastrado dá para atribuir a OS e acompanhar produtividade e meta."
          acao={
            <Botao onClick={() => setShowForm(true)}>
              <Mais tamanho={16} /> Cadastrar mecânico
            </Botao>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ativos.map((m) => <MecanicoCard key={m.id} m={m} />)}
          </div>
          {inativos.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-tinta-3 mb-2">Inativos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inativos.map((m) => <MecanicoCard key={m.id} m={m} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MecanicoCard({ m }: { m: Mecanico }) {
  return (
    <Link
      href={`/mecanicos/${m.id}`}
      className={cn(
        "block rounded-xl border bg-superficie p-4 hover:border-perigo-linha hover:shadow-sm transition-all",
        m.ativo ? "border-linha" : "border-linha opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-tinta truncate">{m.nome}</p>
          {m.especialidade && <p className="text-sm text-tinta-3 truncate">{m.especialidade}</p>}
        </div>
        {!m.ativo && (
          <span className="shrink-0 rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">Inativo</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-tinta-3">
        {m.telefone && <span>{m.telefone}</span>}
        <span className="ml-auto rounded-full bg-superficie-3 px-2 py-0.5 font-medium text-tinta-2">
          {m._count.ordens} {m._count.ordens === 1 ? "OS" : "OS"}
        </span>
      </div>
    </Link>
  );
}
