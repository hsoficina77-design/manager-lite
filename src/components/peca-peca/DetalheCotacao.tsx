"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Aviso, Campo, Entrada, CampoDinheiro } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { Modal } from "@/components/ui/Modal";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Confere } from "@/components/ui/Icones";
import {
  ETAPAS_ENTREGA,
  atualizarCotacao,
  descricaoDoVeiculo,
  escolhaDa,
  escolhasMaisBaratas,
  etapaDa,
  excluirCotacao,
  lojasSemAPeca,
  nomeDaLoja,
  ofertasDa,
  precoDeVenda,
  responder,
  respostaSimulada,
  totaisDa,
  type Cotacao,
  type EtapaEntrega,
  type LojaId,
} from "./dados";
import { useCotacoes, useHidratado } from "./hooks";
import { Cabecalho, PilulaEtapa, horaCurta } from "./ui";

export function DetalheCotacao({ id }: { id: string }) {
  const cotacoes = useCotacoes();
  const hidratado = useHidratado();
  const cotacao = cotacoes.find((c) => c.id === id);

  if (!hidratado) {
    return (
      <div className="p-4 sm:p-6">
        <EsqueletoLista linhas={4} />
      </div>
    );
  }

  if (!cotacao) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <Cabecalho titulo="Cotação não encontrada" voltar="/peca-peca" />
        <Vazio
          titulo="Essa cotação não está neste aparelho"
          texto="Na prévia, cada cotação fica guardada só no aparelho em que foi criada."
          acao={<BotaoLink href="/peca-peca">Ver cotações</BotaoLink>}
        />
      </div>
    );
  }

  return <Conteudo c={cotacao} />;
}

const LINHA_DO_TEMPO = ["Enviada", "Lojas responderam", "Orçamento", "Pedido", "Entregue"];
const POSICAO = { AGUARDANDO: 0, RESPONDIDA: 1, ORCAMENTO: 2, PEDIDO: 3, ENTREGUE: 4 } as const;

function Conteudo({ c }: { c: Cotacao }) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const [gerando, setGerando] = useState(false);

  const posicao = POSICAO[etapaDa(c)];
  const pendentes = c.lojas.filter((l) => !c.respostas[l]);
  const respondeu = c.lojas.length > pendentes.length;
  // Depois do orçamento, mudar a escolha faria a cotação contar uma história e o
  // orçamento outra.
  const travado = Boolean(c.orcamento);

  async function excluir() {
    const ok = await confirmar({
      titulo: `Excluir a cotação #${c.numero}?`,
      texto: c.orcamento
        ? `Sai só daqui. O orçamento #${c.orcamento.numero} continua no boxOS.`
        : "Sai só deste aparelho.",
      acao: "Excluir cotação",
      perigo: true,
    });
    if (!ok) return;
    excluirCotacao(c.id);
    router.push("/peca-peca");
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Cabecalho
        titulo={`Cotação #${c.numero}`}
        voltar="/peca-peca"
        subtitulo={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              {descricaoDoVeiculo(c.veiculo)}
              {c.veiculo.motor && ` · ${c.veiculo.motor}`}
            </span>
            {c.veiculo.placa && (
              <span className="rounded border border-linha-forte bg-superficie px-1.5 font-mono text-xs tracking-widest text-tinta-2">
                {c.veiculo.placa}
              </span>
            )}
            {c.veiculo.clienteNome && <span>· {c.veiculo.clienteNome}</span>}
          </span>
        }
        acao={<PilulaEtapa cotacao={c} />}
      />

      {/* Onde a cotação está no caminho até virar OS. */}
      <ol className="grid grid-cols-5 gap-1">
        {LINHA_DO_TEMPO.map((rotulo, i) => (
          <li key={rotulo} className="min-w-0">
            <div className={cn("h-1.5 rounded-full", i <= posicao ? "bg-brand-600" : "bg-superficie-3")} />
            <p
              className={cn(
                "mt-1.5 text-[0.7rem] leading-tight sm:text-xs",
                i === posicao ? "font-semibold text-tinta" : "text-tinta-3"
              )}
            >
              {rotulo}
            </p>
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Com o orçamento feito, o que importa agora é o pedido: ele sobe. */}
          {c.orcamento && <PainelPedido c={c} />}

          <PainelLojas c={c} pendentes={pendentes} travado={travado} />

          {respondeu ? (
            <PainelEscolha c={c} travado={travado} pendentes={pendentes} />
          ) : (
            <Vazio
              compacto
              titulo="Esperando as lojas"
              texto="Quando o balconista responder, os preços aparecem aqui, lado a lado. Na prévia, você pode responder no lugar dele ou simular."
            />
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6">
          <Resumo c={c} travado={travado} onGerar={() => setGerando(true)} />
          <Botao variante="fantasma" tamanho="denso" onClick={excluir} className="w-full text-perigo">
            Excluir cotação
          </Botao>
        </aside>
      </div>

      {gerando && <ModalOrcamento c={c} onFechar={() => setGerando(false)} />}
    </div>
  );
}

// ─── Lojas ──────────────────────────────────────────────────────────────────

function PainelLojas({ c, pendentes, travado }: { c: Cotacao; pendentes: LojaId[]; travado: boolean }) {
  function simular() {
    for (const l of pendentes) responder(c.id, l, respostaSimulada(c, l));
  }

  return (
    <Painel
      titulo="Lojas"
      ajuda="O balconista confere a aplicação de cada peça antes de responder."
      acao={
        pendentes.length > 0 && (
          <Botao variante="secundario" tamanho="denso" onClick={simular}>
            Simular respostas
          </Botao>
        )
      }
    >
      <ul className="divide-y divide-linha">
        {c.lojas.map((l) => {
          const resposta = c.respostas[l];
          const temQuantas = resposta
            ? c.pecas.filter((p) => (resposta.itens[p.id] ?? []).length > 0).length
            : 0;
          return (
            <li key={l} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  resposta ? "bg-ok" : "animate-pulse bg-atencao"
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tinta">{nomeDaLoja(l)}</p>
                <p className="text-xs text-tinta-3">
                  {resposta
                    ? `Respondeu às ${horaCurta(resposta.respondidaEm)} · tem ${temQuantas} de ${c.pecas.length} peças`
                    : "Esperando o balconista responder"}
                </p>
              </div>
              {!travado && (
                <Link
                  href={`/peca-peca/loja/${c.id}?l=${l}`}
                  className="text-xs font-medium text-brand-texto underline-offset-2 hover:underline"
                >
                  {resposta ? `Mudar resposta da ${nomeDaLoja(l)}` : `Responder como ${nomeDaLoja(l)}`}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </Painel>
  );
}

// ─── Escolha das peças ──────────────────────────────────────────────────────

function PainelEscolha({ c, travado, pendentes }: { c: Cotacao; travado: boolean; pendentes: LojaId[] }) {
  function escolher(pecaId: string, lojaId: LojaId, ofertaId: string) {
    atualizarCotacao(c.id, (x) => ({ ...x, escolhas: { ...x.escolhas, [pecaId]: { lojaId, ofertaId } } }));
  }

  function maisBaratas() {
    atualizarCotacao(c.id, (x) => ({ ...x, escolhas: escolhasMaisBaratas(x) }));
  }

  return (
    <Painel
      titulo={travado ? "Peças escolhidas" : "Escolha as peças"}
      ajuda={travado ? "O orçamento já saiu com estas escolhas." : "Pode misturar: cada peça da loja que for melhor."}
      acao={
        !travado && (
          <Botao variante="secundario" tamanho="denso" onClick={maisBaratas}>
            Menor preço em tudo
          </Botao>
        )
      }
    >
      <div className="space-y-4">
        {c.pecas.map((p) => {
          const escolhida = escolhaDa(c, p.id);
          // Depois do orçamento, as ofertas não escolhidas só alongariam a tela.
          const ofertas = travado ? (escolhida ? [escolhida] : []) : ofertasDa(c, p.id);
          const semAPeca = travado ? [] : lojasSemAPeca(c, p.id);
          const maisRapido = ofertas.length > 1 ? Math.min(...ofertas.map((o) => o.prazoMin)) : null;
          return (
            <div key={p.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-tinta">
                  <span className="text-tinta-3">{p.quantidade}×</span> {p.descricao}
                </p>
                {escolhida && (
                  <span className="shrink-0 text-xs tabular-nums text-tinta-3">
                    {formatCurrency(escolhida.preco * p.quantidade)}
                  </span>
                )}
              </div>

              {ofertas.length === 0 ? (
                <p className="rounded-lg border border-dashed border-linha-forte px-3 py-2 text-xs text-tinta-3">
                  {travado
                    ? "Ficou fora do orçamento."
                    : pendentes.length > 0
                    ? "Ainda sem preço. Falta loja responder."
                    : "Nenhuma loja tem. Na versão final, dá para mandar só esta peça para outras lojas."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {ofertas.map((o, i) => {
                    const marcada = escolhida?.id === o.id;
                    return (
                      <label
                        key={o.id}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                          marcada ? "border-brand-500 bg-brand-50" : "border-linha",
                          travado ? "cursor-default" : "cursor-pointer hover:bg-superficie-2"
                        )}
                      >
                        <input
                          type="radio"
                          name={`peca-${p.id}`}
                          checked={marcada}
                          disabled={travado}
                          onChange={() => escolher(p.id, o.lojaId, o.id)}
                          className="h-5 w-5 shrink-0 accent-brand-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-tinta">{o.marca}</span>
                          <span className="text-sm text-tinta-3"> · {nomeDaLoja(o.lojaId)}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-tinta-3">
                            chega em ~{o.prazoMin} min
                            {i === 0 && ofertas.length > 1 && (
                              <span className="rounded-full bg-ok-fraco px-1.5 font-medium text-ok">menor preço</span>
                            )}
                            {maisRapido !== null &&
                              o.prazoMin === maisRapido &&
                              ofertas.some((x) => x.prazoMin > maisRapido) && (
                                <span className="rounded-full bg-superficie-3 px-1.5 font-medium text-tinta-2">
                                  chega antes
                                </span>
                              )}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold tabular-nums text-tinta">
                            {formatCurrency(o.preco)}
                          </span>
                          {p.quantidade > 1 && <span className="block text-[0.7rem] text-tinta-3">cada</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {semAPeca.length > 0 && ofertas.length > 0 && (
                <p className="mt-1 text-xs text-tinta-3">
                  {semAPeca.map(nomeDaLoja).join(" e ")} não tem.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Painel>
  );
}

// ─── Resumo e orçamento ─────────────────────────────────────────────────────

function Resumo({ c, travado, onGerar }: { c: Cotacao; travado: boolean; onGerar: () => void }) {
  const t = totaisDa(c);

  function mudarMargem(texto: string) {
    const margem = Math.min(300, Number(texto.replace(/\D/g, "")) || 0);
    atualizarCotacao(c.id, (x) => ({ ...x, margem }));
  }

  return (
    <div className="space-y-4 rounded-xl border border-linha bg-superficie p-4 sm:p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-tinta">Resumo</h2>
        <span className="text-xs text-tinta-3">
          {t.escolhidas} de {c.pecas.length} peças escolhidas
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-tinta-3">
          <span>Custo nas lojas</span>
          <span className="tabular-nums">{formatCurrency(t.custo)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-tinta-3">
          <label htmlFor="margem-cotacao">Sua margem</label>
          <span className="flex items-center gap-1">
            <Entrada
              id="margem-cotacao"
              value={String(c.margem)}
              onChange={(e) => mudarMargem(e.target.value)}
              disabled={travado}
              inputMode="numeric"
              className="w-16 text-right tabular-nums"
            />
            %
          </span>
        </div>
        <div className="mt-1 flex justify-between border-t border-linha pt-2 text-lg font-bold text-tinta">
          <span>Cliente paga</span>
          <span className="tabular-nums">{formatCurrency(t.venda)}</span>
        </div>
        <div className="flex justify-between font-semibold text-ok">
          <span>Você ganha nas peças</span>
          <span className="tabular-nums">{formatCurrency(t.ganho)}</span>
        </div>
      </div>

      {c.orcamento ? (
        <div className="space-y-2 rounded-lg border border-ok-linha bg-ok-fraco p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ok">
            <Confere tamanho={16} />
            Orçamento #{c.orcamento.numero} criado
          </p>
          <BotaoLink href={`/orcamentos/${c.orcamento.id}`} variante="secundario" tamanho="denso" className="w-full">
            Abrir orçamento
          </BotaoLink>
        </div>
      ) : (
        <>
          <Botao onClick={onGerar} disabled={t.escolhidas === 0} className="w-full">
            Gerar orçamento
          </Botao>
          <p className="text-xs text-tinta-3">
            {t.escolhidas === 0
              ? "Escolha ao menos uma peça para montar o orçamento."
              : "Sai pronto no boxOS, com o preço já com a sua margem. Só falta o nome do cliente."}
          </p>
        </>
      )}
    </div>
  );
}

function ModalOrcamento({ c, onFechar }: { c: Cotacao; onFechar: () => void }) {
  const avisar = useAvisar();
  const cadastrado = Boolean(c.veiculo.clienteId);
  const [nome, setNome] = useState(c.veiculo.clienteNome ?? "");
  const [maoDeObra, setMaoDeObra] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const linhas = c.pecas.flatMap((p) => {
    const o = escolhaDa(c, p.id);
    if (!o) return [];
    const venda = precoDeVenda(o.preco, c.margem);
    return [{ peca: p, oferta: o, venda }];
  });
  const deFora = c.pecas.length - linhas.length;
  const mo = Number(maoDeObra) || 0;
  const total = linhas.reduce((s, l) => s + l.venda * l.peca.quantidade, 0) + mo;

  async function criar() {
    if (!cadastrado && !nome.trim()) {
      setErro("Escreva o nome do cliente.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const itens: object[] = linhas.map(({ peca, oferta, venda }) => ({
        tipo: "PECA",
        descricao: `${peca.descricao} (${oferta.marca})`,
        quantidade: peca.quantidade,
        valorUnit: venda,
        valorTotal: venda * peca.quantidade,
        // O preço da loja vira o custo do item: é o que faz o lucro da OS sair certo.
        custoUnit: oferta.preco,
        fornecedor: nomeDaLoja(oferta.lojaId),
      }));
      if (mo > 0) {
        itens.push({ tipo: "MAO_DE_OBRA", descricao: "Mão de obra", quantidade: 1, valorUnit: mo, valorTotal: mo });
      }
      const v = c.veiculo;
      const veiculoDesc = [descricaoDoVeiculo(v), v.motor, v.placa && `placa ${v.placa}`].filter(Boolean).join(" · ");
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: v.clienteId,
          veiculoId: v.veiculoId,
          clienteNome: cadastrado ? undefined : nome.trim(),
          veiculoDesc: v.veiculoId ? undefined : veiculoDesc,
          itens,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error || "Não consegui criar o orçamento.");
        return;
      }
      atualizarCotacao(c.id, (x) => ({ ...x, orcamento: { id: data.id, numero: data.numero } }));
      avisar(`Orçamento #${data.numero} criado no boxOS`);
      onFechar();
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Gerar orçamento"
      descricao="Cria um orçamento de verdade no boxOS. Dá para editar ou excluir depois, como qualquer outro."
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao variante="secundario" onClick={onFechar}>
            Voltar
          </Botao>
          <Botao onClick={criar} disabled={salvando}>
            {salvando ? "Criando..." : `Criar orçamento de ${formatCurrency(total)}`}
          </Botao>
        </div>
      }
    >
      <div className="space-y-4">
        {cadastrado ? (
          <p className="rounded-lg bg-superficie-2 px-3 py-2 text-sm text-tinta-2">
            Cliente: <strong className="text-tinta">{c.veiculo.clienteNome ?? "cadastrado"}</strong>, já ligado ao
            carro pela placa.
          </p>
        ) : (
          <Campo
            rotulo="Nome do cliente"
            obrigatorio
            ajuda="É o que basta para o orçamento. O telefone só é pedido na hora de virar OS."
          >
            <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Nilcio do Gol prata" />
          </Campo>
        )}

        <Campo rotulo="Mão de obra (opcional)" ajuda="Se já souber, entra junto. Dá para ajustar no orçamento depois.">
          <CampoDinheiro valor={maoDeObra} onChange={setMaoDeObra} placeholder="0,00" />
        </Campo>

        <div>
          <p className="mb-1.5 text-xs font-medium text-tinta-2">O que o cliente vai ver</p>
          <ul className="divide-y divide-linha rounded-lg border border-linha text-sm">
            {linhas.map(({ peca, oferta, venda }) => (
              <li key={peca.id} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="min-w-0 text-tinta">
                  {peca.quantidade}× {peca.descricao} <span className="text-tinta-3">({oferta.marca})</span>
                </span>
                <span className="shrink-0 tabular-nums text-tinta">{formatCurrency(venda * peca.quantidade)}</span>
              </li>
            ))}
            {mo > 0 && (
              <li className="flex justify-between gap-3 px-3 py-2">
                <span className="text-tinta">Mão de obra</span>
                <span className="tabular-nums text-tinta">{formatCurrency(mo)}</span>
              </li>
            )}
            <li className="flex justify-between gap-3 bg-superficie-2 px-3 py-2 font-semibold text-tinta">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </li>
          </ul>
          <p className="mt-1.5 text-xs text-tinta-3">
            O cliente não vê a loja nem o preço de custo. Isso fica só para você, no lucro da OS.
          </p>
        </div>

        {deFora > 0 && (
          <Aviso tipo="atencao">
            {deFora === 1 ? "1 peça ficou" : `${deFora} peças ficaram`} de fora, porque nenhuma oferta foi escolhida.
          </Aviso>
        )}
        {erro && <Aviso>{erro}</Aviso>}
      </div>
    </Modal>
  );
}

// ─── Pedido e entrega ───────────────────────────────────────────────────────

function PainelPedido({ c }: { c: Cotacao }) {
  const avisar = useAvisar();
  const [pedindo, setPedindo] = useState(false);
  const [erro, setErro] = useState("");
  const orcamento = c.orcamento!;

  // Só entra no pedido a loja de quem se escolheu alguma peça.
  const lojasDoPedido = c.lojas.filter((l) => c.pecas.some((p) => escolhaDa(c, p.id)?.lojaId === l));

  async function pedir() {
    setErro("");
    setPedindo(true);
    try {
      // O orçamento é de verdade: aprovar aqui marca o mesmo orçamento como aprovado
      // no boxOS — mas só se ele ainda estiver pendente, para não desfazer uma conversão.
      const r = await fetch(`/api/orcamentos/${orcamento.id}`);
      if (r.status === 404) throw new Error(`O orçamento #${orcamento.numero} não existe mais no boxOS.`);
      if (!r.ok) throw new Error("Não consegui consultar o orçamento agora.");
      const atual = await r.json();
      if (atual.status === "PENDENTE") {
        const p = await fetch(`/api/orcamentos/${orcamento.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APROVADO" }),
        });
        if (!p.ok) {
          const d = await p.json().catch(() => ({}));
          throw new Error(d.error || "Não consegui marcar o orçamento como aprovado.");
        }
      }
      const entregas = Object.fromEntries(lojasDoPedido.map((l) => [l, "ENVIADO" as EtapaEntrega]));
      atualizarCotacao(c.id, (x) => ({ ...x, pedido: { feitoEm: new Date().toISOString(), entregas } }));
      avisar(lojasDoPedido.length === 1 ? "Pedido enviado à loja" : "Pedido enviado às lojas");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui fazer o pedido.");
    } finally {
      setPedindo(false);
    }
  }

  function avancar(l: LojaId) {
    atualizarCotacao(c.id, (x) => {
      const atual = x.pedido?.entregas[l] ?? "ENVIADO";
      const i = ETAPAS_ENTREGA.findIndex((e) => e.value === atual);
      const proxima = ETAPAS_ENTREGA[Math.min(i + 1, ETAPAS_ENTREGA.length - 1)].value;
      return { ...x, pedido: { ...x.pedido!, entregas: { ...x.pedido!.entregas, [l]: proxima } } };
    });
  }

  if (!c.pedido) {
    return (
      <Painel titulo="Pedido das peças">
        <p className="text-sm text-tinta-2">
          Mandou o orçamento #{orcamento.numero} para o cliente? Quando ele aprovar, o pedido sai daqui direto para{" "}
          {lojasDoPedido.map(nomeDaLoja).join(" e ")}.
        </p>
        {erro && (
          <div className="mt-3">
            <Aviso>{erro}</Aviso>
          </div>
        )}
        <Botao onClick={pedir} disabled={pedindo} variante="sucesso" className="mt-3 w-full sm:w-auto">
          {pedindo ? "Pedindo..." : "O cliente aprovou: pedir as peças"}
        </Botao>
      </Painel>
    );
  }

  const tudoEntregue = etapaDa(c) === "ENTREGUE";

  return (
    <Painel titulo="Pedido das peças" ajuda={`Pedido feito às ${horaCurta(c.pedido.feitoEm)}.`}>
      <div className="space-y-4">
        {lojasDoPedido.map((l) => {
          const etapa = c.pedido!.entregas[l] ?? "ENVIADO";
          const posicao = ETAPAS_ENTREGA.findIndex((e) => e.value === etapa);
          const pecas = c.pecas.filter((p) => escolhaDa(c, p.id)?.lojaId === l);
          return (
            <div key={l} className="rounded-lg border border-linha p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-tinta">{nomeDaLoja(l)}</p>
                {etapa !== "ENTREGUE" && (
                  <Botao variante="secundario" tamanho="denso" onClick={() => avancar(l)}>
                    Simular próximo passo
                  </Botao>
                )}
              </div>
              <ul className="mt-1 text-xs text-tinta-3">
                {pecas.map((p) => (
                  <li key={p.id}>
                    {p.quantidade}× {p.descricao} ({escolhaDa(c, p.id)?.marca})
                  </li>
                ))}
              </ul>
              <ol className="mt-3 grid grid-cols-4 gap-1">
                {ETAPAS_ENTREGA.map((e, i) => (
                  <li key={e.value} className="min-w-0">
                    <div className={cn("h-1.5 rounded-full", i <= posicao ? "bg-ok" : "bg-superficie-3")} />
                    <p
                      className={cn(
                        "mt-1 text-[0.7rem] leading-tight",
                        i === posicao ? "font-semibold text-tinta" : "text-tinta-3"
                      )}
                    >
                      {e.rotulo}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}

        {tudoEntregue && (
          <div className="space-y-2 rounded-lg border border-ok-linha bg-ok-fraco p-3">
            <p className="text-sm font-semibold text-ok">Peças na oficina.</p>
            <p className="text-sm text-tinta-2">
              Agora é converter o orçamento em OS. Só falta o telefone do cliente.
            </p>
            <BotaoLink href={`/orcamentos/${orcamento.id}`} variante="sucesso" tamanho="denso">
              Abrir o orçamento #{orcamento.numero} e converter em OS
            </BotaoLink>
          </div>
        )}
      </div>
    </Painel>
  );
}
