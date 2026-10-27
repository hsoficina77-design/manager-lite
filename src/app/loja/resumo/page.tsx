import type { Metadata } from "next";
import { exigirContaLoja } from "@/lib/conta-loja";
import { resumoDaLoja } from "@/lib/balcao";
import { formatCurrency } from "@/lib/utils";
import { FaixaMetricas, Metrica, Painel } from "@/components/ui/Dados";
import { MOTIVOS_DEVOLUCAO } from "@/components/peca-peca/regras";

export const metadata: Metadata = { title: "Resumo · Peça Peça" };

export const dynamic = "force-dynamic";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function nomeDoMes(mes: string) {
  const [ano, m] = mes.split("-");
  return `${MESES[Number(m) - 1]}/${ano.slice(2)}`;
}

function tempo(minutos: number | null) {
  if (minutos === null) return "—";
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  return `${h} h ${minutos % 60} min`;
}

// O que o dono da autopeça acompanha do balcão: quantas cotações chegaram, quantas a
// loja respondeu e quão rápido, quantas viraram pedido, quanto valeram e quanto voltou.
export default async function ResumoDaLojaPage() {
  const conta = await exigirContaLoja("loja.resumo");
  const r = await resumoDaLoja(conta.loja.id);
  const taxa = r.recebidas ? Math.round((r.respondidas / r.recebidas) * 100) : 0;
  const conversao = r.respondidas ? Math.round((r.pedidos / r.respondidas) * 100) : 0;
  const porMotivo = MOTIVOS_DEVOLUCAO.filter((m) => r.devolucoesPorMotivo[m.value] > 0)
    .map((m) => `${r.devolucoesPorMotivo[m.value]} ${m.rotulo.toLowerCase()}`)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold text-tinta">Resumo da loja</h1>
        <p className="mt-0.5 text-sm text-tinta-3">Últimos 30 dias, pelo Peça Peça.</p>
      </div>

      <FaixaMetricas colunas={4}>
        <Metrica rotulo="Cotações recebidas" valor={String(r.recebidas)} tamanho="grande" />
        <Metrica
          rotulo="Respondidas"
          valor={`${taxa}%`}
          sub={`${r.respondidas} de ${r.recebidas}`}
          tom={taxa >= 80 ? "ok" : taxa >= 50 ? "atencao" : r.recebidas ? "perigo" : "neutro"}
          tamanho="grande"
        />
        <Metrica rotulo="Tempo para responder" valor={tempo(r.minutosParaResponder)} sub="metade responde em até" tamanho="grande" />
        <Metrica
          rotulo="Pedidos"
          valor={String(r.pedidos)}
          sub={`${conversao}% das respondidas · ${formatCurrency(r.valor)}`}
          tom="ok"
          tamanho="grande"
        />
      </FaixaMetricas>

      <Painel
        titulo="Devoluções"
        ajuda="Últimos 30 dias. O valor dos pedidos acima já vem sem o que a loja devolveu."
      >
        {r.devolucoes === 0 ? (
          <p className="text-sm text-tinta-3">Nenhuma peça voltou nos últimos 30 dias.</p>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="text-tinta">
              <strong>{r.devolucoes}</strong> {r.devolucoes === 1 ? "devolução pedida" : "devoluções pedidas"}
              {r.pedidos > 0 && <span className="text-tinta-3"> ({Math.round((r.devolucoes / r.pedidos) * 100)}% dos pedidos)</span>}
            </p>
            <p className="text-tinta-3">{porMotivo}</p>
            <p className="text-tinta-3">Devolvido às oficinas: {formatCurrency(r.devolvido)}</p>
          </div>
        )}
      </Painel>

      <Painel
        titulo="Mês a mês"
        ajuda="Pedido é a cotação em que a oficina fechou alguma peça com a loja. O valor já vem sem o que foi devolvido."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-tinta-3">
                <th className="py-1.5 pr-3 font-medium">Mês</th>
                <th className="py-1.5 pr-3 text-right font-medium">Recebidas</th>
                <th className="py-1.5 pr-3 text-right font-medium">Respondidas</th>
                <th className="py-1.5 pr-3 text-right font-medium">Pedidos</th>
                <th className="py-1.5 pr-3 text-right font-medium">Devolvido</th>
                <th className="py-1.5 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {[...r.meses].reverse().map((m) => (
                <tr key={m.mes} className="tabular-nums text-tinta">
                  <td className="py-2 pr-3">{nomeDoMes(m.mes)}</td>
                  <td className="py-2 pr-3 text-right">{m.recebidas}</td>
                  <td className="py-2 pr-3 text-right">{m.respondidas}</td>
                  <td className="py-2 pr-3 text-right">{m.pedidos}</td>
                  <td className="py-2 pr-3 text-right">{m.devolvido ? formatCurrency(m.devolvido) : "—"}</td>
                  <td className="py-2 text-right">{formatCurrency(m.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>

      <Painel titulo="Quem respondeu" ajuda="Últimos 30 dias, de quem entra com login no painel.">
        {r.quemRespondeu.length === 0 ? (
          <p className="text-sm text-tinta-3">Ninguém respondeu pelo painel ainda.</p>
        ) : (
          <ul className="divide-y divide-linha">
            {r.quemRespondeu.map((p) => (
              <li key={p.nome} className="flex justify-between py-2 text-sm">
                <span className="text-tinta">{p.nome}</span>
                <span className="tabular-nums text-tinta-3">
                  {p.respostas} {p.respostas === 1 ? "resposta" : "respostas"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Painel>
    </div>
  );
}
