"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, formatDatetime, cn } from "@/lib/utils";

const FORMAS_PGTO = ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA"];
const FORMAS_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro", PIX: "PIX",
  CARTAO_CREDITO: "Cartão Crédito", CARTAO_DEBITO: "Cartão Débito", TRANSFERENCIA: "Transferência",
};

type Lancamento = {
  id: string;
  tipo: "os" | "divida";
  valor: number;
  formaPagamento: string;
  data: string;
  obs: string | null;
  referencia: string;
  cliente: string;
  link: string | null;
};
type CaixaData = { data: string; total: number; porForma: Record<string, number>; lancamentos: Lancamento[] };

function hojeISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function CaixaPage() {
  const [data, setData] = useState(hojeISO());
  const [caixa, setCaixa] = useState<CaixaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/caixa?data=${data}`)
      .then((r) => r.json())
      .then(setCaixa)
      .finally(() => setLoading(false));
  }, [data]);

  const isHoje = data === hojeISO();

  function mudarDia(delta: number) {
    const d = new Date(`${data}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setData(d.toISOString().slice(0, 10));
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">Fechamento de Caixa</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Recebimentos do dia, por forma de pagamento</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mudarDia(-1)} className="rounded-lg border border-zinc-300 px-2.5 py-2 text-sm text-zinc-600 hover:bg-zinc-50">←</button>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button onClick={() => mudarDia(1)} disabled={isHoje} className="rounded-lg border border-zinc-300 px-2.5 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-40">→</button>
          {!isHoje && (
            <button onClick={() => setData(hojeISO())} className="text-xs text-brand-600 hover:underline">Hoje</button>
          )}
        </div>
      </div>

      {loading || !caixa ? (
        <div className="text-sm text-zinc-400 text-center py-12">Carregando...</div>
      ) : (
        <>
          {/* Totais por forma de pagamento */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-700">Total recebido</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(caixa.total)}</p>
            </div>
            {FORMAS_PGTO.map((f) => (
              <div key={f} className="rounded-xl border border-zinc-200 bg-white p-4">
                <p className="text-xs text-zinc-500">{FORMAS_LABEL[f]}</p>
                <p className="text-xl font-bold text-zinc-900 mt-1">{formatCurrency(caixa.porForma[f] ?? 0)}</p>
              </div>
            ))}
          </div>

          {/* Lançamentos */}
          {caixa.lancamentos.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center text-sm text-zinc-400">
              Nenhum recebimento neste dia.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100 overflow-hidden">
              {caixa.lancamentos.map((l) => (
                <div key={l.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-zinc-900 truncate">{l.cliente}</span>
                      <span className="text-zinc-400 shrink-0">
                        {l.link ? (
                          <Link href={l.link} className="hover:underline">{l.referencia}</Link>
                        ) : l.referencia}
                      </span>
                    </div>
                    {l.obs && <p className="text-xs text-zinc-400 truncate">{l.obs}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      l.tipo === "os" ? "bg-zinc-100 text-zinc-600" : "bg-orange-100 text-orange-700"
                    )}>
                      {FORMAS_LABEL[l.formaPagamento] || l.formaPagamento}
                    </span>
                    <span className="font-semibold text-zinc-900 w-24 text-right">{formatCurrency(l.valor)}</span>
                    <span className="text-xs text-zinc-400 w-16 text-right">{formatDatetime(l.data).split(" ")[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
