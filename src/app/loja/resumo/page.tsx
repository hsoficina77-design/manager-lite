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
  RapidezVende,
  dicasDosResultados,
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
          <div className="pb-2 pt-1">
            <Destaque r={r} />
          </div>
          <Indicadores r={r} />
          <Dicas dicas={dicasDosResultados(r)} />
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Desfechos r={r} />
            <RapidezVende r={r} />
          </div>
          <Horarios r={r} />
          <Pecas r={r} />
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Clientes r={r} />
            <Marcas r={r} />
          </div>
          <Equipe r={r} />
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            <Entrega r={r} mediaDaLoja={conta.loja.entregaMedia} />
            <Devolucoes r={r} />
          </div>
          <MesAMes r={r} />
        </>
      )}
    </div>
  );
}
