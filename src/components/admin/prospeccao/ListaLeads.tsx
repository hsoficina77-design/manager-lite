"use client";

import Link from "next/link";
import { useState } from "react";
import { cn, normalizarBusca } from "@/lib/utils";
import { ORDEM_ETAPAS, ROTULO_ETAPA, prioridade, rotuloDaCategoria, type Etapa } from "@/lib/prospeccao";
import { Entrada, Selecao } from "@/components/ui/Campos";
import { Vazio } from "@/components/ui/Dados";
import { Botao } from "@/components/ui/Botao";
import { SeloEtapa, TelefoneDoLead, notaDoLead, onde } from "./comum";

export type LeadDaTela = {
  id: string;
  loteId: string | null;
  publico: string;
  nome: string;
  categoria: string | null;
  telefone: string | null;
  tipoTelefone: string;
  temWhatsapp: boolean | null;
  bairro: string | null;
  cidade: string | null;
  nota: number | null;
  avaliacoes: number | null;
  pctNegativas: number | null;
  sinaisDeDor: string | null;
  createdAt: string;
  etapa: Etapa;
};

type Ordem = "prioridade" | "avaliacoes" | "negativas" | "nota" | "recentes" | "nome";

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "prioridade", rotulo: "Prioridade de contato" },
  { valor: "avaliacoes", rotulo: "Mais avaliações (movimento)" },
  { valor: "negativas", rotulo: "Mais reclamações" },
  { valor: "nota", rotulo: "Maior nota" },
  { valor: "recentes", rotulo: "Importados por último" },
  { valor: "nome", rotulo: "Nome" },
];

const POR_PAGINA = 100;

/** Contagem por valor, para mostrar "(12)" ao lado de cada opção do filtro. */
function contar<T>(lista: T[], chave: (t: T) => string | null) {
  const m = new Map<string, number>();
  for (const t of lista) {
    const k = chave(t);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
}

export function ListaLeads({ leads, lotes }: { leads: LeadDaTela[]; lotes: { id: string; nome: string }[] }) {
  const [publico, setPublico] = useState<"OFICINA" | "AUTOPECA">("OFICINA");
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState<Etapa | "">("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [telefone, setTelefone] = useState("");
  const [lote, setLote] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("prioridade");
  const [mostrar, setMostrar] = useState(POR_PAGINA);

  const doPublico = leads.filter((l) => l.publico === publico);
  const naCidade = doPublico.filter((l) => !cidade || l.cidade === cidade);
  const termo = normalizarBusca(busca);

  const visiveis = naCidade
    .filter((l) => !bairro || l.bairro === bairro)
    .filter((l) => !etapa || l.etapa === etapa)
    .filter((l) => !lote || l.loteId === lote)
    .filter((l) =>
      !telefone
        ? true
        : telefone === "whatsapp"
          ? l.telefone && (l.tipoTelefone === "CELULAR" || l.temWhatsapp === true)
          : telefone === "conferir"
            ? l.tipoTelefone === "FIXO" && l.temWhatsapp == null
            : telefone === "sem"
              ? !l.telefone || l.temWhatsapp === false
              : true
    )
    .filter(
      (l) =>
        !termo ||
        normalizarBusca(l.nome).includes(termo) ||
        (l.telefone ?? "").includes(termo.replace(/\D/g, "") || "~") ||
        normalizarBusca(l.bairro ?? "").includes(termo)
    )
    .sort((a, b) => {
      switch (ordem) {
        case "avaliacoes":
          return (b.avaliacoes ?? 0) - (a.avaliacoes ?? 0);
        case "negativas":
          return (b.pctNegativas ?? 0) - (a.pctNegativas ?? 0);
        case "nota":
          return (b.nota ?? 0) - (a.nota ?? 0);
        case "recentes":
          return b.createdAt.localeCompare(a.createdAt);
        case "nome":
          return a.nome.localeCompare(b.nome, "pt-BR");
        default:
          return prioridade(b) - prioridade(a);
      }
    });

  const autopecas = leads.filter((l) => l.publico === "AUTOPECA").length;
  const filtrando = !!(busca || etapa || cidade || bairro || telefone || lote);

  return (
    <div className="space-y-3">
      {autopecas > 0 && (
        <div className="flex gap-2">
          {(["OFICINA", "AUTOPECA"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPublico(p);
                setMostrar(POR_PAGINA);
              }}
              className={cn(
                "min-h-9 rounded-full border px-3 text-xs font-medium",
                publico === p ? "border-brand-600 bg-brand-600 text-brand-fg" : "border-linha-forte text-tinta-2 hover:bg-superficie-2"
              )}
            >
              {p === "OFICINA" ? "Oficinas (boxOS)" : "Autopeças (Peça Peça)"} (
              {leads.filter((l) => l.publico === p).length})
            </button>
          ))}
        </div>
      )}

      {/* Duas colunas já no celular: empilhados, os filtros empurravam a lista para fora da tela. */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Entrada
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, bairro ou telefone"
          aria-label="Buscar lead"
          className="col-span-2"
        />
        <Selecao value={etapa} onChange={(e) => setEtapa(e.target.value as Etapa | "")} aria-label="Filtrar por etapa">
          <option value="">Todas as etapas</option>
          {ORDEM_ETAPAS.map((e) => {
            const n = doPublico.filter((l) => l.etapa === e).length;
            return n > 0 ? (
              <option key={e} value={e}>
                {ROTULO_ETAPA[e]} ({n})
              </option>
            ) : null;
          })}
        </Selecao>
        <Selecao
          value={cidade}
          onChange={(e) => {
            setCidade(e.target.value);
            setBairro("");
          }}
          aria-label="Filtrar por cidade"
        >
          <option value="">Todas as cidades</option>
          {contar(doPublico, (l) => l.cidade).map(([c, n]) => (
            <option key={c} value={c}>
              {c} ({n})
            </option>
          ))}
        </Selecao>
        <Selecao value={bairro} onChange={(e) => setBairro(e.target.value)} aria-label="Filtrar por bairro">
          <option value="">Todos os bairros</option>
          {contar(naCidade, (l) => l.bairro).map(([b, n]) => (
            <option key={b} value={b}>
              {b} ({n})
            </option>
          ))}
        </Selecao>
        <Selecao value={telefone} onChange={(e) => setTelefone(e.target.value)} aria-label="Filtrar por telefone">
          <option value="">Qualquer telefone</option>
          <option value="whatsapp">Com WhatsApp (celular ou fixo conferido)</option>
          <option value="conferir">Fixo, conferir WhatsApp</option>
          <option value="sem">Sem telefone ou sem WhatsApp</option>
        </Selecao>
        {lotes.length > 1 && (
          <Selecao value={lote} onChange={(e) => setLote(e.target.value)} aria-label="Filtrar por lote">
            <option value="">Todos os lotes</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </Selecao>
        )}
        <Selecao value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar por">
          {ORDENS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </Selecao>
      </div>

      <p className="text-xs text-tinta-3">
        {visiveis.length} de {doPublico.length} {publico === "OFICINA" ? "oficinas" : "autopeças"}
        {filtrando && (
          <>
            {" · "}
            <button
              type="button"
              className="text-brand-texto hover:underline"
              onClick={() => {
                setBusca("");
                setEtapa("");
                setCidade("");
                setBairro("");
                setTelefone("");
                setLote("");
              }}
            >
              limpar filtros
            </button>
          </>
        )}
      </p>

      {visiveis.length === 0 ? (
        <Vazio titulo="Nenhum lead com esses filtros" compacto />
      ) : (
        <div className="divide-y divide-linha rounded-xl border border-linha bg-superficie">
          {visiveis.slice(0, mostrar).map((l) => (
            <Link
              key={l.id}
              href={`/admin/prospeccao/leads/${l.id}`}
              className="flex flex-col gap-1 px-4 py-3 hover:bg-superficie-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 space-y-0.5">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-tinta">{l.nome}</span>
                  <SeloEtapa etapa={l.etapa} />
                </p>
                <p className="truncate text-xs text-tinta-3">
                  {rotuloDaCategoria(l.categoria)} · {onde(l)}
                </p>
                <p className="text-xs text-tinta-2">
                  <TelefoneDoLead {...l} />
                </p>
              </div>
              <div className="shrink-0 text-xs text-tinta-3 sm:text-right">
                <p className="text-tinta-2">{notaDoLead(l.nota, l.avaliacoes)}</p>
                {l.pctNegativas != null && l.pctNegativas > 0 && (
                  <p className={cn(l.pctNegativas >= 20 && "text-atencao")}>{l.pctNegativas.toLocaleString("pt-BR")}% de notas 1 e 2</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {visiveis.length > mostrar && (
        <div className="flex justify-center">
          <Botao variante="secundario" onClick={() => setMostrar((n) => n + POR_PAGINA)}>
            Mostrar mais ({visiveis.length - mostrar} restantes)
          </Botao>
        </div>
      )}
    </div>
  );
}
