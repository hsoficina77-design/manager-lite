"use client";

import Link from "next/link";
import type { MotivoAtencao, OficinaResumo } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { Vazio } from "@/components/ui/Dados";
import { LinkWhatsapp, haQuanto } from "./comum";

const COR: Record<MotivoAtencao, string> = {
  "teste-acabando": "bg-atencao-fraco text-atencao",
  "so-consulta": "bg-perigo-fraco text-perigo",
  sumida: "bg-superficie-3 text-tinta-2",
  "nunca-entrou": "bg-superficie-3 text-tinta-2",
};

export function Atencao({
  itens,
}: {
  itens: { oficina: OficinaResumo; motivo: MotivoAtencao; texto: string }[];
}) {
  if (itens.length === 0) {
    return <Vazio titulo="Nada pendente" texto="Nenhuma oficina com teste acabando, parada ou em só consulta." compacto />;
  }
  return (
    <div className="divide-y divide-linha">
      {itens.map(({ oficina, motivo, texto }) => (
        <div key={oficina.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href={`/admin/oficinas/${oficina.id}`}
              className="block truncate font-medium text-tinta hover:text-brand-texto hover:underline"
            >
              {oficina.nome}
            </Link>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tinta-3">
              <span className={cn("rounded-full px-2 py-0.5", COR[motivo])}>{texto}</span>
              <span>
                Último acesso: {haQuanto(oficina.ultimoAcesso)} · {oficina.ordens} OS
              </span>
            </p>
          </div>
          <LinkWhatsapp oficina={oficina} className="shrink-0" />
        </div>
      ))}
    </div>
  );
}
