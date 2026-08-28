"use client";

// Pré-visualizações do painel. Cada seção declara qual delas quer ver ao lado
// dos campos (ver `previa` no registro de seções).

import { linhasDoCabecalho, rodapeDoDocumento, type Configuracao } from "@/lib/configuracao";

function Moldura({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">{titulo}</p>
      {children}
    </div>
  );
}

/** Topo da OS/orçamento como o cliente recebe: logo, contatos e a cor da marca. */
export function PreviaDocumento({ config }: { config: Configuracao }) {
  return (
    <Moldura titulo="Topo da OS">
      <div className="rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center gap-3">
          {config.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl} alt="" className="h-12 w-12 shrink-0 object-contain" />
          )}
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-black uppercase tracking-wider">{config.nome}</p>
            {linhasDoCabecalho(config).map((linha) => (
              <p key={linha} className="mt-0.5 truncate text-[10px] text-zinc-500">
                {linha}
              </p>
            ))}
          </div>
          {config.logoUrl && <div aria-hidden className="h-12 w-12 shrink-0" />}
        </div>
        <div className="my-3 h-0.5" style={{ backgroundColor: config.corPrimaria }} />
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">Ordem de Serviço</p>
            <p className="text-xl font-black" style={{ color: config.corPrimaria }}>
              #128
            </p>
          </div>
          <p className="truncate text-[10px] text-zinc-400">{rodapeDoDocumento(config)}</p>
        </div>
      </div>
    </Moldura>
  );
}

/** Menu e botões com as cores escolhidas — o tema já está aplicado na tela real. */
export function PreviaSistema() {
  return (
    <Moldura titulo="Sistema">
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <div className="flex">
          <div className="w-20 shrink-0 space-y-1 bg-menu p-2">
            <div className="rounded bg-brand-700 px-2 py-1 text-[10px] font-medium text-brand-fg">
              Menu
            </div>
            <div className="px-2 py-1 text-[10px] text-menu-texto">Clientes</div>
            <div className="px-2 py-1 text-[10px] text-menu-texto">OS</div>
          </div>
          <div className="flex-1 space-y-2 bg-gray-100 p-3">
            <div className="rounded bg-brand-600 px-2 py-1.5 text-center text-[10px] font-medium text-brand-fg">
              Nova OS
            </div>
            <div className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-[10px] text-brand-600">
              Link de exemplo
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        As cores já estão aplicadas na tela. Sair sem salvar desfaz.
      </p>
    </Moldura>
  );
}
