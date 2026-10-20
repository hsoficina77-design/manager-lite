"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Botao, BotaoLink, classesBotao } from "@/components/ui/Botao";
import { Aviso } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { useAvisar } from "@/components/ui/Avisos";
import { Mais } from "@/components/ui/Icones";
import { EXEMPLO, descricaoDoVeiculo, type CotacaoVista, type LojaVista, type LojasDaOficina } from "./regras";
import { enviarJson, useAoVivo } from "./aoVivo";
import { AvisoDaPrevia, AvisoSemConexao, Cabecalho, PilulaEtapa, haQuanto } from "./ui";

const PASSOS = [
  { titulo: "Placa e peças", texto: "Digite a placa e o que precisa, do jeito que fala no balcão." },
  { titulo: "As lojas respondem", texto: "Cada loja recebe no balcão dela e manda preço, marca e prazo." },
  { titulo: "Você escolhe", texto: "Os preços aparecem lado a lado. Dá para misturar lojas." },
  { titulo: "Orçamento pronto", texto: "Com o seu preço, já no boxOS. Só precisa do nome do cliente." },
  { titulo: "Pede e vira OS", texto: "Cliente aprovou: o pedido vai para a loja e o orçamento vira OS." },
];

export function ListaCotacoes() {
  const router = useRouter();
  const { dados: cotacoes, semConexao } = useAoVivo<CotacaoVista[]>("/api/peca-peca/cotacoes", 5000);
  const { dados: daOficina } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojas = daOficina?.lojas ?? null;
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState("");

  async function verExemplo() {
    if (!lojas?.length) return;
    setErro("");
    setCriando(true);
    try {
      const r = await enviarJson("/api/peca-peca/cotacoes", "POST", { ...EXEMPLO, lojas: lojas.map((l) => l.id) })();
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(corpo.error ?? "Não consegui criar o exemplo.");
        return;
      }
      router.push(`/peca-peca/${corpo.id}`);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Cabecalho
        titulo="Cotação de peças"
        subtitulo="As autopeças de Suzano num lugar só."
        acao={
          <BotaoLink href="/peca-peca/nova">
            <Mais tamanho={16} />
            Nova cotação
          </BotaoLink>
        }
      />

      <AvisoDaPrevia />
      <AvisoSemConexao ativo={semConexao} />

      <section className="space-y-3">
        <h2 className="font-semibold text-tinta">Cotações</h2>

        {!cotacoes ? (
          <EsqueletoLista linhas={3} />
        ) : cotacoes.length === 0 ? (
          <Vazio
            titulo="Nenhuma cotação ainda"
            texto="Comece uma do zero ou crie um exemplo pronto, com um Gol 2015 e cinco peças, enviado para as lojas."
            acao={
              <div className="flex flex-wrap justify-center gap-2">
                <Botao variante="secundario" onClick={verExemplo} disabled={criando || !lojas}>
                  {criando ? "Criando..." : "Criar um exemplo"}
                </Botao>
                <BotaoLink href="/peca-peca/nova">Nova cotação</BotaoLink>
              </div>
            }
          />
        ) : (
          <>
            <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
              {cotacoes.map((c) => (
                <Link
                  key={c.id}
                  href={`/peca-peca/${c.id}`}
                  className="flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex items-center gap-3 sm:contents">
                    <span className="w-10 shrink-0 text-sm font-bold text-brand-texto">#{c.numero}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-tinta">
                        {descricaoDoVeiculo(c.veiculo)}
                        {c.veiculo.placa && <span className="text-tinta-3"> · {c.veiculo.placa}</span>}
                      </p>
                      <p className="truncate text-xs text-tinta-3">
                        {c.pecas.length} {c.pecas.length === 1 ? "peça" : "peças"} ·{" "}
                        {c.envios.filter((e) => e.respondidaEm).length} de {c.envios.length} lojas responderam ·{" "}
                        {haQuanto(c.criadaEm)}
                      </p>
                    </div>
                  </div>
                  <div className="pl-[3.25rem] sm:pl-0">
                    <PilulaEtapa cotacao={c} />
                  </div>
                </Link>
              ))}
            </div>
            <Botao variante="fantasma" tamanho="denso" onClick={verExemplo} disabled={criando || !lojas}>
              {criando ? "Criando..." : "Criar outro exemplo"}
            </Botao>
          </>
        )}
        {erro && <Aviso>{erro}</Aviso>}
      </section>

      <PainelBalcoes lojas={lojas} cidade={daOficina?.cidade ?? null} />

      <section className="space-y-3">
        <h2 className="font-semibold text-tinta">Como funciona</h2>
        <ol className="grid gap-2 sm:grid-cols-5">
          {PASSOS.map((p, i) => (
            // No celular, número ao lado do texto: cinco cartões empilhados tomavam a tela.
            <li key={p.titulo} className="flex gap-3 rounded-xl border border-linha bg-superficie p-3 sm:block">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-brand-fg">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-tinta sm:mt-2">{p.titulo}</p>
                <p className="mt-0.5 text-xs text-tinta-3">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** Os links dos balcões, para abrir em outra aba (ou mandar para o celular) e testar. */
function PainelBalcoes({ lojas, cidade }: { lojas: LojaVista[] | null; cidade: string | null }) {
  const avisar = useAvisar();

  async function copiar(loja: LojaVista) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${loja.link}`);
      avisar(`Link copiado: balcão ${loja.nome}`);
    } catch {
      avisar("Não consegui copiar. Abra o balcão e copie o endereço da aba.", "erro");
    }
  }

  return (
    <Painel
      titulo={cidade ? `Lojas que atendem ${cidade}` : "Balcões das lojas"}
      ajuda="Abra cada balcão numa aba nova, ou mande o link para outro aparelho, e faça o papel do balconista. Cada loja só vê o que foi mandado para ela."
    >
      {!cidade && (
        <p className="mb-3 rounded-lg border border-atencao-linha bg-atencao-fraco px-3 py-2 text-xs text-atencao">
          A oficina está sem cidade em Configurações, então aparecem todas as lojas. Com a cidade preenchida,
          aparecem só as que atendem a região.
        </p>
      )}
      {!lojas ? (
        <EsqueletoLista linhas={2} />
      ) : lojas.length === 0 ? (
        <p className="text-sm text-tinta-3">
          Nenhuma loja atende {cidade ?? "a oficina"} ainda. As lojas são cadastradas no painel admin do boxOS.
        </p>
      ) : (
        <ul className="divide-y divide-linha">
          {lojas.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-tinta">{l.nome}</p>
                <p className="text-xs text-tinta-3">
                  {l.cidade ?? "—"} · entrega em {l.entregaMin}–{l.entregaMax} min
                </p>
                <p className="text-xs text-tinta-3">Atende: {l.atende.join(", ") || "—"}</p>
              </div>
              <div className="flex gap-2">
                <Botao variante="fantasma" tamanho="denso" onClick={() => copiar(l)}>
                  Copiar link
                </Botao>
                <a href={l.link} target="_blank" rel="noopener" className={classesBotao("secundario", "denso")}>
                  Abrir balcão
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
