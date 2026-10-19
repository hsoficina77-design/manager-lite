"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import { useConfirmar } from "@/components/ui/Avisos";
import { Mais } from "@/components/ui/Icones";
import {
  apagarTudo,
  criarExemplo,
  descricaoDoVeiculo,
  nomeDaLoja,
} from "./dados";
import { useCotacoes, useHidratado } from "./hooks";
import { AlternarVisao, AvisoDaPrevia, Cabecalho, PilulaEtapa, haQuanto } from "./ui";

const PASSOS = [
  { titulo: "Placa e peças", texto: "Digite a placa e o que precisa, do jeito que fala no balcão." },
  { titulo: "As lojas respondem", texto: "Yoshio e Bom Preço recebem o pedido e mandam preço, marca e prazo." },
  { titulo: "Você escolhe", texto: "Os preços aparecem lado a lado. Dá para misturar lojas." },
  { titulo: "Orçamento pronto", texto: "Com a sua margem, já no boxOS. Só precisa do nome do cliente." },
  { titulo: "Pede e vira OS", texto: "Cliente aprovou: a peça é pedida e o orçamento vira OS com o telefone." },
];

export function ListaCotacoes() {
  const router = useRouter();
  const confirmar = useConfirmar();
  const cotacoes = useCotacoes();
  const hidratado = useHidratado();

  function verExemplo() {
    const c = criarExemplo();
    router.push(`/peca-peca/${c.id}`);
  }

  async function limpar() {
    const ok = await confirmar({
      titulo: "Apagar as cotações de teste?",
      texto: "Some só daqui deste aparelho. Os orçamentos que já foram criados no boxOS continuam lá.",
      acao: "Apagar cotações",
      perigo: true,
    });
    if (ok) apagarTudo();
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <AlternarVisao atual="oficina" />
      </div>

      <AvisoDaPrevia />

      <section className="space-y-3">
        <h2 className="font-semibold text-tinta">Cotações</h2>

        {!hidratado ? (
          <EsqueletoLista linhas={3} />
        ) : cotacoes.length === 0 ? (
          <Vazio
            titulo="Nenhuma cotação ainda"
            texto="Comece uma do zero ou veja um exemplo pronto, com um Gol 2015 e cinco peças."
            acao={
              <div className="flex flex-wrap justify-center gap-2">
                <Botao variante="secundario" onClick={verExemplo}>
                  Ver um exemplo
                </Botao>
                <BotaoLink href="/peca-peca/nova">Nova cotação</BotaoLink>
              </div>
            }
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
                      {c.lojas.map(nomeDaLoja).join(" e ")} · {haQuanto(c.criadaEm)}
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

        {hidratado && cotacoes.length > 0 && (
          <div className="flex flex-wrap justify-between gap-2">
            <Botao variante="fantasma" tamanho="denso" onClick={verExemplo}>
              Criar outro exemplo
            </Botao>
            <Botao variante="fantasma" tamanho="denso" onClick={limpar}>
              Apagar cotações de teste
            </Botao>
          </div>
        )}
      </section>

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
