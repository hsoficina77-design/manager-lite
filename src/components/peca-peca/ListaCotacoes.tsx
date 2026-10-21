"use client";

import Link from "next/link";
import { BotaoLink } from "@/components/ui/Botao";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { Mais } from "@/components/ui/Icones";
import { descricaoDoVeiculo, type CotacaoVista, type LojaVista, type LojasDaOficina } from "./regras";
import { useAoVivo } from "./aoVivo";
import { AvisoSemConexao, Cabecalho, InformarCidade, PilulaEtapa, haQuanto } from "./ui";

const PASSOS = [
  { titulo: "Placa e peças", texto: "Digite a placa e o que precisa, do jeito que fala no balcão." },
  { titulo: "As lojas respondem", texto: "Cada loja recebe no balcão dela e manda preço, marca e prazo." },
  { titulo: "Você escolhe", texto: "Os preços aparecem lado a lado. Dá para misturar lojas." },
  { titulo: "Orçamento pronto", texto: "Com o seu preço, já no boxOS. Só precisa do nome do cliente." },
  { titulo: "Pede e vira OS", texto: "Cliente aprovou: o pedido vai para a loja e o orçamento vira OS." },
];

export function ListaCotacoes() {
  const { dados: cotacoes, semConexao } = useAoVivo<CotacaoVista[]>("/api/peca-peca/cotacoes", 5000);
  const { dados: daOficina, carregar: recarregarLojas } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojas = daOficina?.lojas ?? null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Cabecalho
        titulo="Cotação de peças"
        subtitulo={`As autopeças ${daOficina?.cidade ? `de ${daOficina.cidade}` : "da região"} num lugar só.`}
        acao={
          <BotaoLink href="/peca-peca/nova">
            <Mais tamanho={16} />
            Nova cotação
          </BotaoLink>
        }
      />

      <AvisoSemConexao ativo={semConexao} />
      {daOficina && (!daOficina.cidade || !daOficina.estado) && (
        <InformarCidade cidadeAtual={daOficina.cidade} onSalva={recarregarLojas} />
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-tinta">Cotações</h2>

        {!cotacoes ? (
          <EsqueletoLista linhas={3} />
        ) : cotacoes.length === 0 ? (
          <Vazio
            titulo="Nenhuma cotação ainda"
            texto="Digite a placa e as peças que precisa. A cotação vai para as lojas que atendem a sua cidade."
            acao={<BotaoLink href="/peca-peca/nova">Nova cotação</BotaoLink>}
          />
        ) : (
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
        )}
      </section>

      <PainelLojas lojas={lojas} cidade={daOficina?.cidade ?? null} />

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

/** As autopeças que recebem as cotações da oficina. */
function PainelLojas({ lojas, cidade }: { lojas: LojaVista[] | null; cidade: string | null }) {
  return (
    <Painel
      titulo={cidade ? `Lojas que atendem ${cidade}` : "Lojas"}
      ajuda="É para elas que vão as cotações. Cada loja só vê o que foi mandado para ela, nunca o preço da outra."
    >
      {!lojas ? (
        <EsqueletoLista linhas={2} />
      ) : lojas.length === 0 ? (
        <p className="text-sm text-tinta-3">
          Nenhuma autopeça que atende {cidade ?? "a oficina"} está no Peça Peça ainda.
        </p>
      ) : (
        <ul className="divide-y divide-linha">
          {lojas.map((l) => (
            <li key={l.id} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-tinta">{l.nome}</p>
              <p className="text-xs text-tinta-3">
                {l.cidade ?? "—"} · entrega em {l.entregaMin}–{l.entregaMax} min
              </p>
              <p className="text-xs text-tinta-3">Atende: {l.atende.join(", ") || "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
