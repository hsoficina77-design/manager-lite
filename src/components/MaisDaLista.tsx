"use client";

import { useState } from "react";
import { Chevron } from "@/components/ui/Icones";

// As linhas chegam prontas do servidor — o período já foi carregado inteiro para
// somar o DRE, então "mostrar mais" é só revelar o que já está aqui, sem ida ao
// banco. Vem em lotes para que um mês de sessenta entregas não empurre o rodapé
// da página a sessenta linhas de rolagem no celular.
export function MaisDaLista({
  linhas,
  passo = 10,
  rotulo = "Mostrar mais",
}: {
  linhas: React.ReactNode[];
  /** Quantas linhas cada clique revela. */
  passo?: number;
  rotulo?: string;
}) {
  const [visiveis, setVisiveis] = useState(0);
  const restantes = linhas.length - visiveis;

  return (
    <>
      {linhas.slice(0, visiveis)}
      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setVisiveis((v) => v + passo)}
          className="flex w-full min-h-11 items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-brand-600 transition-colors hover:bg-superficie-2"
        >
          {rotulo} · faltam {restantes} <Chevron tamanho={14} />
        </button>
      )}
    </>
  );
}
