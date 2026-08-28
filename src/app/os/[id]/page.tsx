"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn, formatCurrency, formatDate, formatDatetime } from "@/lib/utils";
import { FOTO_TIPOS, tipoDaFoto, labelStatus, corStatus, OS_STATUS_VALUES, OS_CONCLUIDA, anoVeiculo } from "@/lib/constants";
import OSFotos, { type Foto } from "@/components/OSFotos";
import CopiarVeiculo from "@/components/CopiarVeiculo";
import CabecalhoDocumento from "@/components/CabecalhoDocumento";
import { useEhDono } from "@/components/UsuarioProvider";

const OSPdfButton = dynamic(() => import("@/components/OSPdfButton"), {
  ssr: false,
  loading: () => (
    <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400">Baixar</span>
  ),
});

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number; custoUnit: number | null;
};
type Pagamento = {
  id: string; valor: number; formaPagamento: string; data: string; obs: string | null;
};
type OS = {
  id: string; numero: number; status: string; descricao: string;
  defeitoRelatado: string | null;
  kmEntrada: number | null; kmSaida: number | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  pago: boolean; valorPago: number; formaPagamento: string | null; obs: string | null;
  mecanico: string | null; nivelCombustivel: string | null; combustivelEmUso: string | null;
  // Ausentes na resposta quando quem pede é operador (ver src/lib/permissoes.ts).
  custoTotalPecas?: number; lucroReal?: number; margemPecas?: number;
  abertura: string; fechamento: string | null;
  cliente: {
    id: string; nome: string; telefone: string | null; cpfCnpj: string | null;
    email: string | null; endereco: string | null; cidade: string | null; estado: string | null;
  };
  veiculo: {
    id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
    anoFabricacao: number | null; anoModelo: number | null;
    valvulas: string | null; combustivel: string | null; km: number | null;
  };
  itens: Item[];
  pagamentos: Pagamento[];
  fotos: Foto[];
};

const STATUS_OPTIONS = OS_STATUS_VALUES;

const FORMAS_PGTO = ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA"];
const FORMAS_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro", PIX: "PIX",
  CARTAO_CREDITO: "Cartão Crédito", CARTAO_DEBITO: "Cartão Débito", TRANSFERENCIA: "Transferência",
};
const NIVEL_LABEL: Record<string, string> = { CHEIO: "Cheio", MEIO: "Meio", VAZIO: "Vazio" };
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

const A4_HEIGHT_PX = 1122;
const A4_WIDTH_PX = 793;

type PayMode = "TOTAL" | "PARCIAL" | "SEM_PAGAMENTO";

export default function OSDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ehDono = useEhDono();
  const [os, setOs] = useState<OS | null>(null);
  const [loading, setLoading] = useState(true);
  const [pgtoForm, setPgtoForm] = useState({ valor: "", formaPagamento: "DINHEIRO", obs: "" });
  const [savingPgto, setSavingPgto] = useState(false);
  const [payModal, setPayModal] = useState<{ entrega: boolean } | null>(null);
  const [payMode, setPayMode] = useState<PayMode>("TOTAL");
  const [devedor, setDevedor] = useState<{ saldo: number } | null>(null);
  const [descontoInput, setDescontoInput] = useState("");
  const [savingDesconto, setSavingDesconto] = useState(false);
  const [deletingOS, setDeletingOS] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [revelado, setRevelado] = useState(false);
  const [estornando, setEstornando] = useState<string | null>(null);
  const [estornoModal, setEstornoModal] = useState<{ pagamentoId?: string; valor: number } | null>(null);

  const load = () =>
    fetch(`/api/os/${id}`)
      .then((r) => r.json())
      .then((data: OS) => {
        setOs({ ...data, fotos: data.fotos ?? [] });
        setDescontoInput(data.desconto ? String(data.desconto) : "");
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  // Ajusta o documento para caber em uma folha A4 na impressão
  useEffect(() => {
    const doc = () => document.querySelector<HTMLElement>(".print-doc");
    const fit = () => {
      const el = doc();
      if (!el) return;
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.width = "";
      const scale = Math.min(1, A4_HEIGHT_PX / el.scrollHeight, A4_WIDTH_PX / el.scrollWidth);
      if (scale < 1) {
        el.style.transformOrigin = "top left";
        el.style.transform = `scale(${scale})`;
        el.style.width = `${100 / scale}%`;
      }
    };
    const reset = () => {
      const el = doc();
      if (!el) return;
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.width = "";
    };
    window.addEventListener("beforeprint", fit);
    window.addEventListener("afterprint", reset);
    return () => {
      window.removeEventListener("beforeprint", fit);
      window.removeEventListener("afterprint", reset);
    };
  }, []);

  async function changeStatus(status: string) {
    setChangingStatus(true);
    try {
      await fetch(`/api/os/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setChangingStatus(false);
    }
  }

  function handleStatusChange(status: string) {
    if (!os || status === os.status) return;
    const saldoAtual = os.total - os.valorPago;
    // Entregar com saldo em aberto exige registrar o pagamento antes.
    if (status === "ENTREGUE" && os.status !== "ENTREGUE" && saldoAtual > 0) {
      openPay(true);
      return;
    }
    changeStatus(status);
  }

  function openPay(entrega: boolean) {
    if (!os) return;
    const saldoAtual = os.total - os.valorPago;
    setPgtoForm({ valor: saldoAtual > 0 ? saldoAtual.toFixed(2) : "", formaPagamento: "DINHEIRO", obs: "" });
    setPayMode("TOTAL");
    setPayModal({ entrega });
  }

  async function confirmPay(e: React.FormEvent) {
    e.preventDefault();
    if (!os || !payModal) return;
    const saldoAtual = os.total - os.valorPago;
    const semPagamento = payModal.entrega && payMode === "SEM_PAGAMENTO";
    const valor = payModal.entrega && payMode === "TOTAL" ? saldoAtual : Number(pgtoForm.valor);
    if (!semPagamento && (!valor || valor <= 0)) return;
    if (payModal.entrega && !semPagamento && valor > saldoAtual + 0.001) return;

    const entrega = payModal.entrega;
    setSavingPgto(true);
    try {
      if (!semPagamento) {
        await fetch(`/api/os/${id}/pagamentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor, formaPagamento: pgtoForm.formaPagamento, obs: pgtoForm.obs }),
        });
      }
      if (entrega) {
        await fetch(`/api/os/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            semPagamento ? { status: "ENTREGUE" } : { status: "ENTREGUE", formaPagamento: pgtoForm.formaPagamento },
          ),
        });
      }
      const restante = semPagamento ? saldoAtual : Math.max(0, saldoAtual - valor);
      setPayModal(null);
      await load();
      if (entrega && restante > 0) setDevedor({ saldo: restante });
    } finally {
      setSavingPgto(false);
    }
  }

  // Estorna um pagamento (ou todos, quando pagamentoId vem vazio) e devolve a OS para "a receber".
  async function confirmEstorno() {
    if (!estornoModal) return;
    const { pagamentoId } = estornoModal;
    setEstornando(pagamentoId ?? "TODOS");
    try {
      const url = pagamentoId
        ? `/api/os/${id}/pagamentos/${pagamentoId}`
        : `/api/os/${id}/pagamentos`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Não foi possível estornar.");
        return;
      }
      setEstornoModal(null);
      await load();
    } finally {
      setEstornando(null);
    }
  }

  async function saveDesconto(e: React.FormEvent) {
    e.preventDefault();
    setSavingDesconto(true);
    try {
      await fetch(`/api/os/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desconto: descontoInput ? Number(descontoInput) : 0 }),
      });
      load();
    } finally {
      setSavingDesconto(false);
    }
  }

  async function deleteOS() {
    if (!confirm("Excluir esta OS? Esta ação não pode ser desfeita.")) return;
    setDeletingOS(true);
    await fetch(`/api/os/${id}`, { method: "DELETE" });
    router.push("/os");
  }

  if (loading) return <div className="p-6 text-sm text-zinc-400">Carregando...</div>;
  if (!os) return <div className="p-6 text-sm text-zinc-400">OS não encontrada.</div>;

  const saldo = os.total - os.valorPago;
  // `custoTotalPecas` não vem para o operador — o `?? 0` mantém a conta definida
  // mesmo assim, e o bloco que a usa só é renderizado para o dono.
  const margemValor = os.totalPecas - (os.custoTotalPecas ?? 0);
  const podeEditar = os.status !== "ENTREGUE" && os.status !== "CANCELADA";

  // Valor/validação do modal de pagamento
  const valorParcialNum = Number(pgtoForm.valor) || 0;
  const restanteParcial = Math.max(0, saldo - valorParcialNum);
  const parcialInvalido =
    payModal?.entrega && payMode === "PARCIAL" && (valorParcialNum <= 0 || valorParcialNum > saldo);

  const veicLinha: string[] = [];
  if (os.veiculo.cor) veicLinha.push(`Cor: ${os.veiculo.cor}`);
  if (os.veiculo.motorizacao) veicLinha.push(`Motor: ${os.veiculo.motorizacao}`);

  return (
    <div className="pb-12">
      {/* Barra de ações — oculta na impressão */}
      <div className="no-print sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        {/* Mesmo max-w e padding do documento abaixo, para as bordas coincidirem. */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/os" className="shrink-0 text-sm text-zinc-500 hover:text-zinc-700">← OS</Link>
          <div className="hidden min-w-0 items-baseline gap-2 border-l border-zinc-200 pl-3 sm:flex">
            <span className="text-sm font-semibold text-zinc-900">#{os.numero}</span>
            <span className="truncate text-sm text-zinc-500">{os.cliente.nome} · {os.veiculo.marca} {os.veiculo.modelo}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saldo > 0 && OS_CONCLUIDA.includes(os.status) && (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
              A receber — {formatCurrency(saldo)}
            </span>
          )}
          <CopiarVeiculo veiculo={os.veiculo} />
          {os.status !== "CANCELADA" && (
            <Link
              href={`/os/${os.id}/editar`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Editar
            </Link>
          )}
          <select
            value={os.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={changingStatus}
            className={cn(
              "cursor-pointer appearance-none rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60",
              corStatus(os.status),
            )}
            title="Alterar status da OS"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{labelStatus(s)}</option>
            ))}
          </select>
          <OSPdfButton os={os} />
          {/* Excluir apaga faturamento junto — fica com o dono (ver src/lib/permissoes.ts). */}
          {ehDono && (
            <button onClick={deleteOS} disabled={deletingOS} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Excluir
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Corpo: documento (esquerda) + ferramentas internas (direita, sticky em telas largas) */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      {/* Documento da OS — preview de como sai para o cliente (imprimível) */}
      <div className="min-w-0">
        <div className="print-doc rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm">
          {/* Cabeçalho da oficina — vem do painel de configurações */}
          <CabecalhoDocumento />

          <div className="px-5 sm:px-8 py-6">
            {/* Número da OS e status */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">Ordem de Serviço</p>
                <p className="text-3xl font-black text-brand-600">#{os.numero}</p>
              </div>
              <div className="text-right">
                <span className={cn("rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap", corStatus(os.status))}>
                  {labelStatus(os.status)}
                </span>
              </div>
            </div>

            {/* Dados do cliente e veículo */}
            <div className="mb-6 grid gap-x-8 gap-y-3 border-b border-zinc-200 pb-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Row label="Data" value={formatDate(os.abertura)} />
                <Row label="Cliente" value={os.cliente.nome} bold />
                {os.cliente.telefone && <Row label="Tel" value={os.cliente.telefone} />}
                {os.cliente.cpfCnpj && <Row label="CPF/CNPJ" value={os.cliente.cpfCnpj} />}
                {os.cliente.endereco && (
                  <Row
                    label="Endereço"
                    value={`${os.cliente.endereco}${os.cliente.cidade ? `, ${os.cliente.cidade}` : ""}${os.cliente.estado ? ` - ${os.cliente.estado}` : ""}`}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Row
                  label="Veículo"
                  value={`${os.veiculo.marca} ${os.veiculo.modelo}${anoVeiculo(os.veiculo) ? ` (${anoVeiculo(os.veiculo)})` : ""}`}
                  bold
                />
                {os.veiculo.placa && <Row label="Placa" value={os.veiculo.placa} />}
                {veicLinha.length > 0 && <Row label="Detalhes" value={veicLinha.join("  ·  ")} />}
                {os.kmSaida != null && <Row label="KM saída" value={os.kmSaida.toLocaleString("pt-BR")} />}
                {os.mecanico && <Row label="Mecânico" value={os.mecanico} />}
                {os.formaPagamento && <Row label="Pagamento" value={FORMAS_LABEL[os.formaPagamento] ?? os.formaPagamento} />}
              </div>
            </div>

            {/* Recepção */}
            {(os.kmEntrada != null || os.nivelCombustivel || os.combustivelEmUso) && (
              <div className="mb-6 rounded-lg bg-zinc-50 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Recepção do veículo</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {os.kmEntrada != null && (
                    <span><span className="text-zinc-400">KM entrada: </span>{os.kmEntrada.toLocaleString("pt-BR")}</span>
                  )}
                  {os.nivelCombustivel && (
                    <span><span className="text-zinc-400">Nível: </span>{NIVEL_LABEL[os.nivelCombustivel] ?? os.nivelCombustivel}</span>
                  )}
                  {os.combustivelEmUso && (
                    <span><span className="text-zinc-400">Combustível em uso: </span>{os.combustivelEmUso}</span>
                  )}
                </div>
              </div>
            )}

            {/* Defeito relatado pelo cliente */}
            {os.defeitoRelatado && (
              <div className="mb-6">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">Defeito relatado pelo cliente</p>
                <p className="text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap">{os.defeitoRelatado}</p>
              </div>
            )}

            {/* Descrição do serviço */}
            <div className="mb-6">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">Descrição do serviço</p>
              <p className="text-sm leading-relaxed text-zinc-900 whitespace-pre-wrap">{os.descricao}</p>
            </div>

            {/* Itens e serviços */}
            {os.itens.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Itens e serviços</p>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[26rem] text-sm">
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
                    {os.itens.map((item) => (
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
              </div>
            )}

            {/* Resumo financeiro */}
            <div className="border-t border-zinc-200 pt-4">
              <div className="ml-auto max-w-xs space-y-2">
                {os.totalPecas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Total peças</span>
                    <span>{formatCurrency(os.totalPecas)}</span>
                  </div>
                )}
                {os.totalMO > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Mão de obra / Serviços</span>
                    <span>{formatCurrency(os.totalMO)}</span>
                  </div>
                )}
                {os.desconto > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Desconto</span>
                    <span>- {formatCurrency(os.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className={saldo > 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(os.total)}</span>
                </div>
                {os.valorPago > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-zinc-500">
                      <span>Pago</span>
                      <span>{formatCurrency(os.valorPago)}</span>
                    </div>
                    {saldo > 0 && (
                      <div className="flex justify-between text-sm font-medium text-red-600">
                        <span>Saldo</span>
                        <span>{formatCurrency(saldo)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Observações */}
            {os.obs && (
              <div className="mt-6 rounded-lg bg-zinc-50 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Observações</p>
                <p className="text-sm text-zinc-900 whitespace-pre-wrap">{os.obs}</p>
              </div>
            )}

            {/* Assinatura do cliente */}
            <div className="mt-10 flex justify-center">
              <div className="w-72 text-center">
                <div className="border-t border-zinc-400 pt-1.5 text-xs text-zinc-500">
                  Assinatura do Cliente
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fotos no documento — páginas próprias na impressão, agrupadas por momento */}
        {os.fotos.length > 0 && (
          <div className="print-fotos mt-6 space-y-5 rounded-xl border border-zinc-200 bg-white px-5 sm:px-8 py-6 shadow-sm print:border-none print:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Fotos do serviço
            </p>
            {FOTO_TIPOS.map((t) => {
              const doMomento = os.fotos.filter((f) => tipoDaFoto(f.tipo) === t.value);
              if (doMomento.length === 0) return null;
              return (
                <section key={t.value}>
                  <p className="mb-2 border-b border-zinc-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    {t.label}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {doMomento.map((foto) => (
                      <figure key={foto.id}>
                        {/* object-contain: a foto aparece inteira e centralizada, sem corte */}
                        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={foto.url}
                            alt={foto.legenda ?? `Foto — ${t.label}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <figcaption className="mt-1 text-[11px] leading-tight text-zinc-500">
                          {foto.legenda ? (
                            <span className="block font-medium text-zinc-700">{foto.legenda}</span>
                          ) : null}
                          {formatDate(foto.createdAt)}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Ferramentas de gestão — não aparecem na impressão */}
      <div className="no-print mt-6 space-y-5 lg:sticky lg:top-20 lg:mt-0 lg:self-start">
        {/* Visão interna — lucros. Só o dono: a API nem envia estes campos ao operador. */}
        {ehDono && ((os.custoTotalPecas ?? 0) > 0 || os.totalPecas > 0 || os.totalMO > 0) && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Visão interna
              </p>
              <button
                type="button"
                onClick={() => setRevelado((v) => !v)}
                className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                title={revelado ? "Ocultar valores" : "Revelar valores"}
              >
                <EyeIcon off={revelado} />
                {revelado ? "Ocultar" : "Revelar"}
              </button>
            </div>
            <p className="mb-3 text-[11px] text-zinc-400">Não aparece para o cliente</p>
            <div className={cn("grid grid-cols-2 gap-x-3 gap-y-3 transition-all duration-300", !revelado && "blur-sm select-none pointer-events-none")}>
              <div>
                <p className="text-xs text-zinc-400">Custo das peças</p>
                <p className="text-base font-semibold text-zinc-900">{formatCurrency(os.custoTotalPecas ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Margem em peças</p>
                <p className={cn("text-base font-semibold", margemValor >= 0 ? "text-green-600" : "text-red-500")}>
                  {formatCurrency(margemValor)}
                  {os.totalPecas > 0 && (
                    <span className="ml-1 text-xs font-normal text-zinc-400">({(os.margemPecas ?? 0).toFixed(0)}%)</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Mão de obra</p>
                <p className="text-base font-semibold text-zinc-900">{formatCurrency(os.totalMO)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Lucro real</p>
                <p className="text-base font-bold text-green-700">{formatCurrency(os.lucroReal ?? 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pagamento */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-zinc-800">Pagamento</h2>
            {saldo > 0 && (
              <button onClick={() => openPay(false)} className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                Registrar
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-zinc-400">Total</p>
              <p className="text-base font-bold text-zinc-900">{formatCurrency(os.total)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Pago</p>
              <p className="text-base font-bold text-green-600">{formatCurrency(os.valorPago)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Saldo</p>
              <p className={cn("text-base font-bold", saldo > 0 ? "text-red-600" : "text-green-600")}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>

          {os.pago && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-green-600">✓ Pagamento quitado</p>
              <button
                onClick={() => setEstornoModal({ valor: os.valorPago })}
                className="rounded-lg border border-orange-200 px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-50"
              >
                Desmarcar como recebido
              </button>
            </div>
          )}

          {os.pagamentos.length > 0 && (
            <div className="border-t border-zinc-100 pt-4">
              <p className="text-xs font-medium text-zinc-500 mb-2">Histórico</p>
              <div className="space-y-1.5">
                {os.pagamentos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="text-zinc-700 font-medium">{formatCurrency(p.valor)}</span>
                      <span className="text-zinc-400 ml-2">{FORMAS_LABEL[p.formaPagamento] || p.formaPagamento}</span>
                      {p.obs && <span className="text-zinc-400 ml-2">· {p.obs}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-zinc-400">{formatDatetime(p.data)}</span>
                      <button
                        onClick={() => setEstornoModal({ pagamentoId: p.id, valor: p.valor })}
                        disabled={estornando === p.id}
                        className="text-xs text-zinc-400 underline hover:text-red-600 disabled:opacity-50"
                        title="Estornar este pagamento"
                      >
                        Estornar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desconto */}
        {podeEditar && (
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <h2 className="font-semibold text-zinc-800">Desconto</h2>
            <form onSubmit={saveDesconto} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-zinc-500 mb-1">Valor do desconto (R$)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={descontoInput}
                  onChange={(e) => setDescontoInput(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                type="submit"
                disabled={savingDesconto}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {savingDesconto ? "Aplicando..." : "Aplicar"}
              </button>
            </form>
            <div className="space-y-1 border-t border-zinc-100 pt-3 text-sm">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal (peças + M.O.)</span>
                <span>{formatCurrency(os.totalPecas + os.totalMO)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <span>Desconto</span>
                <span>- {formatCurrency(descontoInput ? Number(descontoInput) : 0)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-1 font-bold text-zinc-900">
                <span>Total com desconto</span>
                <span>{formatCurrency(os.totalPecas + os.totalMO - (descontoInput ? Number(descontoInput) : 0))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fotos */}
        <OSFotos
          osId={os.id}
          fotos={os.fotos}
          podeEditar={os.status !== "CANCELADA"}
          onChange={(atualizar) =>
            setOs((atual) => (atual ? { ...atual, fotos: atualizar(atual.fotos) } : atual))
          }
        />
      </div>
      </div>

      {/* Modal de pagamento (popup) */}
      {payModal && (
        <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-40 p-4 sm:items-center">
          <div className="my-auto w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900">
                  {payModal.entrega ? "Confirmar entrega" : "Registrar pagamento"}
                </h3>
                {payModal.entrega && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    A OS será marcada como <span className="font-medium text-zinc-700">Entregue</span>. Registre o pagamento.
                  </p>
                )}
              </div>
              <button onClick={() => setPayModal(null)} className="rounded-md px-2 text-lg leading-none text-zinc-400 hover:text-zinc-700">×</button>
            </div>

            <div className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
              <span className="text-zinc-500">Saldo em aberto</span>
              <span className="font-semibold text-zinc-900">{formatCurrency(saldo)}</span>
            </div>

            <form onSubmit={confirmPay} className="space-y-3">
              {payModal.entrega && (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMode("TOTAL")}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                      payMode === "TOTAL" ? "border-green-600 bg-green-50 text-green-700" : "border-zinc-300 text-zinc-500 hover:bg-zinc-50",
                    )}
                  >
                    Pagou tudo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode("PARCIAL")}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                      payMode === "PARCIAL" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-zinc-300 text-zinc-500 hover:bg-zinc-50",
                    )}
                  >
                    Parcial
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMode("SEM_PAGAMENTO")}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                      payMode === "SEM_PAGAMENTO" ? "border-red-500 bg-red-50 text-red-700" : "border-zinc-300 text-zinc-500 hover:bg-zinc-50",
                    )}
                  >
                    Não recebi
                  </button>
                </div>
              )}

              {payModal.entrega && payMode === "SEM_PAGAMENTO" && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  Nenhum pagamento será registrado agora. O saldo total de{" "}
                  <span className="font-semibold">{formatCurrency(saldo)}</span> vai para Contas a Receber.
                </p>
              )}

              {(!payModal.entrega || payMode === "PARCIAL") && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    step="0.01"
                    max={payModal.entrega ? saldo : undefined}
                    value={pgtoForm.valor}
                    onChange={(e) => setPgtoForm({ ...pgtoForm, valor: e.target.value })}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {payModal.entrega && pgtoForm.valor && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Restante a receber:{" "}
                      <span className={cn("font-medium", restanteParcial > 0 ? "text-orange-600" : "text-green-600")}>
                        {formatCurrency(restanteParcial)}
                      </span>
                      {restanteParcial > 0 && " — vai para Contas a Receber"}
                    </p>
                  )}
                  {parcialInvalido && (
                    <p className="mt-1 text-xs text-red-500">Informe um valor entre R$ 0,01 e {formatCurrency(saldo)}.</p>
                  )}
                </div>
              )}

              {!(payModal.entrega && payMode === "SEM_PAGAMENTO") && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Forma de pagamento</label>
                  <select
                    value={pgtoForm.formaPagamento}
                    onChange={(e) => setPgtoForm({ ...pgtoForm, formaPagamento: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {FORMAS_PGTO.map((f) => <option key={f} value={f}>{FORMAS_LABEL[f]}</option>)}
                  </select>
                </div>
              )}

              {!payModal.entrega && (
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Observação</label>
                  <input
                    value={pgtoForm.obs}
                    onChange={(e) => setPgtoForm({ ...pgtoForm, obs: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={savingPgto || parcialInvalido}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50",
                    payModal.entrega && payMode === "SEM_PAGAMENTO" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700",
                  )}
                >
                  {savingPgto
                    ? "Salvando..."
                    : payModal.entrega && payMode === "SEM_PAGAMENTO"
                      ? "Entregar sem receber"
                      : payModal.entrega
                        ? "Confirmar e Entregar"
                        : "Confirmar"}
                </button>
                <button type="button" onClick={() => setPayModal(null)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de estorno — desfaz o recebimento */}
      {estornoModal && (
        <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-40 p-4 sm:items-center">
          <div className="my-auto w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div>
              <h3 className="font-semibold text-zinc-900">
                {estornoModal.pagamentoId ? "Estornar pagamento" : "Desmarcar como recebido"}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {estornoModal.pagamentoId ? (
                  <>
                    O pagamento de{" "}
                    <span className="font-semibold text-zinc-800">{formatCurrency(estornoModal.valor)}</span>{" "}
                    será apagado e o saldo volta para Contas a Receber.
                  </>
                ) : (
                  <>
                    Todos os pagamentos desta OS ({formatCurrency(estornoModal.valor)}) serão apagados e ela
                    volta para Contas a Receber.
                  </>
                )}
              </p>
              <p className="mt-2 text-xs text-zinc-400">O status da OS não muda.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={confirmEstorno}
                disabled={estornando !== null}
                className="flex-1 rounded-lg bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {estornando !== null ? "Estornando..." : "Confirmar estorno"}
              </button>
              <button
                type="button"
                onClick={() => setEstornoModal(null)}
                className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up — entrega com saldo pendente */}
      {devedor && (
        <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-40 p-4 sm:items-center">
          <div className="my-auto w-full max-w-sm space-y-4 rounded-2xl border border-orange-200 bg-white p-6 shadow-xl">
            <div>
              <h3 className="font-semibold text-zinc-900">OS entregue com saldo pendente</h3>
              <p className="mt-0.5 text-sm text-zinc-500">
                Ficou um saldo de{" "}
                <span className="font-semibold text-orange-600">{formatCurrency(devedor.saldo)}</span>.
                Ele já consta em Contas a Receber.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDevedor(null)} className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                Fechar
              </button>
              <Link
                href="/contas-receber"
                onClick={() => setDevedor(null)}
                className="flex-1 rounded-lg bg-orange-600 py-2 text-center text-sm font-medium text-white hover:bg-orange-700"
              >
                Ver Contas a Receber
              </Link>
            </div>
          </div>
        </div>
      )}
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

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}
