"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { formatQuantidade } from "@/lib/constants";
import { BASE_CAMPO } from "@/components/ui/Campos";
import { Caixa, Fechar } from "@/components/ui/Icones";

/**
 * O mínimo que um formulário precisa saber de um produto para desenhar o selo do
 * vínculo. Fica fora do item (que vai para o rascunho e para o servidor) de
 * propósito: no item mora só o `produtoId`, que é o que tem consequência.
 */
export type ProdutoResumo = { nome: string; unidade: string; quantidade: number };

/** O que a busca do estoque devolve. `custoUnit` some para quem não vê financeiro. */
export type ProdutoBuscado = {
  id: string;
  nome: string;
  codigo: string | null;
  unidade: string;
  valorVenda: number;
  custoUnit?: number;
  quantidade: number;
};

/**
 * Selo de "esta peça saiu da prateleira", logo abaixo do campo de descrição.
 *
 * O vínculo precisa ser visível e desfazível porque ele tem consequência: é ele que
 * tira a peça do estoque ao salvar. Editar a descrição **não** o desfaz — trocar
 * "Óleo 5W30" por "Óleo 5W30 (galão)" continua sendo a mesma peça —, então o único
 * jeito de soltar é este botão, que é explícito de propósito.
 *
 * `disponivel` já soma o que esta OS segura hoje: numa OS que usa 2 e tem 3 na
 * prateleira, subir para 4 ainda cabe, e o aviso não deve aparecer.
 */
export function VinculoEstoque({
  nome,
  unidade,
  disponivel,
  pedido,
  onDesvincular,
}: {
  nome: string;
  unidade: string;
  disponivel?: number;
  pedido?: number;
  onDesvincular: () => void;
}) {
  const falta = disponivel != null && pedido != null && pedido > disponivel;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-superficie-3 py-0.5 pl-2 pr-0.5 text-tinta-2">
        <Caixa tamanho={13} className="shrink-0 text-tinta-3" />
        <span className="max-w-[16rem] truncate font-medium">{nome}</span>
        {disponivel != null && (
          <span className="text-tinta-3">· {formatQuantidade(disponivel, unidade)}</span>
        )}
        <button
          type="button"
          onClick={onDesvincular}
          aria-label={`Desvincular ${nome} do estoque`}
          title="Lançar sem tirar do estoque"
          className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full text-tinta-3 hover:bg-superficie hover:text-tinta"
        >
          <Fechar tamanho={12} />
        </button>
      </span>
      {falta && (
        <span className="text-atencao">
          Só há {formatQuantidade(disponivel!, unidade)} na prateleira — o saldo vai ficar
          negativo.
        </span>
      )}
    </div>
  );
}

/**
 * Campo de descrição da peça que também procura no estoque.
 *
 * É um campo de texto comum — continua dando para digitar "parafuso M8" e seguir a
 * vida, porque a maior parte do que uma oficina aplica não está cadastrada. O que ele
 * acrescenta é: enquanto se digita, o que existe na prateleira aparece embaixo, e
 * escolher preenche descrição, preço e custo de uma vez e amarra a peça ao estoque
 * (é esse vínculo que dá a baixa quando a OS é gravada).
 *
 * A busca acontece no servidor, com pausa: a lista de peças só cresce, e baixá-la
 * inteira a cada abertura de OS é o que deixou a lista de OS lenta antes de ser
 * paginada. Sem acento e sem caixa, para "agua" achar "Água desmineralizada".
 */
export default function ProdutoBusca({
  valor,
  onTexto,
  onEscolher,
  onEnter,
  placeholder = "Ex: Filtro de óleo",
  className,
}: {
  valor: string;
  onTexto: (texto: string) => void;
  onEscolher: (produto: ProdutoBuscado) => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [resultados, setResultados] = useState<ProdutoBuscado[]>([]);
  const [buscando, setBuscando] = useState(false);
  // -1 = ninguém destacado. É o que mantém o Enter salvando o item quando a
  // descrição é texto livre; só depois de descer com a seta o Enter escolhe.
  const [destaque, setDestaque] = useState(-1);
  const [termoBuscado, setTermoBuscado] = useState("");

  const wrapRef = useRef<HTMLDivElement>(null);
  const listaId = useId();

  // Busca com pausa. O termo curto demais não vai ao servidor: com uma letra a
  // resposta seria o catálogo inteiro, e ninguém escolhe peça vendo duas letras.
  useEffect(() => {
    const termo = valor.trim();
    if (!aberto || termo.length < 2) {
      setResultados([]);
      setTermoBuscado("");
      return;
    }
    let cancelado = false;
    setBuscando(true);
    const t = setTimeout(() => {
      fetch(`/api/produtos?ativo=true&limite=8&q=${encodeURIComponent(termo)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((lista: ProdutoBuscado[]) => {
          if (cancelado) return;
          setResultados(lista);
          setTermoBuscado(termo);
          setDestaque(-1);
        })
        .catch(() => !cancelado && setResultados([]))
        .finally(() => !cancelado && setBuscando(false));
    }, 250);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [valor, aberto]);

  // Fecha ao tocar fora — no celular a lista cobre parte do formulário.
  useEffect(() => {
    if (!aberto) return;
    function aoTocar(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", aoTocar);
    document.addEventListener("touchstart", aoTocar);
    return () => {
      document.removeEventListener("mousedown", aoTocar);
      document.removeEventListener("touchstart", aoTocar);
    };
  }, [aberto]);

  function escolher(produto: ProdutoBuscado) {
    onEscolher(produto);
    setAberto(false);
    setResultados([]);
    setDestaque(-1);
  }

  function aoTeclar(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setAberto(false);
      return;
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && resultados.length > 0) {
      e.preventDefault();
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setDestaque((d) => {
        const proximo = d + passo;
        if (proximo < 0) return resultados.length - 1;
        if (proximo >= resultados.length) return 0;
        return proximo;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const alvo = resultados[destaque];
      if (alvo) escolher(alvo);
      else onEnter?.();
    }
  }

  const mostrarLista = aberto && valor.trim().length >= 2;
  const semResultado =
    mostrarLista && !buscando && resultados.length === 0 && termoBuscado === valor.trim();

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={valor}
        onChange={(e) => {
          onTexto(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={aoTeclar}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={listaId}
        aria-autocomplete="list"
        className={cn(BASE_CAMPO, className)}
      />

      {mostrarLista && (resultados.length > 0 || buscando || semResultado) && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto overscroll-contain rounded-xl border border-linha bg-superficie shadow-lg"
        >
          {resultados.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === destaque}
                onMouseEnter={() => setDestaque(i)}
                onClick={() => escolher(p)}
                className={cn(
                  "flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                  i === destaque && "bg-brand-50"
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-tinta">{p.nome}</span>
                  <span className="block truncate text-xs text-tinta-3">
                    {p.codigo ? `${p.codigo} · ` : ""}
                    {formatCurrency(p.valorVenda)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                    p.quantidade <= 0
                      ? "bg-perigo-fraco text-perigo"
                      : "bg-superficie-3 text-tinta-2"
                  )}
                >
                  {formatQuantidade(p.quantidade, p.unidade)}
                </span>
              </button>
            </li>
          ))}

          {buscando && resultados.length === 0 && (
            <li className="px-3 py-3 text-sm text-tinta-3">Procurando no estoque...</li>
          )}

          {semResultado && (
            <li className="px-3 py-3 text-sm text-tinta-3">
              Nada no estoque com “{valor.trim()}”. Pode seguir digitando: a peça entra
              na OS sem vínculo.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
