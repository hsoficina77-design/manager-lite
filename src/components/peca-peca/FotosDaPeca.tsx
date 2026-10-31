"use client";

import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/image-compress";
import { useAvisar } from "@/components/ui/Avisos";
import { Fechar } from "@/components/ui/Icones";
import { FOTOS_POR_PECA, type FotoVista } from "./regras";
import { buscar } from "./aoVivo";

// Fotos que ajudam a acertar a peça — a peça velha, a etiqueta, o defeito. Até duas por
// peça; somem sozinhas 30 dias depois que a cotação fecha (lib/fotos-peca-peca.ts).

/** As fotos já enviadas: miniatura que abre a foto inteira, ou o aviso de que foi apagada. */
export function MiniaturasDaPeca({ fotos }: { fotos: FotoVista[] }) {
  if (fotos.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {fotos.map((f) =>
        f.url ? (
          <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" aria-label="Abrir a foto da peça">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada e temporária do Storage */}
            <img src={f.url} alt="Foto da peça" className="h-20 w-20 rounded-lg border border-linha object-cover" />
          </a>
        ) : (
          <span
            key={f.id}
            className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-linha-forte p-1 text-center text-[0.65rem] text-tinta-3"
          >
            Foto apagada em {new Date(f.apagadaEm!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
          </span>
        )
      )}
    </div>
  );
}

/**
 * Fotos escolhidas antes de existir onde gravar (a cotação ou a devolução ainda não foi
 * criada): ficam no aparelho, com a miniatura, e sobem depois com `enviarFotos`.
 */
export function EscolherFotos({
  fotos,
  onChange,
  rotulo = "Foto da peça",
}: {
  fotos: File[];
  onChange: (fotos: File[]) => void;
  rotulo?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [previas, setPrevias] = useState<string[]>([]);

  useEffect(() => {
    const urls = fotos.map((f) => URL.createObjectURL(f));
    setPrevias(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [fotos]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {previas.map((src, i) => (
        <div key={src} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- prévia local, ainda não enviada */}
          <img src={src} alt={`${rotulo} ${i + 1}`} className="h-16 w-16 rounded-lg border border-linha object-cover" />
          <button
            type="button"
            onClick={() => onChange(fotos.filter((_, j) => j !== i))}
            aria-label="Tirar esta foto"
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-linha bg-superficie text-tinta-2 shadow-sm"
          >
            <Fechar tamanho={14} />
          </button>
        </div>
      ))}
      {fotos.length < FOTOS_POR_PECA && (
        <>
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="flex h-16 min-w-[4rem] items-center justify-center rounded-lg border border-dashed border-linha-forte px-3 text-xs font-medium text-tinta-2 transition-colors hover:border-brand-500 hover:text-tinta"
          >
            + {fotos.length === 0 ? "Foto" : "Outra foto"}
          </button>
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const novas = [...(e.target.files ?? [])];
              e.target.value = "";
              if (novas.length) onChange([...fotos, ...novas].slice(0, FOTOS_POR_PECA));
            }}
          />
        </>
      )}
    </div>
  );
}

/**
 * Sobe as fotos, uma de cada vez (comprimir várias juntas estoura a memória do celular
 * barato). Devolve quantas não subiram — a cotação já existe, então foto que falhou não
 * desfaz nada: só avisa.
 */
export async function enviarFotos(
  cotacaoId: string,
  fotos: File[],
  dona: { pecaId: string } | { devolucaoId: string }
): Promise<number> {
  let falhas = 0;
  for (const foto of fotos) {
    try {
      const corpo = new FormData();
      corpo.set("file", await compressImage(foto), "foto.jpg");
      if ("pecaId" in dona) corpo.set("pecaId", dona.pecaId);
      else corpo.set("devolucaoId", dona.devolucaoId);
      const r = await buscar(`/api/peca-peca/cotacoes/${cotacaoId}/fotos`, { method: "POST", body: corpo });
      if (!r.ok) falhas += 1;
    } catch {
      falhas += 1;
    }
  }
  return falhas;
}

/** Copia o código para colar no catálogo — o balconista não precisa redigitar. */
export function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const avisar = useAvisar();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          avisar(`${rotulo} copiado`);
        } catch {
          avisar("Não deu para copiar. Selecione e copie à mão.", "erro");
        }
      }}
      className="min-h-8 rounded-md border border-linha bg-superficie px-2 text-xs font-medium text-tinta-2 transition-colors hover:border-brand-500 hover:text-tinta"
    >
      Copiar
    </button>
  );
}
