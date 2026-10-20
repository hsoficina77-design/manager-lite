"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  acharMunicipio,
  buscarMunicipios,
  prepararIndice,
  rotuloDoMunicipio,
  type IndiceDeMunicipios,
  type ListaDeMunicipios,
  type Municipio,
} from "@/lib/municipios";
import { BASE_CAMPO } from "./Campos";

// A lista do IBGE é carregada uma vez, na primeira tela que tem o campo — e não
// entra no pacote das telas que não o usam.
let indiceCarregado: Promise<IndiceDeMunicipios> | null = null;
function carregarIndice() {
  indiceCarregado ??= import("@/lib/municipios.json").then((m) =>
    prepararIndice(m.default as ListaDeMunicipios)
  );
  return indiceCarregado;
}

/**
 * Cidade escolhida da lista oficial do IBGE: digita "suz", escolhe "Suzano - SP".
 *
 * O valor só existe depois de escolhido; enquanto a pessoa digita, ele é `null` — é
 * isso que padroniza a cidade. Sair do campo com o nome exato de um município (e de
 * um estado só) já o escolhe, para ninguém precisar clicar no óbvio.
 *
 * `textoInicial` mostra um valor antigo que ainda não é da lista, para a pessoa ver o
 * que tinha e escolher o certo.
 */
export function CampoCidade({
  valor,
  onChange,
  textoInicial,
  id,
  placeholder = "Comece a digitar: Suzano",
  className,
  autoFocus,
  "aria-label": ariaLabel,
}: {
  valor: Municipio | null;
  onChange: (m: Municipio | null) => void;
  textoInicial?: string;
  id?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
}) {
  const gerado = useId();
  const campoId = id ?? gerado;
  const listaId = `${campoId}-sugestoes`;
  const [indice, setIndice] = useState<IndiceDeMunicipios | null>(null);
  const [texto, setTexto] = useState(valor ? rotuloDoMunicipio(valor) : (textoInicial ?? ""));
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const escolhido = useRef(valor);

  useEffect(() => {
    let vivo = true;
    carregarIndice().then((i) => vivo && setIndice(i));
    return () => {
      vivo = false;
    };
  }, []);

  // Valor trocado por fora (o CEP preencheu, o formulário limpou): o texto acompanha.
  useEffect(() => {
    const rotuloNovo = valor ? rotuloDoMunicipio(valor) : null;
    const rotuloAtual = escolhido.current ? rotuloDoMunicipio(escolhido.current) : null;
    escolhido.current = valor;
    if (rotuloNovo !== rotuloAtual) setTexto(rotuloNovo ?? "");
  }, [valor]);

  const sugestoes = indice && aberto && !valor ? buscarMunicipios(indice, texto) : [];

  function escolher(m: Municipio) {
    escolhido.current = m;
    setTexto(rotuloDoMunicipio(m));
    setAberto(false);
    onChange(m);
  }

  function aoSair() {
    setAberto(false);
    if (valor || !indice || !texto.trim()) return;
    const exato = acharMunicipio(indice, texto);
    if (exato) escolher(exato);
  }

  return (
    <div className="relative">
      <input
        id={campoId}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={sugestoes.length > 0}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={sugestoes.length > 0 ? `${listaId}-${ativo}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAtivo(0);
          setAberto(true);
          if (valor) {
            escolhido.current = null;
            onChange(null);
          }
        }}
        onFocus={() => setAberto(true)}
        onBlur={aoSair}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && sugestoes.length) {
            e.preventDefault();
            setAtivo((i) => Math.min(i + 1, sugestoes.length - 1));
          } else if (e.key === "ArrowUp" && sugestoes.length) {
            e.preventDefault();
            setAtivo((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && sugestoes.length) {
            // Com a lista aberta, Enter escolhe a cidade em vez de enviar o formulário.
            e.preventDefault();
            escolher(sugestoes[ativo] ?? sugestoes[0]);
          } else if (e.key === "Escape") {
            setAberto(false);
          }
        }}
        className={cn(BASE_CAMPO, className)}
      />
      {sugestoes.length > 0 && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-linha bg-superficie py-1 shadow-lg"
        >
          {sugestoes.map((m, i) => (
            <li
              key={`${m.nome}-${m.uf}`}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === ativo}
              // mousedown, e não click: o click chegaria depois do blur que fecha a lista.
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(m);
              }}
              onMouseEnter={() => setAtivo(i)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-sm",
                i === ativo ? "bg-brand-50 text-tinta" : "text-tinta-2"
              )}
            >
              <span>{m.nome}</span>
              <span className="text-xs font-semibold text-tinta-3">{m.uf}</span>
            </li>
          ))}
        </ul>
      )}
      {!valor && texto.trim().length >= 2 && !aberto && (
        <p className="mt-1 text-xs text-atencao">Escolha a cidade na lista.</p>
      )}
    </div>
  );
}
