"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Botao, BotaoLink, classesBotao } from "@/components/ui/Botao";
import { Aviso, Campo, CampoDinheiro, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { Modal } from "@/components/ui/Modal";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Confere } from "@/components/ui/Icones";
import {
  ETAPAS_ENTREGA,
  descricaoDoVeiculo,
  escolhaDa,
  etapaDa,
  lojasSemAPeca,
  ofertasDa,
  precoDaPeca,
  rotuloDaEntrega,
  totaisDa,
  type CotacaoVista,
  type LojaVista,
  type LojasDaOficina,
} from "./regras";
import { enviarJson, tocarAviso, useAoVivo } from "./aoVivo";
import { AvisoSemConexao, Cabecalho, PilulaEtapa, horaCurta } from "./ui";

type Gravar = ReturnType<typeof useAoVivo<CotacaoVista>>["gravar"];

export function DetalheCotacao({ id }: { id: string }) {
  const url = `/api/peca-peca/cotacoes/${id}`;
  const { dados: cotacao, naoEncontrado, semConexao, carregar, gravar } = useAoVivo<CotacaoVista>(url, 4000);
  const { dados: daOficina } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojas = daOficina?.lojas ?? null;
  useAvisosDasLojas(cotacao);

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

  return (
    <Conteudo c={cotacao} url={url} lojas={lojas} gravar={gravar} recarregar={carregar} semConexao={semConexao} />
  );
}

/**
 * Avisa quando uma loja responde ou anda com a entrega — com som, porque quem cota
 * costuma estar com a tela de lado. A primeira leitura não conta: é o estado de partida.
 */
function useAvisosDasLojas(c: CotacaoVista | null) {
  const avisar = useAvisar();
  const anterior = useRef<Map<string, { respondidaEm: string | null; entrega: string | null }> | null>(null);

  useEffect(() => {
    if (!c) return;
    const agora = new Map(c.envios.map((e) => [e.id, { respondidaEm: e.respondidaEm, entrega: e.entrega }]));
    const antes = anterior.current;
    anterior.current = agora;
    if (!antes) return;

    const novidades: string[] = [];
    for (const e of c.envios) {
      const era = antes.get(e.id);
      if (!era) continue;
      if (e.respondidaEm && e.respondidaEm !== era.respondidaEm) {
        novidades.push(era.respondidaEm ? `${e.lojaNome} corrigiu a resposta` : `${e.lojaNome} respondeu`);
      }
      if (e.entrega && e.entrega !== era.entrega && era.entrega) {
        novidades.push(`${e.lojaNome}: ${rotuloDaEntrega(e.entrega).toLowerCase()}`);
      }
    }
    if (novidades.length > 0) {
      novidades.forEach((n) => avisar(n));
      tocarAviso();
    }
  }, [c, avisar]);
}

const LINHA_DO_TEMPO = ["Enviada", "Lojas responderam", "Orçamento", "Pedido", "Entregue"];
const POSICAO = { AGUARDANDO: 0, RESPONDIDA: 1, ORCAMENTO: 2, PEDIDO: 3, ENTREGUE: 4 } as const;

function Conteudo({
  c: doServidor,
  url,
  lojas,
  gravar,
  recarregar,
  semConexao,
}: {
  c: CotacaoVista;
  url: string;
  lojas: LojaVista[] | null;
  gravar: Gravar;
  recarregar: () => Promise<void>;
  semConexao: boolean;
}) {
  const router = useRouter();
  const confirmar = useConfirmar();
  const avisar = useAvisar();
  const [gerando, setGerando] = useState(false);

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

  const posicao = POSICAO[etapaDa(c)];
  const pendentes = c.envios.filter((e) => !e.respondidaEm);
  const respondeu = pendentes.length < c.envios.length;
  // Depois do orçamento, mudar a escolha faria a cotação contar uma história e o
  // orçamento outra.
  const travado = Boolean(c.orcamento);
  const linkDaLoja = new Map((lojas ?? []).map((l) => [l.id, l.link]));

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
            {c.clienteNome && <span>· {c.clienteNome}</span>}
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

      <AvisoSemConexao ativo={semConexao} />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Com o orçamento feito, o que importa agora é o pedido: ele sobe. */}
          {c.orcamento && <PainelPedido c={c} url={url} gravar={gravar} linkDaLoja={linkDaLoja} />}

          <PainelLojas
            c={c}
            travado={travado}
            linkDaLoja={linkDaLoja}
            onSimular={async () => {
              const r = await gravar(enviarJson(`${url}/simular`, "POST"), { devolveDado: true });
              if (!r.ok) avisar(r.erro, "erro");
            }}
          />

          {respondeu ? (
            <PainelEscolha
              c={c}
              travado={travado}
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
              texto="Quando o balconista responder, os preços aparecem aqui sozinhos, lado a lado. Para testar, abra o balcão da loja em outra aba, ou simule as respostas."
            />
          )}

          {!travado && (
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
            travado={travado}
            margemDigitada={rascunhoMargem}
            onDigitarMargem={setRascunhoMargem}
            onSalvarMargem={salvarMargem}
            onGerar={() => setGerando(true)}
          />
          <Botao variante="fantasma" tamanho="denso" onClick={excluir} className="w-full text-perigo">
            Excluir cotação
          </Botao>
        </aside>
      </div>

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

function PainelLojas({
  c,
  travado,
  linkDaLoja,
  onSimular,
}: {
  c: CotacaoVista;
  travado: boolean;
  linkDaLoja: Map<string, string | undefined>;
  onSimular: () => Promise<void>;
}) {
  const [simulando, setSimulando] = useState(false);
  const faltam = c.envios.some((e) => !e.respondidaEm);

  return (
    <Painel
      titulo="Lojas"
      ajuda="Atualiza sozinho. O balconista confere a aplicação de cada peça antes de responder."
      acao={
        faltam &&
        !travado && (
          <Botao
            variante="secundario"
            tamanho="denso"
            disabled={simulando}
            onClick={async () => {
              setSimulando(true);
              await onSimular();
              setSimulando(false);
            }}
          >
            {simulando ? "Simulando..." : "Simular as que faltam"}
          </Botao>
        )
      }
    >
      <ul className="divide-y divide-linha">
        {c.envios.map((e) => {
          const temQuantas = c.pecas.filter((p) => e.ofertas.some((o) => o.pecaId === p.id)).length;
          const link = linkDaLoja.get(e.lojaId);
          return (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", e.respondidaEm ? "bg-ok" : "animate-pulse bg-atencao")}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tinta">{e.lojaNome}</p>
                <p className="text-xs text-tinta-3">
                  {e.respondidaEm
                    ? `Respondeu às ${horaCurta(e.respondidaEm)} · tem ${temQuantas} de ${c.pecas.length} peças`
                    : "Esperando o balconista responder"}
                </p>
              </div>
              {link && (
                <a
                  href={`${link}/${e.id}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs font-medium text-brand-texto underline-offset-2 hover:underline"
                >
                  Abrir no balcão
                </a>
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
  travado,
  aguardando,
  onEscolher,
  onMenorPreco,
}: {
  c: CotacaoVista;
  travado: boolean;
  aguardando: boolean;
  onEscolher: (pecaId: string, ofertaId: string) => void;
  onMenorPreco: () => void;
}) {
  return (
    <Painel
      titulo={travado ? "Peças escolhidas" : "Escolha as peças"}
      ajuda={
        travado
          ? "O orçamento já saiu com estas escolhas."
          : "Pode misturar: cada peça da loja que for melhor. A marca é só para você; o cliente não vê."
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
                    : aguardando
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
                          onChange={() => onEscolher(p.id, o.id)}
                          className="h-5 w-5 shrink-0 accent-brand-600"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-semibold text-tinta">{o.marca}</span>
                          <span className="text-sm text-tinta-3"> · {o.lojaNome}</span>
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
                          </span>
                          {p.quantidade > 1 && <span className="block text-[0.7rem] text-tinta-3">cada</span>}
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

  return (
    <Painel
      titulo="Preço para o cliente"
      ajuda={`Já vem com a sua margem de ${c.margem}%. Mude o preço de qualquer peça antes de gerar o orçamento.`}
      acao={
        editadas > 0 && (
          <Botao variante="secundario" tamanho="denso" onClick={onTudoNaMargem}>
            Tudo em {c.margem}%
          </Botao>
        )
      }
    >
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
                  {oferta.marca} · {oferta.lojaNome}
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
    </Painel>
  );
}

// ─── Resumo e orçamento ─────────────────────────────────────────────────────

function Resumo({
  c,
  travado,
  margemDigitada,
  onDigitarMargem,
  onSalvarMargem,
  onGerar,
}: {
  c: CotacaoVista;
  travado: boolean;
  margemDigitada: string | null;
  onDigitarMargem: (v: string) => void;
  onSalvarMargem: () => void;
  onGerar: () => void;
}) {
  const t = totaisDa(c);
  // Só conta preço digitado de peça que está escolhida.
  const comPrecoProprio = c.pecas.filter((p) => p.ofertaId && p.vendaUnit !== null).length;

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
              : "Sai pronto no boxOS, com os preços acima. Só falta o nome do cliente."}
          </p>
        </>
      )}
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

function PainelPedido({
  c,
  url,
  gravar,
  linkDaLoja,
}: {
  c: CotacaoVista;
  url: string;
  gravar: Gravar;
  linkDaLoja: Map<string, string | undefined>;
}) {
  const avisar = useAvisar();
  const [pedindo, setPedindo] = useState(false);
  const [erro, setErro] = useState("");
  const orcamento = c.orcamento!;

  // Só entra no pedido a loja de quem se escolheu alguma peça.
  const doPedido = c.envios.filter((e) => c.pecas.some((p) => e.ofertas.some((o) => o.id === p.ofertaId)));

  async function pedir() {
    setErro("");
    setPedindo(true);
    const r = await gravar(enviarJson(`${url}/pedido`, "POST"), { devolveDado: true });
    setPedindo(false);
    if (!r.ok) return setErro(r.erro);
    avisar(doPedido.length === 1 ? "Pedido enviado à loja" : "Pedido enviado às lojas");
  }

  if (!c.pedidoEm) {
    return (
      <Painel titulo="Pedido das peças">
        <p className="text-sm text-tinta-2">
          Mandou o orçamento #{orcamento.numero} para o cliente? Quando ele aprovar, o pedido sai daqui direto para o
          balcão de {doPedido.map((e) => e.lojaNome).join(" e ")}.
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
    <Painel
      titulo="Pedido das peças"
      ajuda={`Pedido feito às ${horaCurta(c.pedidoEm)}. Quem avança a entrega é o balconista, do balcão dele; aqui atualiza sozinho.`}
    >
      <div className="space-y-4">
        {doPedido.map((e) => {
          const etapa = e.entrega ?? "ENVIADO";
          const posicao = ETAPAS_ENTREGA.findIndex((x) => x.value === etapa);
          const pecas = c.pecas.filter((p) => e.ofertas.some((o) => o.id === p.ofertaId));
          const link = linkDaLoja.get(e.lojaId);
          return (
            <div key={e.id} className="rounded-lg border border-linha p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-tinta">{e.lojaNome}</p>
                {link && etapa !== "ENTREGUE" && (
                  <a
                    href={`${link}/${e.id}`}
                    target="_blank"
                    rel="noopener"
                    className={classesBotao("secundario", "denso")}
                  >
                    Abrir no balcão
                  </a>
                )}
              </div>
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
            </div>
          );
        })}

        {tudoEntregue && (
          <div className="space-y-2 rounded-lg border border-ok-linha bg-ok-fraco p-3">
            <p className="text-sm font-semibold text-ok">Peças na oficina.</p>
            <p className="text-sm text-tinta-2">Agora é converter o orçamento em OS. Só falta o telefone do cliente.</p>
            <BotaoLink href={`/orcamentos/${orcamento.id}`} variante="sucesso" tamanho="denso">
              Abrir o orçamento #{orcamento.numero} e converter em OS
            </BotaoLink>
          </div>
        )}
      </div>
    </Painel>
  );
}
