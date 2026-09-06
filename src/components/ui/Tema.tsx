"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Lua, Monitor, Sol } from "./Icones";

export type Tema = "sistema" | "claro" | "escuro";

const CHAVE = "tema";

/**
 * Aplicado no `<head>`, antes da primeira pintura.
 *
 * Sem isto a página nasce clara e pisca para escuro no primeiro render do React
 * — que é pior do que não ter tema escuro nenhum.
 */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CHAVE}");if(t==="claro"||t==="escuro"){document.documentElement.setAttribute("data-tema",t)}}catch(e){}})();`;

function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "sistema") raiz.removeAttribute("data-tema");
  else raiz.setAttribute("data-tema", tema);
  try {
    if (tema === "sistema") localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, tema);
  } catch {
    // Navegador com armazenamento bloqueado: o tema vale só nesta aba.
  }
}

const OPCOES: { valor: Tema; label: string; Icone: typeof Sol }[] = [
  { valor: "claro", label: "Claro", Icone: Sol },
  { valor: "sistema", label: "Automático", Icone: Monitor },
  { valor: "escuro", label: "Escuro", Icone: Lua },
];

/**
 * Seletor de tema.
 *
 * Numa oficina o mesmo celular alterna entre sol direto no pátio e box coberto o
 * dia inteiro, e o app era branco nas duas situações. "Automático" segue o
 * sistema; as outras duas fixam.
 */
export function SeletorTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<Tema>("sistema");

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo === "claro" || salvo === "escuro") setTema(salvo);
    } catch {
      // sem armazenamento: fica no automático
    }
  }, []);

  function escolher(novo: Tema) {
    setTema(novo);
    aplicar(novo);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema da tela"
      className={cn("flex gap-0.5 rounded-lg bg-menu-hover/60 p-0.5", className)}
    >
      {OPCOES.map(({ valor, label, Icone }) => (
        <button
          key={valor}
          type="button"
          role="radio"
          aria-checked={tema === valor}
          aria-label={label}
          title={label}
          onClick={() => escolher(valor)}
          className={cn(
            "flex h-9 flex-1 items-center justify-center rounded-md transition-colors",
            tema === valor
              ? "bg-menu-fg/15 text-menu-fg"
              : "text-menu-texto hover:text-menu-fg"
          )}
        >
          <Icone tamanho={15} />
        </button>
      ))}
    </div>
  );
}
