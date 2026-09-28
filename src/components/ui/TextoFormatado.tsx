import { blocosDoTexto, type Bloco, type Trecho } from "@/lib/texto-formatado";

// Mostra na tela a descrição do serviço com títulos, negrito e listas.
// As marcas estão explicadas em lib/texto-formatado.ts.

function Trechos({ trechos }: { trechos: Trecho[] }) {
  return (
    <>
      {trechos.map((t, i) =>
        t.negrito ? (
          <strong key={i} className="font-semibold text-tinta">{t.texto}</strong>
        ) : (
          <span key={i}>{t.texto}</span>
        ),
      )}
    </>
  );
}

/** Agrupa itens de lista vizinhos para virarem um <ol>/<ul> de verdade. */
type Grupo =
  | { tipo: "lista"; numerada: boolean; itens: Extract<Bloco, { tipo: "numerado" | "marcador" }>[] }
  | { tipo: "bloco"; bloco: Exclude<Bloco, { tipo: "numerado" | "marcador" }> };

function agrupa(blocos: Bloco[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const b of blocos) {
    if (b.tipo === "numerado" || b.tipo === "marcador") {
      const ultimo = grupos[grupos.length - 1];
      // Sub-item fica no grupo do item de cima, mesmo que o tipo da lista mude.
      if (ultimo?.tipo === "lista" && (b.nivel > 0 || ultimo.numerada === (b.tipo === "numerado"))) {
        ultimo.itens.push(b);
      } else {
        grupos.push({ tipo: "lista", numerada: b.tipo === "numerado", itens: [b] });
      }
    } else {
      grupos.push({ tipo: "bloco", bloco: b });
    }
  }
  return grupos;
}

export function TextoFormatado({ texto, className = "" }: { texto: string; className?: string }) {
  const grupos = agrupa(blocosDoTexto(texto));
  return (
    <div className={`space-y-1 text-sm leading-relaxed text-tinta break-words ${className}`}>
      {grupos.map((g, i) => {
        if (g.tipo === "lista") {
          return (
            <ul key={i} className="space-y-0.5">
              {g.itens.map((item, j) => (
                <li key={j} className={`flex gap-2 ${item.nivel > 0 ? "pl-6" : ""}`}>
                  <span className="w-5 shrink-0 text-right tabular-nums text-tinta-2" aria-hidden="true">
                    {item.tipo === "numerado" ? `${item.numero}.` : "•"}
                  </span>
                  <span className="min-w-0 flex-1"><Trechos trechos={item.trechos} /></span>
                </li>
              ))}
            </ul>
          );
        }
        const b = g.bloco;
        if (b.tipo === "espaco") return <div key={i} className="h-2" aria-hidden="true" />;
        if (b.tipo === "titulo") {
          return (
            <p key={i} className="pt-1 font-bold uppercase tracking-wide text-tinta">
              <Trechos trechos={b.trechos} />
            </p>
          );
        }
        return <p key={i}><Trechos trechos={b.trechos} /></p>;
      })}
    </div>
  );
}
