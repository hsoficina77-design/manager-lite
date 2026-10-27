"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Area, Aviso, Campo, CampoDinheiro, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { useAvisar } from "@/components/ui/Avisos";
import { Confere, Lixeira, Mais, Voltar } from "@/components/ui/Icones";
import { LogoPecaPeca } from "@/components/marca/LogoPecaPeca";
import {
  ETAPAS_ENTREGA,
  SITUACOES_NO_BALCAO,
  descricaoDoVeiculo,
  diferencaDaTroca,
  ehTroca,
  lojaPrecisaAgir,
  prazoSugerido,
  proximaEtapa,
  rotuloDaEntrega,
  rotuloDoMotivo,
  situacaoDaDevolucao,
  type CaixaDoBalcao,
  type DevolucaoVista,
  type EnvioNoBalcao,
} from "./regras";
import { enviarJson, tocarAviso, useAoVivo, useTituloComContador } from "./aoVivo";
import { AvisoSemConexao, haQuanto, horaCurta } from "./ui";

// O balcão é a tela da autopeça — outra empresa. Só mostra o que a loja precisa: o
// carro, as peças, as próprias respostas e o pedido quando a oficina fecha.
//
// Mora em dois lugares: no painel da loja (`/loja`, com login e acesso por pessoa,
// dentro da moldura do painel) e no link antigo (`/balcao/<token>`, sem conta e com
// cabeçalho próprio), que só vale enquanto a loja não tem ninguém com login.

export type LojaDoBalcao = { nome: string; cidade: string | null; entregaMedia: number | null };

/** Onde o balcão está servido: as telas e a API de cada um dos dois lugares. */
export type CaminhosDoBalcao = {
  /** A caixa de entrada. */
  inicio: string;
  /** Prefixo da tela de cada cotação: `${telas}/<envioId>`. */
  telas: string;
  /** Prefixo da API: `${api}` é a caixa, `${api}/<envioId>` a cotação. */
  api: string;
  /** O link antigo traz o próprio cabeçalho; o painel já está numa moldura. */
  comCabecalho: boolean;
};

/** O que a pessoa pode no balcão. No link antigo, tudo; no painel, o acesso dela. */
export type PodeNoBalcao = { responder: boolean; entrega: boolean; devolucao: boolean };

function Moldura({
  loja,
  comCabecalho,
  children,
}: {
  loja: LojaDoBalcao;
  comCabecalho: boolean;
  children: React.ReactNode;
}) {
  if (!comCabecalho) return <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">{children}</div>;
  return (
    <div className="min-h-[100dvh] bg-fundo">
      <header className="border-b border-linha bg-superficie">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <LogoPecaPeca className="text-base text-tinta" />
          <p className="min-w-0 flex-1 truncate text-xs text-tinta-3">
            Balcão · {loja.nome}
            {loja.cidade && ` · ${loja.cidade}`}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5 pb-segura">{children}</main>
    </div>
  );
}

// ─── Caixa de entrada ───────────────────────────────────────────────────────

export function CaixaDoBalcaoTela({ caminhos, loja }: { caminhos: CaminhosDoBalcao; loja: LojaDoBalcao }) {
  const avisar = useAvisar();
  const { dados, semConexao } = useAoVivo<CaixaDoBalcao>(caminhos.api, 4000);
  const envios = dados?.envios ?? [];

  const responder = envios.filter((e) => e.situacao === "RESPONDER");
  const pedidos = envios.filter((e) => e.situacao === "PEDIDO");
  const pedidosAbertos = pedidos.filter((e) => e.entrega !== "ENTREGUE");
  const pedidosNovos = pedidos.filter((e) => e.entrega === "ENVIADO");
  const outras = envios.filter((e) => e.situacao !== "RESPONDER" && e.situacao !== "PEDIDO");
  const decididas = envios.filter((e) => e.situacao === "PEDIDO" || e.situacao === "OUTRA_LOJA");
  // Devolução que espera a loja: responder, mandar a troca ou confirmar a peça que voltou.
  const devolucoes = envios.flatMap((e) => e.devolucoes.filter(lojaPrecisaAgir).map((d) => ({ envio: e, d })));
  const devolucoesNovas = devolucoes.filter(({ d }) => situacaoDaDevolucao(d) === "PEDIDA");

  // O que pede ação vai para a aba do navegador; quando aumenta, toca.
  const pendentes = responder.length + pedidosNovos.length + devolucoesNovas.length;
  useTituloComContador(`Balcão · ${loja.nome}`, pendentes);
  const antes = useRef<{ cotacoes: Set<string>; pedidos: Set<string>; devolucoes: Set<string> } | null>(null);
  useEffect(() => {
    if (!dados) return;
    const agora = {
      cotacoes: new Set(responder.map((e) => e.id)),
      pedidos: new Set(pedidosNovos.map((e) => e.id)),
      devolucoes: new Set(devolucoesNovas.map(({ d }) => d.id)),
    };
    const anterior = antes.current;
    antes.current = agora;
    if (!anterior) return;
    const novasCotacoes = responder.filter((e) => !anterior.cotacoes.has(e.id));
    const novosPedidos = pedidosNovos.filter((e) => !anterior.pedidos.has(e.id));
    const novasDevolucoes = devolucoesNovas.filter(({ d }) => !anterior.devolucoes.has(d.id));
    novasCotacoes.forEach((e) => avisar(`Nova cotação de ${e.oficina}`));
    novosPedidos.forEach((e) => avisar(`Pedido fechado por ${e.oficina}!`));
    novasDevolucoes.forEach(({ envio }) => avisar(`${envio.oficina} quer devolver uma peça`));
    if (novasCotacoes.length + novosPedidos.length + novasDevolucoes.length > 0) tocarAviso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  return (
    <Moldura loja={loja} comCabecalho={caminhos.comCabecalho}>
      <div>
        {/* O nome sozinho: "da Yoshio", mas "do Bom Preço" — o artigo muda de loja para loja. */}
        <h1 className="text-xl font-bold text-tinta">{loja.nome}</h1>
        <p className="mt-0.5 text-sm text-tinta-3">
          Balcão da loja. Deixe esta tela aberta: ela se atualiza sozinha e avisa com som quando chega cotação,
          pedido ou devolução.
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

          {devolucoes.length > 0 && (
            <Secao titulo="Devoluções">
              <div className="divide-y divide-linha overflow-hidden rounded-xl border border-atencao-linha bg-superficie">
                {devolucoes.map(({ envio, d }) => {
                  const situacao = situacaoNoBalcao(d);
                  return (
                    <Link
                      key={d.id}
                      href={`${caminhos.telas}/${envio.id}`}
                      className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-tinta">
                          {envio.oficina} · {d.quantidade}× {envio.pecas.find((p) => p.id === d.pecaId)?.descricao ?? "peça"}
                        </p>
                        <p className="truncate text-xs text-tinta-3">
                          {rotuloDoMotivo(d.motivo)} · {descricaoDoVeiculo(envio.veiculo)} · pedida {haQuanto(d.pedidaEm)}
                        </p>
                      </div>
                      <span className={cn(situacao.cor, "self-start sm:self-auto")}>{situacao.rotulo}</span>
                    </Link>
                  );
                })}
              </div>
            </Secao>
          )}

          {pedidosAbertos.length > 0 && (
            <Secao titulo="Pedidos para separar">
              <Lista envios={pedidosAbertos} telas={caminhos.telas} />
            </Secao>
          )}

          <Secao titulo="Para responder">
            {responder.length === 0 ? (
              <p className="text-sm text-tinta-3">Nada esperando resposta.</p>
            ) : (
              <Lista envios={responder} telas={caminhos.telas} />
            )}
          </Secao>

          {(outras.length > 0 || pedidos.length > pedidosAbertos.length) && (
            <Secao titulo="Respondidas">
              <Lista envios={[...outras, ...pedidos.filter((e) => e.entrega === "ENTREGUE")]} telas={caminhos.telas} />
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

function Lista({ envios, telas }: { envios: EnvioNoBalcao[]; telas: string }) {
  return (
    <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
      {envios.map((e) => (
        <Link
          key={e.id}
          href={`${telas}/${e.id}`}
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

export function EnvioDoBalcaoTela({
  caminhos,
  envioId,
  loja,
  pode,
}: {
  caminhos: CaminhosDoBalcao;
  envioId: string;
  loja: LojaDoBalcao;
  pode: PodeNoBalcao;
}) {
  const url = `${caminhos.api}/${envioId}`;
  const { dados: envio, naoEncontrado, semConexao, gravar } = useAoVivo<EnvioNoBalcao>(url, 4000);
  useTituloComContador(`Balcão · ${loja.nome}`, 0);
  const { comCabecalho } = caminhos;

  const voltar = (
    <Link
      href={caminhos.inicio}
      className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-tinta-2 hover:text-tinta"
    >
      <Voltar tamanho={16} />
      Todas as cotações
    </Link>
  );

  if (naoEncontrado) {
    return (
      <Moldura loja={loja} comCabecalho={comCabecalho}>
        {voltar}
        <Vazio titulo="Cotação não encontrada" texto="A oficina pode ter excluído esta cotação." />
      </Moldura>
    );
  }

  if (!envio) {
    return (
      <Moldura loja={loja} comCabecalho={comCabecalho}>
        {voltar}
        <EsqueletoLista linhas={4} />
      </Moldura>
    );
  }

  return (
    <Moldura loja={loja} comCabecalho={comCabecalho}>
      {voltar}
      <div>
        <h1 className="text-xl font-bold text-tinta">Cotação de {envio.oficina}</h1>
        <p className="mt-0.5 text-sm text-tinta-3">
          Chegou às {horaCurta(envio.recebidoEm)}
          {envio.respondidaEm && ` · respondida às ${horaCurta(envio.respondidaEm)}`}
        </p>
      </div>

      <AvisoSemConexao ativo={semConexao} />

      {envio.devolucoes.length > 0 && (
        <DevolucoesNoBalcao envio={envio} url={url} gravar={gravar} podeCuidar={pode.devolucao} />
      )}

      {envio.situacao === "PEDIDO" && (
        <PedidoNoBalcao envio={envio} url={url} gravar={gravar} podeAvancar={pode.entrega} />
      )}

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
        {envio.observacao && (
          <div className="mt-3 rounded-lg border border-linha bg-superficie-2 px-3 py-2 text-sm">
            <p className="text-xs text-tinta-3">Observação da oficina</p>
            <p className="whitespace-pre-line font-medium text-tinta">{envio.observacao}</p>
          </div>
        )}
      </Painel>

      {envio.travada || !pode.responder ? (
        <RespostaFechada envio={envio} semAcesso={!envio.travada} />
      ) : (
        // A chave refaz o formulário se a cotação mudar de peças; as atualizações
        // automáticas não mexem no que o balconista está digitando.
        <FormResposta key={envio.id} envio={envio} url={url} loja={loja} gravar={gravar} inicio={caminhos.inicio} />
      )}
    </Moldura>
  );
}

type GravarEnvio = ReturnType<typeof useAoVivo<EnvioNoBalcao>>["gravar"];

function PedidoNoBalcao({
  envio,
  url,
  gravar,
  podeAvancar,
}: {
  envio: EnvioNoBalcao;
  url: string;
  gravar: GravarEnvio;
  podeAvancar: boolean;
}) {
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
        {!proxima ? (
          <span className="status status-entregue">Entregue</span>
        ) : podeAvancar ? (
          <Botao variante="sucesso" onClick={avancar} disabled={avancando}>
            {avancando ? "Salvando..." : `Marcar: ${rotuloDaEntrega(proxima).toLowerCase()}`}
          </Botao>
        ) : (
          <span className="text-xs text-tinta-3">Quem avança a entrega é outra pessoa da loja.</span>
        )}
      </div>
      {etapa === "ENTREGUE" && (
        <p className="text-sm text-tinta-2">
          {envio.oficinaRecebeuEm
            ? `A oficina confirmou que recebeu as peças às ${horaCurta(envio.oficinaRecebeuEm)}.`
            : "A oficina ainda vai conferir as peças e confirmar o recebimento."}
        </p>
      )}
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

// ─── Devolução ──────────────────────────────────────────────────────────────

/** A devolução dita do lado da loja: o que o balconista tem de fazer agora. */
function situacaoNoBalcao(d: DevolucaoVista): { rotulo: string; cor: string } {
  switch (situacaoDaDevolucao(d)) {
    case "PEDIDA":
      return { rotulo: "Responder devolução", cor: "status status-peca" };
    case "PRECO_NOVO":
      return { rotulo: "Oficina vendo o preço", cor: "status status-andamento" };
    case "ACEITA":
      if (ehTroca(d) && !d.trocaSaiuEm) return { rotulo: "Mandar a troca", cor: "status status-peca" };
      if (!d.lojaRecebeuEm) return { rotulo: "Esperando a peça voltar", cor: "status status-andamento" };
      return { rotulo: "Oficina vai receber a troca", cor: "status status-andamento" };
    case "TROCA_A_CAMINHO":
      return { rotulo: "Troca a caminho", cor: "status status-chegou" };
    case "CONCLUIDA":
      return { rotulo: "Devolução concluída", cor: "status status-entregue" };
    case "RECUSADA":
      return { rotulo: "Recusada", cor: "status status-inerte" };
    case "CANCELADA":
      return { rotulo: "Cancelada pela oficina", cor: "status status-inerte" };
  }
}

/** Os motivos de recusa de sempre: um toque e o texto vem pronto. */
const RECUSAS_COMUNS = ["A peça já foi montada", "Passou do prazo", "Sem a caixa ou a embalagem", "A peça voltou danificada"];

function DevolucoesNoBalcao({
  envio,
  url,
  gravar,
  podeCuidar,
}: {
  envio: EnvioNoBalcao;
  url: string;
  gravar: GravarEnvio;
  podeCuidar: boolean;
}) {
  // O que espera a loja vem primeiro; as já resolvidas ficam embaixo, como histórico.
  const esperando = envio.devolucoes.filter(lojaPrecisaAgir);
  const resto = envio.devolucoes.filter((d) => !lojaPrecisaAgir(d));
  return (
    <section
      className={cn(
        "space-y-3 rounded-xl p-4",
        esperando.length > 0 ? "border-2 border-atencao-linha bg-atencao-fraco" : "border border-linha bg-superficie-2"
      )}
    >
      <div>
        <p className={cn("font-semibold", esperando.length > 0 ? "text-atencao" : "text-tinta")}>Devolução</p>
        <p className="text-sm text-tinta-2">
          {esperando.length > 0
            ? `${envio.oficina} quer devolver ${esperando.length === 1 ? "uma peça" : "peças"} deste pedido.`
            : "Nada esperando a loja. As devoluções deste pedido ficam aqui."}
        </p>
      </div>
      {[...esperando, ...resto].map((d) => (
        <DevolucaoNoBalcao key={d.id} envio={envio} d={d} url={url} gravar={gravar} podeCuidar={podeCuidar} />
      ))}
    </section>
  );
}

function DevolucaoNoBalcao({
  envio,
  d,
  url,
  gravar,
  podeCuidar,
}: {
  envio: EnvioNoBalcao;
  d: DevolucaoVista;
  url: string;
  gravar: GravarEnvio;
  podeCuidar: boolean;
}) {
  const avisar = useAvisar();
  const peca = envio.pecas.find((p) => p.id === d.pecaId);
  const unitario = Math.round((d.valor / d.quantidade) * 100) / 100;
  const s = situacaoDaDevolucao(d);
  const situacao = situacaoNoBalcao(d);
  const troca = ehTroca(d);

  const [modo, setModo] = useState<"aceitar" | "recusar" | "voltou" | null>(null);
  const [marca, setMarca] = useState("");
  const [preco, setPreco] = useState(String(unitario));
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [devolvido, setDevolvido] = useState(String(d.valor));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(corpo: Record<string, unknown>, aviso: string) {
    setErro("");
    setSalvando(true);
    const r = await gravar(enviarJson(`${url}/devolucao`, "POST", { devolucaoId: d.id, ...corpo }), { devolveDado: true });
    setSalvando(false);
    if (!r.ok) return setErro(r.erro);
    setModo(null);
    avisar(aviso);
  }

  function aceitar() {
    if (!d.querTroca) return enviar({ acao: "aceitar" }, "Devolução aceita");
    const novo = Number(preco);
    if (!(novo > 0)) return setErro("Informe o preço da peça da troca.");
    return enviar(
      {
        acao: "aceitar",
        trocaMarca: marca.trim() || null,
        // Preço igual ao do pedido não é preço novo.
        trocaPreco: Math.abs(novo - unitario) < 0.005 ? null : novo,
      },
      novo > unitario + 0.005 ? "Troca aceita. A oficina vai confirmar o preço novo." : "Troca aceita"
    );
  }

  const pedido =
    d.motivo === "NAO_USADA" || !d.querTroca
      ? "A oficina quer devolver e receber o valor."
      : d.motivo === "ERRADA"
        ? "A oficina quer a peça certa no lugar."
        : "A oficina quer outra peça, sem defeito, no lugar.";

  const fechada = s === "CONCLUIDA" || s === "RECUSADA" || s === "CANCELADA";
  const podeRecusar = !fechada && !d.lojaRecebeuEm && !d.trocaSaiuEm;
  const diferenca = diferencaDaTroca(d);

  return (
    <div className="space-y-2 rounded-lg bg-superficie p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-semibold text-tinta">
          {d.quantidade}× {peca?.descricao ?? "peça"} {peca?.pedida && <span className="font-normal text-tinta-3">({peca.pedida})</span>}
        </p>
        <span className={cn(situacao.cor, "shrink-0")}>{situacao.rotulo}</span>
      </div>
      <p className="text-sm text-tinta">
        <strong>{rotuloDoMotivo(d.motivo)}</strong>
        {d.detalhe && <span className="text-tinta-2">: &ldquo;{d.detalhe}&rdquo;</span>}
      </p>
      <p className="text-sm text-tinta-2">
        {pedido} Valor no pedido: {formatCurrency(d.valor)}
        {d.quantidade > 1 && ` (${formatCurrency(unitario)} cada)`}.
      </p>

      {/* Onde a devolução está, dito para o balconista. */}
      {s === "PRECO_NOVO" && (
        <p className="text-sm text-tinta-2">
          A peça da troca ficou {formatCurrency(diferenca)} mais cara. Esperando a oficina dizer se pode mandar.
        </p>
      )}
      {s === "ACEITA" && !troca && !d.lojaRecebeuEm && (
        <p className="text-sm text-tinta-2">Mande o motoboy buscar a peça. Quando ela chegar, confirme aqui.</p>
      )}
      {s === "ACEITA" && troca && !d.trocaSaiuEm && (
        <p className="text-sm text-tinta-2">
          Mande a peça nova{d.trocaMarca && ` (${d.trocaMarca})`} e traga a outra de volta.
          {diferenca > 0 && ` A oficina paga ${formatCurrency(diferenca)} a mais na entrega.`}
          {diferenca < 0 && ` Devolva ${formatCurrency(-diferenca)} de diferença à oficina.`}
        </p>
      )}
      {s === "TROCA_A_CAMINHO" && (
        <p className="text-sm text-tinta-2">A peça nova está a caminho. A oficina confirma quando ela chegar.</p>
      )}
      {d.lojaRecebeuEm && s !== "CONCLUIDA" && (
        <p className="text-sm text-tinta-2">A peça devolvida já voltou para a loja às {horaCurta(d.lojaRecebeuEm)}.</p>
      )}
      {s === "CONCLUIDA" && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-ok">
          <Confere tamanho={16} className="shrink-0" />
          {troca
            ? "Troca feita."
            : `Peça de volta na loja. Devolvido à oficina: ${formatCurrency(d.valorDevolvido ?? 0)}.`}
        </p>
      )}
      {s === "RECUSADA" && <p className="text-sm text-tinta-2">Recusada: {d.motivoRecusa}</p>}
      {s === "CANCELADA" && <p className="text-sm text-tinta-2">A oficina desistiu da devolução.</p>}

      {!podeCuidar
        ? !fechada && <p className="text-xs text-tinta-3">Quem cuida das devoluções é outra pessoa da loja.</p>
        : !fechada && (
            <>
              {modo === "aceitar" && (
                <div className="space-y-3 rounded-lg border border-linha p-3">
                  <p className="text-sm text-tinta-2">
                    Se a peça certa for de outra marca ou tiver outro preço, mude aqui. Se ficar mais cara, a oficina
                    confirma antes de o motoboy sair.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Campo rotulo="Marca da peça nova">
                      <Entrada value={marca} onChange={(e) => setMarca(e.target.value)} placeholder={peca?.pedida ?? "A mesma"} />
                    </Campo>
                    <Campo rotulo={d.quantidade > 1 ? "Preço de cada" : "Preço"}>
                      <CampoDinheiro valor={preco} onChange={setPreco} />
                    </Campo>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Botao variante="sucesso" onClick={aceitar} disabled={salvando}>
                      {salvando ? "Salvando..." : "Aceitar a troca"}
                    </Botao>
                    <Botao variante="secundario" onClick={() => setModo(null)} disabled={salvando}>
                      Voltar
                    </Botao>
                  </div>
                </div>
              )}

              {modo === "recusar" && (
                <div className="space-y-3 rounded-lg border border-linha p-3">
                  <Campo rotulo="Por que a loja não aceita?" obrigatorio ajuda="A oficina lê este motivo.">
                    <Area value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} rows={2} />
                  </Campo>
                  <div className="flex flex-wrap gap-1.5">
                    {RECUSAS_COMUNS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMotivoRecusa(m)}
                        className="min-h-9 rounded-full border border-linha bg-superficie-2 px-3 text-xs font-medium text-tinta-2 transition-colors hover:border-brand-500 hover:text-tinta"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Botao
                      variante="perigo"
                      onClick={() =>
                        motivoRecusa.trim()
                          ? enviar({ acao: "recusar", motivoRecusa: motivoRecusa.trim() }, "Devolução recusada")
                          : setErro("Escreva por que a loja não aceita.")
                      }
                      disabled={salvando}
                    >
                      {salvando ? "Salvando..." : "Recusar a devolução"}
                    </Botao>
                    <Botao variante="secundario" onClick={() => setModo(null)} disabled={salvando}>
                      Voltar
                    </Botao>
                  </div>
                </div>
              )}

              {modo === "voltou" && (
                <div className="space-y-3 rounded-lg border border-linha p-3">
                  <Campo rotulo="Quanto a loja devolveu ou abateu?" ajuda="Vem com o valor da peça. Mude se descontou algo.">
                    <CampoDinheiro valor={devolvido} onChange={setDevolvido} className="max-w-[10rem]" />
                  </Campo>
                  <div className="flex flex-wrap gap-2">
                    <Botao
                      variante="sucesso"
                      onClick={() =>
                        enviar({ acao: "voltou", valorDevolvido: Number(devolvido) || 0 }, "Peça devolvida confirmada")
                      }
                      disabled={salvando}
                    >
                      {salvando ? "Salvando..." : "Confirmar que a peça voltou"}
                    </Botao>
                    <Botao variante="secundario" onClick={() => setModo(null)} disabled={salvando}>
                      Voltar
                    </Botao>
                  </div>
                </div>
              )}

              {modo === null && (
                <div className="flex flex-wrap gap-2">
                  {s === "PEDIDA" &&
                    (d.querTroca ? (
                      <>
                        <Botao variante="sucesso" onClick={() => setModo("aceitar")} disabled={salvando}>
                          Tenho, vou trocar
                        </Botao>
                        <Botao
                          variante="secundario"
                          onClick={() => enviar({ acao: "sem-a-peca" }, "Combinado: o valor volta para a oficina")}
                          disabled={salvando}
                        >
                          Não tenho a peça para trocar
                        </Botao>
                      </>
                    ) : (
                      <Botao variante="sucesso" onClick={aceitar} disabled={salvando}>
                        {salvando ? "Salvando..." : "Aceitar: o motoboy busca"}
                      </Botao>
                    ))}
                  {s === "ACEITA" && troca && !d.trocaSaiuEm && (
                    <Botao
                      variante="sucesso"
                      onClick={() => enviar({ acao: "saiu" }, "Peça nova a caminho")}
                      disabled={salvando}
                    >
                      {salvando ? "Salvando..." : "Marcar: peça nova saiu com o motoboy"}
                    </Botao>
                  )}
                  {(s === "ACEITA" || s === "TROCA_A_CAMINHO") && !d.lojaRecebeuEm && (
                    <Botao
                      variante={troca ? "secundario" : "sucesso"}
                      onClick={() =>
                        troca ? enviar({ acao: "voltou" }, "Peça devolvida confirmada") : setModo("voltou")
                      }
                      disabled={salvando}
                    >
                      A peça devolvida voltou
                    </Botao>
                  )}
                  {podeRecusar && (
                    <Botao variante="fantasma" onClick={() => setModo("recusar")} disabled={salvando} className="text-perigo">
                      Recusar
                    </Botao>
                  )}
                </div>
              )}
            </>
          )}

      {erro && <Aviso>{erro}</Aviso>}
    </div>
  );
}

function RespostaFechada({ envio, semAcesso = false }: { envio: EnvioNoBalcao; semAcesso?: boolean }) {
  const textos: Partial<Record<EnvioNoBalcao["situacao"], string>> = {
    COM_O_CLIENTE: "A oficina mandou o orçamento para o cliente com peças da loja. Se ele aprovar, o pedido chega aqui.",
    OUTRA_LOJA: "Desta vez a oficina fechou com outra loja.",
    ENCERRADA: "A oficina fechou a cotação antes da resposta da loja.",
  };
  // Quem só acompanha (sem o acesso "Responder cotações") vê a resposta, sem formulário.
  const texto = semAcesso ? "Seu acesso não inclui responder cotações. Quem cuida da equipe da loja libera." : textos[envio.situacao];
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
  inicio,
}: {
  envio: EnvioNoBalcao;
  url: string;
  loja: LojaDoBalcao;
  gravar: GravarEnvio;
  /** A caixa de entrada, para o "voltar às cotações". */
  inicio: string;
}) {
  const avisar = useAvisar();
  const prazoPadrao = String(prazoSugerido(loja));
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
          <BotaoLink href={inicio} variante="sucesso">
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
      <p className="text-sm text-tinta-3">Mais de uma marca? Mande as duas: a oficina escolhe.</p>

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
