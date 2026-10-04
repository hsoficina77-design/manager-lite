"use client";

// Pré-visualização do painel. Cada seção declara se quer vê-la ao lado dos campos
// (ver `previa` no registro de seções).

import { linhasDoCabecalho, rodapeDoDocumento, type Configuracao } from "@/lib/configuracao";
import { estiloDoDocumento } from "@/lib/cor-documento";

function Moldura({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-linha bg-superficie p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-tinta-3">{titulo}</p>
      {children}
    </div>
  );
}

/** Topo da OS/orçamento como o cliente recebe: logo, contatos e a cor dos documentos. */
export function PreviaDocumento({ config }: { config: Configuracao }) {
  return (
    <Moldura titulo="Topo da OS">
      <div className="documento rounded-lg border border-linha p-4" style={estiloDoDocumento(config.corDocumento)}>
        <div className="flex items-center gap-3">
          {config.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl} alt="" className="h-12 w-12 shrink-0 object-contain" />
          )}
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-black uppercase tracking-wider">{config.nome}</p>
            {linhasDoCabecalho(config).map((linha) => (
              <p key={linha} className="mt-0.5 truncate text-[10px] text-tinta-3">
                {linha}
              </p>
            ))}
          </div>
          {config.logoUrl && <div aria-hidden className="h-12 w-12 shrink-0" />}
        </div>
        <div className="my-3 h-0.5 bg-doc" />
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-tinta-3">Ordem de Serviço</p>
            <p className="text-xl font-black text-doc-texto">#128</p>
          </div>
          <p className="truncate text-[10px] text-tinta-3">{rodapeDoDocumento(config)}</p>
        </div>
      </div>
    </Moldura>
  );
}
