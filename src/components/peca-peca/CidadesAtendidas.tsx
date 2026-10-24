"use client";

import { useState } from "react";
import { mesmaCidade, rotuloDoMunicipio, type Municipio } from "@/lib/municipios";
import { CampoCidade } from "@/components/ui/CampoCidade";
import { Fechar } from "@/components/ui/Icones";

// As cidades que uma loja atende — a região dela. É por esta lista que a oficina vê a
// loja ao cotar. A cidade onde a loja fica entra sempre (o servidor a põe de volta),
// então aparece fixa; as outras se tiram e se põem, sempre escolhidas da lista do IBGE.
//
// O mesmo campo serve ao cadastro da plataforma (/admin/lojas) e à tela "Loja" do dono.

/** A região sem a cidade da própria loja — é o que o campo edita. */
export function outrasCidades(atende: string[], rotuloDaSede: string): string[] {
  return atende.filter((c) => !rotuloDaSede || !mesmaCidade(c, rotuloDaSede));
}

export function CidadesAtendidas({
  sede,
  outras,
  onChange,
  sugestoes = [],
}: {
  /** Onde a loja fica. */
  sede: Municipio | null;
  /** As outras cidades, como "Suzano - SP". */
  outras: string[];
  onChange: (outras: string[]) => void;
  /** Atalhos para cidades que já aparecem em outras lojas. */
  sugestoes?: string[];
}) {
  // Troca a chave para limpar o campo de busca depois de cada cidade adicionada.
  const [campoNovo, setCampoNovo] = useState(0);

  const jaTem = (rotulo: string) =>
    Boolean(sede && mesmaCidade(rotulo, rotuloDoMunicipio(sede))) || outras.some((x) => mesmaCidade(x, rotulo));

  function adicionar(rotulo: string) {
    if (!jaTem(rotulo)) onChange([...outras, rotulo]);
    setCampoNovo((n) => n + 1);
  }

  const outrasSugestoes = sugestoes.filter((c) => !jaTem(c));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {sede && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-tinta" title="A cidade da loja entra sempre">
            {rotuloDoMunicipio(sede)}
          </span>
        )}
        {outras.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-full bg-superficie-2 py-1 pl-2.5 pr-1 text-xs text-tinta-2">
            {c}
            <button
              type="button"
              onClick={() => onChange(outras.filter((y) => y !== c))}
              aria-label={`Tirar ${c}`}
              className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-superficie-3"
            >
              <Fechar tamanho={12} />
            </button>
          </span>
        ))}
      </div>
      <CampoCidade
        key={campoNovo}
        valor={null}
        onChange={(m) => m && adicionar(rotuloDoMunicipio(m))}
        placeholder="Mais uma cidade: comece a digitar"
        aria-label="Cidade atendida"
      />
      {outrasSugestoes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {outrasSugestoes.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => adicionar(c)}
              className="min-h-8 rounded-full border border-linha px-2.5 text-xs text-tinta-3 hover:border-brand-500 hover:text-tinta"
            >
              + {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
