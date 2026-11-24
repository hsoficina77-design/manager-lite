import type { Metadata } from "next";
import { exigirContaLoja } from "@/lib/conta-loja";
import { PERIODOS_DOS_RESULTADOS, ehPeriodoDosResultados, resultadosDaLoja } from "@/lib/balcao";
import {
  Clientes,
  Comeco,
  Desfechos,
  Destaque,
  Devolucoes,
  Dicas,
  Entrega,
  Equipe,
  EscolhaDoPeriodo,
  Horarios,
  Indicadores,
  Marcas,
  MesAMes,
  Pecas,
  MINIMO_PARA_RAPIDEZ,
  RapidezVende,
  dicasDosResultados,
  disputasDecididas,
} from "@/components/peca-peca/Resultados";

export const metadata: Metadata = { title: "Resultados · Peça Peça" };

export const dynamic = "force-dynamic";

// Os resultados da autopeça no Peça Peça: quanto vendeu, o que aconteceu com cada
// cotação, o que fazer para vender mais. O endereço continua /loja/resumo (era o
// "Resumo"), para não quebrar o atalho de quem já tinha.
export default async function ResultadosDaLojaPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const [conta, { dias: pedido }] = await Promise.all([exigirContaLoja("loja.resumo"), searchParams]);
  const n = Number(pedido);
  const dias = ehPeriodoDosResultados(n) ? n : 30;
  const r = await resultadosDaLoja(conta.loja.id, dias);

  const nada = r.agora.recebidas === 0 && r.antes.recebidas === 0 && r.meses.every((m) => m.recebidas === 0);
  const comRapidez = disputasDecididas(r) >= MINIMO_PARA_RAPIDEZ;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 sm:space-y-5">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold text-tinta">Resultados da {conta.loja.nome}</h1>
        {!nada && <EscolhaDoPeriodo atual={dias} periodos={PERIODOS_DOS_RESULTADOS} />}
      </header>

      {nada ? (
        <Comeco nomeDaLoja={conta.loja.nome} />
      ) : (
        <>
          {/* O número e, logo embaixo, o que fazer com ele: a dica vale mais que o gráfico. */}
          <div className="pb-2 pt-1">
            <Destaque r={r} />
          </div>
          <Dicas dicas={dicasDosResultados(r)} />
          <Indicadores r={r} />

          {/* A página é longa: atalhos para cada assunto, presos embaixo do menu. */}
          <nav
            aria-label="Assuntos dos resultados"
            className="sticky top-14 z-10 -mx-4 flex gap-1.5 overflow-x-auto border-b border-linha bg-fundo/95 px-4 py-2 backdrop-blur [scrollbar-width:none]"
          >
            {ASSUNTOS.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                className="min-h-9 shrink-0 rounded-full border border-linha bg-superficie px-3 py-1.5 text-sm font-medium text-tinta-2 transition-colors hover:border-brand-500 hover:text-tinta"
              >
                {a.rotulo}
              </a>
            ))}
          </nav>

          <Assunto id="atendimento" titulo="Atendimento">
            <div className={comRapidez ? "grid gap-4 sm:gap-5 lg:grid-cols-2" : undefined}>
              <Desfechos r={r} />
              <RapidezVende r={r} />
            </div>
            <Horarios r={r} />
            <Equipe r={r} />
          </Assunto>

          <Assunto id="pecas" titulo="Peças e marcas">
            <Pecas r={r} />
            <Marcas r={r} />
          </Assunto>

          <Assunto id="clientes" titulo="Clientes">
            <Clientes r={r} />
          </Assunto>

          <Assunto id="entrega" titulo="Entrega e devoluções">
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
              <Entrega r={r} mediaDaLoja={conta.loja.entregaMedia} />
              <Devolucoes r={r} />
            </div>
          </Assunto>

          <Assunto id="historico" titulo="Mês a mês">
            <MesAMes r={r} />
          </Assunto>

          {!comRapidez && (
            <p className="px-1 text-xs text-tinta-3">
              Com mais algumas disputas decididas, aparece aqui se responder rápido faz a loja vender mais.
            </p>
          )}
        </>
      )}
    </div>
  );
}

const ASSUNTOS = [
  { id: "atendimento", rotulo: "Atendimento" },
  { id: "pecas", rotulo: "Peças" },
  { id: "clientes", rotulo: "Clientes" },
  { id: "entrega", rotulo: "Entrega" },
  { id: "historico", rotulo: "Mês a mês" },
];

/** Um assunto da página: o título e os blocos dele. O título para abaixo do menu e dos atalhos. */
function Assunto({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-32 space-y-4 pt-4 sm:space-y-5">
      <h2 id={`${id}-titulo`} className="text-lg font-bold text-tinta">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
