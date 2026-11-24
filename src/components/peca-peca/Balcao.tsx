"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Area, Aviso, Campo, CampoDinheiro, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { useAvisar } from "@/components/ui/Avisos";
import { Avancar, Chevron, Confere, Conversa as IconeConversa, Lixeira, Mais, Voltar } from "@/components/ui/Icones";
import { LogoPecaPeca } from "@/components/marca/LogoPecaPeca";
import {
  ETAPAS_ENTREGA,
  FORMAS_DE_PAGAMENTO,
  SITUACOES_NO_BALCAO,
  descricaoDoVeiculo,
  diferencaDaTroca,
  ehTroca,
  lojaPrecisaAgir,
  prazoSugerido,
  precoNoCredito,
  proximaEtapa,
  textoDaForma,
  rotuloDaEntrega,
  rotuloDoMotivo,
  situacaoDaDevolucao,
  type CaixaDoBalcao,
  type DevolucaoVista,
  type DestinoNoBalcao,
  type EnvioNoBalcao,
} from "./regras";
import { enviarJson, tocarAviso, useAoVivo, useTituloComContador } from "./aoVivo";
import { AvisoSemConexao, haQuanto, horaCurta } from "./ui";
import { AvisoNoCelular, ContadorDeMensagens, Conversa, useConversaDoEndereco, type EventoDaConversa } from "./Conversa";

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
  /** A rota do aviso no celular — só no painel com login: sem conta, não há de quem é o aparelho. */
  push?: string;
};

/** O que a pessoa pode no balcão. No link antigo, tudo; no painel, o acesso dela. */
export type PodeNoBalcao = { responder: boolean; conversa: boolean; entrega: boolean; devolucao: boolean };

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
            <span className="font-medium text-tinta-2">{loja.nome}</span>
            {loja.cidade && <span className="ml-2">{loja.cidade}</span>}
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
  // As já respondidas ficam recolhidas: o balcão é para o que ainda espera a loja.
  const [verRespondidas, setVerRespondidas] = useState(false);
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

  // O que pede ação vai para a aba do navegador e para o ícone do app; quando aumenta, toca.
  const mensagens = envios.reduce((s, e) => s + e.naoLidas, 0);
  const pendentes = responder.length + pedidosNovos.length + devolucoesNovas.length + mensagens;
  useTituloComContador(`Balcão · ${loja.nome}`, pendentes, true);
  const antes = useRef<{
    cotacoes: Set<string>;
    pedidos: Set<string>;
    devolucoes: Set<string>;
    naoLidas: Map<string, number>;
  } | null>(null);
  useEffect(() => {
    if (!dados) return;
    const agora = {
      cotacoes: new Set(responder.map((e) => e.id)),
      pedidos: new Set(pedidosNovos.map((e) => e.id)),
      devolucoes: new Set(devolucoesNovas.map(({ d }) => d.id)),
      naoLidas: new Map(envios.map((e) => [e.id, e.naoLidas])),
    };
    const anterior = antes.current;
    antes.current = agora;
    if (!anterior) return;
    const novasCotacoes = responder.filter((e) => !anterior.cotacoes.has(e.id));
    const novosPedidos = pedidosNovos.filter((e) => !anterior.pedidos.has(e.id));
    const novasDevolucoes = devolucoesNovas.filter(({ d }) => !anterior.devolucoes.has(d.id));
    const novasMensagens = envios.filter((e) => e.naoLidas > (anterior.naoLidas.get(e.id) ?? 0));
    novasCotacoes.forEach((e) => avisar(`Nova cotação de ${e.oficina}`));
    novosPedidos.forEach((e) => avisar(`Pedido fechado por ${e.oficina}!`));
    novasDevolucoes.forEach(({ envio }) => avisar(`${envio.oficina} quer devolver uma peça`));
    novasMensagens.forEach((e) => avisar(`${e.oficina} mandou mensagem`));
    if (novasCotacoes.length + novosPedidos.length + novasDevolucoes.length + novasMensagens.length > 0) tocarAviso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  // O que espera a loja, em palavras, logo abaixo do nome.
  const resumo = [
    responder.length > 0 && `${responder.length} para responder`,
    pedidosAbertos.length > 0 &&
      `${pedidosAbertos.length} ${pedidosAbertos.length === 1 ? "pedido" : "pedidos"} para separar`,
    devolucoes.length > 0 && `${devolucoes.length} ${devolucoes.length === 1 ? "devolução" : "devoluções"}`,
  ].filter(Boolean);
  const respondidas = [...outras, ...pedidos.filter((e) => e.entrega === "ENTREGUE")];

  return (
    <Moldura loja={loja} comCabecalho={caminhos.comCabecalho}>
      <div>
        {/* O nome sozinho: "da Yoshio", mas "do Bom Preço" — o artigo muda de loja para loja. */}
        <h1 className="text-xl font-bold text-tinta">{loja.nome}</h1>
        {dados && (
          <p className="mt-0.5 text-sm text-tinta-2">
            {resumo.length > 0 ? resumo.join(" · ") : "Nada esperando a loja agora."}
            {decididas.length > 0 && (
              // Quantas a loja ganhou das que a oficina já decidiu: o termômetro do balcão.
              <span className="text-tinta-3">
                {" "}
                · fechou {pedidos.length} de {decididas.length}
              </span>
            )}
          </p>
        )}
        <p className="mt-1 text-xs text-tinta-3">Deixe aberta: atualiza sozinha e toca quando chega novidade.</p>
        {caminhos.push && (
          <div className="mt-2">
            <AvisoNoCelular api={caminhos.push} />
          </div>
        )}
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
          {/* Primeiro o que pode virar venda: a cotação esperando preço. */}
          <Secao titulo="Para responder" total={responder.length} destaque={responder.length > 0}>
            {responder.length === 0 ? (
              <p className="text-sm text-tinta-3">Nada esperando resposta.</p>
            ) : (
              <Lista envios={responder} telas={caminhos.telas} />
            )}
          </Secao>

          {pedidosAbertos.length > 0 && (
            <Secao titulo="Pedidos para separar" total={pedidosAbertos.length} destaque={pedidosNovos.length > 0}>
              <Lista envios={pedidosAbertos} telas={caminhos.telas} />
            </Secao>
          )}

          {devolucoes.length > 0 && (
            <Secao titulo="Devoluções" total={devolucoes.length} destaque>
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
                          {d.quantidade}× {envio.pecas.find((p) => p.id === d.pecaId)?.descricao ?? "peça"}
                        </p>
                        <p className="flex flex-wrap gap-x-3 text-xs text-tinta-3">
                          <span className="text-tinta-2">{envio.oficina}</span>
                          <span>{rotuloDoMotivo(d.motivo)}</span>
                          <span>{descricaoDoVeiculo(envio.veiculo)}</span>
                          <span>pedida {haQuanto(d.pedidaEm)}</span>
                        </p>
                      </div>
                      <span className={cn(situacao.cor, "self-start sm:self-auto")}>{situacao.rotulo}</span>
                    </Link>
                  );
                })}
              </div>
            </Secao>
          )}

          {respondidas.length > 0 && (
            <Secao
              titulo="Respondidas"
              total={respondidas.length}
              aberta={verRespondidas}
              onAlternar={() => setVerRespondidas((v) => !v)}
            >
              <Lista envios={respondidas} telas={caminhos.telas} />
            </Secao>
          )}
        </>
      )}
    </Moldura>
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
  total?: number;
  /** Tem coisa esperando a loja: o número fica âmbar. */
  destaque?: boolean;
  aberta?: boolean;
  /** Com ele, o título vira botão de abrir e fechar. */
  onAlternar?: () => void;
  children: React.ReactNode;
}) {
  const cabeca = (
    <>
      <span className="font-semibold text-tinta">{titulo}</span>
      {total !== undefined && total > 0 && (
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums",
            destaque ? "bg-[rgb(var(--gr-sem-resposta))] text-[rgb(20_14_0)]" : "bg-superficie-3 text-tinta-2"
          )}
        >
          {total}
        </span>
      )}
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
              className={cn(
                "transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
                aberta && "rotate-180"
              )}
            />
          </span>
        </button>
      ) : (
        <h2 className="flex items-center gap-2">{cabeca}</h2>
      )}
      {aberta && <div className={cn(onAlternar && "linha-entra")}>{children}</div>}
    </section>
  );
}

/** O próximo passo da loja naquela cotação, para virar o botão da linha. */
function acaoNaLinha(e: EnvioNoBalcao): string | null {
  if (e.situacao === "RESPONDER") return "Responder";
  if (e.situacao === "PEDIDO" && e.entrega === "ENVIADO") return "Separar";
  if (e.naoLidas > 0) return "Ler mensagem";
  return null;
}

function Lista({ envios, telas }: { envios: EnvioNoBalcao[]; telas: string }) {
  return (
    <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
      {envios.map((e) => {
        const acao = acaoNaLinha(e);
        return (
          <Link
            key={e.id}
            href={`${telas}/${e.id}`}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-superficie-2 focus-visible:bg-superficie-2 focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              {/* O carro e o motor primeiro: é o que o balconista confere na aplicação. */}
              <p className="flex min-w-0 items-center gap-2">
                <span className="truncate font-semibold text-tinta">
                  {descricaoDoVeiculo(e.veiculo)}
                  {e.veiculo.motor && <span className="ml-1.5 font-normal text-tinta-2">{e.veiculo.motor}</span>}
                </span>
                {e.naoLidas > 0 && <ContadorDeMensagens total={e.naoLidas} className="shrink-0" />}
              </p>
              <p className="mt-0.5 truncate text-sm text-tinta-2">
                {e.pecas.length <= 2
                  ? e.pecas.map((p) => `${p.quantidade}× ${p.descricao}`).join(", ")
                  : `${e.pecas.length} peças: ${e.pecas[0].descricao} e mais ${e.pecas.length - 1}`}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-tinta-3">
                {e.situacao !== "RESPONDER" && (
                  <span className={SITUACOES_NO_BALCAO[e.situacao].cor}>
                    {e.situacao === "PEDIDO" && e.entrega
                      ? rotuloDaEntrega(e.entrega)
                      : SITUACOES_NO_BALCAO[e.situacao].rotulo}
                  </span>
                )}
                <span>
                  {e.oficina} · {haQuanto(e.recebidoEm)}
                </span>
              </p>
              {/* No celular o botão vai para baixo: ao lado, ele espremia o nome do carro. */}
              {acao && (
                <span className="mt-2.5 inline-flex min-h-9 items-center gap-1 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-brand-fg transition-colors group-hover:bg-brand-700 sm:hidden">
                  {acao}
                  <Avancar tamanho={16} />
                </span>
              )}
            </div>
            {acao ? (
              <span className="hidden min-h-9 shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-brand-fg transition-colors group-hover:bg-brand-700 sm:inline-flex">
                {acao}
                <Avancar tamanho={16} />
              </span>
            ) : (
              <Avancar
                tamanho={18}
                className="shrink-0 text-tinta-3 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            )}
          </Link>
        );
      })}
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
  // O aviso no celular e a caixa "Conversas" trazem `?conversa=1`: abre direto nela.
  const [conversando, setConversando] = useState(false);
  useConversaDoEndereco(() => setConversando(true));

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {/* O carro e o motor no título: é com eles que o balconista acha a aplicação. */}
          <h1 className="text-xl font-bold text-tinta">
            {descricaoDoVeiculo(envio.veiculo)}
            {envio.veiculo.motor && <span className="ml-2 font-semibold text-tinta-2">{envio.veiculo.motor}</span>}
          </h1>
          <p className="mt-0.5 text-sm text-tinta-3">
            {envio.oficina} · chegou às {horaCurta(envio.recebidoEm)}
            {envio.respondidaEm && `, respondida às ${horaCurta(envio.respondidaEm)}`}
          </p>
        </div>
        {/* Conversa que já acabou (e foi apagada) não tem o que abrir. */}
        {!envio.conversaFechada && (
          <Botao
            variante={envio.naoLidas > 0 ? "primario" : "secundario"}
            onClick={() => setConversando(true)}
            className="shrink-0"
          >
            <IconeConversa tamanho={16} />
            {envio.situacao === "RESPONDER" ? "Perguntar à oficina" : "Conversar com a oficina"}
            <ContadorDeMensagens total={envio.naoLidas} />
          </Botao>
        )}
      </div>

      <AvisoSemConexao ativo={semConexao} />

      {conversando && (
        <Conversa
          api={`${url}/conversa`}
          titulo={envio.oficina}
          subtitulo={[descricaoDoVeiculo(envio.veiculo), envio.veiculo.motor].filter(Boolean).join(", ")}
          eu="LOJA"
          podeEscrever={pode.conversa}
          semAcessoTexto="Seu acesso não inclui conversar com as oficinas. Quem cuida da equipe da loja libera."
          eventos={eventosNoBalcao(envio)}
          pushApi={caminhos.push}
          onFechar={() => setConversando(false)}
        />
      )}

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
        <div className="mt-3 rounded-lg border border-linha bg-superficie-2 px-3 py-2 text-sm">
          <p className="text-xs text-tinta-3">Como a oficina vai pagar</p>
          <p className="font-medium text-tinta">{textoDaForma(envio.formaPagamento, envio.debitoAVista)}</p>
        </div>
      </Painel>

      {envio.travada || !pode.responder ? (
        <RespostaFechada envio={envio} semAcesso={!envio.travada} />
      ) : (
        // A chave refaz o formulário se a cotação mudar de peças; as atualizações
        // automáticas não mexem no que o balconista está digitando.
        <FormResposta
          key={envio.id}
          envio={envio}
          url={url}
          loja={loja}
          gravar={gravar}
          inicio={caminhos.inicio}
          comBarraDeBaixo={!comCabecalho}
        />
      )}
    </Moldura>
  );
}

type GravarEnvio = ReturnType<typeof useAoVivo<EnvioNoBalcao>>["gravar"];

/** O que aconteceu na cotação, no meio das mensagens. */
function eventosNoBalcao(envio: EnvioNoBalcao): EventoDaConversa[] {
  const eventos: EventoDaConversa[] = [{ em: envio.recebidoEm, texto: "A cotação chegou" }];
  if (envio.respondidaEm) eventos.push({ em: envio.respondidaEm, texto: "A loja respondeu" });
  if (envio.pedidoEm && envio.situacao === "PEDIDO") eventos.push({ em: envio.pedidoEm, texto: "Pedido fechado com a loja" });
  return eventos;
}

/**
 * Para onde vai o pedido. Cliente novo vem aberto, com os dados prontos para a loja
 * cadastrar a oficina; quem já comprou antes vem recolhido numa linha. Sem telefone:
 * a conversa do app é o canal da loja com a oficina.
 */
function EntregarPara({ destino }: { destino: DestinoNoBalcao }) {
  const avisar = useAvisar();
  const completo = `${destino.endereco} - CEP ${destino.cep} - ${destino.cidade}`;
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(completo)}`;

  async function copiar() {
    const texto = [
      `Oficina: ${destino.oficina}`,
      `CNPJ: ${destino.cnpj}`,
      `Endereço: ${destino.endereco}`,
      `CEP: ${destino.cep}`,
      `Cidade: ${destino.cidade}`,
      `Recebe: ${destino.recebedor}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Dados copiados. É só colar no cadastro da loja.", "ok");
    } catch {
      avisar("Não foi possível copiar. Selecione o texto e copie.", "erro");
    }
  }

  return (
    <details open={destino.clienteNovo} className="group rounded-lg border border-linha-forte bg-superficie-2">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-sm">
        <span className="font-semibold text-tinta">Entregar para</span>
        {destino.clienteNovo && <span className="status status-entregue">Cliente novo</span>}
        <span className="min-w-0 flex-1 truncate text-tinta-2 group-open:hidden">
          {destino.oficina} · {destino.endereco}
        </span>
        <span className="text-xs text-tinta-3 group-open:hidden">Ver</span>
      </summary>
      <div className="space-y-3 border-t border-linha px-3 py-3 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            ["Oficina", destino.oficina],
            ["CNPJ", destino.cnpj],
            ["Endereço", `${destino.endereco} · CEP ${destino.cep}`],
            ["Cidade", destino.cidade],
            ["Quem recebe", destino.recebedor],
          ].map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-xs text-tinta-3">{rotulo}</dt>
              <dd className="font-medium text-tinta">{valor}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2">
          <a
            href={mapa}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm font-medium text-tinta hover:bg-superficie-2"
          >
            Abrir no mapa
          </a>
          <button
            type="button"
            onClick={copiar}
            className="rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm font-medium text-tinta hover:bg-superficie-2"
          >
            {destino.clienteNovo ? "Copiar dados para cadastro" : "Copiar dados"}
          </button>
        </div>
        {destino.clienteNovo && (
          <p className="text-xs text-tinta-3">
            É a primeira compra desta oficina na sua loja. Copie os dados e cadastre a oficina antes de entregar.
          </p>
        )}
      </div>
    </details>
  );
}

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
    <section className="space-y-3 rounded-xl border border-linha bg-superficie p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-semibold text-tinta">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--gr-vendida))]" aria-hidden />
            Pedido fechado
          </p>
          <p className="text-sm text-tinta-2">Separe e mande para {envio.oficina}:</p>
        </div>
        {!proxima ? (
          <span className="status status-entregue">Entregue</span>
        ) : podeAvancar ? (
          <Botao variante="sucesso" onClick={avancar} disabled={avancando} className="aperta w-full sm:w-auto">
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
      {envio.destino && <EntregarPara destino={envio.destino} />}
      <ul className="space-y-1 rounded-lg bg-superficie p-3 text-sm">
        {pedidas.map((p) => (
          <li key={p.id} className="text-tinta">
            <strong>{p.quantidade}×</strong> {p.descricao} <span className="text-tinta-3">({p.pedida})</span>
          </li>
        ))}
      </ul>
      {envio.cobranca && (
        // O que o motoboy cobra na entrega, e como: é por isso que a loja precisa saber a forma.
        <div className="rounded-lg bg-superficie p-3 text-sm">
          <div className="flex justify-between text-tinta-3">
            <span>Peças</span>
            <span className="tabular-nums">{formatCurrency(envio.cobranca.pecas)}</span>
          </div>
          <div className="flex justify-between text-tinta-3">
            <span>Entrega</span>
            <span className="tabular-nums">
              {envio.cobranca.entrega > 0 ? formatCurrency(envio.cobranca.entrega) : "grátis"}
            </span>
          </div>
          <div className="mt-1 flex justify-between border-t border-linha pt-1.5 font-semibold text-tinta">
            <span>Cobrar no {FORMAS_DE_PAGAMENTO[envio.formaPagamento].rotulo.toLowerCase()}</span>
            <span className="tabular-nums">{formatCurrency(envio.cobranca.pecas + envio.cobranca.entrega)}</span>
          </div>
        </div>
      )}
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
        "space-y-3 rounded-xl border border-linha p-4",
        esperando.length > 0 ? "bg-superficie" : "bg-superficie-2"
      )}
    >
      <div>
        <p className="flex items-center gap-2 font-semibold text-tinta">
          {esperando.length > 0 && (
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--gr-sem-resposta))]" aria-hidden />
          )}
          Devolução
        </p>
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
                  <p key={o.id} className="flex flex-wrap gap-x-3 text-xs text-tinta-3">
                    <span className="font-medium text-tinta-2">{o.marca}</span>
                    <span>{formatCurrency(o.preco)} à vista</span>
                    {o.precoCredito !== null && <span>{formatCurrency(o.precoCredito)} no crédito</span>}
                    <span>{o.prazoMin} min</span>
                    {p.pedida === o.marca && <span className="font-semibold text-ok">pedida</span>}
                  </p>
                ))
              )}
            </li>
          ))}
        </ul>
        {envio.respondidaEm && (
          <p className="mt-3 border-t border-linha pt-2.5 text-xs text-tinta-3">
            Entrega: {envio.taxaEntrega ? formatCurrency(envio.taxaEntrega) : "grátis"}
            {envio.taxaEntrega && envio.freteGratisAcima !== null
              ? ` (grátis acima de ${formatCurrency(envio.freteGratisAcima)})`
              : ""}
          </p>
        )}
      </Painel>
    </>
  );
}

type OfertaEmEdicao = {
  chave: string;
  id?: string;
  marca: string;
  /** À vista. */
  preco: string;
  /** No crédito. Enquanto o vendedor não mexe nele, acompanha o à vista com o acréscimo da loja. */
  credito: string;
  creditoMexido: boolean;
  prazo: string;
};
type Rascunho = Record<string, { naoTem: boolean; ofertas: OfertaEmEdicao[] }>;

let contador = 0;
const chaveNova = () => `nova-${(contador += 1)}`;

function FormResposta({
  envio,
  url,
  loja,
  gravar,
  inicio,
  comBarraDeBaixo,
}: {
  envio: EnvioNoBalcao;
  url: string;
  loja: LojaDoBalcao;
  gravar: GravarEnvio;
  /** A caixa de entrada, para o "voltar às cotações". */
  inicio: string;
  /** No painel da loja há a barra de navegação do celular: o botão de enviar para acima dela. */
  comBarraDeBaixo: boolean;
}) {
  const avisar = useAvisar();
  const prazoPadrao = String(prazoSugerido(loja));
  const vazia = (): OfertaEmEdicao => ({
    chave: chaveNova(),
    marca: "",
    preco: "",
    credito: "",
    creditoMexido: false,
    prazo: prazoPadrao,
  });
  const creditoDe = (preco: string) =>
    Number(preco) > 0 ? String(precoNoCredito(Number(preco), envio.acrescimoCredito)) : "";

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
                credito: String(o.precoCredito ?? o.preco),
                // Crédito próprio que a loja já mandou não se recalcula sozinho; o "mesmo
                // preço" volta a seguir a regra se o à vista mudar.
                creditoMexido: o.precoCredito !== null,
                prazo: String(o.prazoMin),
              })),
            }
          : { naoTem: false, ofertas: [vazia()] },
      ])
    )
  );
  const taxaInicial = envio.taxaEntrega ?? envio.taxaSugerida;
  const [taxa, setTaxa] = useState(taxaInicial > 0 ? String(taxaInicial) : "");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  function mudarOferta(pecaId: string, chave: string, campo: "marca" | "preco" | "credito" | "prazo", valor: string) {
    const mudar = (o: OfertaEmEdicao): OfertaEmEdicao => {
      if (campo === "credito") return { ...o, credito: valor, creditoMexido: valor !== "" };
      if (campo === "preco" && !o.creditoMexido) return { ...o, preco: valor, credito: creditoDe(valor) };
      return { ...o, [campo]: valor };
    };
    setRascunho((r) => ({
      ...r,
      [pecaId]: { ...r[pecaId], ofertas: r[pecaId].ofertas.map((o) => (o.chave === chave ? mudar(o) : o)) },
    }));
  }

  function alternarNaoTem(pecaId: string, naoTem: boolean) {
    setRascunho((r) => ({
      ...r,
      [pecaId]: { naoTem, ofertas: naoTem ? [] : r[pecaId].ofertas.length ? r[pecaId].ofertas : [vazia()] },
    }));
  }

  // Pronta: "não tenho" marcado, ou ao menos uma marca com preço e nenhuma pela metade.
  const pronta = (pecaId: string) => {
    const r = rascunho[pecaId];
    if (r.naoTem) return true;
    const usadas = r.ofertas.filter((o) => o.marca.trim() || Number(o.preco) > 0);
    return usadas.length > 0 && usadas.every((o) => o.marca.trim() && Number(o.preco) > 0);
  };
  const prontas = envio.pecas.filter((p) => pronta(p.id)).length;

  async function enviar() {
    const itens: Record<
      string,
      { id?: string; marca: string; preco: number; precoCredito: number | null; prazoMin: number }[]
    > = {};
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
        // Crédito em branco: o mesmo preço do à vista.
        precoCredito: Number(o.credito) > 0 ? Number(o.credito) : null,
        prazoMin: Math.max(0, Math.round(Number(o.prazo) || 0)),
      }));
    }
    setErro("");
    setEnviando(true);
    const r = await gravar(
      enviarJson(`${url}/resposta`, "POST", { itens, taxaEntrega: Number(taxa) > 0 ? Number(taxa) : 0 }),
      { devolveDado: true }
    );
    setEnviando(false);
    if (!r.ok) return setErro(r.erro);
    avisar("Resposta enviada para a oficina");
    setEnviada(true);
  }

  if (enviada) {
    return (
      <div className="space-y-3 rounded-xl border border-linha bg-superficie p-5">
        <p className="flex items-center gap-2 font-semibold text-tinta">
          <Confere tamanho={18} className="text-ok" />
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
      <p className="text-sm text-tinta-3">
        Mais de uma marca? Mande as duas: a oficina escolhe. O preço no crédito
        {envio.acrescimoCredito > 0
          ? ` vem com os ${envio.acrescimoCredito.toLocaleString("pt-BR")}% da loja`
          : " vem igual ao à vista"}
        ; mude se precisar.
      </p>

      {envio.pecas.map((p) => {
        const r = rascunho[p.id];
        return (
          <section key={p.id} className="rounded-xl border border-linha bg-superficie p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-semibold text-tinta">
                <span className="text-tinta-3">{p.quantidade}×</span> {p.descricao}
              </h2>
              {pronta(p.id) && (
                <span className="linha-entra inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ok">
                  <Confere tamanho={14} />
                  {r.naoTem ? "Não tem" : "Pronta"}
                </span>
              )}
            </div>
            {/* Dois botões grandes em vez de uma caixinha: "não tenho" é resposta, não detalhe. */}
            <div role="radiogroup" aria-label={`Tem ${p.descricao}?`} className="mb-3 grid grid-cols-2 gap-1.5">
              {[
                { valor: false, rotulo: "Tenho" },
                { valor: true, rotulo: "Não tenho" },
              ].map((opcao) => (
                <button
                  key={opcao.rotulo}
                  type="button"
                  role="radio"
                  aria-checked={r.naoTem === opcao.valor}
                  onClick={() => r.naoTem !== opcao.valor && alternarNaoTem(p.id, opcao.valor)}
                  className={cn(
                    "aperta min-h-11 rounded-lg border px-3 text-sm font-medium",
                    r.naoTem === opcao.valor
                      ? "border-brand-500 bg-brand-50 text-tinta"
                      : "border-linha text-tinta-2 hover:border-brand-500"
                  )}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>

            {!r.naoTem && (
              <div className="space-y-2">
                {r.ofertas.map((o) => (
                  <div
                    key={o.chave}
                    // No celular: marca; à vista e crédito lado a lado; prazo e lixeira embaixo.
                    className="linha-entra grid grid-cols-2 items-end gap-2 border-b border-linha pb-3 last:border-0 last:pb-0 sm:grid-cols-[1fr_8rem_8rem_6rem_auto] sm:border-0 sm:pb-0"
                  >
                    <Entrada
                      value={o.marca}
                      onChange={(e) => mudarOferta(p.id, o.chave, "marca", e.target.value)}
                      placeholder="Marca (ex.: Cobreq)"
                      aria-label="Marca"
                      className="col-span-2 sm:col-span-1"
                    />
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-[0.7rem] text-tinta-3">À vista</span>
                      <CampoDinheiro
                        valor={o.preco}
                        onChange={(v) => mudarOferta(p.id, o.chave, "preco", v)}
                        placeholder="0,00"
                        aria-label={`Preço à vista${p.quantidade > 1 ? " de cada unidade" : ""}`}
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-0.5 block text-[0.7rem] text-tinta-3">No crédito</span>
                      <CampoDinheiro
                        valor={o.credito}
                        onChange={(v) => mudarOferta(p.id, o.chave, "credito", v)}
                        placeholder={o.preco ? "igual" : "0,00"}
                        aria-label={`Preço no crédito${p.quantidade > 1 ? " de cada unidade" : ""}`}
                      />
                    </label>
                    <div className="relative max-w-[8rem] sm:max-w-none">
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
                      className="justify-self-end text-perigo"
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
          </section>
        );
      })}

      <Painel
        titulo="Entrega"
        ajuda={
          envio.freteGratisAcima !== null
            ? `Vem com a regra da loja. Pedido a partir de ${formatCurrency(envio.freteGratisAcima)} não paga entrega.`
            : "Vem com a regra da loja para a cidade desta oficina. Em branco: entrega grátis."
        }
      >
        <Campo rotulo="Taxa de entrega desta cotação">
          <CampoDinheiro valor={taxa} onChange={setTaxa} placeholder="grátis" className="max-w-[10rem]" />
        </Campo>
      </Painel>

      {/* Barra presa embaixo: quanto falta e o botão, sempre à mão enquanto o balconista
          desce pelas peças. No painel, para acima da barra de navegação do celular. */}
      <div
        className={cn(
          "sticky z-20 -mx-4 border-t border-linha bg-fundo/95 px-4 py-3 backdrop-blur",
          comBarraDeBaixo ? "bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:bottom-0" : "bottom-0 pb-segura"
        )}
      >
        {erro && (
          <div className="mb-2" role="alert">
            <Aviso>{erro}</Aviso>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-tinta">
              {prontas === envio.pecas.length
                ? "Tudo pronto para mandar"
                : `${prontas} de ${envio.pecas.length} ${envio.pecas.length === 1 ? "peça pronta" : "peças prontas"}`}
            </p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-superficie-3">
              <div
                className="h-full origin-left rounded-full bg-brand-600 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]"
                style={{ transform: `scaleX(${envio.pecas.length ? prontas / envio.pecas.length : 0})` }}
              />
            </div>
          </div>
          <Botao onClick={enviar} disabled={enviando} className="aperta shrink-0">
            {enviando ? "Enviando..." : envio.respondidaEm ? "Enviar correção" : "Enviar resposta"}
          </Botao>
        </div>
      </div>
    </>
  );
}
