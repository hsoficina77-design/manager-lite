"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Cliente = { id: string; nome: string; telefone: string | null };

/** Texto comparável: sem acento e em minúsculo, para "jose" achar "José". */
function normalizar(txt: string) {
  return txt.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const inputCls =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

/**
 * Seletor de cliente com campo de busca. Substitui o <select> nativo, que na
 * lista longa da oficina obriga a rolar até achar o nome.
 * No celular abre como painel sobre a tela; no computador, como dropdown.
 */
export default function ClienteSelect({
  clientes,
  value,
  onChange,
  placeholder = "Selecionar cliente...",
  emptyLabel,
  disabled = false,
}: {
  clientes: Cliente[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Quando informado, "sem cliente" vira uma opção de verdade na lista. */
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [destaque, setDestaque] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const selecionado = clientes.find((c) => c.id === value) ?? null;

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return clientes;
    const digitos = termo.replace(/\D/g, "");
    return clientes.filter((c) => {
      if (normalizar(c.nome).includes(termo)) return true;
      if (!digitos || !c.telefone) return false;
      return c.telefone.replace(/\D/g, "").includes(digitos);
    });
  }, [clientes, busca]);

  // A opção "sem cliente" só aparece enquanto ninguém está buscando um nome.
  const mostrarVazio = !!emptyLabel && !busca.trim();
  const opcoes: { id: string; nome: string; telefone: string | null }[] = mostrarVazio
    ? [{ id: "", nome: emptyLabel, telefone: null }, ...filtrados]
    : filtrados;

  function abrir() {
    if (disabled) return;
    setBusca("");
    const idx = opcoes.findIndex((o) => o.id === value);
    setDestaque(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function fechar() {
    setOpen(false);
    setBusca("");
  }

  function escolher(id: string) {
    onChange(id);
    fechar();
  }

  useEffect(() => {
    if (!open) return;
    buscaRef.current?.focus();
  }, [open]);

  // Fecha ao tocar/clicar fora — no celular o painel tem fundo escurecido próprio.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) fechar();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Mantém o item destacado visível ao navegar pelo teclado.
  useEffect(() => {
    if (!open) return;
    const item = listaRef.current?.children[destaque] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [destaque, open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      fechar();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!opcoes.length) return;
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setDestaque((d) => (d + passo + opcoes.length) % opcoes.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const alvo = opcoes[destaque];
      if (alvo) escolher(alvo.id);
    }
  }

  const rotulo = selecionado
    ? `${selecionado.nome}${selecionado.telefone ? ` · ${selecionado.telefone}` : ""}`
    : emptyLabel ?? placeholder;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? fechar() : abrir())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          inputCls +
          " flex items-center justify-between gap-2 bg-white text-left disabled:bg-zinc-50 disabled:text-zinc-400"
        }
      >
        <span className={"truncate " + (selecionado ? "text-zinc-900" : "text-zinc-500")}>{rotulo}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 text-zinc-400" aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* Fundo só no celular, onde o painel flutua sobre o formulário. */}
          <div onClick={fechar} className="fixed inset-0 z-40 bg-black/30 sm:hidden" aria-hidden="true" />
          <div
            className="fixed inset-x-3 top-14 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl sm:absolute sm:inset-x-0 sm:top-full sm:z-30 sm:mt-1 sm:max-h-80 sm:shadow-lg"
            role="dialog"
          >
            <div className="border-b border-zinc-100 p-2">
              <div className="relative">
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={buscaRef}
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setDestaque(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Buscar por nome ou telefone..."
                  aria-label="Buscar cliente"
                  className={inputCls + " pl-9"}
                />
              </div>
            </div>

            <ul ref={listaRef} role="listbox" className="flex-1 overflow-y-auto overscroll-contain">
              {opcoes.map((o, i) => {
                const ativo = o.id === value;
                return (
                  <li key={o.id || "__vazio"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={ativo}
                      onMouseEnter={() => setDestaque(i)}
                      onClick={() => escolher(o.id)}
                      className={
                        "flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm min-h-[44px] " +
                        (i === destaque ? "bg-brand-50 " : "") +
                        (ativo ? "font-semibold text-brand-700" : "text-zinc-700")
                      }
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{o.nome}</span>
                        {o.telefone && (
                          <span className="block truncate text-xs text-zinc-500">{o.telefone}</span>
                        )}
                      </span>
                      {ativo && (
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className="shrink-0" aria-hidden="true"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
              {opcoes.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-zinc-500">
                  Nenhum cliente encontrado para “{busca.trim()}”.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
