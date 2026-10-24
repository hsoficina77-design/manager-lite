"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { rotuloDoMunicipio } from "@/lib/municipios";
import { Botao } from "@/components/ui/Botao";
import { Aviso, Campo, Entrada } from "@/components/ui/Campos";
import { Painel } from "@/components/ui/Dados";
import { useAvisar } from "@/components/ui/Avisos";
import { buscar } from "./aoVivo";
import { CidadesAtendidas, outrasCidades } from "./CidadesAtendidas";
import { ENTREGAS_PARA_MEDIA, ENTREGA_PADRAO } from "./regras";

// O que o dono da autopeça mexe no cadastro da loja: o telefone e as cidades que atende
// — é por elas que as oficinas alcançam a loja. O tempo de entrega só aparece: é medido
// nas entregas da loja, ninguém digita (ver regras.ts). A cidade onde a loja fica é da
// plataforma.

type Bloco = "telefone" | "cidades";

export function DadosDaLoja({
  loja,
}: {
  loja: {
    nome: string;
    cidade: string | null;
    uf: string | null;
    atende: string[];
    telefone: string | null;
    entregaMedia: number | null;
    entregasMedidas: number;
  };
}) {
  const router = useRouter();
  const avisar = useAvisar();
  const sede = loja.cidade && loja.uf ? { nome: loja.cidade, uf: loja.uf } : null;
  const salvas = outrasCidades(loja.atende, sede ? rotuloDoMunicipio(sede) : (loja.cidade ?? ""));

  const [telefone, setTelefone] = useState(loja.telefone ?? "");
  const [outras, setOutras] = useState(salvas);
  const [salvando, setSalvando] = useState<Bloco | null>(null);
  const [erro, setErro] = useState<{ bloco: Bloco; texto: string } | null>(null);
  const cidadesMudaram = outras.length !== salvas.length || outras.some((c) => !salvas.includes(c));
  const faltam = ENTREGAS_PARA_MEDIA - loja.entregasMedidas;

  async function salvar(bloco: Bloco, corpo: object, aviso: string) {
    setErro(null);
    setSalvando(bloco);
    try {
      const r = await buscar("/api/loja/dados", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) return setErro({ bloco, texto: json.error ?? "Não consegui salvar." });
      avisar(aviso);
      router.refresh();
    } catch {
      setErro({ bloco, texto: "Sem conexão. Tente de novo." });
    } finally {
      setSalvando(null);
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

      <Painel titulo="Contato">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvar("telefone", { telefone: telefone.trim() || null }, "Telefone salvo");
          }}
          className="space-y-4"
        >
          <Campo rotulo="Telefone do balcão">
            <Entrada type="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </Campo>
          {erro?.bloco === "telefone" && <Aviso>{erro.texto}</Aviso>}
          <Botao type="submit" disabled={salvando !== null}>
            {salvando === "telefone" ? "Salvando..." : "Salvar"}
          </Botao>
        </form>
      </Painel>

      <Painel titulo="Tempo de entrega" ajuda="Do pedido até as peças chegarem na oficina. É medido nas entregas da loja.">
        {loja.entregaMedia !== null ? (
          <>
            <p className="text-2xl font-bold tabular-nums text-tinta">{loja.entregaMedia} min</p>
            <p className="mt-1 text-sm text-tinta-3">
              Média real das últimas {loja.entregasMedidas} entregas. Atualiza sozinha a cada entrega.
            </p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold tabular-nums text-tinta">
              {ENTREGA_PADRAO.min} a {ENTREGA_PADRAO.max} min
            </p>
            <p className="mt-1 text-sm text-tinta-3">
              Tempo padrão de loja nova. Depois de {ENTREGAS_PARA_MEDIA} entregas, passa a valer o tempo real da loja.{" "}
              {faltam === 1 ? "Falta 1." : `Faltam ${faltam}.`}
            </p>
          </>
        )}
        <p className="mt-3 text-xs text-tinta-3">
          É o que as oficinas veem ao escolher a loja, e vem preenchido como prazo no balcão.
        </p>
      </Painel>

      <Painel titulo="Cidades atendidas" ajuda="As oficinas destas cidades mandam cotação para a loja.">
        <div className="space-y-4">
          <CidadesAtendidas sede={sede} outras={outras} onChange={setOutras} />
          {erro?.bloco === "cidades" && <Aviso>{erro.texto}</Aviso>}
          <Botao
            disabled={!cidadesMudaram || salvando !== null}
            onClick={() => salvar("cidades", { atende: outras }, "Cidades salvas")}
          >
            {salvando === "cidades" ? "Salvando..." : "Salvar cidades"}
          </Botao>
        </div>
      </Painel>
    </div>
  );
}
