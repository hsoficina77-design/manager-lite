"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn, formatCurrency, normalizarBusca } from "@/lib/utils";
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

// ─── Memória da busca ────────────────────────────────────────────────────────
//
// Existe porque digitar é lento. Mesmo com a pausa abaixo, escrever "reservatório ford"
// num celular — onde cada letra demora mais que a pausa — manda quase uma requisição
// por letra, e cada uma custa uma varredura inteira da tabela de produtos no banco (o
// `contains` da rota vira `LIKE '%x%'`, que índice comum nenhum resolve). Apagar uma
// letra para corrigir refazia a consulta idêntica.
//
// Mora no módulo, e não no componente: há um campo destes por linha de item, e o que a
// segunda linha procura a primeira muitas vezes já procurou.
//
// A validade curta é o preço de não mentir: dá para cadastrar a peça na aba do estoque
// e voltar para cá sem recarregar a página.

/** Quanto tempo uma resposta guardada continua valendo. */
const VALIDADE_MS = 60_000;

/** Teto de termos guardados. Passou disso, esquece tudo — é memória de conveniência. */
const MAX_LEMBRADOS = 200;

/** Pausa antes de ir ao servidor. Digitação de celular passa dos 250ms por letra. */
const PAUSA_MS = 400;

/** Abaixo disto não vale a viagem: a resposta seria quase o catálogo inteiro. */
const MIN_LETRAS = 3;

type Lembrado = { lista: ProdutoBuscado[]; em: number };

const lembrados = new Map<string, Lembrado>();

function vigente(l: Lembrado, agora: number): boolean {
  return agora - l.em <= VALIDADE_MS;
}

function lembrar(chave: string, lista: ProdutoBuscado[]) {
  if (lembrados.size >= MAX_LEMBRADOS) lembrados.clear();
  lembrados.set(chave, { lista, em: Date.now() });
}

/**
 * O que já se sabe sobre este termo sem perguntar ao servidor, ou `undefined`.
 *
 * Dois casos. O óbvio: perguntou-se exatamente isto há pouco. E o que economiza de
 * verdade: **um trecho** deste termo já voltou vazio. Como a busca é por trecho, nada
 * que contenha "reserv" pode aparecer se "reserv" não apareceu — então, a partir da
 * primeira resposta vazia, todas as letras seguintes de "reservatório ford" têm
 * resposta conhecida. É exatamente onde mais se digita: peça que não está cadastrada.
 *
 * Só o vazio se propaga assim. Uma resposta com resultados não diz nada sobre o termo
 * maior, e o corte de 8 itens da rota tornaria qualquer palpite errado.
 */
function jaSabido(chave: string): ProdutoBuscado[] | undefined {
  const agora = Date.now();

  const exato = lembrados.get(chave);
  if (exato) {
    if (vigente(exato, agora)) return exato.lista;
    lembrados.delete(chave);
  }

  for (const [anterior, l] of lembrados) {
    if (l.lista.length === 0 && vigente(l, agora) && chave.includes(anterior)) return l.lista;
  }
  return undefined;
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
 *
 * Só vai ao servidor o que ainda não se sabe (ver acima), e a busca que a letra
 * seguinte já tornou obsoleta é abortada — sem isso o servidor terminava de servir
 * respostas que ninguém ia ler.
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

  // Busca com pausa, e só do que ainda não se sabe. O termo curto demais não vai ao
  // servidor: a resposta seria quase o catálogo, e ninguém escolhe peça assim.
  useEffect(() => {
    const termo = valor.trim();
    if (!aberto || termo.length < MIN_LETRAS) {
      setResultados([]);
      setTermoBuscado("");
      setBuscando(false);
      return;
    }

    const chave = normalizarBusca(termo);

    // Resposta que já se tem aparece no mesmo quadro: sem rede, sem pausa e sem o
    // "Procurando no estoque..." piscando por nada.
    const sabido = jaSabido(chave);
    if (sabido) {
      setResultados(sabido);
      setTermoBuscado(termo);
      setDestaque(-1);
      setBuscando(false);
      return;
    }

    // `cancelado` e `abortar` respondem por coisas diferentes: o abort corta o trabalho
    // do lado do servidor, e a flag impede que uma resposta chegada um instante antes
    // do abort pise no resultado da busca seguinte.
    let cancelado = false;
    const controle = new AbortController();
    setBuscando(true);
    const t = setTimeout(() => {
      fetch(`/api/produtos?ativo=true&limite=8&q=${encodeURIComponent(termo)}`, {
        signal: controle.signal,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((lista: ProdutoBuscado[]) => {
          if (cancelado) return;
          lembrar(chave, lista);
          setResultados(lista);
          setTermoBuscado(termo);
          setDestaque(-1);
        })
        .catch(() => !cancelado && setResultados([]))
        .finally(() => !cancelado && setBuscando(false));
    }, PAUSA_MS);
    return () => {
      cancelado = true;
      controle.abort();
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

  const mostrarLista = aberto && valor.trim().length >= MIN_LETRAS;
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
