import { cn } from "@/lib/utils";
import { COR_ETAPA, ROTULO_ETAPA, telefoneLegivel, type Etapa } from "@/lib/prospeccao";

// Peças que as telas da prospecção dividem.

export function SeloEtapa({ etapa, className }: { etapa: Etapa; className?: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", COR_ETAPA[etapa], className)}>
      {ROTULO_ETAPA[etapa]}
    </span>
  );
}

/** "(11) 94452-2019 · celular", ou o aviso de que não tem telefone. */
export function TelefoneDoLead({
  telefone,
  tipoTelefone,
  temWhatsapp,
}: {
  telefone: string | null;
  tipoTelefone: string;
  temWhatsapp: boolean | null;
}) {
  if (!telefone) return <span className="text-tinta-3">sem telefone</span>;
  const tipo =
    tipoTelefone === "CELULAR"
      ? "celular"
      : temWhatsapp === true
        ? "fixo com WhatsApp"
        : temWhatsapp === false
          ? "fixo sem WhatsApp"
          : "fixo, conferir WhatsApp";
  return (
    <span className="tabular-nums">
      {telefoneLegivel(telefone)} <span className={cn("text-tinta-3", temWhatsapp === false && "line-through")}>· {tipo}</span>
    </span>
  );
}

/** "4,7 ★ (64)" */
export function notaDoLead(nota: number | null, avaliacoes: number | null) {
  if (nota == null) return "sem nota";
  return `${nota.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ★ (${avaliacoes ?? 0})`;
}

export function onde(l: { bairro: string | null; cidade: string | null }) {
  return [l.bairro, l.cidade].filter(Boolean).join(", ") || "sem endereço";
}
