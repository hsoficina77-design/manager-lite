"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { Aviso, Campo, Entrada } from "@/components/ui/Campos";
import { Painel } from "@/components/ui/Dados";
import { useAvisar } from "@/components/ui/Avisos";

// O que o dono da autopeça mexe no cadastro da loja: telefone e prazo do motoboy (é a
// sugestão de prazo no balcão). A região — as cidades que a loja atende — fica com a
// plataforma: é ela que decide quais oficinas mandam cotação para a loja.

export function DadosDaLoja({
  inicial,
  loja,
}: {
  inicial: { telefone: string | null; entregaMin: number; entregaMax: number };
  loja: { nome: string; cidade: string | null; uf: string | null; atende: string[] };
}) {
  const router = useRouter();
  const avisar = useAvisar();
  const [telefone, setTelefone] = useState(inicial.telefone ?? "");
  const [entregaMin, setEntregaMin] = useState(String(inicial.entregaMin));
  const [entregaMax, setEntregaMax] = useState(String(inicial.entregaMax));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const r = await fetch("/api/loja/dados", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: telefone.trim() || null, entregaMin, entregaMax }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) return setErro(json.error ?? "Não consegui salvar.");
      avisar("Dados da loja salvos");
      router.refresh();
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-tinta">{loja.nome}</h1>
        <p className="mt-0.5 text-sm text-tinta-3">
          {[loja.cidade, loja.uf].filter(Boolean).join(" - ") || "Cidade não informada"}
        </p>
      </div>

      <Painel titulo="Contato e entrega">
        <form onSubmit={salvar} className="space-y-4">
          <Campo rotulo="Telefone do balcão">
            <Entrada type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Entrega mais rápida (min)" ajuda="Vem preenchido como prazo no balcão.">
              <Entrada
                inputMode="numeric"
                value={entregaMin}
                onChange={(e) => setEntregaMin(e.target.value.replace(/\D/g, ""))}
              />
            </Campo>
            <Campo rotulo="Entrega mais demorada (min)">
              <Entrada
                inputMode="numeric"
                value={entregaMax}
                onChange={(e) => setEntregaMax(e.target.value.replace(/\D/g, ""))}
              />
            </Campo>
          </div>
          {erro && <Aviso>{erro}</Aviso>}
          <Botao type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Botao>
        </form>
      </Painel>

      <Painel titulo="Cidades atendidas" ajuda="As oficinas destas cidades mandam cotação para a loja. Para mudar, fale com a gente.">
        <p className="text-sm text-tinta-2">{loja.atende.join(", ") || "—"}</p>
      </Painel>
    </div>
  );
}
