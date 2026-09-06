"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn, formatCurrency, formatDate, nomeCliente, telefoneCliente, descricaoVeiculo, ehRascunho } from "@/lib/utils";
import { anoVeiculo, corStatusOrcamento, labelStatusOrcamento, ORCAMENTO_STATUS } from "@/lib/constants";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Esqueleto, Metrica } from "@/components/ui/Dados";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Chevron, Olho, Voltar } from "@/components/ui/Icones";
import CopiarVeiculo from "@/components/CopiarVeiculo";
import CabecalhoDocumento from "@/components/CabecalhoDocumento";
import Fotos, { type Foto } from "@/components/Fotos";
import { useEhDono } from "@/components/UsuarioProvider";

const BaixarOrcamento = dynamic(() => import("@/components/BaixarOrcamento"), {
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
type Orcamento = {
  id: string; numero: number; status: string; descricao: string | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  validade: string | null; obs: string | null; createdAt: string;
  ordemId: string | null;
  clienteId: string | null;
  cliente: {
    id: string; nome: string; telefone: string | null; cpfCnpj: string | null;
    email: string | null; endereco: string | null; cidade: string | null; estado: string | null;
  } | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  veiculo: {
    id: string; marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
    anoFabricacao: number | null; anoModelo: number | null;
    valvulas: string | null; combustivel: string | null; km: number | null;
  } | null;
  veiculoDesc: string | null;
  ordem: { id: string; numero: number } | null;
  itens: Item[];
  fotos: Foto[];
};

const STATUS_OPTIONS = ORCAMENTO_STATUS.filter((s) => s.value !== "CONVERTIDO");
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

export default function OrcamentoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const ehDono = useEhDono();
  const confirmar = useConfirmar();
  const avisar = useAvisar();
  const [orc, setOrc] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro] = useState("");
  const [revelado, setRevelado] = useState(false);

  const load = () =>
    fetch(`/api/orcamentos/${id}`)
      .then((r) => r.json())
      // Orçamento antigo (resposta em cache, ou papel sem fotos) não quebra a tela.
      .then((data: Orcamento) => setOrc({ ...data, fotos: data.fotos ?? [] }))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  async function changeStatus(status: string) {
    if (!orc || status === orc.status) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        avisar(d.error || "Não foi possível alterar o status.", "erro");
        return;
      }
      avisar(`Orçamento marcado como ${labelStatusOrcamento(status)}.`);
      await load();
    } finally {
      setChangingStatus(false);
    }
  }

  async function converter() {
    if (!orc) return;
    const ok = await confirmar({
      titulo: `Converter o orçamento #${orc.numero} em OS?`,
      texto: `Uma ordem de serviço nova é aberta com os itens e as fotos deste orçamento, no valor de ${formatCurrency(orc.total)}. O orçamento fica marcado como convertido.`,
      acao: "Converter em OS",
    });
    if (!ok) return;
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
    const ok = await confirmar({
      titulo: `Excluir o orçamento #${orc?.numero ?? ""}?`,
      texto: "Ele sai do sistema junto com os itens e as fotos. Não há como desfazer.",
      acao: "Excluir orçamento",
      perigo: true,
    });
    if (!ok) return;
    setDeleting(true);
    const res = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      avisar(d.error || "Não foi possível excluir o orçamento.", "erro");
      setDeleting(false);
      return;
    }
    router.push("/orcamentos");
  }

  if (loading)
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
        <Esqueleto className="h-11 w-full" />
        <Esqueleto className="h-64 w-full" />
      </div>
    );
  if (!orc) return <div className="p-6 text-sm text-tinta-3">Orçamento não encontrado.</div>;

  const convertido = orc.status === "CONVERTIDO" || !!orc.ordemId;
  const podeEditar = !convertido;

  // Margem do orçamento — calculada dos itens, já que o orçamento não guarda custo consolidado.
  const custoTotalPecas = orc.itens
    .filter((i) => i.tipo === "PECA")
    .reduce((s, i) => s + i.quantidade * (i.custoUnit ?? 0), 0);
  const margemValor = orc.totalPecas - custoTotalPecas;
  const margemPecasPct = orc.totalPecas > 0 ? (margemValor / orc.totalPecas) * 100 : 0;
  const lucroEstimado = orc.total - custoTotalPecas;
  const temValores = orc.total > 0 || custoTotalPecas > 0;

  const veicLinha: string[] = [];
  if (orc.veiculo?.cor) veicLinha.push(`Cor: ${orc.veiculo.cor}`);
  if (orc.veiculo?.motorizacao) veicLinha.push(`Motor: ${orc.veiculo.motorizacao}`);

  return (
    <div className="pb-12">
      {/* Barra de ações — oculta na impressão */}
      <div className="no-print border-b border-linha bg-superficie">
        {/* Mesmo max-w e padding do documento abaixo, para as bordas coincidirem. */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3">
        <Link
          href="/orcamentos"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-tinta-3 hover:text-tinta-2"
        >
          <Voltar tamanho={16} /> Orçamentos
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {orc.veiculo && <CopiarVeiculo veiculo={orc.veiculo} />}
          {!convertido && (
            <BotaoLink href={`/orcamentos/${orc.id}/editar`} variante="secundario" tamanho="denso">
              Editar
            </BotaoLink>
          )}
          {!convertido && (
            <div className="relative">
              <select
                value={orc.status}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={changingStatus}
                aria-label="Status do orçamento"
                className={cn(
                  "min-h-11 cursor-pointer appearance-none rounded-lg border-0 py-1.5 pl-3 pr-8 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 sm:min-h-9",
                  corStatusOrcamento(orc.status)
                )}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Chevron
                tamanho={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70"
              />
            </div>
          )}
          <Botao variante="secundario" tamanho="denso" onClick={() => window.print()}>
            Imprimir
          </Botao>
          <BaixarOrcamento orc={orc} />
          {convertido && orc.ordem ? (
            <Link
              href={`/os/${orc.ordem.id}`}
              className="rounded-lg bg-contraste px-3 py-1.5 text-sm font-medium text-white hover:bg-contraste"
            >
              Ver OS #{orc.ordem.numero}
            </Link>
          ) : (
            <Botao
              variante="sucesso"
              tamanho="denso"
              onClick={converter}
              disabled={converting}
              title={
                !ehRascunho(orc) && orc.veiculo
                  ? "Gerar uma OS a partir deste orçamento"
                  : "Complete o cadastro de cliente e veículo para converter"
              }
            >
              {converting ? "Convertendo..." : "Converter em OS"}
            </Botao>
          )}
          {!convertido && ehDono && (
            <Botao variante="perigo" tamanho="denso" onClick={excluir} disabled={deleting}>
              Excluir
            </Botao>
          )}
        </div>
        </div>
      </div>

      {erro && (
        <div className="no-print mx-auto max-w-3xl px-4 sm:px-6 pt-4">
          <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>
        </div>
      )}

      {/* Rascunho: o que ainda falta para virar OS. */}
      {!convertido && (ehRascunho(orc) || !orc.veiculo) && (
        <div className="no-print mx-auto max-w-3xl px-4 sm:px-6 pt-4">
          <p className="rounded-lg bg-atencao-fraco px-3 py-2 text-sm text-atencao">
            {ehRascunho(orc) && !orc.veiculo
              ? "Rascunho — falta cadastrar o cliente e o veículo para converter em OS."
              : ehRascunho(orc)
                ? "Rascunho — falta cadastrar o cliente para converter em OS."
                : "Falta selecionar o veículo para converter em OS."}{" "}
            <Link href={`/orcamentos/${orc.id}/editar`} className="font-medium underline">
              Completar cadastro
            </Link>
          </p>
        </div>
      )}

      {convertido && orc.ordem && (
        <div className="no-print mx-auto max-w-3xl px-4 sm:px-6 pt-4">
          <p className="rounded-lg bg-superficie-3 px-3 py-2 text-sm text-tinta-2">
            Este orçamento foi convertido na{" "}
            <Link href={`/os/${orc.ordem.id}`} className="font-medium underline">OS #{orc.ordem.numero}</Link>.
          </p>
        </div>
      )}

      {/* Visão interna — margens. Não sai na impressão nem no PDF do cliente. */}
      {ehDono && temValores && (
        <div className="no-print mx-auto max-w-3xl px-4 sm:px-6 pt-4">
          <div className="rounded-xl border border-linha bg-superficie p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-tinta-3">Visão interna</p>
              <button
                type="button"
                onClick={() => setRevelado((v) => !v)}
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
              <Metrica rotulo="Custo das peças" valor={formatCurrency(custoTotalPecas)} />
              <Metrica
                rotulo="Margem em peças"
                valor={formatCurrency(margemValor)}
                sub={orc.totalPecas > 0 ? `${margemPecasPct.toFixed(0)}% sobre as peças` : undefined}
                tom={margemValor >= 0 ? "ok" : "perigo"}
              />
              <Metrica rotulo="Mão de obra" valor={formatCurrency(orc.totalMO)} />
              <Metrica
                rotulo="Lucro estimado"
                valor={formatCurrency(lucroEstimado)}
                sub={orc.total > 0 ? `${((lucroEstimado / orc.total) * 100).toFixed(0)}% do total` : undefined}
                tom="ok"
              />
            </div>
            {custoTotalPecas === 0 && orc.totalPecas > 0 && (
              <p className="mt-3 text-xs text-atencao">
                Nenhum custo de peça informado — a margem está considerando custo zero.{" "}
                {podeEditar && (
                  <Link href={`/orcamentos/${orc.id}/editar`} className="underline">Preencher custos</Link>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Documento do orçamento — imprimível */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="print-doc rounded-xl border border-linha bg-superficie text-tinta shadow-sm">
          {/* Cabeçalho da oficina — vem do painel de configurações */}
          <CabecalhoDocumento />

          <div className="px-5 sm:px-8 py-6">
            {/* Número do orçamento e status */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-tinta-3">Orçamento</p>
                <p className="text-3xl font-black text-brand-600">#{orc.numero}</p>
              </div>
              <div className="text-right">
                <span className={corStatusOrcamento(orc.status)}>{labelStatusOrcamento(orc.status)}</span>
              </div>
            </div>

            {/* Dados do cliente e veículo */}
            <div className="mb-6 grid gap-x-8 gap-y-3 border-b border-linha pb-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Row label="Data" value={formatDate(orc.createdAt)} />
                {orc.validade && <Row label="Validade" value={formatDate(orc.validade)} />}
                <Row label="Cliente" value={nomeCliente(orc)} bold />
                {telefoneCliente(orc) && <Row label="Tel" value={telefoneCliente(orc)!} />}
                {orc.cliente?.cpfCnpj && <Row label="CPF/CNPJ" value={orc.cliente.cpfCnpj} />}
                {orc.cliente?.endereco && (
                  <Row
                    label="Endereço"
                    value={`${orc.cliente.endereco}${orc.cliente.cidade ? `, ${orc.cliente.cidade}` : ""}${orc.cliente.estado ? ` - ${orc.cliente.estado}` : ""}`}
                  />
                )}
              </div>
              {descricaoVeiculo(orc) && (
                <div className="space-y-2">
                  <Row
                    label="Veículo"
                    value={
                      orc.veiculo
                        ? `${orc.veiculo.marca} ${orc.veiculo.modelo}${anoVeiculo(orc.veiculo) ? ` (${anoVeiculo(orc.veiculo)})` : ""}`
                        : orc.veiculoDesc!
                    }
                    bold
                  />
                  {orc.veiculo?.placa && <Row label="Placa" value={orc.veiculo.placa} />}
                  {veicLinha.length > 0 && <Row label="Detalhes" value={veicLinha.join("  ·  ")} />}
                </div>
              )}
            </div>

            {/* Descrição do serviço */}
            {orc.descricao && (
              <div className="mb-6">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta-3">Descrição do serviço</p>
                <p className="text-sm leading-relaxed text-tinta whitespace-pre-wrap">{orc.descricao}</p>
              </div>
            )}

            {/* Itens e serviços */}
            {orc.itens.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-tinta-3">Itens e serviços</p>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[24rem] text-sm">
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
                    {orc.itens.map((item) => (
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
                {orc.totalPecas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tinta-3">Total peças</span>
                    <span>{formatCurrency(orc.totalPecas)}</span>
                  </div>
                )}
                {orc.totalMO > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-tinta-3">Mão de obra / Serviços</span>
                    <span>{formatCurrency(orc.totalMO)}</span>
                  </div>
                )}
                {orc.desconto > 0 && (
                  <div className="flex justify-between text-sm text-ok">
                    <span>Desconto</span>
                    <span>- {formatCurrency(orc.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-linha pt-2 text-base font-bold">
                  <span>TOTAL</span>
                  <span className="text-perigo">{formatCurrency(orc.total)}</span>
                </div>
              </div>
            </div>

            {/* Observações */}
            {orc.obs && (
              <div className="mt-6 rounded-lg bg-superficie-2 px-4 py-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-tinta-3">Observações</p>
                <p className="text-sm text-tinta whitespace-pre-wrap">{orc.obs}</p>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-tinta-3">
              Este documento é um orçamento e não possui valor fiscal.
            </p>
          </div>
        </div>

        {/* Fotos no documento — páginas próprias na impressão */}
        {orc.fotos.length > 0 && (
          <div className="print-fotos mt-6 rounded-xl border border-linha bg-superficie px-5 sm:px-8 py-6 shadow-sm print:border-none print:shadow-none">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-tinta-3">
              Fotos
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {orc.fotos.map((foto) => (
                <figure key={foto.id}>
                  {/* object-contain: a foto aparece inteira e centralizada, sem corte */}
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-linha bg-superficie-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url}
                      alt={foto.legenda ?? "Foto do orçamento"}
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
          </div>
        )}

        {/* Anexar fotos — some depois da conversão, quando a OS passa a ser o lugar */}
        {(podeEditar || orc.fotos.length > 0) && (
          <div className="mt-6">
            <Fotos
              apiBase={`/api/orcamentos/${orc.id}/fotos`}
              fotos={orc.fotos}
              podeEditar={podeEditar}
              porMomento={false}
              documento="orçamento"
              onChange={(atualizar) =>
                setOrc((atual) => (atual ? { ...atual, fotos: atualizar(atual.fotos) } : atual))
              }
            />
          </div>
        )}
      </div>
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
