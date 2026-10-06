"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { labelStatus } from "@/lib/constants";
import { Botao } from "@/components/ui/Botao";
import { Modal } from "@/components/ui/Modal";
import { EsqueletoLista, Vazio } from "@/components/ui/Dados";
import {
  identificacaoDoItem,
  saldoDoItem,
  type ComprovanteItem,
} from "@/components/ComprovantePagamentoPdfDocument";

// O react-pdf só desce quando o modal abre — a ficha do cliente não paga por ele.
const BaixarComprovante = dynamic(() => import("@/components/BaixarComprovante"), {
  ssr: false,
  loading: () => (
    <Botao variante="secundario" tamanho="denso" disabled>
      Baixar extrato
    </Botao>
  ),
});

type Pagamento = { id: string | number; valor: number; formaPagamento: string; data: string; obs: string | null };
type OSExtrato = {
  id: string; numero: number; status: string; desconto: number; total: number; valorPago: number;
  pago: boolean; abertura: string; fechamento: string | null;
  veiculo: { marca: string; modelo: string; placa: string | null };
  pagamentos: Pagamento[];
};
type DividaExtrato = {
  id: number; descricao: string; valor: number; valorPago: number; pago: boolean; createdAt: string;
  pagamentos: Pagamento[];
};

/** Uma linha da seleção: o item do comprovante mais o que a tela precisa para decidir e ordenar. */
type Linha = {
  chave: string;
  item: ComprovanteItem;
  /** Status da OS quando ainda não foi entregue — o cliente pode estar pagando sinal. */
  statusPendente: string | null;
  ultimoPagamento: number;
};

// Quitado há mais tempo que isto já não é novidade para o cliente: fica na lista,
// mas desmarcado.
const DIAS_QUITADO_RECENTE = 30;
// Quitados além destes ficam atrás do "mostrar mais" — cliente antigo tem dezenas.
const QUITADOS_VISIVEIS = 8;

function linhasDoExtrato(ordens: OSExtrato[], dividas: DividaExtrato[]): Linha[] {
  const ultimo = (ps: Pagamento[]) => Math.max(0, ...ps.map((p) => new Date(p.data).getTime()));
  return [
    ...ordens.map((os) => ({
      chave: `os:${os.id}`,
      item: {
        numero: os.numero,
        veiculo: os.veiculo,
        desconto: os.desconto,
        data: os.fechamento ?? os.abertura,
        total: os.total,
        valorPago: os.valorPago,
        pago: os.pago,
        pagamentos: os.pagamentos,
      },
      statusPendente: os.status === "ENTREGUE" ? null : os.status,
      ultimoPagamento: ultimo(os.pagamentos),
    })),
    ...dividas.map((div) => ({
      chave: `div:${div.id}`,
      item: {
        descricao: div.descricao,
        data: div.createdAt,
        total: div.valor,
        valorPago: div.valorPago,
        pago: div.pago,
        pagamentos: div.pagamentos,
      },
      statusPendente: null,
      ultimoPagamento: ultimo(div.pagamentos),
    })),
  ];
}

/**
 * O que vem marcado ao abrir: o que o cliente deve (como em Contas a receber) e
 * o que ele quitou há pouco — o caso de quem acabou de pagar um serviço e ainda
 * tem outro em aberto. OS no pátio só entra se já tiver pagamento (um sinal).
 */
function marcadoDeInicio(l: Linha) {
  if (saldoDoItem(l.item) > 0) return !l.statusPendente || l.item.valorPago > 0;
  return Date.now() - l.ultimoPagamento <= DIAS_QUITADO_RECENTE * 86400000;
}

/**
 * Extrato do cliente para mandar no WhatsApp: escolhe-se o que entra e sai uma
 * imagem só, com o que foi quitado, o que segue em aberto e o histórico.
 */
export default function ExtratoCliente({ clienteId, onFechar }: { clienteId: string; onFechar: () => void }) {
  const [cliente, setCliente] = useState<{ nome: string } | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [todosQuitados, setTodosQuitados] = useState(false);

  useEffect(() => {
    fetch(`/api/clientes/${clienteId}/extrato`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: { cliente: { nome: string }; ordens: OSExtrato[]; dividas: DividaExtrato[] }) => {
        const todas = linhasDoExtrato(data.ordens, data.dividas);
        setCliente(data.cliente);
        setLinhas(todas);
        setMarcadas(new Set(todas.filter(marcadoDeInicio).map((l) => l.chave)));
      })
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));
  }, [clienteId]);

  const abertas = useMemo(
    () =>
      linhas
        .filter((l) => saldoDoItem(l.item) > 0)
        .sort((a, b) => new Date(b.item.data!).getTime() - new Date(a.item.data!).getTime()),
    [linhas]
  );
  const quitadas = useMemo(
    () => linhas.filter((l) => saldoDoItem(l.item) === 0).sort((a, b) => b.ultimoPagamento - a.ultimoPagamento),
    [linhas]
  );

  // Na imagem, o que está em aberto vem primeiro: é a parte que pede ação do cliente.
  const itens = [...abertas, ...quitadas].filter((l) => marcadas.has(l.chave)).map((l) => l.item);
  const total = itens.reduce((acc, i) => acc + i.total, 0);
  const pago = itens.reduce((acc, i) => acc + i.valorPago, 0);
  const saldo = itens.reduce((acc, i) => acc + saldoDoItem(i), 0);

  function alternar(chave: string) {
    setMarcadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(chave)) nova.delete(chave);
      else nova.add(chave);
      return nova;
    });
  }
  function marcarGrupo(grupo: Linha[], marcar: boolean) {
    setMarcadas((atual) => {
      const nova = new Set(atual);
      for (const l of grupo) {
        if (marcar) nova.add(l.chave);
        else nova.delete(l.chave);
      }
      return nova;
    });
  }

  const quitadasVisiveis = todosQuitados ? quitadas : quitadas.slice(0, QUITADOS_VISIVEIS);

  return (
    <Modal
      titulo="Extrato para o cliente"
      descricao="Marque o que entra na imagem. Sai com o que foi quitado, o que está em aberto e o histórico de pagamentos."
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-tinta-3">Total</p>
              <p className="font-semibold tabular-nums text-tinta">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-tinta-3">Pago</p>
              <p className="font-semibold tabular-nums text-ok">{formatCurrency(pago)}</p>
            </div>
            <div>
              <p className="text-tinta-3">Em aberto</p>
              <p className={cn("font-semibold tabular-nums", saldo > 0 ? "text-perigo" : "text-ok")}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Botao variante="secundario" tamanho="denso" onClick={onFechar}>
              Fechar
            </Botao>
            {cliente && itens.length > 0 ? (
              <BaixarComprovante
                dados={{ cliente, itens }}
                rotulo={itens.length > 1 ? "Baixar extrato" : "Baixar comprovante"}
                titulo="Baixar uma imagem com o que foi pago e o que está em aberto"
              />
            ) : (
              <Botao variante="secundario" tamanho="denso" disabled>
                Baixar extrato
              </Botao>
            )}
          </div>
        </div>
      }
    >
      {carregando ? (
        <EsqueletoLista linhas={3} />
      ) : erro ? (
        <p className="text-sm text-perigo">Não foi possível carregar os pagamentos deste cliente.</p>
      ) : linhas.length === 0 ? (
        <Vazio titulo="Nada para mostrar" texto="Este cliente ainda não tem OS com valor nem dívidas registradas." compacto />
      ) : (
        <div className="space-y-5">
          {abertas.length > 0 && (
            <Grupo
              titulo="Em aberto"
              linhas={abertas}
              marcadas={marcadas}
              onAlternar={alternar}
              onMarcarGrupo={(m) => marcarGrupo(abertas, m)}
            />
          )}
          {quitadas.length > 0 && (
            <Grupo
              titulo="Quitados"
              linhas={quitadasVisiveis}
              marcadas={marcadas}
              onAlternar={alternar}
              onMarcarGrupo={(m) => marcarGrupo(quitadas, m)}
              rodape={
                quitadas.length > QUITADOS_VISIVEIS && (
                  <button
                    type="button"
                    onClick={() => setTodosQuitados(!todosQuitados)}
                    className="min-h-11 text-sm text-brand-texto hover:underline sm:min-h-0"
                  >
                    {todosQuitados ? "Mostrar só os mais recentes" : `Mostrar mais ${quitadas.length - QUITADOS_VISIVEIS}`}
                  </button>
                )
              }
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function Grupo({
  titulo,
  linhas,
  marcadas,
  onAlternar,
  onMarcarGrupo,
  rodape,
}: {
  titulo: string;
  linhas: Linha[];
  marcadas: Set<string>;
  onAlternar: (chave: string) => void;
  onMarcarGrupo: (marcar: boolean) => void;
  rodape?: React.ReactNode;
}) {
  const todasMarcadas = linhas.every((l) => marcadas.has(l.chave));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-tinta-3">{titulo}</p>
        <button
          type="button"
          onClick={() => onMarcarGrupo(!todasMarcadas)}
          className="min-h-11 text-xs text-brand-texto hover:underline sm:min-h-0"
        >
          {todasMarcadas ? "Desmarcar todos" : "Marcar todos"}
        </button>
      </div>
      <div className="divide-y divide-linha rounded-xl border border-linha">
        {linhas.map((l) => {
          const saldo = saldoDoItem(l.item);
          const veiculo = l.item.veiculo
            ? `${l.item.veiculo.marca} ${l.item.veiculo.modelo}${l.item.veiculo.placa ? ` · ${l.item.veiculo.placa}` : ""}`
            : "";
          const quando =
            saldo > 0
              ? l.statusPendente
                ? labelStatus(l.statusPendente)
                : l.item.data
                  ? formatDate(l.item.data)
                  : ""
              : l.ultimoPagamento > 0
                ? `Quitado em ${formatDate(new Date(l.ultimoPagamento))}`
                : "";
          return (
            <label key={l.chave} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-superficie-2">
              <input
                type="checkbox"
                checked={marcadas.has(l.chave)}
                onChange={() => onAlternar(l.chave)}
                className="h-4 w-4 shrink-0 rounded border-linha-forte accent-brand-600"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-tinta">{identificacaoDoItem(l.item)}</p>
                <p className="truncate text-xs text-tinta-3">
                  {[veiculo, quando].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                {saldo > 0 ? (
                  <>
                    <p className="font-semibold tabular-nums text-perigo">{formatCurrency(saldo)}</p>
                    <p className="tabular-nums text-tinta-3">de {formatCurrency(l.item.total)}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-ok">Quitado</p>
                    <p className="tabular-nums text-tinta-3">{formatCurrency(l.item.total)}</p>
                  </>
                )}
              </div>
            </label>
          );
        })}
      </div>
      {rodape}
    </div>
  );
}
