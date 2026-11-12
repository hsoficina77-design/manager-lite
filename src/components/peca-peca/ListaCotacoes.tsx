"use client";

import Link from "next/link";
import { BotaoLink } from "@/components/ui/Botao";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";
import { Conversa as IconeConversa, Mais } from "@/components/ui/Icones";
import { ContadorDeMensagens } from "./Conversa";
import {
  aConferir,
  descricaoDoVeiculo,
  etapaDa,
  oficinaPrecisaAgir,
  prazoDaLoja,
  type CotacaoVista,
  type LojaVista,
  type LojasDaOficina,
} from "./regras";
import { useAoVivo } from "./aoVivo";
import { AvisoSemConexao, Cabecalho, InformarCidade, PilulaEtapa, haQuanto } from "./ui";
import { useUsaBoxOS } from "@/components/UsuarioProvider";

const PASSOS_INICIO = [
  { titulo: "Carro e peças", texto: "Digite o carro e o que precisa, do jeito que fala no balcão." },
  { titulo: "As lojas respondem", texto: "Cada loja recebe no balcão dela e manda preço, marca e prazo." },
  { titulo: "Você escolhe", texto: "Os preços aparecem lado a lado. Dá para misturar lojas." },
];

// Com o boxOS, a escolha ainda vira orçamento e OS; sem ele, o caminho termina no pedido.
const PASSOS_COM_BOXOS = [
  ...PASSOS_INICIO,
  { titulo: "Orçamento pronto", texto: "Com o seu preço, já no boxOS. Só precisa do nome do cliente." },
  { titulo: "Pede e vira OS", texto: "Cliente aprovou: o pedido vai para a loja e o orçamento vira OS." },
];
const PASSOS_SEM_BOXOS = [
  ...PASSOS_INICIO,
  { titulo: "Faz o pedido", texto: "Vai direto para o balcão de cada loja, e a entrega aparece aqui." },
];

export function ListaCotacoes() {
  const passos = useUsaBoxOS() ? PASSOS_COM_BOXOS : PASSOS_SEM_BOXOS;
  const { dados: cotacoes, semConexao } = useAoVivo<CotacaoVista[]>("/api/peca-peca/cotacoes", 5000);
  const { dados: daOficina, carregar: recarregarLojas } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojas = daOficina?.lojas ?? null;
  const paraConferir = (cotacoes ?? []).filter((c) => etapaDa(c) === "CONFERIR");
  const devolucoesParaVoce = (cotacoes ?? []).filter((c) => c.devolucoes.some(oficinaPrecisaAgir));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Cabecalho
        titulo="Cotação de peças"
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

      {/* A loja marcou "entregue": só a oficina fecha a entrega, conferindo as peças. */}
      {paraConferir.length > 0 && (
        <Pendencia titulo="Confira as peças que chegaram">
          {paraConferir.map((c) => (
            <ItemDaPendencia
              key={c.id}
              id={c.id}
              numero={c.numero}
              carro={descricaoDoVeiculo(c.veiculo)}
              detalhe={`entregue por ${c.envios
                .filter(aConferir)
                .map((e) => e.lojaNome)
                .join(" e ")}`}
            />
          ))}
        </Pendencia>
      )}

      {/* A loja respondeu à devolução e a oficina tem o que fazer: topar o preço ou receber a troca. */}
      {devolucoesParaVoce.length > 0 && (
        <Pendencia titulo="Devoluções esperando você">
          {devolucoesParaVoce.map((c) => (
            <ItemDaPendencia
              key={c.id}
              id={c.id}
              numero={c.numero}
              carro={descricaoDoVeiculo(c.veiculo)}
              detalhe={c.devolucoes
                .filter(oficinaPrecisaAgir)
                .map((d) => c.pecas.find((p) => p.id === d.pecaId)?.descricao ?? "peça")
                .join(", ")}
            />
          ))}
        </Pendencia>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-tinta">Cotações</h2>

        {!cotacoes ? (
          <EsqueletoLista linhas={3} />
        ) : cotacoes.length === 0 ? (
          <Vazio
            titulo="Nenhuma cotação ainda"
            texto="Digite o carro e as peças que precisa. A cotação vai para as lojas que atendem a sua cidade."
            acao={<BotaoLink href="/peca-peca/nova">Nova cotação</BotaoLink>}
          />
        ) : (
          <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
            {cotacoes.map((c) => (
              // A linha é uma etiqueta de prateleira: o número da cotação na Baloo, grande,
              // é o que o mecânico procura; o carro vem logo ao lado; o resto, miúdo.
              <Link
                key={c.id}
                href={`/peca-peca/${c.id}`}
                className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="flex items-start gap-3.5 sm:contents">
                  <span className="w-10 shrink-0 pt-0.5 text-right font-pecapeca text-[1.6rem] font-extrabold leading-none text-tinta-3 tabular-nums">
                    {c.numero}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium text-tinta">{descricaoDoVeiculo(c.veiculo)}</span>
                      {c.veiculo.placa && <Placa placa={c.veiculo.placa} />}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-tinta-3">
                      <span>
                        {c.pecas.length} {c.pecas.length === 1 ? "peça" : "peças"}
                      </span>
                      <span>
                        {c.envios.filter((e) => e.respondidaEm).length} de {c.envios.length}{" "}
                        {c.envios.length === 1 ? "loja respondeu" : "lojas responderam"}
                      </span>
                      <span>{haQuanto(c.criadaEm)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-[3.5rem] sm:pl-0">
                  {c.envios.some((e) => e.naoLidas > 0) && (
                    <span className="inline-flex items-center gap-1 text-tinta-2">
                      <IconeConversa tamanho={14} />
                      <ContadorDeMensagens total={c.envios.reduce((s, e) => s + e.naoLidas, 0)} />
                    </span>
                  )}
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
        {/* É uma sequência de verdade, então os números ficam: na Baloo, como as
            etiquetas da lista, e numa folha só, sem um cartão por passo. */}
        <ol
          className={`grid divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie sm:divide-x sm:divide-y-0 ${passos.length === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}
        >
          {passos.map((p, i) => (
            <li key={p.titulo} className="flex gap-3 p-3.5 sm:block sm:p-4">
              <span className="w-5 shrink-0 font-pecapeca text-xl font-extrabold leading-none text-brand-600">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-tinta sm:mt-2">{p.titulo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-tinta-3">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

/** A placa como ela é: letras em caixa alta dentro de uma moldura fina. */
function Placa({ placa }: { placa: string }) {
  return (
    <span className="shrink-0 rounded-[3px] border border-linha-forte px-1.5 text-[11px] font-semibold uppercase leading-[18px] tracking-[0.08em] text-tinta-2">
      {placa}
    </span>
  );
}

/**
 * O que a oficina precisa resolver: um título e uma régua âmbar à esquerda, sem a caixa
 * pastel — a régua chama o olho sem competir com a lista logo abaixo.
 */
function Pendencia({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-l-[3px] border-[rgb(var(--gr-sem-resposta))] pl-4">
      <h2 className="text-sm font-semibold text-tinta">{titulo}</h2>
      <ul className="mt-1.5 space-y-1">{children}</ul>
    </section>
  );
}

function ItemDaPendencia({ id, numero, carro, detalhe }: { id: string; numero: number; carro: string; detalhe: string }) {
  return (
    <li>
      <Link href={`/peca-peca/${id}`} className="group flex items-baseline gap-2 text-sm">
        <span className="font-pecapeca font-extrabold text-tinta-3">{numero}</span>
        <span className="font-medium text-tinta underline-offset-2 group-hover:underline">{carro}</span>
        <span className="truncate text-tinta-3">{detalhe}</span>
      </Link>
    </li>
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
          Nenhuma autopeça que atende {cidade ?? "a oficina"} está no Peça Peça ainda. Estamos chegando a novas
          cidades — a sua já está na nossa lista.
        </p>
      ) : (
        <ul className="divide-y divide-linha">
          {lojas.map((l) => (
            <li key={l.id} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-tinta">{l.nome}</p>
              <p className="text-xs text-tinta-3">
                {l.cidade ?? "Cidade não informada"}, entrega em {prazoDaLoja(l)}
              </p>
              <p className="text-xs text-tinta-3">Atende: {l.atende.join(", ") || "—"}</p>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}
