"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { useProduto } from "@/components/ProdutoProvider";

// O orçamento para o cliente é do boxOS, vendido à parte. Na oficina só do Peça Peça,
// o lugar do "Gerar orçamento" mostra esta oferta.

/** Cartão no fim da cotação: o que o boxOS faria com ela. */
export function VitrineBoxOS({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className="rounded-xl border border-linha bg-superficie-2 p-4">
      <p className="text-sm font-semibold text-tinta">Quer mandar o orçamento para o cliente?</p>
      {!compacta && (
        <p className="mt-1 text-sm text-tinta-2">
          Com o boxOS, as peças escolhidas viram orçamento com a sua margem, em PDF com a sua marca — e depois a OS.
          Mesmo login, e as cotações continuam aqui.
        </p>
      )}
      <BotaoLink href="/conheca-o-boxos" variante="secundario" tamanho="denso" className="mt-3 w-full">
        Conhecer o boxOS
      </BotaoLink>
    </div>
  );
}

/** Botão que começa o teste grátis do boxOS na mesma conta. */
export function AtivarBoxOS({ diasTeste }: { diasTeste: number }) {
  const router = useRouter();
  const produto = useProduto();
  const [ativando, setAtivando] = useState(false);
  const [erro, setErro] = useState("");
  const [pronto, setPronto] = useState<string | null>(null);

  async function ativar() {
    setErro("");
    setAtivando(true);
    try {
      const r = await fetch("/api/boxos/ativar", { method: "POST" });
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) return setErro(corpo.error ?? "Não consegui ativar o boxOS. Tente de novo.");
      // No endereço do Peça Peça, o boxOS abre no endereço dele, onde se entra de novo.
      if (produto === "peca-peca" && corpo.enderecoDoBoxOS) {
        setPronto(`${corpo.enderecoDoBoxOS}/login`);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setAtivando(false);
    }
  }

  if (pronto) {
    return (
      <div className="space-y-3 rounded-xl border border-ok-linha bg-ok-fraco p-4">
        <p className="text-sm font-semibold text-ok">Pronto! O boxOS está ativo por {diasTeste} dias grátis.</p>
        <p className="text-sm text-tinta-2">Entre no boxOS com o mesmo e-mail e a mesma senha daqui.</p>
        <a
          href={pronto}
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-ok px-4 text-sm font-semibold text-ok-fg"
        >
          Abrir o boxOS
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Botao onClick={ativar} disabled={ativando} className="w-full">
        {ativando ? "Ativando..." : `Começar ${diasTeste} dias grátis`}
      </Botao>
      <p className="text-center text-xs text-tinta-3">Sem cartão. Depois do teste, você decide se assina.</p>
      {erro && <p className="text-center text-sm text-perigo">{erro}</p>}
    </div>
  );
}
