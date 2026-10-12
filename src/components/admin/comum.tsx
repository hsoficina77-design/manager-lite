"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { diasAte, type Situacao } from "@/lib/plano";

// Peças que a lista de oficinas, a ficha e a visão geral do painel admin dividem.

type Data = Date | string;

export type OficinaBasica = {
  id: string;
  nome: string;
  ativa: boolean;
  situacao: Situacao;
  testeAte: Data | null;
  pagoAte: Data | null;
  whatsapp: string | null;
  assinaturaAutomatica: boolean;
};

/** Selo do plano. Oficina sem prazo (antiga, convite, cortesia) leva "sem prazo". */
export function seloDoPlano(o: OficinaBasica): { texto: string; cor: string } {
  switch (o.situacao) {
    case "TESTE": {
      const n = Math.max(1, diasAte(o.testeAte));
      return { texto: `teste · ${n === 1 ? "último dia" : `faltam ${n} dias`}`, cor: "bg-atencao-fraco text-atencao" };
    }
    case "SOMENTE_LEITURA":
      return {
        texto: o.pagoAte ? "pagamento vencido" : `teste encerrado em ${dia(o.testeAte!)}`,
        cor: "bg-perigo-fraco text-perigo",
      };
    case "ASSINANTE":
      return {
        texto: `assinante até ${dia(o.pagoAte!)} · ${o.assinaturaAutomatica ? "cartão" : "Pix"}`,
        cor: "bg-ok-fraco text-ok",
      };
    default:
      return { texto: "sem prazo", cor: "bg-superficie-3 text-tinta-3" };
  }
}

export function Selos({ oficina, origem }: { oficina: OficinaBasica; origem?: string | null }) {
  const selo = seloDoPlano(oficina);
  return (
    <span className="flex flex-wrap gap-1.5">
      {!oficina.ativa && (
        <span className="rounded-full bg-perigo-fraco px-2 py-0.5 text-xs text-perigo">suspensa</span>
      )}
      <span className={cn("rounded-full px-2 py-0.5 text-xs", selo.cor)}>{selo.texto}</span>
      {origem && (
        <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">veio de {origem}</span>
      )}
    </span>
  );
}

export function linkWhatsapp(o: { nome: string; whatsapp: string | null }) {
  const texto = `Olá! Aqui é do boxOS. Vi que você está testando o sistema na ${o.nome} — posso ajudar em alguma coisa?`;
  return `https://wa.me/${o.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export function formatarWhatsapp(digitos: string) {
  const d = digitos.replace(/^55/, "");
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

export function LinkWhatsapp({ oficina, className }: { oficina: OficinaBasica; className?: string }) {
  if (!oficina.whatsapp) return null;
  return (
    <a
      href={linkWhatsapp(oficina)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("text-xs font-medium text-brand-texto hover:underline", className)}
    >
      WhatsApp {formatarWhatsapp(oficina.whatsapp)}
    </a>
  );
}

/**
 * +3 dias de teste, cortesia e suspender/reativar. As telas vêm do servidor, então
 * depois de cada ação a página é recarregada (`router.refresh`).
 */
export function AcoesDaOficina({ oficina, className }: { oficina: OficinaBasica; className?: string }) {
  const router = useRouter();
  const avisar = useAvisar();
  const confirmar = useConfirmar();

  async function enviar(corpo: Record<string, unknown>, sucesso: (json: { ativa?: boolean }) => string) {
    try {
      const res = await fetch(`/api/plataforma/oficinas/${oficina.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const json = await res.json();
      if (!res.ok) {
        avisar(json.error || "Erro ao salvar", "erro");
        return;
      }
      avisar(sucesso(json));
      router.refresh();
    } catch {
      avisar("Sem conexão com o servidor", "erro");
    }
  }

  async function cortesia() {
    const ok = await confirmar({
      titulo: `Liberar ${oficina.nome} como cortesia?`,
      texto: "A oficina passa a usar o boxOS sem prazo e sem pagar, como as oficinas convidadas.",
      acao: "Liberar cortesia",
    });
    if (ok) enviar({ acao: "cortesia" }, () => "Oficina liberada sem prazo");
  }

  async function alternar() {
    if (oficina.ativa) {
      const ok = await confirmar({
        titulo: `Suspender ${oficina.nome}?`,
        texto:
          "Todo mundo dessa oficina sai do sistema na hora e não consegue mais entrar. Os dados ficam guardados — reativar devolve o acesso do jeito que estava.",
        acao: "Suspender",
        perigo: true,
      });
      if (!ok) return;
    }
    enviar({ ativa: !oficina.ativa }, (json) => (json.ativa ? "Oficina reativada" : "Oficina suspensa"));
  }

  const comPrazo = oficina.situacao === "TESTE" || oficina.situacao === "SOMENTE_LEITURA";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {comPrazo && (
        <>
          <Botao
            variante="secundario"
            tamanho="denso"
            onClick={() => enviar({ acao: "estenderTeste", dias: 3 }, () => "Teste estendido em 3 dias")}
          >
            +3 dias de teste
          </Botao>
          <Botao variante="secundario" tamanho="denso" onClick={cortesia}>
            Cortesia
          </Botao>
        </>
      )}
      <Botao variante={oficina.ativa ? "perigo" : "secundario"} tamanho="denso" onClick={alternar}>
        {oficina.ativa ? "Suspender" : "Reativar"}
      </Botao>
    </div>
  );
}

// Fuso fixo: estas telas renderizam no servidor (UTC no Railway) e depois no navegador,
// e os dois precisam escrever a mesma data.
const FUSO = "America/Sao_Paulo";

export function dia(d: Data) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(d)
  );
}

export function quando(d: Data | null, vazio = "—") {
  if (!d) return vazio;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

/** "hoje", "ontem", "há 5 dias" — para último acesso e afins. */
export function haQuanto(d: Data | null, vazio = "nunca") {
  if (!d) return vazio;
  const dias = Math.floor((Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}
