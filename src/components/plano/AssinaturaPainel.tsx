"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { Painel } from "@/components/ui/Dados";
import { Campo, Entrada } from "@/components/ui/Campos";
import { Calendario, Cartao, Chevron, Confere, Escudo, QrCode } from "@/components/ui/Icones";
import {
  AVISO_VENCIMENTO_DIAS,
  CARENCIA_DIAS,
  diasAte,
  linkWhatsappBoxOS,
  type Situacao,
} from "@/lib/plano";

// A tela de assinar. A oficina escolhe a forma, vai para a fatura do Asaas e volta em
// `/assinatura/obrigado`. Quem libera é o webhook, não esta tela.

type Forma = "cartao" | "pix";

type Tom = "marca" | "ok" | "atencao";

const TOM: Record<Tom, { selo: string; ponto: string; numero: string }> = {
  marca: { selo: "bg-brand-50 text-brand-texto", ponto: "bg-brand-600", numero: "text-brand-texto" },
  ok: { selo: "bg-ok-fraco text-ok", ponto: "bg-ok", numero: "text-ok" },
  atencao: { selo: "bg-atencao-fraco text-atencao", ponto: "bg-atencao", numero: "text-atencao" },
};

type Resumo = {
  selo: string;
  tom: Tom;
  titulo: string;
  texto: string;
  /** Número de destaque à direita (dias restantes, data paga até). */
  destaque?: { valor: string; rotulo: string };
};

function resumoDaSituacao(p: {
  situacao: Situacao;
  testeAte: string | null;
  pagoAte: string | null;
  assinaturaAutomatica: boolean;
}): Resumo {
  switch (p.situacao) {
    case "TESTE": {
      const n = Math.max(1, diasAte(p.testeAte));
      return {
        selo: "Teste grátis",
        tom: "marca",
        titulo: n === 1 ? "Hoje é o último dia do teste" : `Faltam ${n} dias de teste`,
        texto: `${p.testeAte ? `O teste vai até ${formatDate(p.testeAte)}. ` : ""}Assinando agora, nada muda no uso: só deixa de ter prazo.`,
        destaque: { valor: String(n), rotulo: n === 1 ? "dia restante" : "dias restantes" },
      };
    }
    case "SOMENTE_LEITURA":
      return {
        selo: "Só consulta",
        tom: "atencao",
        titulo: "O acesso está só para consulta",
        texto:
          "Nada foi apagado: você ainda vê tudo. Assinando, a oficina volta a registrar assim que o pagamento é confirmado.",
      };
    case "ASSINANTE":
      return p.assinaturaAutomatica
        ? {
            selo: "Assinatura ativa",
            tom: "ok",
            titulo: "Assinatura ativa no cartão",
            texto: "A cobrança é automática todo mês. Você não precisa fazer nada.",
            destaque: { valor: formatDate(p.pagoAte!), rotulo: "próxima cobrança" },
          }
        : {
            selo: "Mês pago",
            tom: "ok",
            titulo: "Assinatura em dia",
            texto: `No Pix, cada pagamento libera mais 30 dias. Avisamos aqui ${AVISO_VENCIMENTO_DIAS} dias antes de vencer.`,
            destaque: { valor: formatDate(p.pagoAte!), rotulo: "pago até" },
          };
    default:
      return {
        selo: "Acesso liberado",
        tom: "ok",
        titulo: "Sua oficina usa o boxOS sem prazo",
        texto: "Esta oficina não precisa de assinatura.",
      };
  }
}

const INCLUSO = [
  "Ordens de serviço e orçamentos sem limite",
  "Clientes e veículos sem limite",
  "Acesso para toda a equipe",
  "Documentos em PDF com a marca da oficina",
  "Contas a receber, caixa e controle de gastos",
  "Estoque de peças",
  "Produtividade dos mecânicos",
  "Fotos do veículo na OS",
];

const FORMAS: Record<Forma, { nome: string; Icone: typeof Cartao; resumo: string; pontos: string[] }> = {
  cartao: {
    nome: "Cartão de crédito",
    Icone: Cartao,
    resumo: "Renova sozinho todo mês",
    pontos: ["Sem se preocupar com vencimento", "Cancele quando quiser, aqui mesmo"],
  },
  pix: {
    nome: "Pix",
    Icone: QrCode,
    resumo: "Paga um mês por vez",
    pontos: [`Aviso ${AVISO_VENCIMENTO_DIAS} dias antes de vencer`, "Sem renovação automática"],
  },
};

function Pergunta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-linha first:border-t-0">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium text-tinta [&::-webkit-details-marker]:hidden">
        {titulo}
        <Chevron tamanho={16} className="shrink-0 text-tinta-3 transition-transform group-open:rotate-180" />
      </summary>
      <p className="pb-4 text-sm text-tinta-2">{children}</p>
    </details>
  );
}

export default function AssinaturaPainel(props: {
  ehDono: boolean;
  situacao: Situacao;
  testeAte: string | null;
  pagoAte: string | null;
  assinaturaAutomatica: boolean;
  precoCentavos: number | null;
  pagamentoDisponivel: boolean;
  /** Primeira cobrança: o Asaas exige CPF ou CNPJ de quem paga. */
  pedeDocumento: boolean;
  documentoSugerido: string;
}) {
  const router = useRouter();
  const avisar = useAvisar();
  const confirmar = useConfirmar();
  // Quem já paga no Pix está renovando: começa com o Pix marcado.
  const [forma, setForma] = useState<Forma>(props.situacao === "ASSINANTE" ? "pix" : "cartao");
  const [abrindo, setAbrindo] = useState(false);
  const [documento, setDocumento] = useState(props.documentoSugerido);
  const whatsapp = linkWhatsappBoxOS("Olá! Quero assinar o boxOS para a minha oficina.");

  async function pagar() {
    // Conferência rápida; a de verdade (dígitos verificadores) é no servidor.
    const digitos = documento.replace(/\D/g, "");
    if (props.pedeDocumento && digitos.length !== 11 && digitos.length !== 14) {
      avisar("Informe o CPF ou o CNPJ de quem paga", "erro");
      return;
    }
    setAbrindo(true);
    try {
      const res = await fetch("/api/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forma, ...(props.pedeDocumento ? { cpfCnpj: digitos } : {}) }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        avisar(json.error || "Não foi possível abrir o pagamento", "erro");
        setAbrindo(false);
        return;
      }
      // Fatura do Asaas; de lá, volta para /assinatura/obrigado.
      window.location.href = json.url;
    } catch {
      avisar("Sem conexão com o servidor", "erro");
      setAbrindo(false);
    }
  }

  async function cancelar() {
    const ok = await confirmar({
      titulo: "Cancelar a renovação automática?",
      texto: `O cartão não será mais cobrado. A oficina segue com acesso completo até ${props.pagoAte ? formatDate(props.pagoAte) : "o fim do período pago"}; depois disso fica só para consulta.`,
      acao: "Cancelar renovação",
      cancelar: "Manter assinatura",
      perigo: true,
    });
    if (!ok) return;
    const res = await fetch("/api/assinatura", { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      avisar(json.error || "Não foi possível cancelar", "erro");
      return;
    }
    avisar("Renovação automática cancelada");
    router.refresh();
  }

  const reais = props.precoCentavos ? props.precoCentavos / 100 : null;
  const preco = reais ? formatCurrency(reais) : null;
  const mostraOpcoes = props.situacao !== "LIBERADA" && !(props.situacao === "ASSINANTE" && props.assinaturaAutomatica);
  const resumo = resumoDaSituacao(props);
  const tom = TOM[resumo.tom];

  const textoBotao = abrindo
    ? "Abrindo pagamento..."
    : forma === "cartao"
      ? `Assinar no cartão${preco ? ` · ${preco}/mês` : ""}`
      : props.situacao === "ASSINANTE"
        ? `Pagar mais 1 mês no Pix${preco ? ` · ${preco}` : ""}`
        : `Pagar 1 mês no Pix${preco ? ` · ${preco}` : ""}`;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Situação */}
      <section className="overflow-hidden rounded-xl border border-linha bg-superficie">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                tom.selo
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", tom.ponto)} />
              {resumo.selo}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-tinta">{resumo.titulo}</h2>
            <p className="mt-1 text-sm text-tinta-2">{resumo.texto}</p>
          </div>
          {resumo.destaque && (
            <div className="flex shrink-0 items-center gap-3 rounded-lg bg-superficie-2 px-4 py-3 sm:min-w-36 sm:flex-col sm:items-end sm:gap-0 sm:text-right">
              <p className={cn("text-2xl font-bold tabular-nums sm:text-3xl", tom.numero)}>
                {resumo.destaque.valor}
              </p>
              <p className="text-xs text-tinta-3">{resumo.destaque.rotulo}</p>
            </div>
          )}
        </div>
      </section>

      {!props.ehDono ? (
        mostraOpcoes && (
          <Painel titulo="Quem assina é o dono">
            <p className="text-sm text-tinta-2">Peça ao dono da oficina para entrar e assinar por esta mesma tela.</p>
          </Painel>
        )
      ) : (
        <>
          {mostraOpcoes && (
            <section className="overflow-hidden rounded-xl border border-linha bg-superficie">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                {/* O plano */}
                <div className="border-b border-linha bg-superficie-2 p-4 sm:p-6 lg:border-b-0 lg:border-r">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-texto">Plano mensal</p>
                  {preco ? (
                    <>
                      <p className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-bold tabular-nums text-tinta">{preco}</span>
                        <span className="text-sm text-tinta-3">/mês</span>
                      </p>
                      <p className="mt-1 text-xs text-tinta-3">
                        Cerca de {formatCurrency(reais! / 30)} por dia. Sem fidelidade.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-2xl font-bold text-tinta">Um plano, tudo incluso</p>
                  )}

                  <p className="mt-5 text-sm font-medium text-tinta">Tudo o que você usou no teste:</p>
                  <ul className="mt-3 space-y-2.5">
                    {INCLUSO.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-tinta-2">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok-fraco text-ok">
                          <Confere tamanho={11} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Como pagar */}
                <div className="p-4 sm:p-6">
                  {props.pagamentoDisponivel ? (
                    <>
                      <p className="font-semibold text-tinta">Como você quer pagar?</p>
                      <div role="radiogroup" aria-label="Forma de pagamento" className="mt-3 space-y-3">
                        {(Object.keys(FORMAS) as Forma[]).map((chave) => {
                          const f = FORMAS[chave];
                          const marcada = forma === chave;
                          return (
                            <label
                              key={chave}
                              className={cn(
                                "relative flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors",
                                marcada
                                  ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                                  : "border-linha hover:border-linha-forte hover:bg-superficie-2"
                              )}
                            >
                              <input
                                type="radio"
                                name="forma"
                                value={chave}
                                checked={marcada}
                                onChange={() => setForma(chave)}
                                disabled={abrindo}
                                className="sr-only"
                              />
                              <span
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                  marcada ? "bg-brand-600 text-brand-fg" : "bg-superficie-3 text-tinta-2"
                                )}
                              >
                                <f.Icone tamanho={20} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-tinta">{f.nome}</span>
                                  {chave === "cartao" && (
                                    <span className="rounded-full bg-ok-fraco px-2 py-0.5 text-[11px] font-semibold text-ok">
                                      Mais prático
                                    </span>
                                  )}
                                </span>
                                <span className="mt-0.5 block text-sm text-tinta-2">{f.resumo}</span>
                                <span className="mt-1.5 block space-y-0.5">
                                  {f.pontos.map((ponto) => (
                                    <span key={ponto} className="block text-xs text-tinta-3">
                                      · {ponto}
                                    </span>
                                  ))}
                                </span>
                              </span>
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                                  marcada ? "border-brand-600" : "border-linha-forte"
                                )}
                              >
                                {marcada && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      {props.pedeDocumento && (
                        <Campo
                          rotulo="CPF ou CNPJ de quem paga"
                          ajuda="Vai na cobrança do boxOS. Pedimos só na primeira vez."
                          obrigatorio
                          className="mt-4"
                        >
                          <Entrada
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value.replace(/[^\d./-]/g, ""))}
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={18}
                          />
                        </Campo>
                      )}

                      <Botao className="mt-5 min-h-12 w-full text-base" disabled={abrindo} onClick={pagar}>
                        {textoBotao}
                      </Botao>
                      <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs text-tinta-3">
                        <Escudo tamanho={14} className="mt-px shrink-0 text-ok" />
                        Pagamento seguro pelo Asaas. O boxOS não vê nem guarda os dados do cartão.
                      </p>
                    </>
                  ) : (
                    <div className="flex h-full flex-col justify-center">
                      <p className="font-semibold text-tinta">Assine com a gente</p>
                      <p className="mt-1 text-sm text-tinta-2">
                        O pagamento online ainda não está disponível.{" "}
                        {whatsapp ? "Chame no WhatsApp que a gente ativa a sua assinatura." : "Fale com a gente para assinar."}
                      </p>
                      {whatsapp && (
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-brand-fg hover:bg-brand-700"
                        >
                          Falar no WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {props.situacao === "ASSINANTE" && props.assinaturaAutomatica && (
            <Painel
              titulo="Renovação automática"
              ajuda="Cancelando, o cartão não é mais cobrado. O acesso segue até o fim do mês já pago."
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-tinta-2">
                  <Calendario tamanho={16} className="text-tinta-3" />
                  Próxima cobrança por volta de {formatDate(props.pagoAte!)}
                </p>
                <Botao variante="perigo" onClick={cancelar}>
                  Cancelar renovação
                </Botao>
              </div>
            </Painel>
          )}
        </>
      )}

      {props.situacao !== "LIBERADA" && (
        <Painel titulo="Dúvidas frequentes">
          <div>
            <Pergunta titulo="Posso cancelar quando quiser?">
              Sim, sem multa nem fidelidade. No cartão, você cancela nesta tela e o acesso continua até o fim do mês já
              pago. No Pix não há renovação: se não pagar o próximo mês, ela simplesmente para.
            </Pergunta>
            <Pergunta titulo="O que acontece com meus dados se eu não assinar?">
              Nada é apagado. A oficina fica só para consulta: você continua vendo clientes, OS e o financeiro, só não
              registra coisas novas. Assinando, tudo volta a funcionar como antes.
            </Pergunta>
            <Pergunta titulo="E se o pagamento atrasar um pouco?">
              {`Você tem ${CARENCIA_DIAS} dias de tolerância depois do vencimento, com acesso completo. No Pix, avisamos aqui ${AVISO_VENCIMENTO_DIAS} dias antes de vencer.`}
            </Pergunta>
            <Pergunta titulo="Cartão ou Pix: qual escolher?">
              O cartão renova sozinho e você não precisa lembrar de nada. O Pix é pago mês a mês, cada pagamento libera
              mais 30 dias. O plano e tudo o que vem nele são iguais nos dois.
            </Pergunta>
          </div>
          {whatsapp && (
            <p className="mt-2 border-t border-linha pt-4 text-sm text-tinta-2">
              Ficou alguma dúvida?{" "}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-texto underline">
                Fale com a gente no WhatsApp
              </a>
            </p>
          )}
        </Painel>
      )}
    </div>
  );
}
