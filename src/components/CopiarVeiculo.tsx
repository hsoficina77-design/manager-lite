"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { textoVeiculo, type VeiculoInfo } from "@/lib/constants";

/** Copia para a área de transferência, com plano B para navegador sem Clipboard API
 *  (o celular da oficina acessando por http na rede local cai nesse caso). */
async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // segue para o plano B
  }
  try {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Botão "copiar dados do carro" — o texto sai pronto para colar no WhatsApp da auto peça. */
export default function CopiarVeiculo({
  veiculo,
  label = "Copiar carro",
  className,
}: {
  veiculo: VeiculoInfo;
  label?: string;
  className?: string;
}) {
  const [estado, setEstado] = useState<"parado" | "copiado" | "falhou">("parado");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const texto = textoVeiculo(veiculo);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copiar() {
    const ok = await copiarTexto(texto);
    setEstado(ok ? "copiado" : "falhou");
    if (timer.current) clearTimeout(timer.current);
    // O aviso de falha fica mais tempo: junto dele aparece o texto para copiar na mão.
    timer.current = setTimeout(() => setEstado("parado"), ok ? 2000 : 15000);
  }

  return (
    <div className={cn("no-print inline-flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        onClick={copiar}
        title={`Copiar para enviar à auto peça:\n\n${texto}`}
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
          estado === "copiado"
            ? "border-green-300 bg-green-50 text-green-700"
            : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
        )}
      >
        {estado === "copiado" ? <CheckIcon /> : <CopyIcon />}
        {estado === "copiado" ? "Copiado!" : label}
      </button>

      {estado === "falhou" && (
        <div className="w-full max-w-xs">
          <p className="mb-1 text-xs text-amber-600">
            O navegador bloqueou a cópia — selecione o texto abaixo e copie.
          </p>
          <textarea
            readOnly
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            value={texto}
            rows={texto.split("\n").length}
            className="w-full resize-none rounded-lg border border-zinc-300 px-2 py-1.5 text-xs text-zinc-700"
          />
        </div>
      )}
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
