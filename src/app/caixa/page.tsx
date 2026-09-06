"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { FORMAS_PAGAMENTO, labelFormaPagamento } from "@/lib/constants";
import { Entrada } from "@/components/ui/Campos";
import { EsqueletoFaixa, EsqueletoLista, FaixaMetricas, Metrica, Vazio } from "@/components/ui/Dados";
import { Avancar, Voltar } from "@/components/ui/Icones";

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
    let cancelado = false;
    setLoading(true);
    fetch(`/api/caixa?data=${data}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("falha"))))
      .then((d) => !cancelado && setCaixa(d))
      .catch(() => !cancelado && setCaixa(null))
      .finally(() => !cancelado && setLoading(false));
    return () => {
      cancelado = true;
    };
  }, [data]);

  const isHoje = data === hojeISO();

  function mudarDia(delta: number) {
    const d = new Date(`${data}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setData(d.toISOString().slice(0, 10));
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tinta sm:text-2xl">Fechamento de caixa</h1>
          <p className="mt-0.5 text-sm text-tinta-3">Recebimentos do dia, por forma de pagamento</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mudarDia(-1)}
            aria-label="Dia anterior"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha-forte bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
          >
            <Voltar tamanho={16} />
          </button>
          <Entrada
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            aria-label="Data do caixa"
            className="w-auto"
          />
          <button
            onClick={() => mudarDia(1)}
            disabled={isHoje}
            aria-label="Próximo dia"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha-forte bg-superficie text-tinta-2 hover:bg-superficie-2 disabled:opacity-40 sm:h-9 sm:w-9"
          >
            <Avancar tamanho={16} />
          </button>
          {!isHoje && (
            <button onClick={() => setData(hojeISO())} className="text-xs text-brand-600 hover:underline">
              Hoje
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <>
          <EsqueletoFaixa colunas={6} />
          <EsqueletoLista linhas={4} />
        </>
      ) : !caixa ? (
        <Vazio
          titulo="Não foi possível carregar o caixa"
          texto="Verifique a conexão e tente de novo."
        />
      ) : (
        <>
          <FaixaMetricas colunas={6}>
            <Metrica
              rotulo="Total recebido"
              valor={formatCurrency(caixa.total)}
              tamanho="grande"
              tom={caixa.total > 0 ? "ok" : "neutro"}
            />
            {FORMAS_PAGAMENTO.map((f) => (
              <Metrica
                key={f.value}
                rotulo={f.label}
                valor={formatCurrency(caixa.porForma[f.value] ?? 0)}
                tamanho="grande"
              />
            ))}
          </FaixaMetricas>

          {caixa.lancamentos.length === 0 ? (
            <Vazio
              titulo="Nenhum recebimento neste dia"
              texto="Recebimentos de OS e de dívidas avulsas aparecem aqui assim que são registrados."
              compacto
            />
          ) : (
            <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
              {caixa.lancamentos.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="truncate font-medium text-tinta">{l.cliente}</span>
                      <span className="shrink-0 text-tinta-3">
                        {l.link ? (
                          <Link href={l.link} className="hover:underline">
                            {l.referencia}
                          </Link>
                        ) : (
                          l.referencia
                        )}
                      </span>
                    </div>
                    {l.obs && <p className="truncate text-xs text-tinta-3">{l.obs}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        l.tipo === "os" ? "bg-superficie-3 text-tinta-2" : "bg-atencao-fraco text-atencao"
                      )}
                    >
                      {labelFormaPagamento(l.formaPagamento)}
                    </span>
                    <span className="w-24 text-right font-semibold tabular-nums text-tinta">
                      {formatCurrency(l.valor)}
                    </span>
                    {/* Antes a hora saía de um `split(" ")` sobre a data formatada. */}
                    <span className="w-16 text-right text-xs tabular-nums text-tinta-3">
                      {new Date(l.data).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
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
