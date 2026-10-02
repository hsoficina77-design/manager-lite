"use client";

import { useRef, useState } from "react";
import { htmlParaTexto } from "@/lib/texto-formatado";
import { TextoFormatado } from "@/components/ui/TextoFormatado";
import { Negrito, Titulo, ListaMarcadores, ListaNumerada } from "@/components/ui/Icones";

// Campo "Descrição do serviço" com barra de formatação.
//
// O valor continua sendo texto simples com as marcas de lib/texto-formatado.ts —
// a barra só escreve essas marcas por você. Texto colado de um chat, do Word ou
// de um site chega com títulos, negrito e listas convertidos para as mesmas marcas.

const RE_PREFIXO = /^(\s*)(#{1,6}\s+|\d{1,3}[.)]\s+|[-*•]\s+)?/;

type Props = {
  value: string;
  onChange: (valor: string) => void;
  maxLength: number;
  required?: boolean;
  placeholder?: string;
  rows?: number;
};

export function EditorDescricao({ value, onChange, maxLength, required, placeholder, rows = 6 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [previa, setPrevia] = useState(false);

  /**
   * Troca o trecho [inicio, fim) por `texto` e seleciona [selIni, selFim] depois.
   * Usa execCommand quando dá, para o Ctrl+Z do navegador continuar desfazendo.
   */
  function substitui(inicio: number, fim: number, texto: string, selIni: number, selFim: number) {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(inicio, fim);
    const ok = typeof document.execCommand === "function" && document.execCommand("insertText", false, texto);
    if (!ok) onChange(el.value.slice(0, inicio) + texto + el.value.slice(fim));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selIni, selFim);
    });
  }

  function negrito() {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: ini, selectionEnd: fim, value: v } = el;
    const sel = v.slice(ini, fim);
    // Já está em negrito: tira as marcas.
    if (v.slice(ini - 2, ini) === "**" && v.slice(fim, fim + 2) === "**") {
      substitui(ini - 2, fim + 2, sel, ini - 2, fim - 2);
      return;
    }
    if (sel.startsWith("**") && sel.endsWith("**") && sel.length >= 4) {
      substitui(ini, fim, sel.slice(2, -2), ini, fim - 4);
      return;
    }
    // Espaços nas pontas da seleção ficam fora das marcas.
    const [, antes, meio, depois] = sel.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    const miolo = meio || "texto em negrito";
    const novo = `${antes}**${miolo}**${depois}`;
    const selIni = ini + antes.length + 2;
    substitui(ini, fim, novo, selIni, selIni + miolo.length);
  }

  /** Aplica (ou tira, se todas já têm) um prefixo em cada linha da seleção. */
  function prefixa(tipo: "titulo" | "marcador" | "numerado") {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: ini, selectionEnd: fim, value: v } = el;
    const inicioLinha = v.lastIndexOf("\n", ini - 1) + 1;
    const fimSel = fim > ini && v[fim - 1] === "\n" ? fim - 1 : fim;
    const quebra = v.indexOf("\n", fimSel);
    const fimLinha = quebra === -1 ? v.length : quebra;
    const linhas = v.slice(inicioLinha, fimLinha).split("\n");

    const jaTem = (l: string) =>
      tipo === "titulo" ? /^\s*#{1,6}\s/.test(l) : tipo === "marcador" ? /^\s*[-*•]\s/.test(l) : /^\s*\d{1,3}[.)]\s/.test(l);
    const tirar = linhas.filter((l) => l.trim()).every(jaTem);

    let n = 0;
    const novas = linhas.map((l) => {
      if (!l.trim()) return l;
      const [, recuo] = l.match(RE_PREFIXO)!;
      const semPrefixo = l.replace(RE_PREFIXO, "");
      if (tirar) return recuo + semPrefixo;
      if (tipo === "titulo") return `## ${semPrefixo}`;
      if (tipo === "marcador") return `${recuo}- ${semPrefixo}`;
      return `${recuo}${++n}. ${semPrefixo}`;
    });
    const novo = novas.join("\n");
    substitui(inicioLinha, fimLinha, novo, inicioLinha + novo.length, inicioLinha + novo.length);
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      negrito();
      return;
    }
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;

    // Enter numa linha de lista continua a lista; Enter num item vazio encerra.
    const el = e.currentTarget;
    const { selectionStart: ini, selectionEnd: fim, value: v } = el;
    if (ini !== fim) return;
    const inicioLinha = v.lastIndexOf("\n", ini - 1) + 1;
    const linha = v.slice(inicioLinha, ini);
    const m = linha.match(/^(\s*)(?:(\d{1,3})([.)])|([-*•]))\s+(.*)$/);
    if (!m) return;
    e.preventDefault();
    const [, recuo, num, sep, marca, resto] = m;
    if (!resto.trim()) {
      substitui(inicioLinha, ini, "", inicioLinha, inicioLinha);
      return;
    }
    const proximo = num ? `${recuo}${Number(num) + 1}${sep} ` : `${recuo}${marca} `;
    const pos = ini + 1 + proximo.length;
    substitui(ini, ini, `\n${proximo}`, pos, pos);
  }

  function aoColar(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData("text/html");
    if (!html) return; // texto simples: o navegador cola sozinho
    const texto = htmlParaTexto(html);
    if (!texto) return;
    e.preventDefault();
    const { selectionStart: ini, selectionEnd: fim } = e.currentTarget;
    substitui(ini, fim, texto, ini + texto.length, ini + texto.length);
  }

  const botao =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md px-2 text-tinta-2 hover:bg-superficie-3 hover:text-tinta disabled:opacity-40 disabled:hover:bg-transparent sm:h-8 sm:min-w-8";
  const restante = maxLength - value.length;

  return (
    <div className="rounded-lg border border-linha-forte focus-within:ring-2 focus-within:ring-brand-500">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-linha-forte px-1.5 py-1">
        <button type="button" onClick={negrito} disabled={previa} className={botao} title="Negrito (Ctrl+B)" aria-label="Negrito">
          <Negrito />
        </button>
        <button type="button" onClick={() => prefixa("titulo")} disabled={previa} className={botao} title="Título de seção" aria-label="Título de seção">
          <Titulo />
        </button>
        <button type="button" onClick={() => prefixa("marcador")} disabled={previa} className={botao} title="Lista com marcadores" aria-label="Lista com marcadores">
          <ListaMarcadores />
        </button>
        <button type="button" onClick={() => prefixa("numerado")} disabled={previa} className={botao} title="Lista numerada" aria-label="Lista numerada">
          <ListaNumerada />
        </button>
        <button
          type="button"
          onClick={() => setPrevia((p) => !p)}
          aria-pressed={previa}
          className={`ml-auto rounded-md px-2.5 py-1.5 text-xs font-medium ${previa ? "bg-brand-50 text-brand-texto" : "text-tinta-2 hover:bg-superficie-3"}`}
        >
          {previa ? "Voltar a editar" : "Ver como fica"}
        </button>
      </div>

      {previa ? (
        <div className="min-h-24 px-3 py-2">
          {value.trim() ? <TextoFormatado texto={value} /> : <p className="text-sm text-tinta-3">Nada escrito ainda.</p>}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={aoTeclar}
          onPaste={aoColar}
          required={required}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          className="block w-full resize-y rounded-b-lg bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
      )}

      <p className={`border-t border-linha-forte px-3 py-1 text-right text-xs ${restante < 200 ? "text-perigo" : "text-tinta-3"}`}>
        {value.length.toLocaleString("pt-BR")} / {maxLength.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
