"use client";

import Link from "next/link";
import type { EventoDePagamento } from "@/lib/sistema";
import { ehPagamento, rotuloDoEvento } from "@/lib/admin";
import { cn, formatCurrency } from "@/lib/utils";
import { Vazio } from "@/components/ui/Dados";
import { quando } from "./comum";

export function EventosDePagamento({ eventos }: { eventos: EventoDePagamento[] }) {
  if (eventos.length === 0) {
    return <Vazio titulo="Nenhum evento no período" compacto />;
  }
  return (
    <ul className="divide-y divide-linha">
      {eventos.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-tinta">
              {e.oficina ? (
                <Link href={`/admin/oficinas/${e.oficina.id}`} className="font-medium hover:underline">
                  {e.oficina.nome}
                </Link>
              ) : (
                <span className="text-tinta-3">Oficina não identificada</span>
              )}
            </p>
            <p className="text-xs text-tinta-3">
              {rotuloDoEvento(e.tipo)}
              {e.forma && ` · ${e.forma === "cartao" ? "cartão" : "Pix"}`} · {quando(e.createdAt)}
            </p>
          </div>
          {e.valor != null && (
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                ehPagamento(e.tipo) ? "text-ok" : "text-tinta-2"
              )}
            >
              {formatCurrency(e.valor / 100)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
