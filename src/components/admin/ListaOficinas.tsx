"use client";

import Link from "next/link";
import { useState } from "react";
import { cn, normalizarBusca } from "@/lib/utils";
import { FILTROS, origemDa, type Filtro, type OficinaResumo } from "@/lib/admin";
import { Entrada, Selecao } from "@/components/ui/Campos";
import { Vazio } from "@/components/ui/Dados";
import { AcoesDaOficina, LinkWhatsapp, Selos, dia, haQuanto } from "./comum";

export type OficinaDaLista = OficinaResumo & { usuarios: number; clientes: number };

function passaNoFiltro(o: OficinaDaLista, filtro: Filtro) {
  if (filtro === "suspensas") return !o.ativa;
  if (filtro === "teste") return o.ativa && o.situacao === "TESTE";
  if (filtro === "encerradas") return o.ativa && o.situacao === "SOMENTE_LEITURA";
  if (filtro === "assinantes") return o.ativa && o.situacao === "ASSINANTE";
  if (filtro === "sem-prazo") return o.ativa && o.situacao === "LIBERADA";
  return true;
}

type Ordem = "recentes" | "acesso" | "uso";

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Cadastro mais recente" },
  { valor: "acesso", rotulo: "Último acesso" },
  { valor: "uso", rotulo: "Mais OS em 30 dias" },
];

const tempo = (d: Date | string | null) => (d ? new Date(d).getTime() : 0);

export function ListaOficinas({ oficinas, filtroInicial = "todas" }: { oficinas: OficinaDaLista[]; filtroInicial?: Filtro }) {
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");

  const termo = normalizarBusca(busca);
  const visiveis = oficinas
    .filter((o) => passaNoFiltro(o, filtro))
    .filter((o) => !termo || normalizarBusca(o.nome).includes(termo) || (o.whatsapp ?? "").includes(termo))
    .sort((a, b) =>
      ordem === "acesso"
        ? tempo(b.ultimoAcesso) - tempo(a.ultimoAcesso)
        : ordem === "uso"
          ? b.ordens30d - a.ordens30d
          : tempo(b.criadaEm) - tempo(a.criadaEm)
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Entrada
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou WhatsApp"
          className="sm:max-w-xs"
          aria-label="Buscar oficina"
        />
        <Selecao
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as Ordem)}
          aria-label="Ordenar por"
          className="sm:max-w-xs"
        >
          {ORDENS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </Selecao>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            className={cn(
              "min-h-9 rounded-full border px-3 text-xs font-medium",
              filtro === f.valor
                ? "border-brand-600 bg-brand-600 text-brand-fg"
                : "border-linha-forte text-tinta-2 hover:bg-superficie-2"
            )}
          >
            {f.rotulo} ({oficinas.filter((o) => passaNoFiltro(o, f.valor)).length})
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <Vazio titulo="Nenhuma oficina" compacto />
      ) : (
        <div className="divide-y divide-linha rounded-xl border border-linha bg-superficie">
          {visiveis.map((o) => (
            <div
              key={o.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/admin/oficinas/${o.id}`}
                  className="block truncate font-medium text-tinta hover:text-brand-texto hover:underline"
                >
                  {o.nome}
                </Link>
                <Selos oficina={o} origem={origemDa(o)} />
                <p className="text-xs text-tinta-3">
                  Desde {dia(o.criadaEm)} · {o.usuarios} acesso{o.usuarios === 1 ? "" : "s"} · {o.clientes} cliente
                  {o.clientes === 1 ? "" : "s"} · {o.ordens} OS ({o.ordens30d} em 30 dias)
                </p>
                <p className="text-xs text-tinta-3">
                  Último acesso: {haQuanto(o.ultimoAcesso, "ninguém entrou ainda")}
                </p>
                <LinkWhatsapp oficina={o} />
              </div>
              <AcoesDaOficina oficina={o} className="sm:justify-end" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
