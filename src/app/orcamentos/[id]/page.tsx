"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number; custoUnit: number | null;
};
type Orcamento = {
  id: string; numero: number; status: string; descricao: string;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  validade: string | null; obs: string | null; createdAt: string;
  ordemId: string | null;
  cliente: {
    id: string; nome: string; telefone: string | null; cpfCnpj: string | null;
    email: string | null; endereco: string | null; cidade: string | null; estado: string | null;
  };
  veiculo: {
    id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
  } | null;
  ordem: { id: string; numero: number } | null;
  itens: Item[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente", APROVADO: "Aprovado", RECUSADO: "Recusado", CONVERTIDO: "Convertido",
};
const STATUS_COLOR: Record<string, string> = {
  PENDENTE: "bg-zinc-200 text-zinc-700",
  APROVADO: "bg-green-100 text-green-700",
  RECUSADO: "bg-red-100 text-red-700",
  CONVERTIDO: "bg-zinc-900 text-white",
};
const STATUS_OPTIONS = ["PENDENTE", "APROVADO", "RECUSADO"];
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

export default function OrcamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [orc, setOrc] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro] = useState("");

  const load = () =>
    fetch(`/api/orcamentos/${id}`)
      .then((r) => r.json())
      .then(setOrc)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  async function changeStatus(status: string) {
    if (!orc || status === orc.status) return;
    setChangingStatus(true);
    try {
      await fetch(`/api/orcamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setChangingStatus(false);
    }
  }

  async function converter() {
    if (!orc) return;
    if (!confirm(`Converter o orçamento #${orc.numero} em Ordem de Serviço?`)) return;
    setErro("");
    setConverting(true);
    try {
      const res = await fetch(`/api/orcamentos/${id}/converter`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Erro ao converter"); return; }
      router.push(`/os/${data.id}`);
    } finally {
      setConverting(false);
    }
  }

  async function excluir() {
    if (!confirm("Excluir este orçamento? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    router.push("/orcamentos");
  }

  if (loading) return <div className="p-6 text-sm text-zinc-400">Carregando...</div>;
  if (!orc) return <div className="p-6 text-sm text-zinc-400">Orçamento não encontrado.</div>;

  const convertido = orc.status === "CONVERTIDO" || !!orc.ordemId;
  const podeEditar = !convertido;

  const veicLinha: string[] = [];
  if (orc.veiculo?.cor) veicLinha.push(`Cor: ${orc.veiculo.cor}`);
  if (orc.veiculo?.motorizacao) veicLinha.push(`Motor: ${orc.veiculo.motorizacao}`);

  return (
    <div className="pb-12">
      {/* Barra de ações — oculta na impressão */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-zinc-200 bg-white px-4 sm:px-6 py-3">
        <Link href="/orcamentos" className="text-sm text-zinc-500 hover:text-zinc-700">← Orçamentos</Link>
        <div className="flex flex-wrap items-center gap-2">
          {!convertido && (
            <Link
              href={`/orcamentos/${orc.id}/editar`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Editar
            </Link>
          )}
          {!convertido && (
            <select
              value={orc.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={changingStatus}
              className={cn(
                "cursor-pointer appearance-none rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60",
                STATUS_COLOR[orc.status],
              )}
              title="Alterar status do orçamento"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          )}
          <button onClick={() => window.print()} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
            Imprimir
          </button>
          {convertido && orc.ordem ? (
            <Link
              href={`/os/${orc.ordem.id}`}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Ver OS #{orc.ordem.numero}
            </Link>
          ) : (
            <button
              onClick={converter}
              disabled={converting}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              title={orc.veiculo ? "Gerar uma OS a partir deste orçamento" : "Selecione um veículo no orçamento para converter"}
            >
              {converting ? "Convertendo..." : "Converter em OS"}
            </button>
          )}
          {!convertido && (
            <button onClick={excluir} disabled={deleting} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Excluir
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="no-print mx-auto max-w-3xl px-4 sm:px-6 pt-4">
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>
        </div>
      )}

      {convertido && orc.ordem && (
        <div className="no-print mx-auto max-w-3xl px-4 sm:px-6 pt-4">
          <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
            Este orçamento foi convertido na{" "}
            <Link href={`/os/${orc.ordem.id}`} className="font-medium underline">OS #{orc.ordem.numero}</Link>.
          </p>
        </div>
      )}

      {/* Documento do orçamento — imprimível */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="print-doc rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm">
          {/* Cabeçalho da oficina */}
          <div className="flex items-center gap-3 sm:gap-5 border-b border-zinc-200 px-5 sm:px-8 py-5 sm:py-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-hs.png" alt="HS Oficina Mecânica" width={80} height={80} className="h-14 w-14 sm:h-20 sm:w-20 shrink-0 object-contain" />
            <div className="flex-1 text-center">
              <h1 className="text-lg sm:text-2xl font-black uppercase tracking-wider">HS Oficina Mecânica</h1>
              <p className="mt-0.5 text-xs text-zinc-500">CNPJ: 67.090.409/0001-17</p>
              <p className="mt-0.5 text-xs text-zinc-500">Telefone: (11) 91330-4006</p>
            </div>
          </div>

          <div className="px-5 sm:px-8 py-6">
            {/* Número do orçamento e status */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Orçamento</p>
                <p className="text-3xl font-black text-red-600">#{orc.numero}</p>
              </div>
              <div className="text-right">
                <span className={cn("rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap", STATUS_COLOR[orc.status])}>
                  {STATUS_LABEL[orc.status]}
                </span>
              </div>
            </div>

            {/* Dados do cliente e veículo */}
            <div className="mb-6 grid gap-x-8 gap-y-3 border-b border-zinc-200 pb-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Row label="Data" value={formatDate(orc.createdAt)} />
                {orc.validade && <Row label="Validade" value={formatDate(orc.validade)} />}
                <Row label="Cliente" value={orc.cliente.nome} bold />
                {orc.cliente.telefone && <Row label="Tel" value={orc.cliente.telefone} />}
                {orc.cliente.cpfCnpj && <Row label="CPF/CNPJ" value={orc.cliente.cpfCnpj} />}
                {orc.cliente.endereco && (
                  <Row
                    label="Endereço"
                    value={`${orc.cliente.endereco}${orc.cliente.cidade ? `, ${orc.cliente.cidade}` : ""}${orc.cliente.estado ? ` - ${orc.cliente.estado}` : ""}`}
                  />
                )}
              </div>
              {orc.veiculo && (
                <div className="space-y-2">
                  <Row
                    label="Veículo"
                    value={`${orc.veiculo.marca} ${orc.veiculo.modelo}${orc.veiculo.ano ? ` (${orc.veiculo.ano})` : ""}`}
                    bold
                  />
                  {orc.veiculo.placa && <Row label="Placa" value={orc.veiculo.placa} />}
                  {veicLinha.length > 0 && <Row label="Detalhes" value={veicLinha.join("  ·  ")} />}
                </div>
              )}
            </div>

            {/* Descrição do serviço */}
            <div className="mb-6">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">Descrição do serviço</p>
              <p className="text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap">{orc.descricao}</p>
            </div>

            {/* Itens e serviços */}
            {orc.itens.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Itens e serviços</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-300 text-left text-xs text-zinc-400">
                      <th className="pb-1.5 font-medium">Tipo</th>
                      <th className="pb-1.5 font-medium">Descrição</th>
                      <th className="pb-1.5 text-right font-medium">Qtd</th>
                      <th className="pb-1.5 text-right font-medium">Unit</th>
                      <th className="pb-1.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {orc.itens.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 text-xs text-zinc-500">{TIPO_LABEL[item.tipo] ?? item.tipo}</td>
                        <td className="py-1.5 pr-2">{item.descricao}</td>
                        <td className="py-1.5 text-right text-zinc-600">{item.quantidade}</td>
                        <td className="py-1.5 text-right text-zinc-600">{formatCurrency(item.valorUnit)}</td>
                        <td className="py-1.5 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumo financeiro */}
            <div className="border-t border-zinc-200 pt-4">
              <div className="ml-auto max-w-xs space-y-2">
                {orc.totalPecas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Total peças</span>
                    <span>{formatCurrency(orc.totalPecas)}</span>
                  </div>
                )}
                {orc.totalMO > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Mão de obra / Serviços</span>
                    <span>{formatCurrency(orc.totalMO)}</span>
                  </div>
                )}
                {orc.desconto > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Desconto</span>
                    <span>- {formatCurrency(orc.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className="text-red-600">{formatCurrency(orc.total)}</span>
                </div>
              </div>
            </div>

            {/* Observações */}
            {orc.obs && (
              <div className="mt-6 rounded-lg bg-zinc-50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Observações</p>
                <p className="text-sm text-zinc-900 whitespace-pre-wrap">{orc.obs}</p>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-zinc-400">
              Este documento é um orçamento e não possui valor fiscal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-20 shrink-0 text-zinc-400">{label}:</span>
      <span className={bold ? "font-semibold text-zinc-900" : "text-zinc-700"}>{value}</span>
    </div>
  );
}
