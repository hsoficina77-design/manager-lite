"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Barras verticais de uma série só (cadastros por semana, recebido por mês). Uma cor —
// a da marca —, sem legenda: o título do painel diz o que é. O valor aparece escrito
// só na barra atual; as outras mostram o seu ao passar o dedo ou o mouse.

export type Barra = { rotulo: string; valor: number; dica: string };

export function Barras({ barras, altura = 140, rotuloAcessivel }: { barras: Barra[]; altura?: number; rotuloAcessivel: string }) {
  const [focada, setFocada] = useState<number | null>(null);
  const maximo = Math.max(1, ...barras.map((b) => b.valor));
  const ultima = barras.length - 1;
  const mostrada = focada ?? ultima;

  return (
    <figure aria-label={rotuloAcessivel} className="space-y-2">
      <p className="min-h-5 text-xs text-tinta-2" aria-live="polite">
        {barras[mostrada]?.dica}
      </p>
      <div
        className="flex items-end gap-[2px] border-b border-linha"
        style={{ height: altura }}
        onMouseLeave={() => setFocada(null)}
      >
        {barras.map((b, i) => (
          <button
            key={i}
            type="button"
            aria-label={b.dica}
            onMouseEnter={() => setFocada(i)}
            onFocus={() => setFocada(i)}
            onBlur={() => setFocada(null)}
            onClick={() => setFocada(i)}
            // A área de toque é a coluna inteira, não só a barra — barra baixa também se pega.
            className="group flex h-full min-w-0 flex-1 items-end"
          >
            <span
              className={cn(
                "block w-full rounded-t-[4px] transition-opacity",
                b.valor === 0 ? "h-[2px] bg-linha-forte" : "bg-brand-600",
                focada !== null && focada !== i && "opacity-50"
              )}
              style={b.valor === 0 ? undefined : { height: `${Math.max(3, (b.valor / maximo) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="flex gap-[2px]" aria-hidden>
        {barras.map((b, i) => (
          <span
            key={i}
            className={cn(
              "min-w-0 flex-1 truncate text-center text-[10px] leading-none text-tinta-3",
              // Rótulo sim, rótulo não, para não encavalar no celular.
              i !== ultima && (ultima - i) % 2 === 1 && "invisible"
            )}
          >
            {b.rotulo}
          </span>
        ))}
      </div>
    </figure>
  );
}
