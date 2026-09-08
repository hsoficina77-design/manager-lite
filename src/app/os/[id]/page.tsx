"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn, formatCurrency, formatDate, formatDatetime, paraNumero } from "@/lib/utils";
import {
  FOTO_TIPOS,
  tipoDaFoto,
  labelStatus,
  corStatus,
  OS_STATUS_VALUES,
  OS_CONCLUIDA,
  anoVeiculo,
  FORMAS_PAGAMENTO,
  labelFormaPagamento,
} from "@/lib/constants";
import Fotos, { type Foto } from "@/components/Fotos";
import CopiarVeiculo from "@/components/CopiarVeiculo";
import CabecalhoDocumento from "@/components/CabecalhoDocumento";
import { useEhDono } from "@/components/UsuarioProvider";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { CampoDinheiro, Entrada, Selecao } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { Esqueleto, Metrica } from "@/components/ui/Dados";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Chevron, Lapis, Lixeira, Olho, Voltar } from "@/components/ui/Icones";

const BaixarOS = dynamic(() => import("@/components/BaixarOS"), {
  ssr: false,
  loading: () => (
    <span className="inline-block rounded-lg border border-linha px-3 py-1.5 text-sm text-tinta-3">
      Baixar PDF
    </span>
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

const NIVEL_LABEL: Record<string, string> = { CHEIO: "Cheio", MEIO: "Meio", VAZIO: "Vazio" };
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

const A4_WIDTH_PX = 793;

/** Lembra se o dono deixou a visão interna revelada, entre OS e entre sessões. */
const CHAVE_REVELADO = "os:visao-interna-revelada";

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
  const [menuAberto, setMenuAberto] = useState(false);

  const confirmar = useConfirmar();
  const avisar = useAvisar();

  // A visão interna volta ao estado em que o dono a deixou. Antes ela renascia
  // borrada a cada carregamento, cobrando um clique em toda OS aberta.
  useEffect(() => {
    try {
      setRevelado(localStorage.getItem(CHAVE_REVELADO) === "1");
    } catch {
      // armazenamento bloqueado: segue oculta
    }
  }, []);

  function alternarRevelado() {
    setRevelado((v) => {
      const novo = !v;
      try {
        localStorage.setItem(CHAVE_REVELADO, novo ? "1" : "0");
      } catch {
        // sem armazenamento: vale só nesta aba
      }
      return novo;
    });
  }

  const load = () =>
    fetch(`/api/os/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Falha ao carregar a OS"))))
      .then((data: OS) => {
        setOs({ ...data, fotos: data.fotos ?? [] });
        setDescontoInput(data.desconto ? String(data.desconto) : "");
      })
      .catch(() => avisar("Não foi possível carregar a OS. Verifique a conexão.", "erro"))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  // Ajuste de impressão: encolhe só o que passa da largura da folha.
  //
  // Antes a altura também entrava na conta, e uma OS com muitos itens era
  // comprimida para caber numa página só — em vinte itens o corpo do texto saía
  // abaixo do legível, sem aviso. Passar de uma página é o comportamento certo:
  // o navegador quebra sozinho, e o texto sai no tamanho em que foi desenhado.
  useEffect(() => {
    const doc = () => document.querySelector<HTMLElement>(".print-doc");
    const reset = () => {
      const el = doc();
      if (!el) return;
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.width = "";
    };
    const fit = () => {
      const el = doc();
      if (!el) return;
      reset();
      const escala = Math.min(1, A4_WIDTH_PX / el.scrollWidth);
      if (escala < 1) {
        el.style.transformOrigin = "top left";
        el.style.transform = `scale(${escala})`;
        el.style.width = `${100 / escala}%`;
      }
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
      const res = await fetch(`/api/os/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      // Sem esta checagem a tela recarregava com o status antigo e nenhuma
      // explicação — o usuário concluía que tinha salvado.
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        avisar(d.error || "Não foi possível alterar o status.", "erro");
        return;
      }
      avisar(`Status alterado para ${labelStatus(status)}.`);
      await load();
    } catch {
      avisar("Sem conexão. O status não foi alterado.", "erro");
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
        const res = await fetch(`/api/os/${id}/pagamentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor, formaPagamento: pgtoForm.formaPagamento, obs: pgtoForm.obs }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          avisar(d.error || "Não foi possível registrar o pagamento.", "erro");
          return;
        }
      }
      if (entrega) {
        const res = await fetch(`/api/os/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            semPagamento ? { status: "ENTREGUE" } : { status: "ENTREGUE", formaPagamento: pgtoForm.formaPagamento },
          ),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          avisar(d.error || "O pagamento entrou, mas a OS não foi marcada como entregue.", "erro");
          await load();
          return;
        }
      }
      const restante = semPagamento ? saldoAtual : Math.max(0, saldoAtual - valor);
      setPayModal(null);
      if (!semPagamento) avisar(`Recebimento de ${formatCurrency(valor)} registrado.`);
      await load();
      if (entrega && restante > 0) setDevedor({ saldo: restante });
    } catch {
      avisar("Sem conexão. Nada foi salvo.", "erro");
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
        avisar(d.error || "Não foi possível estornar.", "erro");
        return;
      }
      setEstornoModal(null);
      avisar("Pagamento estornado. O saldo voltou para Contas a receber.");
      await load();
    } catch {
      avisar("Sem conexão. O estorno não foi feito.", "erro");
    } finally {
      setEstornando(null);
    }
  }

  async function saveDesconto(e: React.FormEvent) {
    e.preventDefault();
    setSavingDesconto(true);
    try {
      const res = await fetch(`/api/os/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desconto: paraNumero(descontoInput) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        avisar(d.error || "Não foi possível aplicar o desconto.", "erro");
        return;
      }
      avisar("Desconto aplicado.");
      await load();
    } catch {
      avisar("Sem conexão. O desconto não foi aplicado.", "erro");
    } finally {
      setSavingDesconto(false);
    }
  }

  async function deleteOS() {
    if (!os) return;
    const ok = await confirmar({
      titulo: `Excluir a OS #${os.numero}?`,
      texto: `Some junto o faturamento de ${formatCurrency(os.total)} e todo o histórico de pagamentos desta OS. Não há como desfazer.`,
      acao: "Excluir a OS",
      perigo: true,
    });
    if (!ok) return;
    setDeletingOS(true);
    const res = await fetch(`/api/os/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      avisar(d.error || "Não foi possível excluir a OS.", "erro");
      setDeletingOS(false);
      return;
    }
    router.push("/os");
  }

  if (loading) return <EsqueletoOS />;
  if (!os) return <div className="p-6 text-sm text-tinta-3">OS não encontrada.</div>;

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
      {/* Barra de ações — oculta na impressão.
          `top-14` no celular: a barra é `sticky` dentro de um documento cujo topo
          fica atrás do cabeçalho fixo de 56 px, e com `top-0` ela deslizava para
          debaixo dele e sumia inteira ao rolar. */}
      <div className="no-print sticky top-14 z-20 border-b border-linha bg-superficie/95 backdrop-blur md:top-0">
        {/* Mesmo max-w e padding do documento abaixo, para as bordas coincidirem. */}
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/os"
              aria-label="Voltar para ordens de serviço"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-tinta-3 hover:bg-superficie-2 hover:text-tinta-2 sm:h-9 sm:w-9"
            >
              <Voltar tamanho={18} />
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-semibold tabular-nums text-tinta">#{os.numero}</p>
              <p className="truncate text-xs text-tinta-3">
                {os.cliente.nome} · {os.veiculo.marca} {os.veiculo.modelo}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {saldo > 0 && OS_CONCLUIDA.includes(os.status) && (
              <span className="hidden rounded-full bg-atencao-fraco px-3 py-1 text-xs font-medium tabular-nums text-atencao lg:inline">
                A receber — {formatCurrency(saldo)}
              </span>
            )}

            {/* Status: o `select` recebia `appearance-none` e a cor da pílula, sem
                nenhuma seta em troca — ficava idêntico ao selo estático do
                documento logo abaixo, e nada dizia que abria. */}
            <div className="relative">
              <select
                value={os.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={changingStatus}
                aria-label="Status da OS"
                className={cn(
                  "min-h-11 cursor-pointer appearance-none rounded-lg border-0 py-1.5 pl-3 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 sm:min-h-9",
                  corStatus(os.status)
                )}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {labelStatus(s)}
                  </option>
                ))}
              </select>
              <Chevron
                tamanho={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70"
              />
            </div>

            {/* Sete controles com `flex-wrap` viravam quatro linhas em 360 px, e
                ocupavam um terço da tela antes de o documento começar. As ações
                secundárias passam a um menu; só status e voltar ficam à vista. */}
            <div className="relative">
              <Botao
                variante="secundario"
                tamanho="icone"
                onClick={() => setMenuAberto((v) => !v)}
                aria-label="Mais ações"
                aria-expanded={menuAberto}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  ⋯
                </span>
              </Botao>
              {menuAberto && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuAberto(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-60 overflow-hidden rounded-xl border border-linha bg-superficie p-1 shadow-lg">
                    {saldo > 0 && OS_CONCLUIDA.includes(os.status) && (
                      <p className="px-3 py-2 text-xs font-medium tabular-nums text-atencao lg:hidden">
                        A receber — {formatCurrency(saldo)}
                      </p>
                    )}
                    <CopiarVeiculo veiculo={os.veiculo} comoItem />
                    {os.status !== "CANCELADA" && (
                      <Link
                        href={`/os/${os.id}/editar`}
                        className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm text-tinta-2 hover:bg-superficie-2"
                      >
                        <Lapis tamanho={16} className="shrink-0" />
                        Editar OS
                      </Link>
                    )}
                    <BaixarOS os={os} comoItem />
                    {/* Excluir apaga faturamento junto — fica com o dono
                        (ver src/lib/permissoes.ts) e separado por um filete. */}
                    {ehDono && (
                      <>
                        <div className="my-1 border-t border-linha" />
                        <button
                          onClick={() => {
                            setMenuAberto(false);
                            deleteOS();
                          }}
                          disabled={deletingOS}
                          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm text-perigo hover:bg-perigo-fraco disabled:opacity-50"
                        >
                          <Lixeira tamanho={16} className="shrink-0" />
                          Excluir OS
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Corpo: documento (esquerda) + ferramentas internas (direita, sticky em telas largas) */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
      {/* Documento da OS — preview de como sai para o cliente (imprimível) */}
      <div className="min-w-0">
        <div className="print-doc rounded-xl border border-linha bg-superficie text-tinta shadow-sm">
          {/* Cabeçalho da oficina — vem do painel de configurações */}
          <CabecalhoDocumento />

          <div className="px-5 sm:px-8 py-6">
            {/* Número da OS e status */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-tinta-3">Ordem de Serviço</p>
                <p className="text-3xl font-black text-brand-600">#{os.numero}</p>
              </div>
              <div className="text-right">
                <span className={cn("rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap", corStatus(os.status))}>
                  {labelStatus(os.status)}
                </span>
              </div>
            </div>

            {/* Dados do cliente e veículo */}
            <div className="mb-6 grid gap-x-8 gap-y-3 border-b border-linha pb-6 sm:grid-cols-2">
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
                {os.formaPagamento && <Row label="Pagamento" value={labelFormaPagamento(os.formaPagamento)} />}
              </div>
            </div>

            {/* Recepção */}
            {(os.kmEntrada != null || os.nivelCombustivel || os.combustivelEmUso) && (
              <div className="mb-6 rounded-lg bg-superficie-2 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">Recepção do veículo</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {os.kmEntrada != null && (
                    <span><span className="text-tinta-3">KM entrada: </span>{os.kmEntrada.toLocaleString("pt-BR")}</span>
                  )}
                  {os.nivelCombustivel && (
                    <span><span className="text-tinta-3">Nível: </span>{NIVEL_LABEL[os.nivelCombustivel] ?? os.nivelCombustivel}</span>
                  )}
                  {os.combustivelEmUso && (
                    <span><span className="text-tinta-3">Combustível em uso: </span>{os.combustivelEmUso}</span>
                  )}
                </div>
              </div>
            )}

            {/* Defeito relatado pelo cliente */}
            {os.defeitoRelatado && (
              <div className="mb-6">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-3">Defeito relatado pelo cliente</p>
                <p className="text-sm leading-relaxed text-tinta whitespace-pre-wrap">{os.defeitoRelatado}</p>
              </div>
            )}

            {/* Descrição do serviço */}
            <div className="mb-6">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-3">Descrição do serviço</p>
              <p className="text-sm leading-relaxed text-tinta whitespace-pre-wrap">{os.descricao}</p>
            </div>

            {/* Itens e serviços */}
            {os.itens.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">Itens e serviços</p>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[26rem] text-sm">
                  <thead>
                    <tr className="border-b border-linha-forte text-left text-xs text-tinta-3">
                      <th className="pb-1.5 font-medium">Tipo</th>
                      <th className="pb-1.5 font-medium">Descrição</th>
                      <th className="pb-1.5 text-right font-medium">Qtd</th>
                      <th className="pb-1.5 text-right font-medium">Unit</th>
                      <th className="pb-1.5 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linha">
                    {os.itens.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 text-xs text-tinta-3">{TIPO_LABEL[item.tipo] ?? item.tipo}</td>
                        <td className="py-1.5 pr-2">{item.descricao}</td>
                        <td className="py-1.5 text-right text-tinta-2">{item.quantidade}</td>
                        <td className="py-1.5 text-right text-tinta-2">{formatCurrency(item.valorUnit)}</td>
                        <td className="py-1.5 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* Resumo financeiro */}
            <div className="border-t border-linha pt-4">
              <div className="ml-auto max-w-xs space-y-2">
                {os.totalPecas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tinta-3">Total peças</span>
                    <span>{formatCurrency(os.totalPecas)}</span>
                  </div>
                )}
                {os.totalMO > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tinta-3">Mão de obra / Serviços</span>
                    <span>{formatCurrency(os.totalMO)}</span>
                  </div>
                )}
                {os.desconto > 0 && (
                  <div className="flex justify-between text-sm text-ok">
                    <span>Desconto</span>
                    <span>- {formatCurrency(os.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-linha pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className={saldo > 0 ? "text-perigo" : "text-ok"}>{formatCurrency(os.total)}</span>
                </div>
                {os.valorPago > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-tinta-3">
                      <span>Pago</span>
                      <span>{formatCurrency(os.valorPago)}</span>
                    </div>
                    {saldo > 0 && (
                      <div className="flex justify-between text-sm font-medium text-perigo">
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
              <div className="mt-6 rounded-lg bg-superficie-2 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tinta-3">Observações</p>
                <p className="text-sm text-tinta whitespace-pre-wrap">{os.obs}</p>
              </div>
            )}

            {/* Assinatura do cliente */}
            <div className="mt-10 flex justify-center">
              <div className="w-72 text-center">
                <div className="border-t border-linha-forte pt-1.5 text-xs text-tinta-3">
                  Assinatura do Cliente
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fotos no documento — páginas próprias na impressão, agrupadas por momento */}
        {os.fotos.length > 0 && (
          <div className="print-fotos mt-6 space-y-5 rounded-xl border border-linha bg-superficie px-5 sm:px-8 py-6 shadow-sm print:border-none print:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
              Fotos do serviço
            </p>
            {FOTO_TIPOS.map((t) => {
              const doMomento = os.fotos.filter((f) => tipoDaFoto(f.tipo) === t.value);
              if (doMomento.length === 0) return null;
              return (
                <section key={t.value}>
                  <p className="mb-2 border-b border-linha pb-1 text-xs font-semibold uppercase tracking-wide text-tinta-3">
                    {t.label}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {doMomento.map((foto) => (
                      <figure key={foto.id}>
                        {/* object-contain: a foto aparece inteira e centralizada, sem corte */}
                        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-linha bg-superficie-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={foto.url}
                            alt={foto.legenda ?? `Foto — ${t.label}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <figcaption className="mt-1 text-xs leading-tight text-tinta-3">
                          {foto.legenda ? (
                            <span className="block font-medium text-tinta-2">{foto.legenda}</span>
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
          <div className="rounded-xl border border-linha bg-superficie p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">
                Visão interna
              </p>
              <button
                type="button"
                onClick={alternarRevelado}
                className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-tinta-3 hover:bg-superficie-3 hover:text-tinta transition-colors"
                title={revelado ? "Ocultar valores" : "Revelar valores"}
              >
                <Olho tamanho={14} fechado={revelado} />
                {revelado ? "Ocultar" : "Revelar"}
              </button>
            </div>
            <p className="mb-3 text-xs text-tinta-3">Não aparece para o cliente</p>
            <div
              className={cn(
                "grid grid-cols-2 gap-3 transition-all duration-300",
                !revelado && "pointer-events-none select-none blur-sm"
              )}
            >
              <Metrica rotulo="Custo das peças" valor={formatCurrency(os.custoTotalPecas ?? 0)} />
              <Metrica
                rotulo="Margem em peças"
                valor={formatCurrency(margemValor)}
                sub={os.totalPecas > 0 ? `${(os.margemPecas ?? 0).toFixed(0)}% sobre as peças` : undefined}
                tom={margemValor >= 0 ? "ok" : "perigo"}
              />
              <Metrica rotulo="Mão de obra" valor={formatCurrency(os.totalMO)} />
              <Metrica rotulo="Lucro real" valor={formatCurrency(os.lucroReal ?? 0)} tom="ok" />
            </div>
          </div>
        )}

        {/* Pagamento */}
        <div className="bg-superficie rounded-xl border border-linha p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-tinta">Pagamento</h2>
            {saldo > 0 && (
              <Botao variante="sucesso" tamanho="denso" onClick={() => openPay(false)}>
                Registrar
              </Botao>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Metrica rotulo="Total" valor={formatCurrency(os.total)} />
            <Metrica rotulo="Pago" valor={formatCurrency(os.valorPago)} tom="ok" />
            <Metrica rotulo="Saldo" valor={formatCurrency(saldo)} tom={saldo > 0 ? "perigo" : "ok"} />
          </div>

          {os.pago && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ok">Pagamento quitado</p>
              <Botao
                variante="secundario"
                tamanho="denso"
                onClick={() => setEstornoModal({ valor: os.valorPago })}
              >
                Desmarcar como recebido
              </Botao>
            </div>
          )}

          {os.pagamentos.length > 0 && (
            <div className="border-t border-linha pt-4">
              <p className="text-xs font-medium text-tinta-3 mb-2">Histórico</p>
              <div className="space-y-1.5">
                {os.pagamentos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium tabular-nums text-tinta-2">
                        {formatCurrency(p.valor)}
                      </span>
                      <span className="ml-2 text-tinta-3">{labelFormaPagamento(p.formaPagamento)}</span>
                      {p.obs && <span className="ml-2 text-tinta-3">· {p.obs}</span>}
                      <span className="block text-xs tabular-nums text-tinta-3">
                        {formatDatetime(p.data)}
                      </span>
                    </div>
                    <Botao
                      variante="fantasma"
                      tamanho="denso"
                      onClick={() => setEstornoModal({ pagamentoId: p.id, valor: p.valor })}
                      disabled={estornando === p.id}
                      title="Estornar este pagamento"
                    >
                      Estornar
                    </Botao>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Desconto */}
        {podeEditar && (
          <div className="bg-superficie rounded-xl border border-linha p-5 space-y-4">
            <h2 className="font-semibold text-tinta">Desconto</h2>
            <form onSubmit={saveDesconto} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="desconto">
                  Valor do desconto
                </label>
                <CampoDinheiro
                  id="desconto"
                  valor={descontoInput}
                  onChange={setDescontoInput}
                  placeholder="0,00"
                />
              </div>
              <Botao type="submit" variante="contraste" disabled={savingDesconto}>
                {savingDesconto ? "Aplicando..." : "Aplicar"}
              </Botao>
            </form>
            <div className="space-y-1 border-t border-linha pt-3 text-sm tabular-nums">
              <div className="flex justify-between text-tinta-3">
                <span>Subtotal (peças + M.O.)</span>
                <span>{formatCurrency(os.totalPecas + os.totalMO)}</span>
              </div>
              <div className="flex justify-between text-ok">
                <span>Desconto</span>
                <span>- {formatCurrency(paraNumero(descontoInput))}</span>
              </div>
              <div className="flex justify-between border-t border-linha pt-1 font-bold text-tinta">
                <span>Total com desconto</span>
                <span>{formatCurrency(os.totalPecas + os.totalMO - paraNumero(descontoInput))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fotos */}
        <Fotos
          apiBase={`/api/os/${os.id}/fotos`}
          fotos={os.fotos}
          podeEditar={os.status !== "CANCELADA"}
          onChange={(atualizar) =>
            setOs((atual) => (atual ? { ...atual, fotos: atualizar(atual.fotos) } : atual))
          }
        />
      </div>
      </div>

      {/* Modal de pagamento */}
      {payModal && (
        <Modal
          titulo={payModal.entrega ? "Confirmar entrega" : "Registrar pagamento"}
          descricao={
            payModal.entrega ? "A OS será marcada como Entregue. Registre o pagamento." : undefined
          }
          largura="max-w-sm"
          onFechar={() => setPayModal(null)}
          rodape={
            <div className="flex gap-2">
              <Botao
                type="submit"
                form="form-pagamento"
                variante={payModal.entrega && payMode === "SEM_PAGAMENTO" ? "perigo" : "sucesso"}
                className="flex-1"
                disabled={savingPgto || parcialInvalido}
              >
                {savingPgto
                  ? "Salvando..."
                  : payModal.entrega && payMode === "SEM_PAGAMENTO"
                    ? "Entregar sem receber"
                    : payModal.entrega
                      ? "Confirmar e entregar"
                      : "Confirmar"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => setPayModal(null)}>
                Cancelar
              </Botao>
            </div>
          }
        >
          <div className="mb-3 flex justify-between rounded-lg bg-superficie-2 px-3 py-2 text-sm">
            <span className="text-tinta-3">Saldo em aberto</span>
            <span className="font-semibold tabular-nums text-tinta">{formatCurrency(saldo)}</span>
          </div>

          <form id="form-pagamento" onSubmit={confirmPay} className="space-y-3">
            {payModal.entrega && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["TOTAL", "Pagou tudo", "border-ok-linha bg-ok-fraco text-ok"],
                    ["PARCIAL", "Parcial", "border-atencao-linha bg-atencao-fraco text-atencao"],
                    ["SEM_PAGAMENTO", "Não recebi", "border-perigo-linha bg-perigo-fraco text-perigo"],
                  ] as const
                ).map(([modo, label, ativo]) => (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => setPayMode(modo)}
                    aria-pressed={payMode === modo}
                    className={cn(
                      "min-h-11 rounded-lg border px-2 text-sm font-medium transition-colors",
                      payMode === modo
                        ? ativo
                        : "border-linha-forte text-tinta-3 hover:bg-superficie-2"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {payModal.entrega && payMode === "SEM_PAGAMENTO" && (
              <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-xs text-perigo">
                Nenhum pagamento será registrado agora. O saldo total de{" "}
                <span className="font-semibold">{formatCurrency(saldo)}</span> vai para Contas a
                receber.
              </p>
            )}

            {(!payModal.entrega || payMode === "PARCIAL") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="valor-pgto">
                  Valor <span className="text-perigo">*</span>
                </label>
                <CampoDinheiro
                  id="valor-pgto"
                  valor={pgtoForm.valor}
                  onChange={(v) => setPgtoForm({ ...pgtoForm, valor: v })}
                  required
                  data-foco-inicial
                />
                {payModal.entrega && pgtoForm.valor && (
                  <p className="mt-1 text-xs text-tinta-3">
                    Restante a receber:{" "}
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        restanteParcial > 0 ? "text-atencao" : "text-ok"
                      )}
                    >
                      {formatCurrency(restanteParcial)}
                    </span>
                    {restanteParcial > 0 && " — vai para Contas a receber"}
                  </p>
                )}
                {parcialInvalido && (
                  <p className="mt-1 text-xs text-perigo">
                    Informe um valor entre R$ 0,01 e {formatCurrency(saldo)}.
                  </p>
                )}
              </div>
            )}

            {!(payModal.entrega && payMode === "SEM_PAGAMENTO") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="forma-pgto">
                  Forma de pagamento
                </label>
                <Selecao
                  id="forma-pgto"
                  value={pgtoForm.formaPagamento}
                  onChange={(e) => setPgtoForm({ ...pgtoForm, formaPagamento: e.target.value })}
                >
                  {FORMAS_PAGAMENTO.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Selecao>
              </div>
            )}

            {!payModal.entrega && (
              <div>
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="obs-pgto">
                  Observação
                </label>
                <Entrada
                  id="obs-pgto"
                  value={pgtoForm.obs}
                  onChange={(e) => setPgtoForm({ ...pgtoForm, obs: e.target.value })}
                />
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Estorno — desfaz o recebimento */}
      {estornoModal && (
        <Modal
          titulo={estornoModal.pagamentoId ? "Estornar pagamento" : "Desmarcar como recebido"}
          largura="max-w-sm"
          onFechar={() => setEstornoModal(null)}
          rodape={
            <div className="flex gap-2">
              <Botao
                variante="perigo"
                className="flex-1"
                onClick={confirmEstorno}
                disabled={estornando !== null}
              >
                {estornando !== null ? "Estornando..." : "Confirmar estorno"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => setEstornoModal(null)}>
                Cancelar
              </Botao>
            </div>
          }
        >
          <p className="text-sm text-tinta-2">
            {estornoModal.pagamentoId ? (
              <>
                O pagamento de{" "}
                <span className="font-semibold tabular-nums text-tinta">
                  {formatCurrency(estornoModal.valor)}
                </span>{" "}
                será apagado e o saldo volta para Contas a receber.
              </>
            ) : (
              <>
                Todos os pagamentos desta OS ({formatCurrency(estornoModal.valor)}) serão apagados e
                ela volta para Contas a receber.
              </>
            )}
          </p>
          <p className="mt-2 text-xs text-tinta-3">O status da OS não muda.</p>
        </Modal>
      )}

      {/* Entrega com saldo pendente */}
      {devedor && (
        <Modal
          titulo="OS entregue com saldo pendente"
          largura="max-w-sm"
          onFechar={() => setDevedor(null)}
          rodape={
            <div className="flex gap-2">
              <Botao variante="secundario" className="flex-1" onClick={() => setDevedor(null)}>
                Fechar
              </Botao>
              <BotaoLink href="/contas-receber" onClick={() => setDevedor(null)} className="flex-1">
                Ver contas a receber
              </BotaoLink>
            </div>
          }
        >
          <p className="text-sm text-tinta-2">
            Ficou um saldo de{" "}
            <span className="font-semibold tabular-nums text-atencao">
              {formatCurrency(devedor.saldo)}
            </span>
            . Ele já consta em Contas a receber.
          </p>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-20 shrink-0 text-tinta-3">{label}:</span>
      <span className={bold ? "font-semibold text-tinta" : "text-tinta-2"}>{value}</span>
    </div>
  );
}

/** Esqueleto da OS: reserva a forma do documento para a tela não saltar. */
function EsqueletoOS() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      <Esqueleto className="h-11 w-full" />
      <Esqueleto className="h-64 w-full" />
      <Esqueleto className="h-40 w-full" />
    </div>
  );
}
