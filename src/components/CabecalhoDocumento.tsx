"use client";

import { linhasDoCabecalho } from "@/lib/configuracao";
import { useConfiguracao } from "@/lib/useConfiguracao";

/**
 * Topo do documento que o cliente recebe (OS e orçamento, na tela e na impressão).
 *
 * Tudo vem do painel de configurações: é o único lugar do sistema onde a oficina
 * aparece com nome, logo e contato próprios.
 */
export default function CabecalhoDocumento() {
  const config = useConfiguracao();

  if (!config) {
    // Esqueleto do mesmo tamanho do cabeçalho pronto — a folha não "pula" ao carregar.
    return (
      <div className="flex items-center gap-3 sm:gap-5 border-b border-zinc-200 px-5 sm:px-8 py-5 sm:py-6">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded bg-zinc-100 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="mx-auto h-6 w-2/3 animate-pulse rounded bg-zinc-100" />
          <div className="mx-auto h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
        </div>
        <div aria-hidden className="h-14 w-14 shrink-0 sm:h-20 sm:w-20" />
      </div>
    );
  }

  const linhas = linhasDoCabecalho(config);

  return (
    <div className="flex items-center gap-3 sm:gap-5 border-b border-zinc-200 px-5 sm:px-8 py-5 sm:py-6">
      {config.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.logoUrl}
          alt={config.nome}
          width={80}
          height={80}
          className="h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20"
        />
      )}
      <div className="min-w-0 flex-1 text-center">
        <h1 className="text-lg font-black uppercase tracking-wider sm:text-2xl">{config.nome}</h1>
        {linhas.map((linha) => (
          <p key={linha} className="mt-0.5 text-xs text-zinc-500">
            {linha}
          </p>
        ))}
      </div>
      {/* Espelha a largura da logo para o título centralizar no card, e não no espaço restante. */}
      {config.logoUrl && <div aria-hidden className="h-14 w-14 shrink-0 sm:h-20 sm:w-20" />}
    </div>
  );
}
