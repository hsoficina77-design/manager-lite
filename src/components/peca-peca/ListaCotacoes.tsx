"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BotaoLink } from "@/components/ui/Botao";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import { Avancar, Busca, Chevron, Fechar, Mais } from "@/components/ui/Icones";
import { useUsaBoxOS } from "@/components/UsuarioProvider";
import { ContadorDeMensagens } from "./Conversa";
import {
  aConferir,
  descricaoDoVeiculo,
  devolucaoAberta,
  enviosDoPedido,
  etapaDa,
  normalizarPlaca,
  oficinaPrecisaAgir,
  oQueFaltaNaDevolucao,
  prazoDaLoja,
  rotuloDaEntrega,
  type CotacaoVista,
  type LojaVista,
  type LojasDaOficina,
} from "./regras";
import { useAoVivo } from "./aoVivo";
import { AvisoSemConexao, Cabecalho, InformarCidade, haQuanto } from "./ui";

/*
 * Lista de cotações, organizada pelo que o mecânico precisa fazer.
 *
 * Antes era uma lista só, por número, com a situação miúda no pé de cada linha: para
 * achar o que pedia ação era preciso ler tudo. Agora são três grupos:
 *
 *   Precisa de você — a loja respondeu, a peça chegou, a devolução pede resposta,
 *                     ou tem mensagem nova. Cada linha diz o próximo passo.
 *   Em andamento    — esperando alguém de fora: as lojas, o cliente, o motoboy.
 *   Concluídas      — fechada por padrão: só abre quando a pessoa quer.
 *
 * O carro e a placa vêm primeiro (é como o mecânico lembra); o número fica no rodapé.
 */

const PASSOS_INICIO = [
  { titulo: "Carro e peças", texto: "Digite o carro e o que precisa, do jeito que fala no balcão." },
  { titulo: "As lojas respondem", texto: "Cada loja recebe no balcão dela e manda preço, marca e prazo." },
  { titulo: "Você escolhe", texto: "Os preços aparecem lado a lado. Dá para misturar lojas." },
];

// Com o boxOS, a escolha ainda vira orçamento e OS; sem ele, o caminho termina no pedido.
const PASSOS_COM_BOXOS = [
  ...PASSOS_INICIO,
  { titulo: "Orçamento pronto", texto: "Com o seu preço, já no boxOS. Só precisa do nome do cliente." },
  { titulo: "Pede e vira OS", texto: "Cliente aprovou: o pedido vai para a loja e o orçamento vira OS." },
];
const PASSOS_SEM_BOXOS = [
  ...PASSOS_INICIO,
  { titulo: "Faz o pedido", texto: "Vai direto para o balcão de cada loja, e a entrega aparece aqui." },
];

/** A partir de quantas cotações a busca aparece: antes disso, a lista cabe na tela. */
const BUSCA_A_PARTIR_DE = 6;

type Grupo = "VOCE" | "ANDAMENTO" | "CONCLUIDA";
type Tom = "acao" | "andamento" | "chegou" | "inerte";

/** O que a linha diz: a situação em palavras e, quando é com a oficina, o próximo passo. */
type Leitura = { grupo: Grupo; tom: Tom; situacao: string; acao?: string; lojas?: boolean };

const nomes = (lista: string[]) =>
  lista.length <= 1 ? (lista[0] ?? "") : `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;

function lerCotacao(c: CotacaoVista): Leitura {
  const etapa = etapaDa(c);
  const responderam = c.envios.filter((e) => e.respondidaEm).length;
  const respostas = `${responderam} de ${c.envios.length} ${c.envios.length === 1 ? "loja respondeu" : "lojas responderam"}`;

  // Primeiro o que é com a oficina, na ordem do que trava mais.
  if (etapa === "CONFERIR") {
    const quem = nomes(enviosDoPedido(c).filter(aConferir).map((e) => e.lojaNome));
    return { grupo: "VOCE", tom: "acao", situacao: `Entregue por ${quem}`, acao: "Confirmar que chegou" };
  }
  const devolucao = c.devolucoes.find(oficinaPrecisaAgir);
  if (devolucao) {
    return { grupo: "VOCE", tom: "acao", situacao: oQueFaltaNaDevolucao(devolucao), acao: "Ver devolução" };
  }
  if (etapa === "RESPONDIDA") {
    return { grupo: "VOCE", tom: "acao", situacao: respostas, acao: "Escolher as peças", lojas: true };
  }
  const comMensagem = c.envios.filter((e) => e.naoLidas > 0);

  let leitura: Leitura;
  switch (etapa) {
    case "AGUARDANDO":
      // As bolinhas ao lado mostram quais lojas faltam; o texto só diz quantas.
      leitura = {
        grupo: "ANDAMENTO",
        tom: "andamento",
        situacao: `Esperando as lojas · ${responderam} de ${c.envios.length}`,
        lojas: true,
      };
      break;
    case "ORCAMENTO":
      leitura = { grupo: "ANDAMENTO", tom: "andamento", situacao: "Orçamento com o cliente, esperando ele aprovar" };
      break;
    case "PEDIDO": {
      // Uma loja: "Separando". Várias: "Yoshio: Separando · Bom Preço: Saiu com o motoboy".
      const doPedido = enviosDoPedido(c).filter((e) => e.entrega && !e.oficinaRecebeuEm);
      const situacao =
        doPedido.length === 1
          ? rotuloDaEntrega(doPedido[0].entrega!)
          : doPedido.map((e) => `${e.lojaNome}: ${rotuloDaEntrega(e.entrega!)}`).join(" · ") || "Peças a caminho";
      leitura = { grupo: "ANDAMENTO", tom: "chegou", situacao };
      break;
    }
    case "DEVOLUCAO": {
      const aberta = c.devolucoes.find(devolucaoAberta);
      leitura = {
        grupo: "ANDAMENTO",
        tom: "andamento",
        situacao: aberta ? `Devolução: ${oQueFaltaNaDevolucao(aberta)}` : "Devolução em andamento",
      };
      break;
    }
    default:
      leitura = { grupo: "CONCLUIDA", tom: "inerte", situacao: "Peças entregues" };
  }

  // Mensagem nova da loja também é com a oficina, mesmo com o resto andando sozinho.
  if (comMensagem.length > 0 && leitura.grupo !== "CONCLUIDA") {
    return {
      ...leitura,
      grupo: "VOCE",
      acao: "Ler mensagem",
      situacao: `Mensagem nova de ${nomes(comMensagem.map((e) => e.lojaNome))}`,
      tom: "acao",
      lojas: false,
    };
  }
  return leitura;
}

/** Procura pelo que o mecânico lembra: placa, carro, número ou uma peça. */
function combina(c: CotacaoVista, termo: string) {
  const t = termo.trim().toLowerCase();
  if (!t) return true;
  const placa = normalizarPlaca(t);
  if (placa && c.veiculo.placa && normalizarPlaca(c.veiculo.placa).includes(placa)) return true;
  if (String(c.numero) === t.replace(/^(n[ºo°]?|#)\s*/, "")) return true;
  const texto = [descricaoDoVeiculo(c.veiculo), c.veiculo.motor, c.clienteNome ?? "", ...c.pecas.map((p) => p.descricao)]
    .join(" ")
    .toLowerCase();
  return t.split(/\s+/).every((parte) => texto.includes(parte));
}

export function ListaCotacoes() {
  const passos = useUsaBoxOS() ? PASSOS_COM_BOXOS : PASSOS_SEM_BOXOS;
  const { dados: cotacoes, semConexao } = useAoVivo<CotacaoVista[]>("/api/peca-peca/cotacoes", 5000);
  const { dados: daOficina, carregar: recarregarLojas } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojas = daOficina?.lojas ?? null;

  const [busca, setBusca] = useState("");
  const [verConcluidas, setVerConcluidas] = useState(false);

  const lidas = useMemo(() => (cotacoes ?? []).map((c) => ({ c, l: lerCotacao(c) })), [cotacoes]);
  const filtradas = busca.trim() ? lidas.filter(({ c }) => combina(c, busca)) : lidas;
  const doGrupo = (g: Grupo) => filtradas.filter(({ l }) => l.grupo === g);
  const paraVoce = doGrupo("VOCE");
  const andamento = doGrupo("ANDAMENTO");
  const concluidas = doGrupo("CONCLUIDA");

  // A cotação que acabou de subir para "Precisa de você" (a loja respondeu, a peça
  // chegou) entra com movimento: é a novidade da tela. Na primeira carga, nada se mexe.
  const chegaram = useChegadas(cotacoes ? lidas.filter(({ l }) => l.grupo === "VOCE").map(({ c }) => c.id) : null);

  const total = cotacoes?.length ?? 0;
  const resumo =
    cotacoes && total > 0
      ? [
          paraVoce.length > 0 && !busca
            ? `${paraVoce.length} ${paraVoce.length === 1 ? "precisa" : "precisam"} de você`
            : !busca && "Nada esperando você agora",
          andamento.length > 0 && !busca && `${andamento.length} em andamento`,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Cabecalho
        titulo="Cotações"
        subtitulo={resumo}
        acao={
          <BotaoLink href="/peca-peca/nova" className="aperta">
            <Mais tamanho={16} />
            Nova cotação
          </BotaoLink>
        }
      />

      <AvisoSemConexao ativo={semConexao} />
      {daOficina && (!daOficina.cidade || !daOficina.estado) && (
        <InformarCidade cidadeAtual={daOficina.cidade} onSalva={recarregarLojas} />
      )}

      {!cotacoes ? (
        <EsqueletoLista linhas={4} />
      ) : total === 0 ? (
        <>
          <Vazio
            titulo="Nenhuma cotação ainda"
            texto="Diga o carro e as peças que precisa. A cotação vai para as lojas que atendem a sua cidade."
            acao={<BotaoLink href="/peca-peca/nova">Fazer a primeira cotação</BotaoLink>}
          />
          <ComoFunciona passos={passos} aberto />
        </>
      ) : (
        <>
          {total >= BUSCA_A_PARTIR_DE && <CampoBusca valor={busca} onChange={setBusca} />}

          {busca.trim() && filtradas.length === 0 && (
            <p className="text-sm text-tinta-3">Nenhuma cotação com &quot;{busca.trim()}&quot;.</p>
          )}

          {paraVoce.length > 0 && (
            <Secao titulo="Precisa de você" total={paraVoce.length} destaque>
              {paraVoce.map(({ c, l }) => (
                <Linha key={c.id} cotacao={c} leitura={l} chegou={chegaram.has(c.id)} />
              ))}
            </Secao>
          )}

          {andamento.length > 0 && (
            <Secao titulo="Em andamento" total={andamento.length}>
              {andamento.map(({ c, l }) => (
                <Linha key={c.id} cotacao={c} leitura={l} />
              ))}
            </Secao>
          )}

          {concluidas.length > 0 && (
            <Secao
              titulo="Concluídas"
              total={concluidas.length}
              // Buscando, mostra tudo o que achou: esconder seria achar e não mostrar.
              aberta={verConcluidas || !!busca.trim()}
              onAlternar={busca.trim() ? undefined : () => setVerConcluidas((v) => !v)}
            >
              {concluidas.map(({ c, l }) => (
                <Linha key={c.id} cotacao={c} leitura={l} />
              ))}
            </Secao>
          )}

          <div className="space-y-2 pt-2">
            <PainelLojas lojas={lojas} cidade={daOficina?.cidade ?? null} />
            <ComoFunciona passos={passos} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Ids que entraram num grupo desde a última atualização. Fica vazio na primeira carga
 * (nada é novidade quando a tela acabou de abrir) e se limpa sozinho depois da animação.
 */
function useChegadas(ids: string[] | null) {
  const vistos = useRef<Set<string> | null>(null);
  const [chegaram, setChegaram] = useState<Set<string>>(() => new Set());
  const chave = ids?.join(",") ?? null;
  useEffect(() => {
    if (chave === null) return;
    const atuais = new Set(chave ? chave.split(",") : []);
    const antes = vistos.current;
    vistos.current = atuais;
    if (!antes) return;
    const novos = [...atuais].filter((id) => !antes.has(id));
    if (novos.length === 0) return;
    setChegaram(new Set(novos));
    const t = setTimeout(() => setChegaram(new Set()), 1200);
    return () => clearTimeout(t);
  }, [chave]);
  return chegaram;
}

function CampoBusca({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <label className="relative block">
      <span className="sr-only">Buscar cotação</span>
      <Busca tamanho={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-3" />
      <input
        type="search"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onChange("")}
        placeholder="Placa, carro, peça ou nº"
        className="min-h-12 w-full rounded-xl border border-linha bg-superficie pl-11 pr-11 text-base text-tinta placeholder:text-tinta-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpar busca"
          className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-tinta-3 hover:bg-superficie-2 hover:text-tinta"
        >
          <Fechar tamanho={16} />
        </button>
      )}
    </label>
  );
}

function Secao({
  titulo,
  total,
  destaque = false,
  aberta = true,
  onAlternar,
  children,
}: {
  titulo: string;
  total: number;
  destaque?: boolean;
  aberta?: boolean;
  /** Com ele, o título vira botão de abrir e fechar. */
  onAlternar?: () => void;
  children: React.ReactNode;
}) {
  const cabeca = (
    <>
      <span className={cn("font-semibold", destaque ? "text-tinta" : "text-tinta-2")}>{titulo}</span>
      <span
        className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums",
          destaque ? "bg-[rgb(var(--gr-sem-resposta))] text-[rgb(20_14_0)]" : "bg-superficie-3 text-tinta-2"
        )}
      >
        {total}
      </span>
    </>
  );
  return (
    <section className="space-y-2">
      {onAlternar ? (
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={aberta}
          className="flex min-h-11 w-full items-center gap-2 text-left"
        >
          {cabeca}
          <span className="ml-auto inline-flex items-center gap-1 text-sm text-tinta-3">
            {aberta ? "Esconder" : "Mostrar"}
            <Chevron
              tamanho={16}
              className={cn("transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]", aberta && "rotate-180")}
            />
          </span>
        </button>
      ) : (
        <h2 className="flex items-center gap-2">{cabeca}</h2>
      )}
      {aberta && (
        <ul
          className={cn(
            "divide-y divide-linha overflow-hidden rounded-xl border bg-superficie",
            destaque ? "border-[rgb(var(--gr-sem-resposta)/0.45)]" : "border-linha",
            onAlternar && "linha-entra"
          )}
        >
          {children}
        </ul>
      )}
    </section>
  );
}

const PONTO: Record<Tom, string> = {
  acao: "bg-[rgb(var(--gr-sem-resposta))]",
  andamento: "bg-brand-600",
  chegou: "bg-[rgb(var(--gr-vendida))]",
  inerte: "bg-linha-forte",
};

function Linha({ cotacao: c, leitura: l, chegou = false }: { cotacao: CotacaoVista; leitura: Leitura; chegou?: boolean }) {
  const naoLidas = c.envios.reduce((s, e) => s + e.naoLidas, 0);
  const concluida = l.grupo === "CONCLUIDA";
  return (
    <li className={cn(chegou && "linha-chega")}>
      <Link
        href={`/peca-peca/${c.id}`}
        className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-superficie-2 focus-visible:bg-superficie-2 focus-visible:outline-none"
      >
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2">
            <span className={cn("truncate font-semibold", concluida ? "text-tinta-2" : "text-tinta")}>
              {descricaoDoVeiculo(c.veiculo)}
            </span>
            {c.veiculo.placa && <Placa placa={c.veiculo.placa} />}
            {naoLidas > 0 && <ContadorDeMensagens total={naoLidas} className="shrink-0" />}
          </p>

          <p className={cn("mt-1 flex items-start gap-2 text-sm", concluida ? "text-tinta-3" : "text-tinta-2")}>
            <span aria-hidden="true" className={cn("mt-[0.45rem] h-2 w-2 shrink-0 rounded-full", PONTO[l.tom])} />
            <span className="min-w-0">{l.situacao}</span>
            {l.lojas && <PontosDasLojas cotacao={c} />}
          </p>

          <p className="mt-1 text-xs text-tinta-3">
            <span className="font-pecapeca font-bold">nº {c.numero}</span>
            {" · "}
            {c.pecas.length} {c.pecas.length === 1 ? "peça" : "peças"}
            {" · "}
            {haQuanto(c.criadaEm)}
          </p>

          {l.acao && (
            <span className="mt-2.5 inline-flex min-h-9 items-center gap-1 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-brand-fg transition-colors group-hover:bg-brand-700 sm:hidden">
              {l.acao}
              <Avancar tamanho={16} />
            </span>
          )}
        </div>

        {l.acao ? (
          <span className="hidden min-h-9 shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-brand-fg transition-colors group-hover:bg-brand-700 sm:inline-flex">
            {l.acao}
            <Avancar tamanho={16} />
          </span>
        ) : (
          <Avancar
            tamanho={18}
            className="shrink-0 text-tinta-3 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5"
          />
        )}
      </Link>
    </li>
  );
}

/** Uma bolinha por loja: cheia quando respondeu. Enche na hora em que a resposta chega. */
function PontosDasLojas({ cotacao: c }: { cotacao: CotacaoVista }) {
  if (c.envios.length < 2) return null;
  return (
    <span className="mt-[0.4rem] inline-flex shrink-0 gap-1" aria-hidden="true">
      {c.envios.map((e) => (
        <span
          key={e.id}
          title={`${e.lojaNome}: ${e.respondidaEm ? "respondeu" : "ainda não respondeu"}`}
          className={cn(
            "h-2.5 w-2.5 rounded-full border transition-[background-color,border-color,transform] duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
            e.respondidaEm ? "scale-100 border-brand-600 bg-brand-600" : "scale-90 border-linha-forte bg-transparent"
          )}
        />
      ))}
    </span>
  );
}

/** A placa como ela é: letras em caixa alta dentro de uma moldura fina. */
function Placa({ placa }: { placa: string }) {
  return (
    <span className="shrink-0 rounded-[3px] border border-linha-forte px-1.5 text-[11px] font-semibold uppercase leading-[18px] tracking-[0.08em] text-tinta-2">
      {placa}
    </span>
  );
}

/** Dobra de informação que não muda de um dia para o outro: fechada até a pessoa abrir. */
function Dobra({ titulo, aberto = false, children }: { titulo: React.ReactNode; aberto?: boolean; children: React.ReactNode }) {
  return (
    <details open={aberto} className="group/dobra rounded-xl border border-linha bg-superficie">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold text-tinta-2 hover:text-tinta [&::-webkit-details-marker]:hidden">
        {titulo}
        <Chevron
          tamanho={16}
          className="ml-auto text-tinta-3 transition-transform duration-200 group-open/dobra:rotate-180"
        />
      </summary>
      <div className="border-t border-linha px-4 py-3">{children}</div>
    </details>
  );
}

/** As autopeças que recebem as cotações da oficina. */
function PainelLojas({ lojas, cidade }: { lojas: LojaVista[] | null; cidade: string | null }) {
  return (
    <Dobra
      titulo={
        <>
          {cidade ? `Lojas que atendem ${cidade}` : "Lojas"}
          {lojas && <span className="font-normal text-tinta-3">· {lojas.length}</span>}
        </>
      }
    >
      <p className="mb-2 text-xs text-tinta-3">
        É para elas que vão as cotações. Cada loja só vê o que foi mandado para ela, nunca o preço da outra.
      </p>
      {!lojas ? (
        <EsqueletoLista linhas={2} />
      ) : lojas.length === 0 ? (
        <p className="text-sm text-tinta-3">
          Nenhuma autopeça que atende {cidade ?? "a oficina"} está no Peça Peça ainda. Estamos chegando a novas
          cidades — a sua já está na nossa lista.
        </p>
      ) : (
        <ul className="divide-y divide-linha">
          {lojas.map((l) => (
            <li key={l.id} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-tinta">{l.nome}</p>
              <p className="text-xs text-tinta-3">
                {l.cidade ?? "Cidade não informada"}, entrega em {prazoDaLoja(l)}
              </p>
              <p className="text-xs text-tinta-3">Atende: {l.atende.join(", ") || "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </Dobra>
  );
}

function ComoFunciona({ passos, aberto = false }: { passos: { titulo: string; texto: string }[]; aberto?: boolean }) {
  return (
    <Dobra titulo="Como funciona" aberto={aberto}>
      {/* Sequência de verdade, então os números ficam: na Baloo, numa folha só. */}
      <ol className="space-y-3">
        {passos.map((p, i) => (
          <li key={p.titulo} className="flex gap-3">
            <span className="w-5 shrink-0 font-pecapeca text-xl font-extrabold leading-none text-brand-600">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-tinta">{p.titulo}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-tinta-3">{p.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Dobra>
  );
}
