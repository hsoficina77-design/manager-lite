"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn, formatCurrency, formatDate, formatDatetime } from "@/lib/utils";
import { FORMAS_PAGAMENTO, labelFormaPagamento, labelStatus } from "@/lib/constants";
import { Botao } from "@/components/ui/Botao";
import { CampoDinheiro, Entrada, Selecao } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { EsqueletoLista, FaixaMetricas, Metrica, Vazio } from "@/components/ui/Dados";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Alerta, Mais } from "@/components/ui/Icones";

type Faixa = "0-15" | "16-30" | "31-60" | "60+";

// Quatro passos da rampa de tempo em aberto. O semáforo de três colapsaria
// "16-30" e "31-60" na mesma cor, apagando a faixa que separa o atraso novo do
// atraso velho — que é justamente a decisão que esta tela existe para apoiar.
const FAIXA_LABEL: Record<Faixa, string> = {
  "0-15": "0 a 15 dias",
  "16-30": "16 a 30 dias",
  "31-60": "31 a 60 dias",
  "60+": "Mais de 60 dias",
};
const FAIXA_NIVEL: Record<Faixa, 1 | 2 | 3 | 4> = {
  "0-15": 1,
  "16-30": 2,
  "31-60": 3,
  "60+": 4,
};
const FAIXAS: Faixa[] = ["0-15", "16-30", "31-60", "60+"];

type OSPendente = {
  id: string; numero: number; status: string; total: number; valorPago: number; abertura: string;
  veiculo: { marca: string; modelo: string; placa: string | null };
};
type DividaAvulsa = {
  id: number; descricao: string; valor: number; valorPago: number; createdAt: string;
};
type VeiculoInfo = { marca: string; modelo: string; placa: string | null };
type ClienteDevedor = {
  id: string; nome: string; apelido: string | null; telefone: string | null;
  veiculos: VeiculoInfo[];
  ordens: OSPendente[];
  dividasAvulsas: DividaAvulsa[];
  totalSaldo: number;
  diasEmAberto: number;
  faixa: Faixa;
};
type Resumo = {
  totalAReceber: number; totalDevedores: number; totalOSPendentes: number; totalDividasAvulsas: number;
  porFaixa: Record<Faixa, { clientes: number; valor: number }>;
};

type Pagamento = {
  id: string | number; valor: number; formaPagamento: string; obs: string | null; data: string;
};
type ModalPgto = { type: "os" | "divida"; id: string | number; saldo: number } | null;
type HistoricoModal = { type: "os" | "divida"; id: string | number; pagamentos: Pagamento[] } | null;
type Ordenacao = "saldo" | "dias";

const RESUMO_VAZIO: Resumo = {
  totalAReceber: 0, totalDevedores: 0, totalOSPendentes: 0, totalDividasAvulsas: 0,
  porFaixa: { "0-15": { clientes: 0, valor: 0 }, "16-30": { clientes: 0, valor: 0 }, "31-60": { clientes: 0, valor: 0 }, "60+": { clientes: 0, valor: 0 } },
};

function csvEscape(v: string) {
  if (v.includes(";") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function whatsappLink(telefone: string, nome: string, saldo: number) {
  const digits = telefone.replace(/\D/g, "");
  const numero = digits.startsWith("55") ? digits : `55${digits}`;
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const msg = `Olá ${primeiroNome}, tudo bem? Aqui é da oficina. Identificamos um saldo em aberto de ${formatCurrency(saldo)}. Poderia verificar a possibilidade de acerto? Qualquer dúvida, estou à disposição!`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}

export default function ContasReceberPage() {
  const [clientes, setClientes] = useState<ClienteDevedor[]>([]);
  const [resumo, setResumo] = useState<Resumo>(RESUMO_VAZIO);
  const [allClientes, setAllClientes] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [faixaFiltro, setFaixaFiltro] = useState<Faixa | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("saldo");
  const [modalPgto, setModalPgto] = useState<ModalPgto>(null);
  const [historicoModal, setHistoricoModal] = useState<HistoricoModal>(null);
  const [novaDividaModal, setNovaDividaModal] = useState(false);
  const [pgtoForm, setPgtoForm] = useState({ valor: "", formaPagamento: "DINHEIRO", obs: "" });
  const [savingPgto, setSavingPgto] = useState(false);
  const [novaDividaForm, setNovaDividaForm] = useState({ clienteId: "", descricao: "", valor: "" });
  const [savingDivida, setSavingDivida] = useState(false);
  const [estornandoId, setEstornandoId] = useState<string | number | null>(null);

  const confirmar = useConfirmar();
  const avisar = useAvisar();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contas-receber");
      if (!res.ok) throw new Error("falha");
      const data: { clientes: ClienteDevedor[]; resumo: Resumo } = await res.json();
      setClientes(data.clientes);
      setResumo(data.resumo);
    } catch {
      avisar("Não foi possível carregar as contas a receber.", "erro");
    } finally {
      setLoading(false);
    }
  }, [avisar]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { id: string; nome: string }[]) => setAllClientes(data))
      .catch(() => setAllClientes([]));
  }, []);

  const filtered = useMemo(() => {
    const porFaixaEBusca = clientes.filter((c) => {
      if (faixaFiltro && c.faixa !== faixaFiltro) return false;
      if (!q) return true;
      const t = q.toLowerCase();
      return (
        c.nome.toLowerCase().includes(t) ||
        c.apelido?.toLowerCase().includes(t) ||
        c.ordens.some((o) => o.veiculo.placa?.toLowerCase().includes(t) || String(o.numero).includes(t))
      );
    });
    return [...porFaixaEBusca].sort((a, b) =>
      ordenacao === "dias" ? b.diasEmAberto - a.diasEmAberto : b.totalSaldo - a.totalSaldo
    );
  }, [clientes, faixaFiltro, q, ordenacao]);

  function openPgto(type: "os" | "divida", id: string | number, saldo: number) {
    setModalPgto({ type, id, saldo });
    setPgtoForm({ valor: String(saldo), formaPagamento: "DINHEIRO", obs: "" });
  }

  async function submitPgto(e: React.FormEvent) {
    e.preventDefault();
    if (!modalPgto) return;
    setSavingPgto(true);
    try {
      const url =
        modalPgto.type === "os"
          ? `/api/os/${modalPgto.id}/pagamentos`
          : `/api/dividas/${modalPgto.id}/pagamentos`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pgtoForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        avisar(d.error || "Não foi possível registrar o recebimento.", "erro");
        return;
      }
      setModalPgto(null);
      avisar("Recebimento registrado.");
      load();
    } catch {
      avisar("Sem conexão. O recebimento não foi registrado.", "erro");
    } finally {
      setSavingPgto(false);
    }
  }

  async function deleteDivida(div: DividaAvulsa) {
    const ok = await confirmar({
      titulo: "Excluir esta dívida?",
      texto: `“${div.descricao}”, de ${formatCurrency(div.valor - div.valorPago)} em aberto. Não há como desfazer.`,
      acao: "Excluir dívida",
      perigo: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/dividas/${div.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      avisar(d.error || "Não foi possível excluir.", "erro");
      return;
    }
    avisar("Dívida excluída.");
    load();
  }

  async function openHistorico(type: "os" | "divida", id: string | number) {
    const url = type === "os" ? `/api/os/${id}` : `/api/dividas/${id}/pagamentos`;
    const res = await fetch(url);
    if (!res.ok) {
      avisar("Não foi possível carregar o histórico.", "erro");
      return;
    }
    const data = await res.json();
    setHistoricoModal({ type, id, pagamentos: type === "os" ? data.pagamentos : data });
  }

  // Estorna um pagamento do histórico — o valor volta para o saldo em aberto.
  async function estornarPagamento(p: Pagamento) {
    if (!historicoModal) return;
    const ok = await confirmar({
      titulo: "Estornar este pagamento?",
      texto: `Os ${formatCurrency(p.valor)} voltam para o saldo em aberto deste cliente.`,
      acao: "Estornar",
      perigo: true,
    });
    if (!ok) return;
    const { type, id } = historicoModal;
    setEstornandoId(p.id);
    try {
      const base = type === "os" ? `/api/os/${id}` : `/api/dividas/${id}`;
      const res = await fetch(`${base}/pagamentos/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        avisar(d.error || "Não foi possível estornar.", "erro");
        return;
      }
      setHistoricoModal({
        ...historicoModal,
        pagamentos: historicoModal.pagamentos.filter((x) => x.id !== p.id),
      });
      avisar("Pagamento estornado.");
      load();
    } catch {
      avisar("Sem conexão. O estorno não foi feito.", "erro");
    } finally {
      setEstornandoId(null);
    }
  }

  async function submitNovaDivida(e: React.FormEvent) {
    e.preventDefault();
    setSavingDivida(true);
    try {
      const res = await fetch("/api/dividas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDividaForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        avisar(d.error || "Não foi possível criar a dívida.", "erro");
        return;
      }
      setNovaDividaModal(false);
      setNovaDividaForm({ clienteId: "", descricao: "", valor: "" });
      avisar("Dívida avulsa criada.");
      load();
    } catch {
      avisar("Sem conexão. A dívida não foi criada.", "erro");
    } finally {
      setSavingDivida(false);
    }
  }

  function copyTelefone(tel: string) {
    navigator.clipboard
      .writeText(tel)
      .then(() => avisar("Telefone copiado."))
      .catch(() => avisar("Não foi possível copiar o telefone.", "erro"));
  }

  function exportarCSV() {
    const header = ["Cliente", "Telefone", "Total em aberto", "Dias em aberto", "Faixa", "OS pendentes", "Dívidas avulsas"];
    const linhas = filtered.map((c) => [
      c.nome,
      c.telefone ?? "",
      c.totalSaldo.toFixed(2).replace(".", ","),
      String(c.diasEmAberto),
      c.faixa,
      String(c.ordens.length),
      String(c.dividasAvulsas.length),
    ]);
    const csv = [header, ...linhas].map((linha) => linha.map(csvEscape).join(";")).join("\r\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inadimplencia-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-tinta sm:text-2xl">Contas a receber</h1>
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={exportarCSV} disabled={filtered.length === 0}>
            Exportar CSV
          </Botao>
          <Botao onClick={() => setNovaDividaModal(true)}>
            <Mais tamanho={16} /> Dívida avulsa
          </Botao>
        </div>
      </div>

      <FaixaMetricas colunas={4}>
        <Metrica
          rotulo="Total a receber"
          valor={formatCurrency(resumo.totalAReceber)}
          tamanho="grande"
          tom={resumo.totalAReceber > 0 ? "perigo" : "neutro"}
        />
        <Metrica rotulo="Clientes devedores" valor={String(resumo.totalDevedores)} tamanho="grande" />
        <Metrica rotulo="OS pendentes" valor={String(resumo.totalOSPendentes)} tamanho="grande" />
        <Metrica rotulo="Dívidas avulsas" valor={String(resumo.totalDividasAvulsas)} tamanho="grande" />
      </FaixaMetricas>

      {/* Tempo em aberto — cada faixa filtra a lista */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-tinta-3">
          Tempo em aberto
        </p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {FAIXAS.map((f) => (
            <FaixaCard
              key={f}
              faixa={f}
              dados={resumo.porFaixa[f]}
              ativo={faixaFiltro === f}
              onClick={() => setFaixaFiltro(faixaFiltro === f ? null : f)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Entrada
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, apelido, placa ou nº da OS"
          aria-label="Buscar devedores"
          className="sm:max-w-sm"
        />
        <Selecao
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
          aria-label="Ordenação"
          className="sm:w-auto"
        >
          <option value="saldo">Ordenar: maior saldo</option>
          <option value="dias">Ordenar: mais atrasado</option>
        </Selecao>
        {faixaFiltro && (
          <Botao variante="secundario" onClick={() => setFaixaFiltro(null)} className="sm:w-auto">
            Limpar faixa
          </Botao>
        )}
      </div>

      {loading ? (
        <EsqueletoLista linhas={4} />
      ) : filtered.length === 0 ? (
        clientes.length === 0 ? (
          <Vazio
            titulo="Nada a receber"
            texto="Todas as OS entregues estão quitadas e não há dívidas avulsas em aberto."
          />
        ) : (
          <Vazio
            titulo="Nenhum devedor com esse filtro"
            texto="Ajuste a busca ou a faixa de tempo em aberto."
            acao={
              <Botao
                variante="secundario"
                onClick={() => {
                  setQ("");
                  setFaixaFiltro(null);
                }}
              >
                Limpar filtros
              </Botao>
            }
          />
        )
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const veiculosDesc = c.veiculos
              .slice(0, 2)
              .map((v) => `${v.marca} ${v.modelo}${v.placa ? ` · ${v.placa}` : ""}`)
              .join(" · ");
            const extrasVeiculos = c.veiculos.length > 2 ? ` +${c.veiculos.length - 2}` : "";

            return (
              <div key={c.id} className="overflow-hidden rounded-xl border border-linha bg-superficie">
                {/* Cabeçalho do cliente.
                    Era `flex items-center justify-between` sem nenhum ponto de
                    quebra, carregando avatar, nome, apelido, faixa, telefone,
                    botão de WhatsApp e total. Em 360 px isso espremia o nome e o
                    valor devido — o dado que a pessoa foi ali ver. */}
                <div className="flex flex-col gap-3 border-b border-linha bg-superficie-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-superficie-3 text-sm font-bold text-tinta-2">
                      {c.nome[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="font-semibold text-tinta hover:underline"
                        >
                          {c.nome}
                        </Link>
                        {c.apelido && (
                          <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-2">
                            {c.apelido}
                          </span>
                        )}
                        <span className={`idade idade-${FAIXA_NIVEL[c.faixa]}`}>
                          <span className="idade-ponto" aria-hidden="true" />
                          {c.diasEmAberto}d
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-tinta-3">
                        {veiculosDesc}
                        {extrasVeiculos}
                      </p>
                      {c.telefone && (
                        <button
                          onClick={() => copyTelefone(c.telefone!)}
                          className="mt-0.5 text-xs text-tinta-2 hover:underline"
                          title="Copiar telefone"
                        >
                          {c.telefone}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-tinta-3">Total em aberto</p>
                      <p className="font-bold tabular-nums text-perigo">
                        {formatCurrency(c.totalSaldo)}
                      </p>
                    </div>
                    {c.telefone && (
                      <a
                        href={whatsappLink(c.telefone, c.nome, c.totalSaldo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-ok-linha bg-ok-fraco px-3 text-xs font-medium text-ok hover:opacity-90 sm:min-h-9"
                      >
                        Cobrar no WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {c.ordens.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="pt-1 text-xs font-medium uppercase tracking-wide text-tinta-3">
                      OS pendentes
                    </p>
                    {c.ordens.map((os) => {
                      const saldo = os.total - os.valorPago;
                      const diasOS = Math.floor((Date.now() - new Date(os.abertura).getTime()) / 86400000);
                      return (
                        <div
                          key={os.id}
                          className="flex flex-col gap-2 border-b border-linha py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <Link
                                href={`/os/${os.id}`}
                                className="shrink-0 font-medium tabular-nums text-brand-600 hover:underline"
                              >
                                #{os.numero}
                              </Link>
                              <span className="truncate text-tinta-2">
                                {os.veiculo.marca} {os.veiculo.modelo}
                                {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-tinta-3">
                                {labelStatus(os.status)} · {diasOS}d
                                {diasOS > 30 && <Alerta tamanho={12} className="text-perigo" />}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-semibold tabular-nums text-perigo">
                              {formatCurrency(saldo)}
                            </span>
                            <Botao
                              variante="fantasma"
                              tamanho="denso"
                              onClick={() => openHistorico("os", os.id)}
                            >
                              Histórico
                            </Botao>
                            <Botao
                              variante="sucesso"
                              tamanho="denso"
                              onClick={() => openPgto("os", os.id, saldo)}
                            >
                              Receber
                            </Botao>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {c.dividasAvulsas.length > 0 && (
                  <div className="px-4 py-2">
                    <p className="pt-1 text-xs font-medium uppercase tracking-wide text-tinta-3">
                      Dívidas avulsas
                    </p>
                    {c.dividasAvulsas.map((div) => {
                      const saldo = div.valor - div.valorPago;
                      const dias = Math.floor((Date.now() - new Date(div.createdAt).getTime()) / 86400000);
                      return (
                        <div
                          key={div.id}
                          className="flex flex-col gap-2 border-b border-linha py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-tinta-2">{div.descricao}</p>
                            <p className="text-xs tabular-nums text-tinta-3">
                              Há {dias} dias · {formatDate(div.createdAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <span className="font-semibold tabular-nums text-perigo">
                              {formatCurrency(saldo)}
                            </span>
                            <Botao
                              variante="fantasma"
                              tamanho="denso"
                              onClick={() => openHistorico("divida", div.id)}
                            >
                              Histórico
                            </Botao>
                            <Botao
                              variante="sucesso"
                              tamanho="denso"
                              onClick={() => openPgto("divida", div.id, saldo)}
                            >
                              Receber
                            </Botao>
                            <Botao variante="perigo" tamanho="denso" onClick={() => deleteDivida(div)}>
                              Excluir
                            </Botao>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- modais ---------------------------------------------------------- */}

      {modalPgto && (
        <Modal
          titulo="Registrar recebimento"
          descricao={`Saldo em aberto: ${formatCurrency(modalPgto.saldo)}`}
          largura="max-w-sm"
          onFechar={() => setModalPgto(null)}
          rodape={
            <div className="flex gap-2">
              <Botao
                type="submit"
                form="form-recebimento"
                variante="sucesso"
                className="flex-1"
                disabled={savingPgto}
              >
                {savingPgto ? "Confirmando..." : "Confirmar"}
              </Botao>
              <Botao variante="secundario" className="flex-1" onClick={() => setModalPgto(null)}>
                Cancelar
              </Botao>
            </div>
          }
        >
          <form id="form-recebimento" onSubmit={submitPgto} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="valor-receb">
                Valor <span className="text-perigo">*</span>
              </label>
              <CampoDinheiro
                id="valor-receb"
                valor={pgtoForm.valor}
                onChange={(v) => setPgtoForm({ ...pgtoForm, valor: v })}
                required
                data-foco-inicial
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="forma-receb">
                Forma de pagamento
              </label>
              <Selecao
                id="forma-receb"
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
            <div>
              <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="obs-receb">
                Observação
              </label>
              <Entrada
                id="obs-receb"
                value={pgtoForm.obs}
                onChange={(e) => setPgtoForm({ ...pgtoForm, obs: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}

      {historicoModal && (
        <Modal
          titulo="Histórico de pagamentos"
          onFechar={() => setHistoricoModal(null)}
          rodape={
            <Botao variante="secundario" className="w-full" onClick={() => setHistoricoModal(null)}>
              Fechar
            </Botao>
          }
        >
          {historicoModal.pagamentos.length === 0 ? (
            <p className="text-sm text-tinta-3">Nenhum pagamento registrado.</p>
          ) : (
            <div className="space-y-2">
              {historicoModal.pagamentos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 border-b border-linha pb-2 text-sm last:border-0"
                >
                  <div className="min-w-0">
                    <span className="font-medium tabular-nums text-tinta">
                      {formatCurrency(p.valor)}
                    </span>
                    <span className="ml-2 text-tinta-3">{labelFormaPagamento(p.formaPagamento)}</span>
                    {p.obs && <span className="ml-1 text-tinta-3">· {p.obs}</span>}
                    <span className="block text-xs tabular-nums text-tinta-3">
                      {formatDatetime(p.data)}
                    </span>
                  </div>
                  <Botao
                    variante="fantasma"
                    tamanho="denso"
                    onClick={() => estornarPagamento(p)}
                    disabled={estornandoId === p.id}
                  >
                    Estornar
                  </Botao>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {novaDividaModal && (
        <Modal
          titulo="Nova dívida avulsa"
          descricao="Para o que o cliente deve sem ter uma OS aberta."
          largura="max-w-sm"
          onFechar={() => setNovaDividaModal(false)}
          rodape={
            <div className="flex gap-2">
              <Botao type="submit" form="form-divida" className="flex-1" disabled={savingDivida}>
                {savingDivida ? "Criando..." : "Criar dívida"}
              </Botao>
              <Botao
                variante="secundario"
                className="flex-1"
                onClick={() => setNovaDividaModal(false)}
              >
                Cancelar
              </Botao>
            </div>
          }
        >
          <form id="form-divida" onSubmit={submitNovaDivida} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="divida-cliente">
                Cliente <span className="text-perigo">*</span>
              </label>
              <Selecao
                id="divida-cliente"
                value={novaDividaForm.clienteId}
                onChange={(e) => setNovaDividaForm({ ...novaDividaForm, clienteId: e.target.value })}
                required
                data-foco-inicial
              >
                <option value="">Selecionar...</option>
                {allClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Selecao>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="divida-desc">
                Descrição <span className="text-perigo">*</span>
              </label>
              <Entrada
                id="divida-desc"
                value={novaDividaForm.descricao}
                onChange={(e) => setNovaDividaForm({ ...novaDividaForm, descricao: e.target.value })}
                placeholder="Ex: peça comprada para o cliente"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="divida-valor">
                Valor <span className="text-perigo">*</span>
              </label>
              <CampoDinheiro
                id="divida-valor"
                valor={novaDividaForm.valor}
                onChange={(v) => setNovaDividaForm({ ...novaDividaForm, valor: v })}
                required
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function FaixaCard({
  faixa,
  dados,
  ativo,
  onClick,
}: {
  faixa: Faixa;
  dados: { clientes: number; valor: number };
  ativo: boolean;
  onClick: () => void;
}) {
  const nivel = FAIXA_NIVEL[faixa];
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        ativo ? "border-brand-600 bg-superficie ring-1 ring-brand-600" : "border-linha bg-superficie hover:bg-superficie-2"
      )}
    >
      <span className={`idade idade-${nivel}`}>
        <span className="idade-ponto" aria-hidden="true" />
        {FAIXA_LABEL[faixa]}
      </span>
      <p className="mt-1.5 text-lg font-bold tabular-nums text-tinta">{formatCurrency(dados.valor)}</p>
      <p className="text-xs tabular-nums text-tinta-3">
        {dados.clientes} cliente{dados.clientes !== 1 ? "s" : ""}
      </p>
    </button>
  );
}
