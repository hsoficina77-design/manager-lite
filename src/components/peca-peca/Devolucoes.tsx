"use client";

import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Area, Aviso, Campo, CampoQuantidade } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import {
  MOTIVOS_DEVOLUCAO,
  SITUACOES_DEVOLUCAO,
  diferencaDaTroca,
  ehTroca,
  escolhaDa,
  oQueFaltaNaDevolucao,
  prazoParaDevolver,
  quantasDaParaDevolver,
  rotuloDoMotivo,
  situacaoDaDevolucao,
  type CotacaoVista,
  type DevolucaoVista,
  type EnvioVista,
  type MotivoDevolucao,
} from "./regras";
import { enviarJson, type useAoVivo } from "./aoVivo";

// A devolução do lado da oficina: pedir (a janela) e acompanhar (um cartão por peça
// devolvida, dentro do cartão da loja no pedido). O balcão tem o lado dele em Balcao.tsx.

type Gravar = ReturnType<typeof useAoVivo<CotacaoVista>>["gravar"];

const data = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/** As peças do pedido que vieram desta loja. */
export function pecasDaLoja(c: CotacaoVista, envio: EnvioVista) {
  return c.pecas.filter((p) => envio.ofertas.some((o) => o.id === p.ofertaId));
}

/** Ainda há peça desta loja que dá para devolver. */
export function temOQueDevolver(c: CotacaoVista, envio: EnvioVista): boolean {
  return pecasDaLoja(c, envio).some((p) => quantasDaParaDevolver(p, c.devolucoes) > 0);
}

/**
 * Até quando vale devolver peça sem uso. Sem data de chegada nenhuma (entrega antiga),
 * conta de agora, como o servidor.
 */
function prazoDaLoja(envio: EnvioVista) {
  return prazoParaDevolver({ ...envio, oficinaRecebeuEm: envio.oficinaRecebeuEm ?? new Date().toISOString() });
}

// ─── Pedir ──────────────────────────────────────────────────────────────────

export function ModalDevolucao({
  c,
  envio,
  url,
  gravar,
  onFechar,
}: {
  c: CotacaoVista;
  envio: EnvioVista;
  url: string;
  gravar: Gravar;
  onFechar: () => void;
}) {
  const avisar = useAvisar();
  const pecas = pecasDaLoja(c, envio).filter((p) => quantasDaParaDevolver(p, c.devolucoes) > 0);
  const [pecaId, setPecaId] = useState(pecas.length === 1 ? pecas[0].id : "");
  const [quantidade, setQuantidade] = useState("1");
  const [motivo, setMotivo] = useState<MotivoDevolucao | null>(null);
  const [detalhe, setDetalhe] = useState("");
  const [querTroca, setQuerTroca] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const peca = pecas.find((p) => p.id === pecaId);
  const oferta = peca ? escolhaDa(c, peca) : undefined;
  const maximo = peca ? quantasDaParaDevolver(peca, c.devolucoes) : 1;
  const qtd = Math.min(maximo, Math.max(1, Math.round(Number(quantidade) || 1)));
  const valor = oferta ? oferta.preco * qtd : 0;

  const prazo = prazoDaLoja(envio);
  const semUsoFechado = !prazo || Date.now() > prazo.getTime();
  const textoDoPrazo = !prazo
    ? `A ${envio.lojaNome} não aceita devolução de peça sem uso.`
    : Date.now() > prazo.getTime()
      ? `O prazo da ${envio.lojaNome} para peça sem uso acabou em ${data(prazo)}.`
      : `Prazo da ${envio.lojaNome}: até ${data(prazo)}.`;

  const doMotivo = MOTIVOS_DEVOLUCAO.find((m) => m.value === motivo);
  const comTroca = motivo !== null && motivo !== "NAO_USADA";

  async function pedir() {
    if (!peca) return setErro("Escolha a peça que vai voltar.");
    if (!motivo) return setErro("Escolha o motivo da devolução.");
    if (doMotivo?.pergunta && !detalhe.trim()) return setErro(`${doMotivo.pergunta} Conte para a loja.`);
    setErro("");
    setEnviando(true);
    const r = await gravar(
      enviarJson(`${url}/devolucoes`, "POST", {
        envioId: envio.id,
        pecaId: peca.id,
        quantidade: qtd,
        motivo,
        detalhe: detalhe.trim(),
        querTroca: comTroca && querTroca,
      }),
      { devolveDado: true }
    );
    setEnviando(false);
    if (!r.ok) return setErro(r.erro);
    avisar(`Devolução pedida à ${envio.lojaNome}`);
    onFechar();
  }

  return (
    <Modal
      titulo={`Devolver peça à ${envio.lojaNome}`}
      descricao="A loja recebe o pedido no balcão dela e responde por aqui."
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao variante="secundario" onClick={onFechar}>
            Voltar
          </Botao>
          <Botao onClick={pedir} disabled={enviando}>
            {enviando ? "Pedindo..." : "Pedir devolução"}
          </Botao>
        </div>
      }
    >
      <div className="space-y-5">
        {pecas.length > 1 && (
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-sm font-medium text-tinta">Qual peça?</legend>
            {pecas.map((p) => (
              <Opcao key={p.id} marcada={pecaId === p.id} onEscolher={() => setPecaId(p.id)} nome="peca">
                <span className="text-sm font-semibold text-tinta">
                  {p.quantidade}× {p.descricao}
                </span>
                <span className="block text-xs text-tinta-3">{escolhaDa(c, p)?.marca}</span>
              </Opcao>
            ))}
          </fieldset>
        )}
        {pecas.length === 1 && peca && (
          <p className="rounded-lg bg-superficie-2 px-3 py-2 text-sm text-tinta">
            {peca.quantidade}× {peca.descricao} <span className="text-tinta-3">({oferta?.marca})</span>
          </p>
        )}

        {peca && maximo > 1 && (
          <Campo rotulo="Quantas voltam?" ajuda={`Até ${maximo}.`}>
            <CampoQuantidade valor={quantidade} onChange={setQuantidade} className="w-24" aria-label="Quantidade" />
          </Campo>
        )}

        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-sm font-medium text-tinta">Por que vai voltar?</legend>
          {MOTIVOS_DEVOLUCAO.map((m) => {
            const fechado = m.value === "NAO_USADA" && semUsoFechado;
            return (
              <Opcao
                key={m.value}
                marcada={motivo === m.value}
                onEscolher={() => setMotivo(m.value)}
                desligada={fechado}
                nome="motivo"
              >
                <span className="text-sm font-semibold text-tinta">{m.rotulo}</span>
                <span className="block text-xs text-tinta-3">{m.ajuda}</span>
                {m.value === "NAO_USADA" && (
                  <span className={cn("block text-xs", fechado ? "text-perigo" : "text-tinta-3")}>{textoDoPrazo}</span>
                )}
              </Opcao>
            );
          })}
        </fieldset>

        {doMotivo?.pergunta && (
          <Campo rotulo={doMotivo.pergunta} obrigatorio ajuda="O balconista lê antes de responder.">
            <Area
              value={detalhe}
              onChange={(e) => setDetalhe(e.target.value)}
              rows={2}
              placeholder={
                motivo === "ERRADA" ? "Ex.: veio com 4 furos, o carro é de 5; é a do lado esquerdo" : "Ex.: está fazendo barulho"
              }
            />
          </Campo>
        )}

        {comTroca && (
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-sm font-medium text-tinta">O que você quer?</legend>
            <Opcao marcada={querTroca} onEscolher={() => setQuerTroca(true)} nome="troca">
              <span className="text-sm font-semibold text-tinta">
                {motivo === "ERRADA" ? "Quero a peça certa" : "Quero outra peça, sem defeito"}
              </span>
              <span className="block text-xs text-tinta-3">
                A loja manda a nova e o motoboy leva esta de volta. Se a loja não tiver, o valor volta para você.
              </span>
            </Opcao>
            <Opcao marcada={!querTroca} onEscolher={() => setQuerTroca(false)} nome="troca">
              <span className="text-sm font-semibold text-tinta">Quero devolver e receber o valor</span>
              <span className="block text-xs text-tinta-3">{formatCurrency(valor)}, acertado com a loja.</span>
            </Opcao>
          </fieldset>
        )}

        {motivo === "NAO_USADA" && (
          <p className="text-xs text-tinta-3">
            Valor da peça: {formatCurrency(valor)}. O acerto é feito com a loja, como o pagamento.
          </p>
        )}

        {!envio.oficinaRecebeuEm && (
          <Aviso tipo="atencao">Pedir a devolução também confirma que as peças da {envio.lojaNome} chegaram.</Aviso>
        )}
        {erro && <Aviso>{erro}</Aviso>}
      </div>
    </Modal>
  );
}

/** Uma alternativa grande, fácil de acertar com o dedo. */
function Opcao({
  marcada,
  onEscolher,
  desligada = false,
  nome,
  children,
}: {
  marcada: boolean;
  onEscolher: () => void;
  desligada?: boolean;
  nome: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-12 items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
        marcada ? "border-brand-500 bg-brand-50" : "border-linha",
        desligada ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-superficie-2"
      )}
    >
      <input
        type="radio"
        name={nome}
        checked={marcada}
        disabled={desligada}
        onChange={onEscolher}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
      />
      <span className="min-w-0">{children}</span>
    </label>
  );
}

// ─── Acompanhar ─────────────────────────────────────────────────────────────

/** O dinheiro da devolução, do jeito que se fala no balcão. */
function linhaDoDinheiro(d: DevolucaoVista): string | null {
  const s = situacaoDaDevolucao(d);
  if (s === "RECUSADA" || s === "CANCELADA") return null;
  if (ehTroca(d)) {
    if (!d.aceitaEm) return null;
    const diferenca = diferencaDaTroca(d);
    if (diferenca > 0) return `A peça nova custa ${formatCurrency(diferenca)} a mais, pagos na entrega.`;
    if (diferenca < 0) return `A peça nova custa menos: a loja devolve ${formatCurrency(-diferenca)}.`;
    return "Sem diferença de preço.";
  }
  if (d.valorDevolvido !== null) {
    return d.valorDevolvido < d.valor
      ? `A loja devolveu ${formatCurrency(d.valorDevolvido)} dos ${formatCurrency(d.valor)}.`
      : `A loja devolveu ${formatCurrency(d.valorDevolvido)}.`;
  }
  return `Valor da peça: ${formatCurrency(d.valor)}. O acerto é feito com a loja, como o pagamento.`;
}

export function DevolucoesDaLoja({
  c,
  envio,
  url,
  gravar,
}: {
  c: CotacaoVista;
  envio: EnvioVista;
  url: string;
  gravar: Gravar;
}) {
  const avisar = useAvisar();
  const confirmar = useConfirmar();
  const [salvando, setSalvando] = useState<string | null>(null);
  const devolucoes = c.devolucoes.filter((d) => d.envioId === envio.id);
  if (devolucoes.length === 0) return null;

  async function agir(d: DevolucaoVista, acao: string, aviso: string) {
    setSalvando(d.id);
    const r = await gravar(enviarJson(`${url}/devolucoes/${d.id}`, "PATCH", { acao }), { devolveDado: true });
    setSalvando(null);
    if (!r.ok) return avisar(r.erro, "erro");
    avisar(aviso);
  }

  async function cancelar(d: DevolucaoVista) {
    const ok = await confirmar({
      titulo: "Cancelar esta devolução?",
      texto: `A peça fica com você, e o pedido sai do balcão da ${envio.lojaNome}.`,
      acao: "Cancelar devolução",
      perigo: true,
    });
    if (ok) await agir(d, "cancelar", "Devolução cancelada");
  }

  return (
    <ul className="mt-3 space-y-2">
      {devolucoes.map((d) => {
        const s = situacaoDaDevolucao(d);
        const peca = c.pecas.find((p) => p.id === d.pecaId);
        const dinheiro = linhaDoDinheiro(d);
        const ocupado = salvando === d.id;
        const podeCancelar = s !== "CONCLUIDA" && s !== "RECUSADA" && s !== "CANCELADA" && !d.lojaRecebeuEm && !d.trocaSaiuEm;
        const esperaTroca = ehTroca(d) && (s === "ACEITA" || s === "TROCA_A_CAMINHO") && !d.oficinaRecebeuTrocaEm;
        const recotar = d.motivo !== "NAO_USADA" && (s === "RECUSADA" || (d.querTroca && d.semAPeca));
        return (
          <li
            key={d.id}
            className={cn(
              "space-y-2 rounded-lg border p-3",
              s === "PRECO_NOVO" || s === "TROCA_A_CAMINHO" ? "border-atencao-linha bg-atencao-fraco" : "border-linha bg-superficie-2"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 text-sm font-semibold text-tinta">
                Devolução: {d.quantidade}× {peca?.descricao ?? "peça"}
              </p>
              <span className={cn(SITUACOES_DEVOLUCAO[s].cor, "shrink-0")}>{SITUACOES_DEVOLUCAO[s].rotulo}</span>
            </div>
            <p className="text-xs text-tinta-3">
              {rotuloDoMotivo(d.motivo)}
              {d.detalhe && ` · "${d.detalhe}"`} · {d.querTroca ? "pediu troca" : "pediu o valor"}
            </p>
            {d.trocaMarca || d.trocaPreco !== null ? (
              <p className="text-xs text-tinta-2">
                Peça da troca: {[d.trocaMarca, d.trocaPreco !== null && `${formatCurrency(d.trocaPreco)} cada`].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            <p className={cn("text-sm", s === "RECUSADA" ? "text-perigo" : "text-tinta-2")}>{oQueFaltaNaDevolucao(d)}</p>
            {d.querTroca && d.semAPeca && s !== "RECUSADA" && s !== "CANCELADA" && (
              <p className="text-sm text-tinta-2">A loja não tem a peça para trocar, então o valor volta para você.</p>
            )}
            {dinheiro && <p className="text-xs text-tinta-3">{dinheiro}</p>}

            <div className="flex flex-wrap gap-2">
              {s === "PRECO_NOVO" && (
                <>
                  <Botao variante="sucesso" tamanho="denso" onClick={() => agir(d, "aceitar-preco", "Combinado: a loja vai mandar a peça")} disabled={ocupado}>
                    Pode mandar
                  </Botao>
                  <Botao variante="secundario" tamanho="denso" onClick={() => agir(d, "recusar-preco", "Combinado: a peça volta pelo valor")} disabled={ocupado}>
                    Prefiro devolver e receber o valor
                  </Botao>
                </>
              )}
              {esperaTroca && (
                <Botao
                  variante={s === "TROCA_A_CAMINHO" ? "sucesso" : "secundario"}
                  tamanho="denso"
                  onClick={() => agir(d, "recebi-troca", "Peça nova recebida")}
                  disabled={ocupado}
                >
                  {s === "TROCA_A_CAMINHO" ? "Recebi a peça nova" : "Já chegou? Marcar a peça nova como recebida"}
                </Botao>
              )}
              {recotar && (
                <BotaoLink href={`/peca-peca/nova?de=${c.id}&devolucao=${d.id}`} variante="secundario" tamanho="denso">
                  {d.motivo === "ERRADA" ? "Cotar a certa nas outras lojas" : "Cotar outra nas outras lojas"}
                </BotaoLink>
              )}
              {podeCancelar && (
                <Botao variante="fantasma" tamanho="denso" onClick={() => cancelar(d)} disabled={ocupado} className="text-perigo">
                  Cancelar devolução
                </Botao>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
