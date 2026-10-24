import Link from "next/link";
import { exigirPlataforma } from "@/lib/auth";
import { resumoDoPecaPeca } from "@/lib/sistema";
import { lojasDoPainel } from "@/lib/balcao";
import { FaixaMetricas, Metrica, MetricaLink, Painel } from "@/components/ui/Dados";
import { CabecalhoAdmin } from "@/components/admin/CabecalhoAdmin";

export const dynamic = "force-dynamic";

function pct(parte: number, todo: number) {
  return todo ? `${Math.round((parte / todo) * 100)}%` : "—";
}

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "nunca");

function whatsapp(o: { nome: string; whatsapp: string | null }) {
  if (!o.whatsapp) return null;
  const texto = `Olá! Aqui é do Peça Peça. Vi que a ${o.nome} criou a conta — posso ajudar com a primeira cotação?`;
  return `https://wa.me/${o.whatsapp}?text=${encodeURIComponent(texto)}`;
}

// O Peça Peça visto pela plataforma: quem criou a conta grátis, quanto se cota, quantas
// viram cliente do boxOS e onde há oficina pedindo sem loja para atender.
export default async function AdminPecaPecaPage() {
  await exigirPlataforma();
  const [r, lojas] = await Promise.all([resumoDoPecaPeca(), lojasDoPainel()]);
  const topoFunil = r.funil[0].valor;
  const lojasQueMaisRespondem = lojas
    .filter((l) => l.ativa && l.cotacoes > 0)
    .sort((a, b) => b.respondidas - a.respondidas)
    .slice(0, 8);

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6">
      <CabecalhoAdmin
        titulo="Peça Peça"
        texto="As contas grátis de oficina, o uso das cotações e onde falta autopeça. Só contagens — o que está dentro de cada cotação é da oficina."
      />

      <div className="space-y-3">
        <FaixaMetricas colunas={4}>
          <Metrica rotulo="Contas grátis" valor={String(r.contas)} sub={`${r.novas7d} em 7 dias · ${r.novas30d} em 30`} tamanho="grande" />
          <Metrica rotulo="Entraram em 7 dias" valor={String(r.ativas7d)} sub={`de ${r.contas} contas`} tamanho="grande" />
          <Metrica rotulo="Cotações em 30 dias" valor={String(r.cotacoes30d)} sub={`${r.oficinasCotando30d} oficinas cotando`} tamanho="grande" />
          <Metrica
            rotulo="Pedidos em 30 dias"
            valor={String(r.pedidos30d)}
            sub={`${pct(r.pedidos30d, r.cotacoes30d)} das cotações`}
            tom="ok"
            tamanho="grande"
          />
        </FaixaMetricas>
        <FaixaMetricas colunas={2}>
          <MetricaLink href="/admin/lojas" rotulo="Lojas ativas" valor={String(lojas.filter((l) => l.ativa).length)} />
          <Metrica
            rotulo="Cidades com procura e sem loja"
            valor={String(r.semLoja.length)}
            tom={r.semLoja.length ? "atencao" : "neutro"}
          />
        </FaixaMetricas>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel titulo="Do Peça Peça para o boxOS" ajuda="Só quem criou a conta grátis pelo Peça Peça.">
          {topoFunil === 0 ? (
            <p className="text-sm text-tinta-3">Ninguém criou conta pelo Peça Peça ainda.</p>
          ) : (
            <ol className="space-y-3">
              {r.funil.map((etapa, i) => (
                <li key={etapa.rotulo}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-tinta-2">{etapa.rotulo}</span>
                    <span className="font-semibold tabular-nums text-tinta">
                      {etapa.valor}
                      {i > 0 && <span className="ml-1.5 text-xs font-normal text-tinta-3">{pct(etapa.valor, topoFunil)}</span>}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-superficie-3">
                    <div
                      className="h-2 rounded-full bg-brand-600"
                      style={{ width: `${Math.max(etapa.valor ? 2 : 0, (etapa.valor / topoFunil) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Painel>

        <Painel
          titulo="Onde abrir a próxima loja"
          ajuda="Cidades com oficina (do boxOS ou do Peça Peça) que nenhuma autopeça ativa atende."
        >
          {r.semLoja.length === 0 ? (
            <p className="text-sm text-tinta-3">Toda oficina tem ao menos uma loja que atende a cidade dela.</p>
          ) : (
            <ul className="divide-y divide-linha text-sm">
              {r.semLoja.map((c) => (
                <li key={c.cidade} className="flex justify-between gap-2 py-1.5">
                  <span className="truncate text-tinta-2">{c.cidade}</span>
                  <span className="shrink-0 tabular-nums text-tinta">
                    {c.oficinas} {c.oficinas === 1 ? "oficina" : "oficinas"}
                    {c.soPecaPeca > 0 && <span className="ml-1 text-xs text-tinta-3">({c.soPecaPeca} só Peça Peça)</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <Painel titulo="Lojas que mais respondem" ajuda="Desde o começo. Responder rápido é o que faz a oficina voltar.">
        {lojasQueMaisRespondem.length === 0 ? (
          <p className="text-sm text-tinta-3">Nenhuma loja recebeu cotação ainda.</p>
        ) : (
          <ul className="divide-y divide-linha text-sm">
            {lojasQueMaisRespondem.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-1.5">
                <span className="text-tinta">{l.nome}</span>
                <span className="tabular-nums text-tinta-3">
                  {l.respondidas} de {l.cotacoes} respondidas ({pct(l.respondidas, l.cotacoes)}) · {l.pedidos} pedidos
                </span>
              </li>
            ))}
          </ul>
        )}
      </Painel>

      <Painel titulo="Contas grátis" ajuda="Oficinas que entraram pelo Peça Peça, da mais nova para a mais antiga.">
        {r.lista.length === 0 ? (
          <p className="text-sm text-tinta-3">Nenhuma conta ainda.</p>
        ) : (
          <ul className="divide-y divide-linha">
            {r.lista.map((o) => {
              const zap = whatsapp(o);
              return (
                <li key={o.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link href={`/admin/oficinas/${o.id}`} className="text-sm font-semibold text-tinta hover:underline">
                      {o.nome}
                    </Link>
                    <p className="text-xs text-tinta-3">
                      {o.cidade ?? "sem cidade"} · criou em {data(o.criadaEm)} · entrou {data(o.ultimoAcesso)} ·{" "}
                      {o.cotacoes} {o.cotacoes === 1 ? "cotação" : "cotações"}
                      {o.origem && ` · veio de ${o.origem}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!o.ativa && <span className="rounded-full bg-perigo-fraco px-2 py-0.5 text-xs text-perigo">suspensa</span>}
                    {o.usaBoxOS && <span className="rounded-full bg-ok-fraco px-2 py-0.5 text-xs text-ok">ativou o boxOS</span>}
                    {zap && (
                      <a href={zap} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-texto hover:underline">
                        WhatsApp
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>
    </div>
  );
}
