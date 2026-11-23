"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Aviso, Campo, CampoDinheiro, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { Modal } from "@/components/ui/Modal";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Chevron, Confere, Conversa as IconeConversa } from "@/components/ui/Icones";
import { useUsaBoxOS } from "@/components/UsuarioProvider";
import { useLinkDoBoxOS } from "@/components/ProdutoProvider";
import {
  ETAPAS_ENTREGA,
  FORMAS_DE_PAGAMENTO,
  aConferir,
  descricaoDoVeiculo,
  escolhaDa,
  etapaDa,
  lojasSemAPeca,
  ofertasDa,
  pedidoPorLoja,
  podeDevolver,
  precoDaPeca,
  rotuloDaEntrega,
  situacaoDaDevolucao,
  textoDoFrete,
  totaisDa,
  tudoRecebido,
  type CotacaoVista,
  type Etapa,
  type FormaDePagamento,
} from "./regras";
import { enviarJson, tocarAviso, useAoVivo } from "./aoVivo";
import { AvisoSemConexao, Cabecalho, EscolhaDaForma, Recado, horaCurta } from "./ui";
import { VitrineBoxOS } from "./VitrineBoxOS";
import { DevolucoesDaLoja, ModalDevolucao, temOQueDevolver } from "./Devolucoes";
import { ContadorDeMensagens, Conversa, useConversaDoEndereco, type EventoDaConversa } from "./Conversa";

type Gravar = ReturnType<typeof useAoVivo<CotacaoVista>>["gravar"];

export function DetalheCotacao({ id }: { id: string }) {
  const url = `/api/peca-peca/cotacoes/${id}`;
  const { dados: cotacao, naoEncontrado, semConexao, carregar, gravar } = useAoVivo<CotacaoVista>(url, 4000);
  // A conversa aberta (o envio), se alguma. O aviso no celular abre direto nela.
  const [conversaCom, setConversaCom] = useState<string | null>(null);
  useConversaDoEndereco(setConversaCom);
  useAvisosDasLojas(cotacao, conversaCom);

  if (naoEncontrado) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <Cabecalho titulo="Cotação não encontrada" voltar="/peca-peca" />
        <Vazio
          titulo="Essa cotação não existe mais"
          texto="Ela pode ter sido excluída."
          acao={<BotaoLink href="/peca-peca">Ver cotações</BotaoLink>}
        />
      </div>
    );
  }

  if (!cotacao) {
    return (
      <div className="p-4 sm:p-6">
        <EsqueletoLista linhas={4} />
      </div>
    );
  }

  const envioDaConversa = cotacao.envios.find((e) => e.id === conversaCom);
  return (
    <>
      <Conteudo
        c={cotacao}
        url={url}
        gravar={gravar}
        recarregar={carregar}
        semConexao={semConexao}
        onConversar={setConversaCom}
      />
      {envioDaConversa && (
        <Conversa
          api={`${url}/conversa/${envioDaConversa.id}`}
          titulo={envioDaConversa.lojaNome}
          subtitulo={`Cotação ${cotacao.numero}, ${descricaoDoVeiculo(cotacao.veiculo)}`}
          eu="OFICINA"
          eventos={eventosDaConversa(cotacao, envioDaConversa)}
          pushApi="/api/peca-peca/push"
          onFechar={() => setConversaCom(null)}
        />
      )}
    </>
  );
}

/** O que aconteceu na cotação com esta loja, no meio das mensagens. */
function eventosDaConversa(c: CotacaoVista, e: CotacaoVista["envios"][number]): EventoDaConversa[] {
  const eventos: EventoDaConversa[] = [{ em: c.criadaEm, texto: "Cotação enviada à loja" }];
  if (e.respondidaEm) eventos.push({ em: e.respondidaEm, texto: `${e.lojaNome} respondeu` });
  if (c.pedidoEm && e.entrega) eventos.push({ em: c.pedidoEm, texto: "Pedido feito" });
  return eventos;
}

/** O que só a loja mexe na devolução: mudou entre duas leituras, a novidade é dela. */
type DevolucaoLida = {
  aceitaEm: string | null;
  recusadaEm: string | null;
  trocaSaiuEm: string | null;
  lojaRecebeuEm: string | null;
};

/**
 * Avisa quando uma loja responde, anda com a entrega ou mexe numa devolução — com som,
 * porque quem cota costuma estar com a tela de lado. A primeira leitura não conta: é o
 * estado de partida.
 */
function useAvisosDasLojas(c: CotacaoVista | null, conversaAberta: string | null) {
  const avisar = useAvisar();
  const anterior = useRef<Map<string, { respondidaEm: string | null; entrega: string | null; naoLidas: number }> | null>(
    null
  );
  const devolucoesAntes = useRef<Map<string, DevolucaoLida> | null>(null);
  const aberta = useRef(conversaAberta);
  aberta.current = conversaAberta;

  useEffect(() => {
    if (!c) return;
    const agora = new Map(
      c.envios.map((e) => [e.id, { respondidaEm: e.respondidaEm, entrega: e.entrega, naoLidas: e.naoLidas }])
    );
    const antes = anterior.current;
    anterior.current = agora;
    const devolucoesAgora = new Map(
      c.devolucoes.map((d) => [
        d.id,
        { aceitaEm: d.aceitaEm, recusadaEm: d.recusadaEm, trocaSaiuEm: d.trocaSaiuEm, lojaRecebeuEm: d.lojaRecebeuEm },
      ])
    );
    const devolucoesEram = devolucoesAntes.current;
    devolucoesAntes.current = devolucoesAgora;
    if (!antes || !devolucoesEram) return;

    const novidades: string[] = [];
    for (const d of c.devolucoes) {
      const era = devolucoesEram.get(d.id);
      if (!era) continue;
      const loja = c.envios.find((e) => e.id === d.envioId)?.lojaNome ?? "A loja";
      const peca = c.pecas.find((p) => p.id === d.pecaId)?.descricao ?? "a peça";
      if (d.aceitaEm && !era.aceitaEm) {
        const s = situacaoDaDevolucao(d);
        novidades.push(
          d.querTroca && d.semAPeca
            ? `${loja} não tem ${peca} para trocar. O valor volta para você.`
            : s === "PRECO_NOVO"
              ? `${loja}: a troca de ${peca} custa mais. Diga se pode mandar.`
              : `${loja} aceitou a devolução de ${peca}`
        );
      }
      if (d.recusadaEm && !era.recusadaEm) novidades.push(`${loja} recusou a devolução de ${peca}`);
      if (d.trocaSaiuEm && !era.trocaSaiuEm && !d.oficinaRecebeuTrocaEm) {
        novidades.push(`${loja}: a peça nova (${peca}) saiu com o motoboy`);
      }
      if (d.lojaRecebeuEm && !era.lojaRecebeuEm) novidades.push(`${loja} confirmou que ${peca} voltou para a loja`);
    }
    for (const e of c.envios) {
      const era = antes.get(e.id);
      if (!era) continue;
      if (e.respondidaEm && e.respondidaEm !== era.respondidaEm) {
        novidades.push(era.respondidaEm ? `${e.lojaNome} corrigiu a resposta` : `${e.lojaNome} respondeu`);
      }
      // A oficina confirmando o recebimento também leva a etapa a "entregue": aí não é novidade.
      if (e.entrega && e.entrega !== era.entrega && era.entrega && !e.oficinaRecebeuEm) {
        novidades.push(
          e.entrega === "ENTREGUE"
            ? `${e.lojaNome} marcou como entregue. Confira as peças e confirme o recebimento.`
            : `${e.lojaNome}: ${rotuloDaEntrega(e.entrega).toLowerCase()}`
        );
      }
      // Com a conversa aberta, a própria conversa mostra e toca.
      if (e.naoLidas > era.naoLidas && e.id !== aberta.current) {
        novidades.push(`${e.lojaNome} mandou mensagem`);
      }
    }
    if (novidades.length > 0) {
      novidades.forEach((n) => avisar(n));
      tocarAviso();
    }
  }, [c, avisar]);
}

// O caminho da cotação. O passo do orçamento é do boxOS: some para quem só tem o Peça
// Peça, e para quem pediu direto sem gerar orçamento.
const COM_ORCAMENTO = {
  rotulos: ["Enviada", "Lojas responderam", "Orçamento", "Pedido", "Entregue"],
  posicao: { AGUARDANDO: 0, RESPONDIDA: 1, ORCAMENTO: 2, PEDIDO: 3, CONFERIR: 3, DEVOLUCAO: 4, ENTREGUE: 4 },
} satisfies { rotulos: string[]; posicao: Record<Etapa, number> };
const SEM_ORCAMENTO = {
  rotulos: ["Enviada", "Lojas responderam", "Pedido", "Entregue"],
  posicao: { AGUARDANDO: 0, RESPONDIDA: 1, ORCAMENTO: 1, PEDIDO: 2, CONFERIR: 2, DEVOLUCAO: 3, ENTREGUE: 3 },
} satisfies { rotulos: string[]; posicao: Record<Etapa, number> };

/** Por que a escolha das peças não muda mais: o orçamento saiu, ou o pedido foi feito. */
type Trava = "orcamento" | "pedido" | null;

function Conteudo({
  c: doServidor,
  url,
  gravar,
  recarregar,
  semConexao,
  onConversar,
}: {
  c: CotacaoVista;
  url: string;
  gravar: Gravar;
  recarregar: () => Promise<void>;
  semConexao: boolean;
  onConversar: (envioId: string) => void;
}) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const avisar = useAvisar();
  const usaBoxOS = useUsaBoxOS();
  const [gerando, setGerando] = useState(false);
  const [pedindo, setPedindo] = useState(false);

  // O que a pessoa está digitando (margem, preço de venda) entra na conta da tela na
  // hora, e só vai para o servidor quando ela sai do campo.
  const [rascunhoMargem, setRascunhoMargem] = useState<string | null>(null);
  const [rascunhoVenda, setRascunhoVenda] = useState<Record<string, string>>({});
  const c: CotacaoVista = {
    ...doServidor,
    margem: rascunhoMargem !== null ? Math.min(300, Number(rascunhoMargem) || 0) : doServidor.margem,
    pecas: doServidor.pecas.map((p) =>
      p.id in rascunhoVenda ? { ...p, vendaUnit: Number(rascunhoVenda[p.id]) > 0 ? Number(rascunhoVenda[p.id]) : null } : p
    ),
  };

  const linha = usaBoxOS && !(c.pedidoEm && !c.orcamento) ? COM_ORCAMENTO : SEM_ORCAMENTO;
  // Devolução aberta com loja ainda entregando: a barra fica no pedido, não no fim.
  const etapa = etapaDa(c);
  const posicao = etapa === "DEVOLUCAO" && !tudoRecebido(c) ? linha.posicao.PEDIDO : linha.posicao[etapa];
  const pendentes = c.envios.filter((e) => !e.respondidaEm);
  const respondeu = pendentes.length < c.envios.length;
  // Depois do orçamento, mudar a escolha faria a cotação contar uma história e o
  // orçamento outra; depois do pedido, as lojas já estão separando aquelas peças.
  const trava: Trava = c.orcamento ? "orcamento" : c.pedidoEm ? "pedido" : null;

  async function pedir() {
    const lojas = pedidoPorLoja(c).map(
      ({ envio, pecas }) => `${envio.lojaNome} (${pecas.length === 1 ? "1 peça" : `${pecas.length} peças`})`
    );
    const ok = await confirmar({
      titulo: c.orcamento ? `O cliente aprovou o orçamento #${c.orcamento.numero}?` : "Fazer o pedido?",
      texto: `O pedido vai para o balcão de ${lojas.join(" e ")}. Depois dele, a escolha das peças não muda mais.`,
      acao: "Fazer o pedido",
    });
    if (!ok) return;
    setPedindo(true);
    const r = await gravar(enviarJson(`${url}/pedido`, "POST"), { devolveDado: true });
    setPedindo(false);
    if (!r.ok) return avisar(r.erro, "erro");
    avisar(lojas.length === 1 ? "Pedido enviado à loja" : "Pedido enviado às lojas");
  }

  async function alterar(corpo: object, otimista?: (d: CotacaoVista) => CotacaoVista) {
    const r = await gravar(enviarJson(url, "PATCH", corpo), { otimista, devolveDado: true });
    if (!r.ok) avisar(r.erro, "erro");
  }

  function salvarMargem() {
    if (rascunhoMargem === null) return;
    const margem = Math.min(300, Number(rascunhoMargem) || 0);
    setRascunhoMargem(null);
    if (margem !== doServidor.margem) void alterar({ margem }, (d) => ({ ...d, margem }));
  }

  /** Grava o preço de venda da peça. Nulo (ou campo vazio) volta para o preço da margem. */
  function gravarVenda(pecaId: string, valor: number | null) {
    setRascunhoVenda((r) => {
      const resto = { ...r };
      delete resto[pecaId];
      return resto;
    });
    void alterar({ venda: { pecaId, valor } }, (d) => ({
      ...d,
      pecas: d.pecas.map((p) => (p.id === pecaId ? { ...p, vendaUnit: valor } : p)),
    }));
  }

  function salvarVenda(pecaId: string) {
    if (!(pecaId in rascunhoVenda)) return;
    const n = Number(rascunhoVenda[pecaId]);
    gravarVenda(pecaId, n > 0 ? n : null);
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: `Excluir a cotação #${c.numero}?`,
      texto: c.orcamento
        ? `As respostas das lojas somem junto. O orçamento #${c.orcamento.numero} continua no boxOS.`
        : "As respostas das lojas somem junto, e a cotação sai do balcão delas.",
      acao: "Excluir cotação",
      perigo: true,
    });
    if (!ok) return;
    const r = await gravar(enviarJson(url, "DELETE"));
    if (!r.ok) return avisar(r.erro, "erro");
    router.push("/peca-peca");
  }

  const t = totaisDa(c);
  const semEscolha = t.escolhidas === 0;
  // A barra de baixo do celular: só enquanto há escolha a fazer e um botão para apertar.
  const comBarra = respondeu && !c.pedidoEm;
  const acaoPrincipal =
    usaBoxOS && !c.orcamento
      ? { rotulo: "Gerar orçamento", fazer: () => setGerando(true) }
      : { rotulo: c.orcamento ? "Cliente aprovou: pedir" : "Fazer o pedido", fazer: pedir };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* O carro em cima, como na lista: é como o mecânico lembra. O número vem junto, menor. */}
      <Cabecalho
        titulo={descricaoDoVeiculo(c.veiculo)}
        voltar="/peca-peca"
        subtitulo={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {c.veiculo.placa && (
              <span className="rounded-[3px] border border-linha-forte bg-superficie px-1.5 text-[11px] font-semibold uppercase leading-[18px] tracking-[0.08em] text-tinta-2">
                {c.veiculo.placa}
              </span>
            )}
            <span>
              {c.veiculo.motor && `Motor ${c.veiculo.motor} · `}
              Cotação <span className="font-pecapeca font-bold">nº {c.numero}</span>
            </span>
            {c.clienteNome && <span>· {c.clienteNome}</span>}
          </span>
        }
      />

      {/* Onde a cotação está e, em palavras, o que fazer agora. */}
      <div>
        <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${linha.rotulos.length}, minmax(0, 1fr))` }}>
          {linha.rotulos.map((rotulo, i) => (
            <li key={rotulo} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-superficie-3">
                <div
                  className={cn(
                    "h-full origin-left rounded-full bg-brand-600 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
                    i <= posicao ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </div>
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
        <Recado tom="marca" titulo="Agora" className="mt-4">
          {proximoPasso(c, usaBoxOS, pendentes.length)}
        </Recado>
      </div>

      {c.observacao && (
        <div className="rounded-lg border border-linha bg-superficie-2 px-3 py-2 text-sm">
          <p className="text-xs text-tinta-3">Recado enviado às lojas</p>
          <p className="whitespace-pre-line text-tinta">{c.observacao}</p>
        </div>
      )}

      <AvisoSemConexao ativo={semConexao} />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Com o pedido feito, o que importa agora é a entrega: ela sobe. */}
          {c.pedidoEm && (
            <PainelEntrega c={{ ...c, pedidoEm: c.pedidoEm }} url={url} gravar={gravar} onGerar={() => setGerando(true)} />
          )}

          {/* Sem resposta ainda, as lojas são a notícia; com resposta, a escolha vem primeiro. */}
          {!respondeu && <PainelLojas c={c} onConversar={onConversar} />}

          {respondeu ? (
            <PainelEscolha
              c={c}
              trava={trava}
              usaBoxOS={usaBoxOS}
              aguardando={pendentes.length > 0}
              onEscolher={(pecaId, ofertaId) =>
                alterar({ escolha: { pecaId, ofertaId } }, (d) => ({
                  ...d,
                  pecas: d.pecas.map((p) =>
                    p.id === pecaId ? { ...p, ofertaId, vendaUnit: p.ofertaId === ofertaId ? p.vendaUnit : null } : p
                  ),
                }))
              }
              onMenorPreco={() => alterar({ menorPreco: true })}
            />
          ) : (
            <Vazio
              compacto
              titulo="Esperando as lojas"
              texto="Quando o balconista responder, os preços aparecem aqui sozinhos, lado a lado. Com esta tela aberta, toca um aviso quando uma loja responder."
            />
          )}

          {respondeu && <PainelLojas c={c} onConversar={onConversar} />}

          {/* Preço para o cliente: é o orçamento, coisa do boxOS. */}
          {usaBoxOS && !c.orcamento && (
            <PainelPrecos
              c={c}
              rascunho={rascunhoVenda}
              onDigitar={(pecaId, valor) => setRascunhoVenda((r) => ({ ...r, [pecaId]: valor }))}
              onSalvar={salvarVenda}
              onDesfazer={(pecaId) => gravarVenda(pecaId, null)}
              onTudoNaMargem={async () => {
                for (const p of c.pecas.filter((p) => p.vendaUnit !== null)) {
                  await alterar({ venda: { pecaId: p.id, valor: null } });
                }
              }}
            />
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6">
          <Resumo
            c={c}
            usaBoxOS={usaBoxOS}
            pedindo={pedindo}
            margemDigitada={rascunhoMargem}
            onDigitarMargem={setRascunhoMargem}
            onSalvarMargem={salvarMargem}
            onGerar={() => setGerando(true)}
            onPedir={pedir}
            onForma={(formaPagamento) =>
              alterar({ formaPagamento }, (d) => ({ ...d, formaPagamento }))
            }
            principalSoNoComputador={comBarra}
          />
          <Botao variante="fantasma" tamanho="denso" onClick={excluir} className="w-full text-perigo">
            Excluir cotação
          </Botao>
        </aside>
      </div>

      {/* Celular: o total e o próximo botão sempre à mão, acima da barra de navegação.
          No computador, o resumo ao lado já fica parado na tela. */}
      {comBarra && (
        <div className="sticky bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-20 -mx-4 flex items-center gap-3 border-t border-linha bg-fundo/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:bottom-0 lg:hidden">
          <div className="min-w-0">
            <p className="text-xs text-tinta-3">
              {usaBoxOS ? "Cliente paga" : "Total"} · {t.escolhidas} de {c.pecas.length}{" "}
              {c.pecas.length === 1 ? "peça" : "peças"}
            </p>
            <Valor valor={usaBoxOS ? t.venda : t.custo} className="text-lg font-bold text-tinta" />
          </div>
          <Botao
            variante={c.orcamento ? "sucesso" : "primario"}
            onClick={acaoPrincipal.fazer}
            disabled={semEscolha || pedindo}
            className="aperta ml-auto"
          >
            {pedindo ? "Pedindo..." : acaoPrincipal.rotulo}
          </Botao>
        </div>
      )}

      {gerando && (
        <ModalOrcamento
          c={c}
          url={url}
          onFechar={() => setGerando(false)}
          onCriado={async (numero) => {
            setGerando(false);
            avisar(`Orçamento #${numero} criado no boxOS`);
            await recarregar();
          }}
        />
      )}
    </div>
  );
}

// ─── Lojas ──────────────────────────────────────────────────────────────────

function PainelLojas({ c, onConversar }: { c: CotacaoVista; onConversar: (envioId: string) => void }) {
  return (
    <Painel
      titulo="Lojas"
      ajuda="Atualiza sozinho. Dúvida sobre a peça? Converse com a loja."
    >
      <ul className="divide-y divide-linha">
        {c.envios.map((e) => {
          const temQuantas = c.pecas.filter((p) => e.ofertas.some((o) => o.pecaId === p.id)).length;
          return (
            <li key={e.id} className="flex items-center gap-3 py-2.5">
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", e.respondidaEm ? "bg-ok" : "animate-pulse bg-atencao")}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tinta">{e.lojaNome}</p>
                {e.respondidaEm ? (
                  <p className="flex flex-wrap gap-x-3 text-xs text-tinta-3">
                    <span>Respondeu às {horaCurta(e.respondidaEm)}</span>
                    <span>
                      Tem {temQuantas} de {c.pecas.length} peças
                    </span>
                    <span>{textoDoFrete(e)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-tinta-3">Esperando o balconista responder</p>
                )}
              </div>
              {/* Conversa que já acabou (e foi apagada) não tem o que abrir. */}
              {!e.conversaFechada && (
                <Botao
                  variante={e.naoLidas > 0 ? "primario" : "secundario"}
                  tamanho="denso"
                  onClick={() => onConversar(e.id)}
                  className="shrink-0"
                >
                  <IconeConversa tamanho={15} />
                  Conversar
                  <ContadorDeMensagens total={e.naoLidas} />
                </Botao>
              )}
            </li>
          );
        })}
      </ul>
    </Painel>
  );
}

// ─── Escolha das peças ──────────────────────────────────────────────────────

function PainelEscolha({
  c,
  trava,
  usaBoxOS,
  aguardando,
  onEscolher,
  onMenorPreco,
}: {
  c: CotacaoVista;
  trava: Trava;
  usaBoxOS: boolean;
  aguardando: boolean;
  onEscolher: (pecaId: string, ofertaId: string) => void;
  onMenorPreco: () => void;
}) {
  const travado = trava !== null;
  return (
    <Painel
      titulo={travado ? "Peças escolhidas" : "Escolha as peças"}
      ajuda={
        trava === "orcamento"
          ? "O orçamento já saiu com estas escolhas."
          : trava === "pedido"
            ? "O pedido já foi feito com estas escolhas."
            : `Pode misturar: cada peça da loja que for melhor.${usaBoxOS ? " A marca é só para você; o cliente não vê." : ""}`
      }
      acao={
        !travado && (
          <Botao variante="secundario" tamanho="denso" onClick={onMenorPreco}>
            Menor preço em tudo
          </Botao>
        )
      }
    >
      <div className="space-y-4">
        {c.pecas.map((p) => {
          const escolhida = escolhaDa(c, p);
          // Depois do orçamento ou do pedido, as ofertas não escolhidas só alongariam a tela.
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
                    ? trava === "orcamento"
                      ? "Ficou fora do orçamento."
                      : "Ficou fora do pedido."
                    : aguardando
                      ? "Ainda sem preço. Falta loja responder."
                      : "Nenhuma das lojas tem esta peça."}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {ofertas.map((o, i) => {
                    const marcada = escolhida?.id === o.id;
                    return (
                      <label
                        key={o.id}
                        className={cn(
                          "aperta flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2",
                          marcada ? "border-brand-500 bg-brand-50" : "border-linha",
                          travado ? "cursor-default" : "cursor-pointer hover:bg-superficie-2"
                        )}
                      >
                        <input
                          type="radio"
                          name={`peca-${p.id}`}
                          checked={marcada}
                          disabled={travado}
                          onChange={() => onEscolher(p.id, o.id)}
                          className="h-5 w-5 shrink-0 accent-brand-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-tinta">{o.marca}</span>
                          <span className="ml-2 text-sm text-tinta-3">{o.lojaNome}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-tinta-3">
                            chega em ~{o.prazoMin} min
                            {!travado && i === 0 && ofertas.length > 1 && (
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
                            {p.quantidade > 1 && <span className="font-normal text-tinta-3"> cada</span>}
                          </span>
                          {/* O outro preço da loja, quando há dois: para ver quanto a forma pesa. */}
                          {o.precoCredito !== null && (
                            <span className="block text-[0.7rem] tabular-nums text-tinta-3">
                              {o.preco === o.precoAVista
                                ? `${formatCurrency(o.precoCredito)} no crédito`
                                : `${formatCurrency(o.precoAVista)} à vista`}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {semAPeca.length > 0 && ofertas.length > 0 && (
                <p className="mt-1 text-xs text-tinta-3">{semAPeca.join(" e ")} não tem.</p>
              )}
            </div>
          );
        })}
      </div>
    </Painel>
  );
}

// ─── Preço para o cliente ───────────────────────────────────────────────────

function PainelPrecos({
  c,
  rascunho,
  onDigitar,
  onSalvar,
  onDesfazer,
  onTudoNaMargem,
}: {
  c: CotacaoVista;
  rascunho: Record<string, string>;
  onDigitar: (pecaId: string, valor: string) => void;
  onSalvar: (pecaId: string) => void;
  onDesfazer: (pecaId: string) => void;
  onTudoNaMargem: () => Promise<void>;
}) {
  const linhas = c.pecas.flatMap((p) => {
    const o = escolhaDa(c, p);
    return o ? [{ peca: p, oferta: o, venda: precoDaPeca(p, o.preco, c.margem), editado: p.vendaUnit !== null }] : [];
  });
  if (linhas.length === 0) return null;
  const editadas = linhas.filter((l) => l.editado).length;
  const totalVenda = linhas.reduce((s, l) => s + l.venda * l.peca.quantidade, 0);

  // A margem do resumo já dá o preço de tudo; mexer peça por peça é exceção. Por isso a
  // lista fica dobrada, e só abre sozinha quando já tem preço mexido à mão.
  return (
    <details open={editadas > 0} className="group/precos rounded-xl border border-linha bg-superficie">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-tinta">Preço para o cliente, peça por peça</span>
          <span className="block text-xs text-tinta-3">
            {editadas > 0
              ? `${editadas === 1 ? "1 peça" : `${editadas} peças`} com preço seu · ${formatCurrency(totalVenda)}`
              : `Tudo com a margem de ${c.margem}% · ${formatCurrency(totalVenda)}`}
          </span>
        </span>
        <Chevron
          tamanho={18}
          className="shrink-0 text-tinta-3 transition-transform duration-200 group-open/precos:rotate-180"
        />
      </summary>
      <div className="border-t border-linha px-4 pb-4 pt-3 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-tinta-3">Mude o preço de qualquer peça antes de gerar o orçamento.</p>
          {editadas > 0 && (
            <Botao variante="secundario" tamanho="denso" onClick={onTudoNaMargem}>
              Tudo em {c.margem}%
            </Botao>
          )}
        </div>
      <ul className="divide-y divide-linha">
        {linhas.map(({ peca, oferta, venda, editado }) => {
          // Mesma conta da margem do resumo: quanto o preço está acima do custo.
          const sobreCusto = ((venda - oferta.preco) / oferta.preco) * 100;
          return (
            <li key={peca.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-sm font-semibold text-tinta">
                  <span className="text-tinta-3">{peca.quantidade}×</span> {peca.descricao}
                </p>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-tinta">
                  {formatCurrency(venda * peca.quantidade)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <p className="min-w-0 text-xs text-tinta-3">
                  <span className="font-medium text-tinta-2">{oferta.marca}</span>
                  <span className="ml-2">{oferta.lojaNome}</span>
                  <br />
                  custo {formatCurrency(oferta.preco)}
                  {peca.quantidade > 1 && " cada"}
                  {editado && (
                    <button
                      type="button"
                      onClick={() => onDesfazer(peca.id)}
                      className="block font-medium text-brand-texto underline-offset-2 hover:underline"
                    >
                      voltar para {c.margem}%
                    </button>
                  )}
                </p>
                {/* `ml-auto`: se quebrar a linha, o campo continua alinhado à direita. */}
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-32">
                    <CampoDinheiro
                      valor={rascunho[peca.id] ?? String(venda)}
                      onChange={(v) => onDigitar(peca.id, v)}
                      onBlur={() => onSalvar(peca.id)}
                      onEnter={() => onSalvar(peca.id)}
                      aria-label={`Preço de venda de ${peca.descricao}${peca.quantidade > 1 ? ", cada" : ""}`}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-12 text-right text-xs font-semibold tabular-nums",
                      sobreCusto >= 0 ? "text-ok" : "text-perigo"
                    )}
                    title="Acima do custo da loja"
                  >
                    {sobreCusto >= 0 ? "+" : ""}
                    {Math.round(sobreCusto)}%
                  </span>
                </div>
              </div>
              {venda < oferta.preco && <p className="text-xs text-perigo">Abaixo do que você paga na loja.</p>}
            </li>
          );
        })}
      </ul>
      </div>
    </details>
  );
}

/** O que fazer agora, numa frase: a barra de etapas diz onde está; isto diz o próximo passo. */
function proximoPasso(c: CotacaoVista, usaBoxOS: boolean, faltam: number): string {
  switch (etapaDa(c)) {
    case "AGUARDANDO":
      return "Esperar as lojas responderem. Os preços aparecem aqui sozinhos, e toca um aviso.";
    case "RESPONDIDA": {
      if (faltam > 0) {
        const fazer = usaBoxOS ? "gerar o orçamento" : "fazer o pedido";
        const falta = faltam === 1 ? "1 loja ainda não respondeu" : `${faltam} lojas ainda não responderam`;
        return `Escolha as peças e já dá para ${fazer}. ${falta}; se responder, o preço aparece aqui.`;
      }
      return `Todas as lojas responderam. Escolha as peças e ${usaBoxOS ? "gere o orçamento para o cliente" : "faça o pedido"}.`;
    }
    case "ORCAMENTO":
      return "O orçamento está com o cliente. Quando ele aprovar, peça as peças aqui.";
    case "PEDIDO":
      return "Pedido feito. Acompanhe a entrega de cada loja logo abaixo.";
    case "CONFERIR":
      return "A loja entregou. Confira as peças e confirme o recebimento.";
    case "DEVOLUCAO":
      return "Tem devolução em andamento. Veja o que falta na loja dela, logo abaixo.";
    case "ENTREGUE":
      return c.orcamento ? "Peças na oficina. Agora é converter o orçamento em OS." : "Peças na oficina. Cotação concluída.";
  }
}

/**
 * Valor em reais que rola um pouco quando muda: escolher outra oferta mexe no total, e
 * o movimento mostra onde a conta mudou. Parado na primeira vez que aparece.
 */
function Valor({ valor, className }: { valor: number; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const antes = useRef(valor);
  useEffect(() => {
    const era = antes.current;
    antes.current = valor;
    if (era === valor || !el.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.current.animate(
      [
        { opacity: 0.2, transform: `translateY(${valor > era ? 35 : -35}%)` },
        { opacity: 1, transform: "none" },
      ],
      { duration: 280, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
    );
  }, [valor]);
  return (
    <span ref={el} className={cn("inline-block tabular-nums", className)}>
      {formatCurrency(valor)}
    </span>
  );
}

// ─── Resumo e orçamento ─────────────────────────────────────────────────────

function Resumo({
  c,
  usaBoxOS,
  pedindo,
  margemDigitada,
  onDigitarMargem,
  onSalvarMargem,
  onGerar,
  onPedir,
  onForma,
  principalSoNoComputador = false,
}: {
  c: CotacaoVista;
  usaBoxOS: boolean;
  pedindo: boolean;
  margemDigitada: string | null;
  onDigitarMargem: (v: string) => void;
  onSalvarMargem: () => void;
  onGerar: () => void;
  onPedir: () => void;
  onForma: (forma: FormaDePagamento) => void;
  /** No celular o botão principal mora na barra de baixo: aqui ele some, para não ter dois. */
  principalSoNoComputador?: boolean;
}) {
  const soNoComputador = principalSoNoComputador ? "max-lg:hidden" : "";
  const linkDoBoxOS = useLinkDoBoxOS();
  const t = totaisDa(c);
  const porLoja = pedidoPorLoja(c);
  // Só conta preço digitado de peça que está escolhida.
  const comPrecoProprio = c.pecas.filter((p) => p.ofertaId && p.vendaUnit !== null).length;
  const semEscolha = t.escolhidas === 0;

  return (
    <div className="space-y-4 rounded-xl border border-linha bg-superficie p-4 sm:p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-tinta">Resumo</h2>
        <span className="text-xs text-tinta-3">
          {t.escolhidas} de {c.pecas.length} peças escolhidas
        </span>
      </div>

      {/* A forma muda o preço de cada oferta: vem antes dos números. Depois do orçamento ou
          do pedido, fica fixa (o custo já saiu com ela). */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-tinta-2">Como vai pagar</p>
        {c.pedidoEm || c.orcamento ? (
          <p className="text-sm font-semibold text-tinta">{FORMAS_DE_PAGAMENTO[c.formaPagamento].rotulo}</p>
        ) : (
          <EscolhaDaForma valor={c.formaPagamento} onChange={onForma} />
        )}
      </div>

      <div className="space-y-1.5 text-sm">
        {/* Quanto fica em cada loja: é o que se paga a cada uma. */}
        {porLoja.map(({ envio, total }) => (
          <div key={envio.id} className="flex justify-between text-tinta-3">
            <span className="min-w-0 truncate">{envio.lojaNome}</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        ))}
        <div
          className={cn(
            "flex justify-between",
            usaBoxOS ? "text-tinta-3" : "mt-1 border-t border-linha pt-2 text-lg font-bold text-tinta"
          )}
        >
          <span>{usaBoxOS ? "Custo nas lojas" : "Total das peças"}</span>
          <Valor valor={t.custo} />
        </div>

        {usaBoxOS && (
          <>
            <div className="flex items-center justify-between gap-3 text-tinta-3">
              <label htmlFor="margem-cotacao">
                Sua margem
                {comPrecoProprio > 0 && (
                  <span className="block text-xs">
                    {comPrecoProprio === 1 ? "1 peça com preço seu" : `${comPrecoProprio} peças com preço seu`}
                  </span>
                )}
              </label>
              <span className="flex items-center gap-1">
                <Entrada
                  id="margem-cotacao"
                  value={margemDigitada ?? String(c.margem)}
                  onChange={(e) => onDigitarMargem(e.target.value.replace(/\D/g, ""))}
                  onBlur={onSalvarMargem}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onSalvarMargem())}
                  disabled={Boolean(c.orcamento)}
                  inputMode="numeric"
                  className="w-16 text-right tabular-nums"
                />
                %
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t border-linha pt-2 text-lg font-bold text-tinta">
              <span>Cliente paga</span>
              <Valor valor={t.venda} />
            </div>
            <div className="flex justify-between font-semibold text-ok">
              <span>Você ganha nas peças</span>
              <Valor valor={t.ganho} />
            </div>
          </>
        )}
      </div>

      {c.orcamento && (
        <div className="space-y-2 border-l-[3px] border-[rgb(var(--gr-vendida))] py-0.5 pl-3.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-tinta">
            <Confere tamanho={16} className="text-ok" />
            Orçamento #{c.orcamento.numero} criado
          </p>
          <BotaoLink
            href={linkDoBoxOS(`/orcamentos/${c.orcamento.id}`)}
            variante="secundario"
            tamanho="denso"
            className="w-full"
          >
            Abrir orçamento
          </BotaoLink>
        </div>
      )}

      {!c.pedidoEm && (
        <div className="space-y-2">
          {/* Com o boxOS, o caminho de sempre é orçamento → cliente aprova → pedido; o
              pedido direto fica como segunda opção. Sem ele, pedir é a ação. */}
          {usaBoxOS && !c.orcamento ? (
            <>
              <Botao onClick={onGerar} disabled={semEscolha} className={cn("aperta w-full", soNoComputador)}>
                Gerar orçamento
              </Botao>
              <Botao variante="secundario" onClick={onPedir} disabled={semEscolha || pedindo} className="w-full">
                {pedindo ? "Pedindo..." : "Pedir sem orçamento"}
              </Botao>
            </>
          ) : (
            <Botao
              variante={c.orcamento ? "sucesso" : "primario"}
              onClick={onPedir}
              disabled={semEscolha || pedindo}
              className={cn("aperta w-full", soNoComputador)}
            >
              {pedindo ? "Pedindo..." : c.orcamento ? "O cliente aprovou: pedir as peças" : "Fazer o pedido"}
            </Botao>
          )}
          <p className="text-xs text-tinta-3">
            {semEscolha
              ? "Escolha ao menos uma peça."
              : usaBoxOS && !c.orcamento
                ? "O orçamento sai pronto no boxOS, com os preços acima. Só falta o nome do cliente."
                : `O pedido vai direto para o balcão de ${porLoja.map((l) => l.envio.lojaNome).join(" e ")}.`}
          </p>
        </div>
      )}

      {/* O orçamento para o cliente é do boxOS, vendido à parte. */}
      {!usaBoxOS && <VitrineBoxOS compacta={Boolean(c.pedidoEm)} />}
    </div>
  );
}

function ModalOrcamento({
  c,
  url,
  onFechar,
  onCriado,
}: {
  c: CotacaoVista;
  url: string;
  onFechar: () => void;
  onCriado: (numero: number) => void;
}) {
  const cadastrado = Boolean(c.clienteId);
  const [nome, setNome] = useState("");
  const [maoDeObra, setMaoDeObra] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const linhas = c.pecas.flatMap((p) => {
    const o = escolhaDa(c, p);
    return o ? [{ peca: p, venda: precoDaPeca(p, o.preco, c.margem) }] : [];
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
      const r = await enviarJson(`${url}/orcamento`, "POST", {
        clienteNome: cadastrado ? null : nome.trim(),
        maoDeObra: mo,
      })();
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(corpo.error ?? "Não consegui criar o orçamento.");
        return;
      }
      onCriado(corpo.numero);
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
            Cliente: <strong className="text-tinta">{c.clienteNome ?? "cadastrado"}</strong>, já ligado ao carro
            pela placa.
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
            {linhas.map(({ peca, venda }) => (
              <li key={peca.id} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="min-w-0 text-tinta">
                  {peca.quantidade}× {peca.descricao}
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
            O cliente não vê a marca, a loja nem o custo. Isso fica guardado só para você, no orçamento.
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

function PainelEntrega({
  c,
  url,
  gravar,
  onGerar,
}: {
  c: CotacaoVista & { pedidoEm: string };
  url: string;
  gravar: Gravar;
  onGerar: () => void;
}) {
  const avisar = useAvisar();
  const confirmar = useConfirmar();
  const usaBoxOS = useUsaBoxOS();
  const linkDoBoxOS = useLinkDoBoxOS();
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [devolvendo, setDevolvendo] = useState<string | null>(null);

  // Só entra no pedido a loja de quem se escolheu alguma peça.
  const doPedido = c.envios.filter((e) => c.pecas.some((p) => e.ofertas.some((o) => o.id === p.ofertaId)));

  /**
   * Só a oficina fecha a entrega. Antes de a loja marcar "entregue" pede confirmação:
   * não tem volta, e o balcão da loja passa a mostrar entregue também.
   */
  async function confirmarRecebimento(envio: CotacaoVista["envios"][number]) {
    if (!aConferir(envio)) {
      const ok = await confirmar({
        titulo: `As peças da ${envio.lojaNome} chegaram?`,
        texto: "A loja ainda não marcou como entregue. Confirmando, a entrega fecha aqui e no balcão dela.",
        acao: "Chegaram, confirmar",
      });
      if (!ok) return;
    }
    setConfirmando(envio.id);
    const r = await gravar(enviarJson(`${url}/recebido`, "POST", { envioId: envio.id }), { devolveDado: true });
    setConfirmando(null);
    if (!r.ok) return avisar(r.erro, "erro");
    avisar(`Recebimento das peças da ${envio.lojaNome} confirmado`);
  }

  // Com devolução aberta as peças já estão na oficina: o próximo passo continua valendo.
  const tudoEntregue = tudoRecebido(c);
  const envioDevolvendo = doPedido.find((e) => e.id === devolvendo);

  return (
    <Painel
      titulo="Pedido das peças"
      ajuda={`Pedido feito às ${horaCurta(c.pedidoEm)}. A entrega atualiza sozinha, conforme a loja avança.`}
    >
      <div className="space-y-4">
        {doPedido.map((e) => {
          const etapa = e.entrega ?? "ENVIADO";
          const posicao = ETAPAS_ENTREGA.findIndex((x) => x.value === etapa);
          const pecas = c.pecas.filter((p) => e.ofertas.some((o) => o.id === p.ofertaId));
          const conferir = aConferir(e);
          return (
            <div
              key={e.id}
              className="rounded-lg border border-linha p-3"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-tinta">
                {conferir && <span className="h-2 w-2 rounded-full bg-[rgb(var(--gr-sem-resposta))]" aria-hidden />}
                {e.lojaNome}
              </p>
              <ul className="mt-1 text-xs text-tinta-3">
                {pecas.map((p) => (
                  <li key={p.id}>
                    {p.quantidade}× {p.descricao} ({escolhaDa(c, p)?.marca})
                  </li>
                ))}
              </ul>
              <ol className="mt-3 grid grid-cols-4 gap-1">
                {ETAPAS_ENTREGA.map((x, i) => (
                  <li key={x.value} className="min-w-0">
                    <div className={cn("h-1.5 rounded-full", i <= posicao ? "bg-ok" : "bg-superficie-3")} />
                    <p
                      className={cn(
                        "mt-1 text-[0.7rem] leading-tight",
                        i === posicao ? "font-semibold text-tinta" : "text-tinta-3"
                      )}
                    >
                      {x.rotulo}
                    </p>
                  </li>
                ))}
              </ol>
              {e.oficinaRecebeuEm ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-ok">
                  <Confere tamanho={16} className="shrink-0" />
                  Recebimento confirmado às {horaCurta(e.oficinaRecebeuEm)}
                </p>
              ) : conferir ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-atencao">
                    A loja marcou como entregue. Confira as peças e confirme o recebimento.
                  </p>
                  <Botao
                    variante="sucesso"
                    onClick={() => confirmarRecebimento(e)}
                    disabled={confirmando === e.id}
                    className="w-full sm:w-auto"
                  >
                    <Confere tamanho={16} />
                    {confirmando === e.id ? "Confirmando..." : "Confirmar recebimento"}
                  </Botao>
                </div>
              ) : (
                <Botao
                  variante="secundario"
                  tamanho="denso"
                  onClick={() => confirmarRecebimento(e)}
                  disabled={confirmando === e.id}
                  className="mt-3"
                >
                  {confirmando === e.id ? "Confirmando..." : "Já chegou? Marcar como recebido"}
                </Botao>
              )}
              <DevolucoesDaLoja c={c} envio={e} url={url} gravar={gravar} />
              {podeDevolver(e) && temOQueDevolver(c, e) && (
                <Botao variante="secundario" tamanho="denso" onClick={() => setDevolvendo(e.id)} className="mt-3">
                  Devolver uma peça
                </Botao>
              )}
            </div>
          );
        })}

        {envioDevolvendo && (
          <ModalDevolucao c={c} envio={envioDevolvendo} url={url} gravar={gravar} onFechar={() => setDevolvendo(null)} />
        )}

        {tudoEntregue && (
          <div className="space-y-2 border-l-[3px] border-[rgb(var(--gr-vendida))] py-0.5 pl-3.5">
            <p className="text-sm font-semibold text-tinta">Peças na oficina.</p>
            {c.orcamento ? (
              <>
                <p className="text-sm text-tinta-2">Agora é converter o orçamento em OS. Só falta o telefone do cliente.</p>
                <BotaoLink href={linkDoBoxOS(`/orcamentos/${c.orcamento.id}`)} variante="sucesso" tamanho="denso">
                  Abrir o orçamento #{c.orcamento.numero} e converter em OS
                </BotaoLink>
              </>
            ) : usaBoxOS ? (
              <>
                <p className="text-sm text-tinta-2">Quer passar para o cliente? O orçamento sai destas peças, no boxOS.</p>
                <Botao variante="sucesso" tamanho="denso" onClick={onGerar}>
                  Gerar orçamento
                </Botao>
              </>
            ) : null}
          </div>
        )}
      </div>
    </Painel>
  );
}
