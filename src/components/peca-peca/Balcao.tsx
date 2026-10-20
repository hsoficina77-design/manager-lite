"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Aviso, CampoDinheiro, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { useAvisar } from "@/components/ui/Avisos";
import { Confere, Lixeira, Mais, PecaPeca, Voltar } from "@/components/ui/Icones";
import {
  ETAPAS_ENTREGA,
  SITUACOES_NO_BALCAO,
  descricaoDoVeiculo,
  proximaEtapa,
  respostaSimulada,
  rotuloDaEntrega,
  type CaixaDoBalcao,
  type EnvioNoBalcao,
} from "./regras";
import { enviarJson, tocarAviso, useAoVivo, useTituloComContador } from "./aoVivo";
import { AvisoSemConexao, haQuanto, horaCurta } from "./ui";

// O balcão é a tela da autopeça — outra empresa, sem conta no boxOS, aberta por um
// link secreto. Por isso não tem o menu do boxOS, e só mostra o que a loja precisa:
// o carro, as peças, as próprias respostas e o pedido quando a oficina fecha.

export type LojaDoBalcao = { nome: string; cidade: string | null; entregaMin: number; entregaMax: number };

function Moldura({ loja, children }: { loja: LojaDoBalcao; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-fundo">
      <header className="border-b border-linha bg-superficie">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <PecaPeca tamanho={24} className="shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <p className="font-marca text-sm font-bold leading-tight text-tinta">
              Peça<span className="text-brand-texto">Peça</span>
              <span className="ml-1.5 font-sans text-xs font-medium text-tinta-3">· Balcão</span>
            </p>
            <p className="truncate text-xs text-tinta-3">
              {loja.nome}
              {loja.cidade && ` · ${loja.cidade}`}
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5 pb-segura">{children}</main>
    </div>
  );
}

// ─── Caixa de entrada ───────────────────────────────────────────────────────

export function CaixaDoBalcaoTela({ token, loja }: { token: string; loja: LojaDoBalcao }) {
  const avisar = useAvisar();
  const { dados, semConexao } = useAoVivo<CaixaDoBalcao>(`/api/balcao/${token}`, 4000);
  const envios = dados?.envios ?? [];

  const responder = envios.filter((e) => e.situacao === "RESPONDER");
  const pedidos = envios.filter((e) => e.situacao === "PEDIDO");
  const pedidosAbertos = pedidos.filter((e) => e.entrega !== "ENTREGUE");
  const pedidosNovos = pedidos.filter((e) => e.entrega === "ENVIADO");
  const outras = envios.filter((e) => e.situacao !== "RESPONDER" && e.situacao !== "PEDIDO");
  const decididas = envios.filter((e) => e.situacao === "PEDIDO" || e.situacao === "OUTRA_LOJA");

  // O que pede ação vai para a aba do navegador; quando aumenta, toca.
  const pendentes = responder.length + pedidosNovos.length;
  useTituloComContador(`Balcão · ${loja.nome}`, pendentes);
  const antes = useRef<{ cotacoes: Set<string>; pedidos: Set<string> } | null>(null);
  useEffect(() => {
    if (!dados) return;
    const agora = { cotacoes: new Set(responder.map((e) => e.id)), pedidos: new Set(pedidosNovos.map((e) => e.id)) };
    const anterior = antes.current;
    antes.current = agora;
    if (!anterior) return;
    const novasCotacoes = responder.filter((e) => !anterior.cotacoes.has(e.id));
    const novosPedidos = pedidosNovos.filter((e) => !anterior.pedidos.has(e.id));
    novasCotacoes.forEach((e) => avisar(`Nova cotação de ${e.oficina}`));
    novosPedidos.forEach((e) => avisar(`Pedido fechado por ${e.oficina}!`));
    if (novasCotacoes.length + novosPedidos.length > 0) tocarAviso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  return (
    <Moldura loja={loja}>
      <div>
        {/* O nome sozinho: "da Yoshio", mas "do Bom Preço" — o artigo muda de loja para loja. */}
        <h1 className="text-xl font-bold text-tinta">{loja.nome}</h1>
        <p className="mt-0.5 text-sm text-tinta-3">
          Balcão da loja. Deixe esta tela aberta: ela se atualiza sozinha e avisa com som quando chega cotação ou
          pedido.
        </p>
      </div>

      <AvisoSemConexao ativo={semConexao} />

      {!dados ? (
        <EsqueletoLista linhas={3} />
      ) : envios.length === 0 ? (
        <Vazio
          titulo="Nenhuma cotação ainda"
          texto="Quando uma oficina pedir peças para a loja, a cotação aparece aqui na hora."
        />
      ) : (
        <>
          {decididas.length > 0 && (
            <p className="rounded-xl border border-linha bg-superficie px-4 py-3 text-sm text-tinta-2">
              A loja fechou <strong className="text-tinta">{pedidos.length}</strong> de {decididas.length}{" "}
              {decididas.length === 1 ? "cotação decidida" : "cotações decididas"}.
            </p>
          )}

          {pedidosAbertos.length > 0 && (
            <Secao titulo="Pedidos para separar">
              <Lista envios={pedidosAbertos} token={token} />
            </Secao>
          )}

          <Secao titulo="Para responder">
            {responder.length === 0 ? (
              <p className="text-sm text-tinta-3">Nada esperando resposta.</p>
            ) : (
              <Lista envios={responder} token={token} />
            )}
          </Secao>

          {(outras.length > 0 || pedidos.length > pedidosAbertos.length) && (
            <Secao titulo="Respondidas">
              <Lista envios={[...outras, ...pedidos.filter((e) => e.entrega === "ENTREGUE")]} token={token} />
            </Secao>
          )}
        </>
      )}
    </Moldura>
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

function Lista({ envios, token }: { envios: EnvioNoBalcao[]; token: string }) {
  return (
    <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
      {envios.map((e) => (
        <Link
          key={e.id}
          href={`/balcao/${token}/${e.id}`}
          className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-tinta">
              {e.oficina} · {descricaoDoVeiculo(e.veiculo)}
              {e.veiculo.motor && <span className="text-tinta-3"> · {e.veiculo.motor}</span>}
            </p>
            <p className="truncate text-xs text-tinta-3">
              {e.pecas.length} {e.pecas.length === 1 ? "peça" : "peças"} · chegou {haQuanto(e.recebidoEm)}
            </p>
          </div>
          <span className={cn(SITUACOES_NO_BALCAO[e.situacao].cor, "self-start sm:self-auto")}>
            {e.situacao === "PEDIDO" && e.entrega ? rotuloDaEntrega(e.entrega) : SITUACOES_NO_BALCAO[e.situacao].rotulo}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ─── Uma cotação no balcão ──────────────────────────────────────────────────

export function EnvioDoBalcaoTela({ token, envioId, loja }: { token: string; envioId: string; loja: LojaDoBalcao }) {
  const url = `/api/balcao/${token}/${envioId}`;
  const { dados: envio, naoEncontrado, semConexao, gravar } = useAoVivo<EnvioNoBalcao>(url, 4000);
  useTituloComContador(`Balcão · ${loja.nome}`, 0);

  const voltar = (
    <Link
      href={`/balcao/${token}`}
      className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-tinta-2 hover:text-tinta"
    >
      <Voltar tamanho={16} />
      Todas as cotações
    </Link>
  );

  if (naoEncontrado) {
    return (
      <Moldura loja={loja}>
        {voltar}
        <Vazio titulo="Cotação não encontrada" texto="A oficina pode ter excluído esta cotação." />
      </Moldura>
    );
  }

  if (!envio) {
    return (
      <Moldura loja={loja}>
        {voltar}
        <EsqueletoLista linhas={4} />
      </Moldura>
    );
  }

  return (
    <Moldura loja={loja}>
      {voltar}
      <div>
        <h1 className="text-xl font-bold text-tinta">Cotação de {envio.oficina}</h1>
        <p className="mt-0.5 text-sm text-tinta-3">
          Chegou às {horaCurta(envio.recebidoEm)}
          {envio.respondidaEm && ` · respondida às ${horaCurta(envio.respondidaEm)}`}
        </p>
      </div>

      <AvisoSemConexao ativo={semConexao} />

      {envio.situacao === "PEDIDO" && <PedidoNoBalcao envio={envio} url={url} gravar={gravar} />}

      {/* O que o balconista precisa para conferir a aplicação — e nada da oficina além do nome. */}
      <Painel titulo="Veículo">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ["Placa", envio.veiculo.placa || "—"],
            ["Marca", envio.veiculo.marca || "—"],
            ["Modelo e ano", [envio.veiculo.modelo, envio.veiculo.ano].filter(Boolean).join(" ") || "—"],
            ["Motor", envio.veiculo.motor || "não informado"],
          ].map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-xs text-tinta-3">{rotulo}</dt>
              <dd className={cn("font-medium text-tinta", rotulo === "Placa" && "font-mono tracking-widest")}>{valor}</dd>
            </div>
          ))}
        </dl>
      </Painel>

      {envio.travada ? (
        <RespostaFechada envio={envio} />
      ) : (
        // A chave refaz o formulário se a cotação mudar de peças; as atualizações
        // automáticas não mexem no que o balconista está digitando.
        <FormResposta key={envio.id} envio={envio} url={url} loja={loja} gravar={gravar} token={token} />
      )}
    </Moldura>
  );
}

type GravarEnvio = ReturnType<typeof useAoVivo<EnvioNoBalcao>>["gravar"];

function PedidoNoBalcao({ envio, url, gravar }: { envio: EnvioNoBalcao; url: string; gravar: GravarEnvio }) {
  const avisar = useAvisar();
  const [avancando, setAvancando] = useState(false);
  const etapa = envio.entrega ?? "ENVIADO";
  const posicao = ETAPAS_ENTREGA.findIndex((e) => e.value === etapa);
  const proxima = proximaEtapa(etapa);
  const pedidas = envio.pecas.filter((p) => p.pedida);

  async function avancar() {
    setAvancando(true);
    const r = await gravar(enviarJson(`${url}/entrega`, "POST"), { devolveDado: true });
    setAvancando(false);
    if (!r.ok) avisar(r.erro, "erro");
  }

  return (
    <section className="space-y-3 rounded-xl border-2 border-ok-linha bg-ok-fraco p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ok">Pedido fechado</p>
          <p className="text-sm text-tinta-2">Separe e mande para {envio.oficina}:</p>
        </div>
        {proxima ? (
          <Botao variante="sucesso" onClick={avancar} disabled={avancando}>
            {avancando ? "Salvando..." : `Marcar: ${rotuloDaEntrega(proxima).toLowerCase()}`}
          </Botao>
        ) : (
          <span className="status status-entregue">Entregue</span>
        )}
      </div>
      <ul className="space-y-1 rounded-lg bg-superficie p-3 text-sm">
        {pedidas.map((p) => (
          <li key={p.id} className="text-tinta">
            <strong>{p.quantidade}×</strong> {p.descricao} <span className="text-tinta-3">({p.pedida})</span>
          </li>
        ))}
      </ul>
      <ol className="grid grid-cols-4 gap-1">
        {ETAPAS_ENTREGA.map((e, i) => (
          <li key={e.value} className="min-w-0">
            <div className={cn("h-1.5 rounded-full", i <= posicao ? "bg-ok" : "bg-superficie-3")} />
            <p className={cn("mt-1 text-[0.7rem] leading-tight", i === posicao ? "font-semibold text-tinta" : "text-tinta-3")}>
              {e.rotulo}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RespostaFechada({ envio }: { envio: EnvioNoBalcao }) {
  const textos: Partial<Record<EnvioNoBalcao["situacao"], string>> = {
    COM_O_CLIENTE: "A oficina mandou o orçamento para o cliente com peças da loja. Se ele aprovar, o pedido chega aqui.",
    OUTRA_LOJA: "Desta vez a oficina fechou com outra loja.",
    ENCERRADA: "A oficina fechou a cotação antes da resposta da loja.",
  };
  const texto = textos[envio.situacao];
  return (
    <>
      {texto && <Aviso tipo="atencao">{texto}</Aviso>}
      <Painel titulo="Resposta da loja">
        <ul className="divide-y divide-linha">
          {envio.pecas.map((p) => (
            <li key={p.id} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-tinta">
                {p.quantidade}× {p.descricao}
              </p>
              {p.ofertas.length === 0 ? (
                <p className="text-xs text-tinta-3">Não tinha.</p>
              ) : (
                p.ofertas.map((o) => (
                  <p key={o.id} className="text-xs text-tinta-3">
                    {o.marca} · {formatCurrency(o.preco)} · {o.prazoMin} min
                    {p.pedida === o.marca && <span className="ml-1 font-semibold text-ok">pedida</span>}
                  </p>
                ))
              )}
            </li>
          ))}
        </ul>
      </Painel>
    </>
  );
}

type OfertaEmEdicao = { chave: string; id?: string; marca: string; preco: string; prazo: string };
type Rascunho = Record<string, { naoTem: boolean; ofertas: OfertaEmEdicao[] }>;

let contador = 0;
const chaveNova = () => `nova-${(contador += 1)}`;

function FormResposta({
  envio,
  url,
  loja,
  gravar,
  token,
}: {
  envio: EnvioNoBalcao;
  url: string;
  loja: LojaDoBalcao;
  gravar: GravarEnvio;
  token: string;
}) {
  const avisar = useAvisar();
  const prazoPadrao = String(loja.entregaMin);
  const vazia = (): OfertaEmEdicao => ({ chave: chaveNova(), marca: "", preco: "", prazo: prazoPadrao });

  const [rascunho, setRascunho] = useState<Rascunho>(() =>
    Object.fromEntries(
      envio.pecas.map((p) => [
        p.id,
        envio.respondidaEm
          ? {
              naoTem: p.ofertas.length === 0,
              ofertas: p.ofertas.map((o) => ({
                chave: o.id,
                id: o.id,
                marca: o.marca,
                preco: String(o.preco),
                prazo: String(o.prazoMin),
              })),
            }
          : { naoTem: false, ofertas: [vazia()] },
      ])
    )
  );
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  function mudarOferta(pecaId: string, chave: string, campo: "marca" | "preco" | "prazo", valor: string) {
    setRascunho((r) => ({
      ...r,
      [pecaId]: { ...r[pecaId], ofertas: r[pecaId].ofertas.map((o) => (o.chave === chave ? { ...o, [campo]: valor } : o)) },
    }));
  }

  function alternarNaoTem(pecaId: string, naoTem: boolean) {
    setRascunho((r) => ({
      ...r,
      [pecaId]: { naoTem, ofertas: naoTem ? [] : r[pecaId].ofertas.length ? r[pecaId].ofertas : [vazia()] },
    }));
  }

  /** Preenche com uma resposta plausível — para testar rápido. */
  function sugerir() {
    const sugestao = respostaSimulada(envio.pecas, loja);
    setRascunho(
      Object.fromEntries(
        envio.pecas.map((p) => {
          const ofertas = sugestao[p.id] ?? [];
          return [
            p.id,
            {
              naoTem: ofertas.length === 0,
              ofertas: ofertas.map((o) => ({ chave: chaveNova(), marca: o.marca, preco: String(o.preco), prazo: String(o.prazoMin) })),
            },
          ];
        })
      )
    );
  }

  async function enviar() {
    const itens: Record<string, { id?: string; marca: string; preco: number; prazoMin: number }[]> = {};
    for (const p of envio.pecas) {
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
        prazoMin: Math.max(0, Math.round(Number(o.prazo) || 0)),
      }));
    }
    setErro("");
    setEnviando(true);
    const r = await gravar(enviarJson(`${url}/resposta`, "POST", { itens }), { devolveDado: true });
    setEnviando(false);
    if (!r.ok) return setErro(r.erro);
    avisar("Resposta enviada para a oficina");
    setEnviada(true);
  }

  if (enviada) {
    return (
      <div className="space-y-3 rounded-xl border border-ok-linha bg-ok-fraco p-5">
        <p className="flex items-center gap-2 font-semibold text-ok">
          <Confere tamanho={18} />
          Resposta enviada
        </p>
        <p className="text-sm text-tinta-2">
          {envio.oficina} já está vendo os preços da loja. Se fechar com vocês, o pedido aparece em
          &ldquo;Pedidos para separar&rdquo;, com aviso.
        </p>
        <div className="flex flex-wrap gap-2">
          <BotaoLink href={`/balcao/${token}`} variante="sucesso">
            Voltar às cotações
          </BotaoLink>
          <Botao variante="secundario" onClick={() => setEnviada(false)}>
            Corrigir a resposta
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-tinta-3">Mais de uma marca? Mande as duas: a oficina escolhe.</p>
        <Botao variante="secundario" tamanho="denso" onClick={sugerir}>
          Preencher com sugestão
        </Botao>
      </div>

      {envio.pecas.map((p) => {
        const r = rascunho[p.id];
        return (
          <Painel key={p.id} titulo={`${p.quantidade}× ${p.descricao}`}>
            <label className="mb-3 flex min-h-9 w-fit cursor-pointer items-center gap-2 text-sm text-tinta-2">
              <input
                type="checkbox"
                checked={r.naoTem}
                onChange={(e) => alternarNaoTem(p.id, e.target.checked)}
                className="h-5 w-5 accent-brand-600"
              />
              Não tenho esta peça
            </label>

            {!r.naoTem && (
              <div className="space-y-2">
                {r.ofertas.map((o) => (
                  <div key={o.chave} className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:grid-cols-[1fr_8rem_6rem_auto]">
                    <Entrada
                      value={o.marca}
                      onChange={(e) => mudarOferta(p.id, o.chave, "marca", e.target.value)}
                      placeholder="Marca (ex.: Cobreq)"
                      aria-label="Marca"
                      className="col-span-3 sm:col-span-1"
                    />
                    <CampoDinheiro
                      valor={o.preco}
                      onChange={(v) => mudarOferta(p.id, o.chave, "preco", v)}
                      placeholder="Preço"
                      aria-label={`Preço${p.quantidade > 1 ? " de cada unidade" : ""}`}
                    />
                    <div className="relative">
                      <Entrada
                        value={o.prazo}
                        onChange={(e) => mudarOferta(p.id, o.chave, "prazo", e.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        aria-label="Prazo de entrega em minutos"
                        className="pr-10 text-right tabular-nums"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-tinta-3">
                        min
                      </span>
                    </div>
                    <Botao
                      variante="fantasma"
                      tamanho="icone"
                      onClick={() =>
                        setRascunho((x) => ({
                          ...x,
                          [p.id]: { ...x[p.id], ofertas: x[p.id].ofertas.filter((y) => y.chave !== o.chave) },
                        }))
                      }
                      disabled={r.ofertas.length === 1}
                      aria-label="Tirar esta marca"
                      className="text-perigo"
                    >
                      <Lixeira tamanho={16} />
                    </Botao>
                  </div>
                ))}
                <Botao
                  variante="fantasma"
                  tamanho="denso"
                  onClick={() =>
                    setRascunho((x) => ({ ...x, [p.id]: { naoTem: false, ofertas: [...x[p.id].ofertas, vazia()] } }))
                  }
                >
                  <Mais tamanho={14} />
                  Outra marca
                </Botao>
              </div>
            )}
          </Painel>
        );
      })}

      {erro && <Aviso>{erro}</Aviso>}

      <div className="flex justify-end">
        <Botao onClick={enviar} disabled={enviando} className="w-full sm:w-auto">
          {enviando ? "Enviando..." : envio.respondidaEm ? "Enviar resposta corrigida" : "Enviar resposta para a oficina"}
        </Botao>
      </div>
    </>
  );
}
