"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BotaoLink } from "@/components/ui/Botao";

// Volta da página de pagamento. Esta tela **não** libera nada — qualquer um poderia
// abri-la digitando o endereço. Ela só espera o webhook da AbacatePay chegar,
// consultando a situação a cada poucos segundos.

const INTERVALO_MS = 3000;
const DESISTE_APOS_MS = 3 * 60_000;

export default function ObrigadoPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<"esperando" | "liberada" | "demorando">("esperando");

  useEffect(() => {
    const inicio = Date.now();
    let parar = false;
    let timer: ReturnType<typeof setTimeout>;

    async function consultar() {
      try {
        const res = await fetch("/api/assinatura");
        const json = await res.json();
        if (json.situacao === "ASSINANTE") {
          setEstado("liberada");
          router.refresh(); // tira a faixa de teste do topo
          return;
        }
      } catch {
        // Sem rede por um instante: tenta de novo no próximo ciclo.
      }
      if (parar) return;
      if (Date.now() - inicio > DESISTE_APOS_MS) {
        setEstado("demorando");
        return;
      }
      timer = setTimeout(consultar, INTERVALO_MS);
    }

    consultar();
    return () => {
      parar = true;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="p-4 pt-6 sm:p-6">
      <div className="mx-auto max-w-md rounded-2xl border border-linha bg-superficie p-6 text-center shadow-sm">
        {estado === "esperando" && (
          <>
            <h1 className="text-base font-semibold text-tinta">Confirmando o pagamento…</h1>
            <p className="mt-2 text-sm text-tinta-3">
              Assim que a confirmação chegar, a oficina é liberada. Costuma levar poucos segundos.
            </p>
          </>
        )}
        {estado === "liberada" && (
          <>
            <h1 className="text-base font-semibold text-tinta">Pagamento confirmado!</h1>
            <p className="mt-2 text-sm text-tinta-3">Obrigado por assinar o boxOS. Está tudo liberado.</p>
            <BotaoLink href="/" className="mt-5 w-full">
              Voltar para a oficina
            </BotaoLink>
          </>
        )}
        {estado === "demorando" && (
          <>
            <h1 className="text-base font-semibold text-tinta">A confirmação está demorando</h1>
            <p className="mt-2 text-sm text-tinta-3">
              Pagamentos às vezes levam alguns minutos para serem confirmados. Assim que chegar, a faixa do topo some
              sozinha — não precisa pagar de novo.
            </p>
            <BotaoLink href="/" variante="secundario" className="mt-5 w-full">
              Voltar para a oficina
            </BotaoLink>
          </>
        )}
      </div>
    </div>
  );
}
