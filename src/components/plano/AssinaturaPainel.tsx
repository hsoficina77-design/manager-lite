"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { Painel } from "@/components/ui/Dados";
import { diasAte, linkWhatsappBoxOS, type Situacao } from "@/lib/plano";

// A tela de assinar. A oficina escolhe a forma, vai para a página de pagamento da
// AbacatePay e volta em `/assinatura/obrigado`. Quem libera é o webhook, não esta tela.

function textoDaSituacao(p: {
  situacao: Situacao;
  testeAte: string | null;
  pagoAte: string | null;
  assinaturaAutomatica: boolean;
}): string {
  switch (p.situacao) {
    case "TESTE": {
      const n = Math.max(1, diasAte(p.testeAte));
      return `Você está no teste grátis — ${n === 1 ? "este é o último dia" : `faltam ${n} dias`}. Assinando agora, nada muda no uso: só deixa de ter prazo.`;
    }
    case "SOMENTE_LEITURA":
      return "O teste grátis terminou e a oficina está só para consulta. Assinando, a oficina volta a registrar assim que o pagamento é confirmado.";
    case "ASSINANTE":
      return p.assinaturaAutomatica
        ? `Assinatura ativa no cartão. A próxima cobrança é automática, por volta de ${formatDate(p.pagoAte!)}.`
        : `Mês pago até ${formatDate(p.pagoAte!)}. No Pix, cada pagamento libera mais 30 dias.`;
    default:
      return "Esta oficina usa o boxOS sem prazo de assinatura.";
  }
}

export default function AssinaturaPainel(props: {
  ehDono: boolean;
  situacao: Situacao;
  testeAte: string | null;
  pagoAte: string | null;
  assinaturaAutomatica: boolean;
  precoCentavos: number | null;
  pagamentoDisponivel: boolean;
}) {
  const router = useRouter();
  const avisar = useAvisar();
  const confirmar = useConfirmar();
  const [abrindo, setAbrindo] = useState<"cartao" | "pix" | null>(null);
  const whatsapp = linkWhatsappBoxOS("Olá! Quero assinar o boxOS para a minha oficina.");

  async function pagar(forma: "cartao" | "pix") {
    setAbrindo(forma);
    try {
      const res = await fetch("/api/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forma }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        avisar(json.error || "Não foi possível abrir o pagamento", "erro");
        setAbrindo(null);
        return;
      }
      // Página de pagamento da AbacatePay; de lá, volta para /assinatura/obrigado.
      window.location.href = json.url;
    } catch {
      avisar("Sem conexão com o servidor", "erro");
      setAbrindo(null);
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

  const preco = props.precoCentavos ? formatCurrency(props.precoCentavos / 100) : null;
  const mostraOpcoes = props.situacao !== "LIBERADA" && !(props.situacao === "ASSINANTE" && props.assinaturaAutomatica);

  return (
    <div className="max-w-2xl space-y-6">
      <Painel titulo="Situação">
        <p className="text-sm text-tinta-2">{textoDaSituacao(props)}</p>
      </Painel>

      {!props.ehDono ? (
        mostraOpcoes && (
          <Painel titulo="Quem assina é o dono">
            <p className="text-sm text-tinta-2">Peça ao dono da oficina para entrar e assinar por esta mesma tela.</p>
          </Painel>
        )
      ) : (
        <>
          {mostraOpcoes && (
            <Painel
              titulo={preco ? `Plano mensal · ${preco}/mês` : "Plano mensal"}
              ajuda="Tudo o que você usou no teste, sem limite de OS, clientes ou acessos da equipe."
            >
              {props.pagamentoDisponivel ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-linha p-4">
                    <p className="font-medium text-tinta">Cartão de crédito</p>
                    <p className="mt-1 text-xs text-tinta-3">Renova sozinho todo mês. Cancele quando quiser.</p>
                    <Botao className="mt-3 w-full" disabled={abrindo !== null} onClick={() => pagar("cartao")}>
                      {abrindo === "cartao" ? "Abrindo..." : "Assinar no cartão"}
                    </Botao>
                  </div>
                  <div className="rounded-lg border border-linha p-4">
                    <p className="font-medium text-tinta">Pix</p>
                    <p className="mt-1 text-xs text-tinta-3">
                      Paga um mês por vez. Avisamos aqui 5 dias antes de vencer.
                    </p>
                    <Botao
                      variante="secundario"
                      className="mt-3 w-full"
                      disabled={abrindo !== null}
                      onClick={() => pagar("pix")}
                    >
                      {abrindo === "pix" ? "Abrindo..." : "Pagar 1 mês no Pix"}
                    </Botao>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-tinta-2">
                  O pagamento online ainda não está disponível.{" "}
                  {whatsapp ? (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-brand-texto underline">
                      Fale com a gente no WhatsApp
                    </a>
                  ) : (
                    "Fale com a gente"
                  )}{" "}
                  para assinar.
                </p>
              )}
            </Painel>
          )}

          {props.situacao === "ASSINANTE" && props.assinaturaAutomatica && (
            <Painel titulo="Renovação automática">
              <Botao variante="perigo" onClick={cancelar}>
                Cancelar renovação
              </Botao>
            </Painel>
          )}
        </>
      )}
    </div>
  );
}
