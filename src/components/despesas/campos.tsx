"use client";

// Peças de formulário do controle de gastos.
//
// O que era próprio daqui virou primitiva do sistema: os mesmos modais, o mesmo
// campo e o mesmo botão passaram a servir contas a receber, a OS e o cadastro de
// cliente. Este arquivo agora reexporta, para os locais de chamada não trocarem
// de import, e guarda só o que é exclusivo de gastos — a paleta das categorias.

import { useState } from "react";
import { CampoDinheiro } from "@/components/ui/Campos";

export { Campo, Entrada, Selecao, Area, CampoDinheiro, Aviso } from "@/components/ui/Campos";
export { Botao } from "@/components/ui/Botao";
export { Modal } from "@/components/ui/Modal";

/**
 * Campo de dinheiro do controle de gastos.
 *
 * Mantém o nome antigo porque os quatro modais o chamam assim, e continua
 * recebendo/entregando evento com `target.value`. Por baixo é o campo de texto
 * que aceita vírgula: antes era `type="number"`, que recusava `1.250,50` e
 * entregava vazio no envio sem dizer nada.
 */
export function EntradaValor({
  value,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
}) {
  return (
    <CampoDinheiro
      {...props}
      valor={value == null ? "" : String(value)}
      onChange={(canonico) => onChange?.({ target: { value: canonico } })}
    />
  );
}

/** Paleta das categorias. Cores distinguíveis entre si no gráfico do mês. */
export const CORES = [
  "#6366f1", "#0ea5e9", "#14b8a6", "#22c55e", "#84cc16",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#71717a",
];

/** Sorteia a próxima cor da paleta, para duas categorias novas não saírem iguais. */
export function corSeguinte(usadas: number): string {
  return CORES[usadas % CORES.length];
}

export function PaletaCor({ valor, onMudar }: { valor: string; onMudar: (cor: string) => void }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Escolher cor"
        aria-expanded={aberta}
        onClick={() => setAberta((v) => !v)}
        className="h-11 w-11 rounded-lg border border-linha-forte"
        style={{ backgroundColor: valor }}
      />
      {aberta && (
        // Alvos de 32 px: os quadradinhos de 24 px eram difíceis de acertar no dedo.
        <div className="absolute left-0 top-12 z-10 grid w-56 grid-cols-6 gap-1 rounded-xl border border-linha bg-superficie p-2 shadow-lg">
          {CORES.map((cor) => (
            <button
              key={cor}
              type="button"
              aria-label={`Cor ${cor}`}
              onClick={() => {
                onMudar(cor);
                setAberta(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-superficie-2"
            >
              <span className="h-6 w-6 rounded-full" style={{ backgroundColor: cor }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Chip da categoria — a cor é a que o dono escolheu, então vem por style. */
export function ChipCategoria({ nome, cor }: { nome: string; cor: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${cor}1a`, color: cor }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} />
      {nome}
    </span>
  );
}
