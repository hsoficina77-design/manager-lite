"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Aviso, CampoDinheiro, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { useAvisar } from "@/components/ui/Avisos";
import { Confere, Lixeira, Mais } from "@/components/ui/Icones";
import {
  ETAPAS_ENTREGA,
  LOJAS,
  atualizarCotacao,
  descricaoDoVeiculo,
  escolhaDa,
  nomeDaLoja,
  responder,
  respostaSimulada,
  type Cotacao,
  type LojaId,
  type Oferta,
} from "./dados";
import { useCotacoes, useHidratado } from "./hooks";
import { AlternarVisao, AvisoDaPrevia, Cabecalho, haQuanto, horaCurta } from "./ui";

const AVISO_LOJA = (
  <>
    <span className="font-semibold text-tinta-2">Esta é a tela da loja.</span> Aqui você faz o papel do balconista:
    confere a aplicação e responde com marca, preço e prazo. A loja não vê o preço da concorrente nem os clientes
    da oficina.
  </>
);

function TrocarLoja({ atual, cotacaoId }: { atual: LojaId; cotacaoId?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LOJAS.map((l) => (
        <Link
          key={l.id}
          href={cotacaoId ? `/peca-peca/loja/${cotacaoId}?l=${l.id}` : `/peca-peca/loja?l=${l.id}`}
          aria-current={l.id === atual ? "page" : undefined}
          className={cn(
            "flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
            l.id === atual
              ? "border-brand-500 bg-brand-50 text-tinta"
              : "border-linha bg-superficie text-tinta-3 hover:text-tinta"
          )}
        >
          {l.nome}
        </Link>
      ))}
    </div>
  );
}

// ─── Caixa de entrada da loja ───────────────────────────────────────────────

export function PainelLoja({ loja, oficina }: { loja: LojaId; oficina: string }) {
  const cotacoes = useCotacoes();
  const hidratado = useHidratado();

  const recebidas = cotacoes.filter((c) => c.lojas.includes(loja));
  const novas = recebidas.filter((c) => !c.respostas[loja]);
  const pedidos = recebidas.filter((c) => c.pedido?.entregas[loja]);
  const respondidas = recebidas.filter((c) => c.respostas[loja] && !c.pedido?.entregas[loja]);
  const fechadas = recebidas.filter((c) => c.pedido);
  const ganhas = fechadas.filter((c) => c.pedido?.entregas[loja]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Cabecalho
        titulo={`Painel da ${nomeDaLoja(loja)}`}
        subtitulo="O que o balconista vê no computador do balcão ou no celular."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AlternarVisao atual="loja" />
        <TrocarLoja atual={loja} />
      </div>

      <AvisoDaPrevia>{AVISO_LOJA}</AvisoDaPrevia>

      {!hidratado ? (
        <EsqueletoLista linhas={3} />
      ) : recebidas.length === 0 ? (
        <Vazio
          titulo="Nenhum pedido de cotação"
          texto={`Crie uma cotação na visão da oficina e mande para a ${nomeDaLoja(loja)}. Ela aparece aqui na hora.`}
          acao={<BotaoLink href="/peca-peca/nova">Criar cotação</BotaoLink>}
        />
      ) : (
        <>
          {fechadas.length > 0 && (
            <p className="rounded-xl border border-linha bg-superficie px-4 py-3 text-sm text-tinta-2">
              A {nomeDaLoja(loja)} fechou <strong className="text-tinta">{ganhas.length}</strong> de{" "}
              {fechadas.length} {fechadas.length === 1 ? "cotação decidida" : "cotações decididas"}. Na versão final,
              o dono vê aqui por que perdeu as outras: preço ou prazo.
            </p>
          )}

          <Lista titulo="Para responder" vazio="Nada esperando resposta." itens={novas}>
            {(c) => (
              <LinhaCotacao c={c} oficina={oficina} href={`/peca-peca/loja/${c.id}?l=${loja}`}>
                <span className="status status-peca">Responder</span>
              </LinhaCotacao>
            )}
          </Lista>

          {pedidos.length > 0 && (
            <Secao titulo="Pedidos para separar">
              <div className="space-y-3">
                {pedidos.map((c) => (
                  <PedidoDaLoja key={c.id} c={c} loja={loja} oficina={oficina} />
                ))}
              </div>
            </Secao>
          )}

          <Lista titulo="Respondidas" vazio="Nenhuma resposta enviada ainda." itens={respondidas}>
            {(c) => (
              <LinhaCotacao c={c} oficina={oficina} href={`/peca-peca/loja/${c.id}?l=${loja}`}>
                <span className={c.pedido ? "status status-inerte" : "status status-andamento"}>
                  {c.pedido ? "Fechou com outra loja" : c.orcamento ? "Com o cliente da oficina" : "Oficina decidindo"}
                </span>
              </LinhaCotacao>
            )}
          </Lista>
        </>
      )}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-tinta">{titulo}</h2>
      {children}
    </section>
  );
}

function Lista({
  titulo,
  vazio,
  itens,
  children,
}: {
  titulo: string;
  vazio: string;
  itens: Cotacao[];
  children: (c: Cotacao) => React.ReactNode;
}) {
  return (
    <Secao titulo={titulo}>
      {itens.length === 0 ? (
        <p className="text-sm text-tinta-3">{vazio}</p>
      ) : (
        <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
          {itens.map((c) => (
            <div key={c.id}>{children(c)}</div>
          ))}
        </div>
      )}
    </Secao>
  );
}

function LinhaCotacao({
  c,
  oficina,
  href,
  children,
}: {
  c: Cotacao;
  oficina: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-3"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-tinta">
          {oficina} · {descricaoDoVeiculo(c.veiculo)}
          {c.veiculo.motor && <span className="text-tinta-3"> · {c.veiculo.motor}</span>}
        </p>
        <p className="truncate text-xs text-tinta-3">
          {c.pecas.length} {c.pecas.length === 1 ? "peça" : "peças"} · chegou {haQuanto(c.criadaEm)}
        </p>
      </div>
      <div>{children}</div>
    </Link>
  );
}

function PedidoDaLoja({ c, loja, oficina }: { c: Cotacao; loja: LojaId; oficina: string }) {
  const etapa = c.pedido?.entregas[loja] ?? "ENVIADO";
  const posicao = ETAPAS_ENTREGA.findIndex((e) => e.value === etapa);
  const proxima = ETAPAS_ENTREGA[posicao + 1];
  const pecas = c.pecas.filter((p) => escolhaDa(c, p.id)?.lojaId === loja);

  function avancar() {
    if (!proxima) return;
    atualizarCotacao(c.id, (x) => ({
      ...x,
      pedido: { ...x.pedido!, entregas: { ...x.pedido!.entregas, [loja]: proxima.value } },
    }));
  }

  return (
    <div className="rounded-xl border border-linha bg-superficie p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-tinta">
            {oficina} · {descricaoDoVeiculo(c.veiculo)}
          </p>
          <p className="text-xs text-tinta-3">Pedido às {horaCurta(c.pedido!.feitoEm)}</p>
        </div>
        {proxima ? (
          <Botao variante="contraste" tamanho="denso" onClick={avancar}>
            Marcar: {proxima.rotulo.toLowerCase()}
          </Botao>
        ) : (
          <span className="status status-entregue">Entregue</span>
        )}
      </div>
      <ul className="mt-2 space-y-0.5 text-sm text-tinta-2">
        {pecas.map((p) => (
          <li key={p.id}>
            {p.quantidade}× {p.descricao} <span className="text-tinta-3">({escolhaDa(c, p.id)?.marca})</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-tinta-3">
        Agora: <span className="font-medium text-tinta-2">{ETAPAS_ENTREGA[posicao].rotulo}</span>
      </p>
    </div>
  );
}

// ─── Responder uma cotação ──────────────────────────────────────────────────

type OfertaEmEdicao = { id: string; marca: string; preco: string; prazo: string };
type Rascunho = Record<string, { naoTem: boolean; ofertas: OfertaEmEdicao[] }>;

export function ResponderCotacao({ id, loja, oficina }: { id: string; loja: LojaId; oficina: string }) {
  const cotacoes = useCotacoes();
  const hidratado = useHidratado();
  const c = cotacoes.find((x) => x.id === id);

  if (!hidratado) {
    return (
      <div className="p-4 sm:p-6">
        <EsqueletoLista linhas={4} />
      </div>
    );
  }

  if (!c || !c.lojas.includes(loja)) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <Cabecalho titulo="Cotação não encontrada" voltar={`/peca-peca/loja?l=${loja}`} />
        <Vazio
          titulo={c ? `Esta cotação não foi enviada para a ${nomeDaLoja(loja)}` : "Essa cotação não está neste aparelho"}
          acao={<BotaoLink href={`/peca-peca/loja?l=${loja}`}>Voltar ao painel</BotaoLink>}
        />
      </div>
    );
  }

  // A chave refaz o formulário ao trocar de loja pelo seletor, sem herdar o rascunho da outra.
  return <FormResposta key={`${c.id}-${loja}`} c={c} loja={loja} oficina={oficina} />;
}

let contador = 0;
const idLocal = () => `nova-${Date.now()}-${(contador += 1)}`;

function rascunhoDe(itens: Record<string, Oferta[]>, c: Cotacao): Rascunho {
  return Object.fromEntries(
    c.pecas.map((p) => {
      const ofertas = itens[p.id] ?? [];
      return [
        p.id,
        {
          naoTem: p.id in itens && ofertas.length === 0,
          ofertas: ofertas.map((o) => ({ id: o.id, marca: o.marca, preco: String(o.preco), prazo: String(o.prazoMin) })),
        },
      ];
    })
  );
}

function FormResposta({ c, loja, oficina }: { c: Cotacao; loja: LojaId; oficina: string }) {
  const avisar = useAvisar();
  const prazoPadrao = String(LOJAS.find((l) => l.id === loja)!.entrega[0]);
  const vazia = (): OfertaEmEdicao => ({ id: idLocal(), marca: "", preco: "", prazo: prazoPadrao });

  const [rascunho, setRascunho] = useState<Rascunho>(() => {
    const anterior = c.respostas[loja];
    if (anterior) return rascunhoDe(anterior.itens, c);
    return Object.fromEntries(c.pecas.map((p) => [p.id, { naoTem: false, ofertas: [vazia()] }]));
  });
  const [erro, setErro] = useState("");
  const [enviada, setEnviada] = useState(false);

  // A oficina já gerou o orçamento: mexer na resposta agora não mudaria mais nada.
  const fechada = Boolean(c.orcamento);

  function mudarOferta(pecaId: string, ofertaId: string, campo: keyof OfertaEmEdicao, valor: string) {
    setRascunho((r) => ({
      ...r,
      [pecaId]: {
        ...r[pecaId],
        ofertas: r[pecaId].ofertas.map((o) => (o.id === ofertaId ? { ...o, [campo]: valor } : o)),
      },
    }));
  }

  function adicionarOferta(pecaId: string) {
    setRascunho((r) => ({ ...r, [pecaId]: { naoTem: false, ofertas: [...r[pecaId].ofertas, vazia()] } }));
  }

  function tirarOferta(pecaId: string, ofertaId: string) {
    setRascunho((r) => ({
      ...r,
      [pecaId]: { ...r[pecaId], ofertas: r[pecaId].ofertas.filter((o) => o.id !== ofertaId) },
    }));
  }

  function alternarNaoTem(pecaId: string, naoTem: boolean) {
    setRascunho((r) => ({
      ...r,
      [pecaId]: { naoTem, ofertas: naoTem ? [] : r[pecaId].ofertas.length ? r[pecaId].ofertas : [vazia()] },
    }));
  }

  function enviar() {
    const itens: Record<string, Oferta[]> = {};
    for (const p of c.pecas) {
      const r = rascunho[p.id];
      if (r.naoTem) {
        itens[p.id] = [];
        continue;
      }
      const ofertas = r.ofertas.filter((o) => o.marca.trim() || Number(o.preco) > 0);
      if (ofertas.length === 0 || ofertas.some((o) => !o.marca.trim() || !(Number(o.preco) > 0))) {
        setErro(`"${p.descricao}": informe marca e preço, ou marque que não tem.`);
        return;
      }
      itens[p.id] = ofertas.map((o) => ({
        id: o.id,
        marca: o.marca.trim(),
        preco: Number(o.preco),
        prazoMin: Math.max(0, Number(o.prazo) || 0),
      }));
    }
    setErro("");
    responder(c.id, loja, itens);
    avisar("Resposta enviada para a oficina");
    setEnviada(true);
  }

  const cabecalho = (
    <>
      <Cabecalho
        titulo={`Cotação de ${oficina}`}
        voltar={`/peca-peca/loja?l=${loja}`}
        subtitulo={`Chegou às ${horaCurta(c.criadaEm)} · respondendo como ${nomeDaLoja(loja)}`}
      />
      <TrocarLoja atual={loja} cotacaoId={c.id} />
    </>
  );

  if (enviada) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
        {cabecalho}
        <div className="space-y-3 rounded-xl border border-ok-linha bg-ok-fraco p-5">
          <p className="flex items-center gap-2 font-semibold text-ok">
            <Confere tamanho={18} />
            Resposta enviada
          </p>
          <p className="text-sm text-tinta-2">
            A oficina já vê os preços da {nomeDaLoja(loja)} ao lado das outras lojas. Se ela fechar com você, o
            pedido aparece em &ldquo;Pedidos para separar&rdquo;.
          </p>
          <div className="flex flex-wrap gap-2">
            <BotaoLink href={`/peca-peca/${c.id}`} variante="sucesso">
              Ver como a oficina recebeu
            </BotaoLink>
            <BotaoLink href={`/peca-peca/loja?l=${loja}`} variante="secundario">
              Voltar ao painel da loja
            </BotaoLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      {cabecalho}
      <AvisoDaPrevia>{AVISO_LOJA}</AvisoDaPrevia>

      {/* O que o balconista precisa para conferir a aplicação — e nada da oficina além do nome. */}
      <Painel titulo="Veículo">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ["Placa", c.veiculo.placa || "—"],
            ["Marca", c.veiculo.marca || "—"],
            ["Modelo e ano", [c.veiculo.modelo, c.veiculo.ano].filter(Boolean).join(" ") || "—"],
            ["Motor", c.veiculo.motor || "não informado"],
          ].map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-xs text-tinta-3">{rotulo}</dt>
              <dd className={cn("font-medium text-tinta", rotulo === "Placa" && "font-mono tracking-widest")}>
                {valor}
              </dd>
            </div>
          ))}
        </dl>
      </Painel>

      {fechada ? (
        <Aviso tipo="atencao">A oficina já fechou esta cotação. A resposta não pode mais mudar.</Aviso>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-tinta-3">Mais de uma marca? Mande as duas: a oficina escolhe.</p>
          <Botao
            variante="secundario"
            tamanho="denso"
            onClick={() => setRascunho(rascunhoDe(respostaSimulada(c, loja), c))}
          >
            Preencher com sugestão
          </Botao>
        </div>
      )}

      {c.pecas.map((p) => {
        const r = rascunho[p.id];
        return (
          <Painel key={p.id} titulo={`${p.quantidade}× ${p.descricao}`}>
            <label className="mb-3 flex min-h-9 w-fit cursor-pointer items-center gap-2 text-sm text-tinta-2">
              <input
                type="checkbox"
                checked={r.naoTem}
                disabled={fechada}
                onChange={(e) => alternarNaoTem(p.id, e.target.checked)}
                className="h-5 w-5 accent-brand-600"
              />
              Não tenho esta peça
            </label>

            {!r.naoTem && (
              <div className="space-y-2">
                {r.ofertas.map((o) => (
                  <div key={o.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:grid-cols-[1fr_8rem_6rem_auto]">
                    <Entrada
                      value={o.marca}
                      onChange={(e) => mudarOferta(p.id, o.id, "marca", e.target.value)}
                      placeholder="Marca (ex.: Cobreq)"
                      aria-label="Marca"
                      disabled={fechada}
                      className="col-span-3 sm:col-span-1"
                    />
                    <CampoDinheiro
                      valor={o.preco}
                      onChange={(v) => mudarOferta(p.id, o.id, "preco", v)}
                      placeholder="Preço R$"
                      aria-label="Preço unitário"
                      disabled={fechada}
                    />
                    <div className="relative">
                      <Entrada
                        value={o.prazo}
                        onChange={(e) => mudarOferta(p.id, o.id, "prazo", e.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        aria-label="Prazo de entrega em minutos"
                        disabled={fechada}
                        className="pr-10 text-right tabular-nums"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-tinta-3">
                        min
                      </span>
                    </div>
                    <Botao
                      variante="fantasma"
                      tamanho="icone"
                      onClick={() => tirarOferta(p.id, o.id)}
                      disabled={fechada || r.ofertas.length === 1}
                      aria-label="Tirar esta marca"
                      className="text-perigo"
                    >
                      <Lixeira tamanho={16} />
                    </Botao>
                  </div>
                ))}
                {!fechada && (
                  <Botao variante="fantasma" tamanho="denso" onClick={() => adicionarOferta(p.id)}>
                    <Mais tamanho={14} />
                    Outra marca
                  </Botao>
                )}
              </div>
            )}
          </Painel>
        );
      })}

      {erro && <Aviso>{erro}</Aviso>}

      {!fechada && (
        <div className="flex justify-end">
          <Botao onClick={enviar} className="w-full sm:w-auto">
            {c.respostas[loja] ? "Enviar resposta corrigida" : "Enviar resposta para a oficina"}
          </Botao>
        </div>
      )}
    </div>
  );
}
