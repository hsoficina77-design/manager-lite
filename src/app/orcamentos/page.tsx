"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate, cn, nomeCliente, descricaoVeiculo, ehRascunho } from "@/lib/utils";
import { corStatusOrcamento, labelStatusOrcamento } from "@/lib/constants";
import { BotaoLink } from "@/components/ui/Botao";
import { BuscaLive } from "@/components/ui/BuscaLive";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import { Mais } from "@/components/ui/Icones";

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
  const q = searchParams.get("q") || "";
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-xl sm:text-2xl font-bold text-tinta">Orçamentos</h1>
        <BotaoLink href="/orcamentos/novo">
          <Mais tamanho={16} /> Novo orçamento
        </BotaoLink>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-superficie-3 rounded-lg p-1 w-fit">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={tab.value ? `/orcamentos?status=${tab.value}` : "/orcamentos"}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                statusParam === tab.value ? "bg-superficie text-tinta shadow-sm" : "text-tinta-3 hover:text-tinta-2"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <BuscaLive
          placeholder="Buscar por nome, apelido, placa ou nº"
          rotulo="Buscar orçamentos"
          className="min-w-48 flex-1"
        />
      </div>

      {loading ? (
        <EsqueletoLista linhas={5} />
      ) : filtered.length === 0 ? (
        q || statusParam ? (
          <Vazio
            titulo="Nenhum orçamento com esse filtro"
            texto="Ajuste a busca ou volte para a aba Todos."
          />
        ) : (
          <Vazio
            titulo="Nenhum orçamento ainda"
            texto="O orçamento é o passo antes da OS: dá o preço ao cliente e vira ordem de serviço com um clique."
            acao={
              <BotaoLink href="/orcamentos/novo">
                <Mais tamanho={16} /> Novo orçamento
              </BotaoLink>
            }
          />
        )
      ) : (
        <div className="rounded-xl border border-linha bg-superficie divide-y divide-linha overflow-hidden">
          {filtered.map((o) => (
            <Link key={o.id} href={`/orcamentos/${o.id}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-superficie-2 transition-colors sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-3 sm:contents">
                <div className="shrink-0 text-center w-12">
                  <p className="text-xs text-tinta-3">Orç</p>
                  <p className="font-bold tabular-nums text-tinta">#{o.numero}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-tinta truncate">{nomeCliente(o)}</p>
                    {o.cliente?.apelido && (
                      <span className="shrink-0 rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">{o.cliente.apelido}</span>
                    )}
                    {ehRascunho(o) && (
                      <span className="shrink-0 rounded-full bg-atencao-fraco px-2 py-0.5 text-xs font-medium text-atencao">Rascunho</span>
                    )}
                  </div>
                  <p className="text-sm text-tinta-3 truncate">
                    {[descricaoVeiculo(o), o.descricao].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={cn("shrink-0 sm:hidden", corStatusOrcamento(o.status))}>
                  {labelStatusOrcamento(o.status)}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {o.ordem && (
                  <span className="rounded-full bg-superficie-3 px-2.5 py-0.5 text-xs font-medium text-tinta-2">OS #{o.ordem.numero}</span>
                )}
                <span className={cn("hidden sm:inline-flex", corStatusOrcamento(o.status))}>
                  {labelStatusOrcamento(o.status)}
                </span>
                <div className="w-24 text-right text-xs tabular-nums">
                  <p className="font-semibold text-tinta">{formatCurrency(o.total)}</p>
                  <p className="text-tinta-3">{formatDate(o.createdAt)}</p>
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
