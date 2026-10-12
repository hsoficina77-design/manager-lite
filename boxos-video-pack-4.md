# boxOS — pacote visual para o vídeo · parte 4 de 5

**Esta parte:** Fiado e painel financeiro.

Pacote gerado em 07/10/2026 a partir do repositório do boxOS, só por leitura: nenhum arquivo do projeto foi alterado. Serve para recriar as telas num vídeo animado, fora do repositório.

Partes: 1. Mapa das telas, tokens, marca e componentes base · 2. Pátio (Dashboard e lista de OS) · 3. Orçamento, OS aberta e documento da OS · 4. Fiado e painel financeiro · 5. Dados fictícios. Os tokens, a marca e os componentes base estão na parte 1, e os dados fictícios na parte 5.

## Índice (todas as partes)

| Parte | Arquivo | Conteúdo | Tamanho aprox. |
|---|---|---|---|
| 1 | `src/app/globals.css` | íntegro | 17,8 KB |
| 1 | `tailwind.config.ts` | íntegro | 4,2 KB |
| 1 | `src/app/layout.tsx` | trecho: Poppins e variável de fonte | 0,9 KB |
| 1 | `src/components/marca/LogoBoxOS.tsx` | íntegro | 3,5 KB |
| 1 | `public/brand/boxOS_horizontal.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_fundo_escuro.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_mono_branco.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_horizontal_mono_preto.svg` | íntegro | 1,0 KB |
| 1 | `public/brand/boxOS_icone_app.svg` | íntegro | 0,9 KB |
| 1 | `public/brand/boxOS_simbolo.svg` | íntegro | 0,8 KB |
| 1 | `public/brand/favicon_16.svg` | íntegro | 0,5 KB |
| 1 | `src/components/ui/Icones.tsx` | íntegro | 8,5 KB |
| 1 | `src/components/ui/Botao.tsx` | íntegro | 2,5 KB |
| 1 | `src/lib/constants.ts` | trecho: corStatus() e OS_STATUS | 1,8 KB |
| 1 | `src/lib/cor-documento.ts` | íntegro | 4,8 KB |
| 1 | `src/app/layout.tsx` | trecho: casca do app (menu + conteúdo) | 1,4 KB |
| 1 | `src/components/Sidebar.tsx` | lógica de dados removida | 11,8 KB |
| 1 | `src/components/ui/BarraInferior.tsx` | íntegro | 3,2 KB |
| 1 | `src/components/ui/Dados.tsx` | íntegro | 7,7 KB |
| 1 | `src/components/ui/Campos.tsx` | íntegro | 6,2 KB |
| 1 | `src/components/ui/Modal.tsx` | íntegro | 5,3 KB |
| 1 | `src/components/ui/Avisos.tsx` | íntegro | 5,8 KB |
| 1 | `src/components/MaisDaLista.tsx` | íntegro | 1,1 KB |
| 1 | `src/components/ui/TextoFormatado.tsx` | íntegro | 2,7 KB |
| 1 | `src/components/CopiarVeiculo.tsx` | íntegro | 4,3 KB |
| 1 | `src/lib/utils.ts` | íntegro | 5,5 KB |
| 1 | `src/lib/configuracao.ts` | íntegro | 3,9 KB |
| 2 | `src/app/page.tsx` | lógica de dados removida | 29,9 KB |
| 2 | `src/app/os/page.tsx` | lógica de dados removida | 12,9 KB |
| 2 | `src/lib/os-periodo.ts` | íntegro | 1,5 KB |
| 2 | `src/lib/periodo.ts` | íntegro | 12,6 KB |
| 2 | `src/lib/texto-formatado.ts` | íntegro | 7,2 KB |
| 3 | `src/app/orcamentos/[id]/page.tsx` | lógica de dados removida | 21,3 KB |
| 3 | `src/components/BaixarOrcamento.tsx` | lógica de dados removida | 1,5 KB |
| 3 | `src/app/os/[id]/page.tsx` | lógica de dados removida | 43,5 KB |
| 3 | `src/components/CabecalhoDocumento.tsx` | lógica de dados removida | 2,2 KB |
| 3 | `src/components/Fotos.tsx` | lógica de dados removida | 24,5 KB |
| 3 | `src/components/BaixarOS.tsx` | lógica de dados removida | 1,4 KB |
| 3 | `src/components/BaixarDocumento.tsx` | íntegro | 10,5 KB |
| 3 | `src/lib/formato-download.ts` | íntegro | 1,4 KB |
| 3 | `src/components/OSPdfDocument.tsx` | íntegro | 16,7 KB |
| 3 | `src/components/TextoFormatadoPdf.tsx` | íntegro | 1,8 KB |
| 3 | `src/lib/pdf-para-imagem.ts` | íntegro | 3,9 KB |
| **4** ← | `src/app/contas-receber/page.tsx` | lógica de dados removida | 31,2 KB |
| **4** ← | `src/components/BaixarComprovante.tsx` | lógica de dados removida | 4,0 KB |
| **4** ← | `src/components/ComprovantePagamentoPdfDocument.tsx` | íntegro | 12,5 KB |
| **4** ← | `src/components/ClienteSelect.tsx` | íntegro | 8,2 KB |
| **4** ← | `src/app/despesas/page.tsx` | lógica de dados removida | 1,5 KB |
| **4** ← | `src/components/despesas/ControleDeGastos.tsx` | lógica de dados removida | 33,2 KB |
| **4** ← | `src/components/despesas/campos.tsx` | íntegro | 3,5 KB |
| **4** ← | `src/components/despesas/tipos.ts` | íntegro | 1,4 KB |
| **4** ← | `src/lib/despesas-comum.ts` | íntegro | 8,3 KB |
| 5 | `dados-ficticios.json` | gerado para o vídeo: não existe no repositório | 48,9 KB |

---

## 4.5 Fiado / contas a receber

`src/app/contas-receber/page.tsx`. De cima para baixo: quatro números (total a receber, devedores, OS pendentes, dívidas avulsas); os cartões de **tempo em aberto**, um por faixa, que filtram a lista; a busca; e um cartão por cliente com a pílula de dias, o total em aberto em vermelho e as OS ou dívidas com os botões Histórico, Baixar comprovante e **Receber**. O comprovante e o extrato saem como imagem (`BaixarComprovante` → `ComprovantePagamentoPdfDocument` → PNG).

### src/app/contas-receber/page.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn, formatCurrency, formatDate, formatDatetime } from "@/lib/utils";
import { FORMAS_PAGAMENTO, labelFormaPagamento, labelStatus } from "@/lib/constants";
import { Botao } from "@/components/ui/Botao";
import ClienteSelect from "@/components/ClienteSelect";
import { CampoDinheiro, Entrada, Selecao } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { EsqueletoLista, FaixaMetricas, Metrica, Vazio } from "@/components/ui/Dados";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Alerta, Mais } from "@/components/ui/Icones";
import BaixarComprovante from "@/components/BaixarComprovante";
import type { ComprovanteItem } from "@/components/ComprovantePagamentoPdfDocument";

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
  id: string; numero: number; status: string; desconto: number; total: number; valorPago: number; abertura: string;
  veiculo: { marca: string; modelo: string; placa: string | null };
  pagamentos: Pagamento[];
};
type DividaAvulsa = {
  id: number; descricao: string; valor: number; valorPago: number; createdAt: string;
  pagamentos: Pagamento[];
};
type VeiculoInfo = { marca: string; modelo: string; placa: string | null };
type ClienteDevedor = {
  // Vazio quando é um devedor avulso, sem cadastro de cliente — ver `id` da API.
  id: string; clienteId: string | null; nome: string; apelido: string | null; telefone: string | null;
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
/**
 * Cada linha carrega o próprio alvo porque o histórico do cliente junta
 * pagamentos de OS e de dívidas diferentes — o estorno precisa saber de qual
 * deles o valor está voltando.
 */
type HistoricoLinha = Pagamento & {
  type: "os" | "divida";
  alvoId: string | number;
  origem: string;
};
type HistoricoModal = { descricao?: string; linhas: HistoricoLinha[]; mostrarOrigem: boolean } | null;
type Ordenacao = "saldo" | "dias";

const RESUMO_VAZIO: Resumo = {
  totalAReceber: 0, totalDevedores: 0, totalOSPendentes: 0, totalDividasAvulsas: 0,
  porFaixa: { "0-15": { clientes: 0, valor: 0 }, "16-30": { clientes: 0, valor: 0 }, "31-60": { clientes: 0, valor: 0 }, "60+": { clientes: 0, valor: 0 } },
};

/** Tudo o que o cliente deve, na ordem em que aparece na tela, para o comprovante geral. */
function itensDoCliente(c: ClienteDevedor): ComprovanteItem[] {
  return [
    ...c.ordens.map((os) => ({
      numero: os.numero,
      veiculo: os.veiculo,
      desconto: os.desconto,
      total: os.total,
      valorPago: os.valorPago,
      pago: false,
      pagamentos: os.pagamentos,
    })),
    ...c.dividasAvulsas.map((div) => ({
      descricao: div.descricao,
      total: div.valor,
      valorPago: div.valorPago,
      pago: false,
      pagamentos: div.pagamentos,
    })),
  ];
}

export default function ContasReceberPage() {
  const [clientes, setClientes] = useState<ClienteDevedor[]>([]);
  const [resumo, setResumo] = useState<Resumo>(RESUMO_VAZIO);
  const [allClientes, setAllClientes] = useState<{ id: string; nome: string; telefone: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [faixaFiltro, setFaixaFiltro] = useState<Faixa | null>(null);
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("saldo");
  const [modalPgto, setModalPgto] = useState<ModalPgto>(null);
  const [historicoModal, setHistoricoModal] = useState<HistoricoModal>(null);
  const [novaDividaModal, setNovaDividaModal] = useState(false);
  const [pgtoForm, setPgtoForm] = useState({ valor: "", formaPagamento: "DINHEIRO", obs: "" });
  const [savingPgto, setSavingPgto] = useState(false);
  const [novaDividaForm, setNovaDividaForm] = useState({ clienteId: "", devedorNome: "", descricao: "", valor: "" });
  const [savingDivida, setSavingDivida] = useState(false);
  const [estornandoId, setEstornandoId] = useState<string | number | null>(null);

  const confirmar = useConfirmar();
  const avisar = useAvisar();

  // [removido: busca de dados] — GET /api/contas-receber preenchia `clientes` e `resumo`; GET
  // /api/clientes preenchia `allClientes` (seletor do modal "Nova dívida avulsa").
  // Dados fictícios: `contasReceber`.

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
    // [removido: chamada à API] — POST /api/os/:id/pagamentos ou /api/dividas/:id/pagamentos
  }

  async function deleteDivida(div: DividaAvulsa) {
    const ok = await confirmar({
      titulo: "Excluir esta dívida?",
      texto: `“${div.descricao}”, de ${formatCurrency(div.valor - div.valorPago)} em aberto. Não há como desfazer.`,
      acao: "Excluir dívida",
      perigo: true,
    });
    if (!ok) return;
    // [removido: chamada à API] — DELETE /api/dividas/:id
  }

  async function openHistorico(type: "os" | "divida", id: string | number, origem: string) {
    // [removido: busca de dados] — buscava os pagamentos da OS ou da dívida e abria o modal
    // "Histórico de pagamentos" (mesmo formato de `openHistoricoCliente`, logo abaixo).
  }

  /**
   * Histórico do cliente inteiro: todas as OS e dívidas em aberto numa lista só,
   * em ordem de data. Sai dos dados já carregados na lista — são os mesmos que a
   * API acabou de entregar, e abrir um pedido por débito só atrasaria o modal.
   */
  function openHistoricoCliente(c: ClienteDevedor) {
    const linhas: HistoricoLinha[] = [
      ...c.ordens.flatMap((os) =>
        os.pagamentos.map((p) => ({ ...p, type: "os" as const, alvoId: os.id, origem: `OS #${os.numero}` }))
      ),
      ...c.dividasAvulsas.flatMap((div) =>
        div.pagamentos.map((p) => ({ ...p, type: "divida" as const, alvoId: div.id, origem: div.descricao }))
      ),
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    setHistoricoModal({
      descricao: `${c.nome} · todas as OS e dívidas em aberto`,
      linhas,
      mostrarOrigem: true,
    });
  }

  // Estorna um pagamento do histórico — o valor volta para o saldo em aberto.
  async function estornarPagamento(p: HistoricoLinha) {
    if (!historicoModal) return;
    const ok = await confirmar({
      titulo: "Estornar este pagamento?",
      texto: `Os ${formatCurrency(p.valor)} de ${p.origem} voltam para o saldo em aberto deste cliente.`,
      acao: "Estornar",
      perigo: true,
    });
    if (!ok) return;
    // [removido: chamada à API] — DELETE .../pagamentos/:id; a linha sai do histórico e o saldo volta.
  }

  async function submitNovaDivida(e: React.FormEvent) {
    // [removido: chamada à API] — POST /api/dividas
  }

  function copyTelefone(tel: string) {
    navigator.clipboard
      .writeText(tel)
      .then(() => avisar("Telefone copiado."))
      .catch(() => avisar("Não foi possível copiar o telefone.", "erro"));
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-tinta sm:text-2xl">Contas a receber</h1>
        <div className="flex gap-2">
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
            // Com um débito só, os botões da linha já fazem o mesmo — repetir no
            // cabeçalho seria só ruído.
            const varios = c.ordens.length + c.dividasAvulsas.length > 1;

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
                        {c.clienteId ? (
                          <Link
                            href={`/clientes/${c.clienteId}`}
                            className="font-semibold text-tinta hover:underline"
                          >
                            {c.nome}
                          </Link>
                        ) : (
                          <span className="font-semibold text-tinta">{c.nome}</span>
                        )}
                        {c.apelido && (
                          <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-2">
                            {c.apelido}
                          </span>
                        )}
                        {!c.clienteId && (
                          <span
                            className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-2"
                            title="Dívida avulsa sem cadastro de cliente"
                          >
                            Sem cadastro
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

                  <div className="flex flex-col gap-2 sm:items-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-tinta-3">Total em aberto</p>
                      <p className="font-bold tabular-nums text-perigo">
                        {formatCurrency(c.totalSaldo)}
                      </p>
                    </div>
                    {varios && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Botao
                          variante="fantasma"
                          tamanho="denso"
                          onClick={() => openHistoricoCliente(c)}
                          title="Pagamentos de todas as OS e dívidas em aberto deste cliente"
                        >
                          Histórico geral
                        </Botao>
                        <BaixarComprovante
                          dados={{ cliente: { nome: c.nome }, itens: itensDoCliente(c) }}
                          rotulo="Extrato geral"
                          titulo="Uma imagem só com todas as OS e dívidas em aberto deste cliente"
                        />
                      </div>
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
                                className="shrink-0 font-medium tabular-nums text-brand-texto hover:underline"
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
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <span className="font-semibold tabular-nums text-perigo">
                              {formatCurrency(saldo)}
                            </span>
                            <Botao
                              variante="fantasma"
                              tamanho="denso"
                              onClick={() => openHistorico("os", os.id, `OS #${os.numero}`)}
                            >
                              Histórico
                            </Botao>
                            <BaixarComprovante
                              dados={{
                                cliente: { nome: c.nome },
                                itens: [
                                  {
                                    numero: os.numero,
                                    veiculo: os.veiculo,
                                    desconto: os.desconto,
                                    total: os.total,
                                    valorPago: os.valorPago,
                                    pago: false,
                                    pagamentos: os.pagamentos,
                                  },
                                ],
                              }}
                            />
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
                              onClick={() => openHistorico("divida", div.id, div.descricao)}
                            >
                              Histórico
                            </Botao>
                            <BaixarComprovante
                              dados={{
                                cliente: { nome: c.nome },
                                itens: [
                                  {
                                    descricao: div.descricao,
                                    total: div.valor,
                                    valorPago: div.valorPago,
                                    pago: false,
                                    pagamentos: div.pagamentos,
                                  },
                                ],
                              }}
                            />
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
          descricao={historicoModal.descricao}
          onFechar={() => setHistoricoModal(null)}
          rodape={
            <Botao variante="secundario" className="w-full" onClick={() => setHistoricoModal(null)}>
              Fechar
            </Botao>
          }
        >
          {historicoModal.linhas.length === 0 ? (
            <p className="text-sm text-tinta-3">Nenhum pagamento registrado.</p>
          ) : (
            <div className="space-y-2">
              {historicoModal.linhas.map((p) => (
                <div
                  key={`${p.alvoId}-${p.id}`}
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
                      {historicoModal.mostrarOrigem && (
                        <span className="text-tinta-2"> · {p.origem}</span>
                      )}
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
                Cliente
              </label>
              <ClienteSelect
                clientes={allClientes}
                value={novaDividaForm.clienteId}
                onChange={(id) => setNovaDividaForm({ ...novaDividaForm, clienteId: id })}
                emptyLabel="Sem cadastro — anotar só o nome"
              />
            </div>

            {!novaDividaForm.clienteId && (
              <div>
                <label className="mb-1 block text-xs font-medium text-tinta-2" htmlFor="divida-devedor">
                  Nome do devedor <span className="text-perigo">*</span>
                </label>
                <Entrada
                  id="divida-devedor"
                  value={novaDividaForm.devedorNome}
                  onChange={(e) => setNovaDividaForm({ ...novaDividaForm, devedorNome: e.target.value })}
                  placeholder="Ex: Nilcio do Fusca azul"
                  required
                  data-foco-inicial
                />
              </div>
            )}

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
```

### src/components/BaixarComprovante.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import { useCallback, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import { toDataUrl } from "@/lib/foto-pdf";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { ComprovantePagamentoPdfDocument, type ComprovanteDados } from "./ComprovantePagamentoPdfDocument";

/**
 * Botão que gera direto uma imagem do histórico de pagamento — a mesma coisa
 * que hoje sai de um print recortado à mão para mandar no WhatsApp.
 *
 * Sai só em PNG, sem a escolha de formato do BaixarDocumento: aqui a imagem é
 * o próprio produto, não um documento que também poderia virar PDF.
 */
export default function BaixarComprovante({
  dados,
  rotulo = "Baixar comprovante",
  titulo = "Baixar uma imagem com o histórico de pagamento",
}: {
  dados: ComprovanteDados;
  rotulo?: string;
  titulo?: string;
}) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const baixar = useCallback(async () => {
    setGerando(true);
    setErro(null);
    try {
      // [removido: busca de dados] — carregava a configuração da oficina (com a logo).
      // Dados fictícios: `configuracao`.

      const pdfBlob = await comPrazo(
        pdf(
          <ComprovantePagamentoPdfDocument dados={dados} logoSrc={logo} config={config} geradoEm={new Date()} />
        ).toBlob(),
        PRAZO.pdf,
        "Montar o comprovante"
      );

      // Carregado só agora: quem nunca baixa comprovante não paga pelo pdf.js.
      const { pdfParaPngs } = await import("@/lib/pdf-para-imagem");
      const [png] = await comPrazo(pdfParaPngs(pdfBlob), PRAZO.pdf, "Converter em imagem");
      if (!png) throw new Error("Não foi possível gerar a imagem");

      const url = URL.createObjectURL(png);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${nomeArquivo(dados)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Falha ao gerar o comprovante");
    } finally {
      setGerando(false);
    }
  }, [dados]);

  return (
    <div className="relative">
      <Botao
        type="button"
        variante="secundario"
        tamanho="denso"
        onClick={baixar}
        disabled={gerando}
        title={erro ? `Não foi possível gerar o comprovante: ${erro}` : titulo}
        className={cn(erro && "border-perigo-linha text-perigo hover:bg-perigo-fraco")}
      >
        <IconeDownload className="h-3.5 w-3.5 shrink-0" />
        {gerando ? "Gerando..." : erro ? "Tentar de novo" : rotulo}
      </Botao>

      {erro && (
        <p role="alert" className="absolute right-0 top-full z-10 mt-1 w-56 text-right text-xs leading-snug text-perigo">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * Ex.: "Comprovante - OS 123 - João Silva" com um débito só; com vários, o nome
 * cai para "Extrato - João Silva" — enfileirar as OS no nome do arquivo não
 * caberia na tela do celular de quem recebe.
 */
function nomeArquivo({ cliente, itens }: ComprovanteDados) {
  const nome = limparNome(cliente.nome);
  if (itens.length !== 1) return ["Extrato", nome].filter(Boolean).join(" - ");
  const identificacao = itens[0].numero != null ? `OS ${itens[0].numero}` : "Dívida";
  return [`Comprovante - ${identificacao}`, nome].filter(Boolean).join(" - ");
}

function IconeDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" />
      <path d="M3.5 13.5v1.75A1.75 1.75 0 0 0 5.25 17h9.5a1.75 1.75 0 0 0 1.75-1.75V13.5" />
    </svg>
  );
}
```

### src/components/ComprovantePagamentoPdfDocument.tsx

```tsx
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { labelFormaPagamento } from "@/lib/constants";
import { CONFIG_PADRAO, EMITIDO_COM, rodapeDoDocumento, type Configuracao } from "@/lib/configuracao";

type Pagamento = {
  id: string | number; valor: number; formaPagamento: string; data: string; obs: string | null;
};
/**
 * Um débito do cliente: uma OS ou uma dívida avulsa.
 *
 * Uma OS tem `numero` e `veiculo`; uma dívida avulsa não tem nenhum dos dois — usa
 * `descricao` no lugar. Nunca os dois ao mesmo tempo.
 */
export type ComprovanteItem = {
  numero?: number;
  descricao?: string;
  veiculo?: { marca: string; modelo: string; placa: string | null };
  /** Desconto já abatido de `total`. Dívida avulsa não tem desconto. */
  desconto?: number;
  /** Entrega da OS (ou abertura, enquanto não sai) / criação da dívida. Só aparece no extrato. */
  data?: string;
  total: number;
  valorPago: number;
  pago: boolean;
  pagamentos: Pagamento[];
};

/**
 * Um comprovante por cliente, não por OS: com um débito só ele sai como o recibo
 * de sempre; com vários, vira extrato — a lista de serviços, cada um marcado
 * como quitado ou com o saldo, e o histórico com a origem de cada pagamento. É
 * assim que o cliente com uma OS recém-quitada e outra em aberto recebe uma
 * conta só, em vez de duas imagens para juntar de cabeça.
 */
export type ComprovanteDados = {
  cliente: { nome: string };
  itens: ComprovanteItem[];
};

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function dataCurta(d: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}
function dataHora(d: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export function identificacaoDoItem(item: ComprovanteItem) {
  return item.numero != null ? `OS Nº ${item.numero}` : (item.descricao ?? "Dívida avulsa");
}
export function saldoDoItem(item: ComprovanteItem) {
  // Centavo de arredondamento do Float não pode deixar um serviço quitado "em aberto".
  return item.pago ? 0 : Math.max(0, Math.round((item.total - item.valorPago) * 100) / 100);
}
function veiculoDoItem(item: ComprovanteItem) {
  if (!item.veiculo) return "";
  const nome = [item.veiculo.marca, item.veiculo.modelo].filter(Boolean).join(" ");
  return item.veiculo.placa ? `${nome} · ${item.veiculo.placa}` : nome;
}

const C = {
  ink: "#18181b", sub: "#52525b", mute: "#a1a1aa", line: "#e4e4e7",
  soft: "#f4f4f5", green: "#16a34a", red: "#dc2626",
};

// Largura fixa e sem altura: o react-pdf estica a página até caber tudo, do
// jeito de um recibo de balcão — sem paginação, que aqui só atrapalharia o
// recorte para o WhatsApp.
const LARGURA_PAGINA = 380;

const s = StyleSheet.create({
  page: { padding: 26, fontFamily: "Helvetica", fontSize: 9, color: C.ink },

  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  logo: { width: 36, height: 36, objectFit: "contain" },
  brandName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },
  brandLine: { fontSize: 8, color: C.sub, marginTop: 1 },

  rule: { height: 2, marginBottom: 16 },

  title: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  subtitle: { fontSize: 9, color: C.sub, marginBottom: 16, lineHeight: 1.4 },

  secTitle: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },

  debitos: { marginBottom: 16 },
  debRow: {
    flexDirection: "row", justifyContent: "space-between", gap: 10,
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.soft,
  },
  debInfo: { flex: 1 },
  debLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink },
  debSub: { fontSize: 7.5, color: C.mute, marginTop: 1.5 },
  debDireita: { alignItems: "flex-end" },
  debSaldo: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  debSituacao: { fontSize: 7, marginTop: 1.5, textTransform: "uppercase", letterSpacing: 0.5 },

  grid: {
    flexDirection: "row", borderWidth: 1, borderColor: C.line, borderRadius: 10,
    marginBottom: 16,
  },
  gridCol: { flex: 1, paddingVertical: 12, alignItems: "center" },
  gridDivider: { width: 1, backgroundColor: C.line },
  gridLabel: { fontSize: 7.5, color: C.mute, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  gridValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },

  desconto: {
    borderWidth: 1, borderColor: C.line, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10,
  },
  descontoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  descontoLabel: { fontSize: 8.5, color: C.sub },
  descontoValor: { fontSize: 8.5, color: C.sub },

  quitado: {
    flexDirection: "row", alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: C.green, borderRadius: 8, backgroundColor: "#f0fdf4",
    paddingVertical: 8, paddingHorizontal: 10,
  },
  quitadoTexto: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.green },

  histRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.soft },
  histLinha1: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" },
  histValor: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink },
  histForma: { fontSize: 8.5, color: C.sub, marginLeft: 6 },
  histObs: { fontSize: 8, color: C.sub, marginTop: 2, lineHeight: 1.35 },
  histData: { fontSize: 8, color: C.mute, marginTop: 2 },

  footer: { marginTop: 18, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 },
  footerText: { fontSize: 7.5, color: C.mute },
  footerGerado: { fontSize: 7.5, color: C.mute, marginTop: 2 },
});

export function ComprovantePagamentoPdfDocument({
  dados,
  logoSrc,
  geradoEm,
  config = CONFIG_PADRAO,
}: {
  dados: ComprovanteDados;
  logoSrc?: string;
  /** Fixado no momento em que o download começa, para bater com o nome do arquivo. */
  geradoEm: Date;
  config?: Configuracao;
}) {
  const { cliente, itens } = dados;
  const varios = itens.length > 1;

  const total = itens.reduce((acc, i) => acc + i.total, 0);
  const valorPago = itens.reduce((acc, i) => acc + i.valorPago, 0);
  const saldo = itens.reduce((acc, i) => acc + saldoDoItem(i), 0);
  // `total` já vem líquido; o bruto só existe aqui, para o cliente enxergar o abatimento.
  const desconto = itens.reduce((acc, i) => acc + (i.desconto ?? 0), 0);
  const emAberto = itens.filter((i) => saldoDoItem(i) > 0).length;
  const quitados = itens.length - emAberto;
  const quitado = itens.length > 0 && emAberto === 0;

  const unico = varios ? null : itens[0];
  const veiculoUnico = unico ? veiculoDoItem(unico) : "";

  // Um histórico só, em ordem de data, com a origem de cada pagamento à mão —
  // sem ela, dois débitos viram uma lista de valores soltos.
  const historico = itens
    .flatMap((item, idx) =>
      item.pagamentos.map((p) => ({ ...p, chave: `${idx}-${p.id}`, origem: identificacaoDoItem(item) }))
    )
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const tituloDoc = unico
    ? `Comprovante - ${identificacaoDoItem(unico)} - ${cliente.nome}`
    : `Extrato - ${cliente.nome}`;
  const resumoContagem = [
    emAberto > 0 ? `${emAberto} em aberto` : "",
    quitados > 0 ? `${quitados} ${quitados === 1 ? "quitado" : "quitados"}` : "",
  ].filter(Boolean).join(" · ");

  return (
    <Document title={tituloDoc} author={config.nome}>
      <Page size={{ width: LARGURA_PAGINA }} style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {logoSrc ? <Image style={s.logo} src={logoSrc} /> : null}
          <View>
            <Text style={s.brandName}>{config.nome}</Text>
            {config.telefone ? <Text style={s.brandLine}>{config.telefone}</Text> : null}
          </View>
        </View>

        <View style={[s.rule, { backgroundColor: config.corDocumento }]} />

        <Text style={s.title}>{varios ? "Extrato de Pagamentos" : "Comprovante de Pagamento"}</Text>
        {unico ? (
          <Text style={s.subtitle}>
            {identificacaoDoItem(unico)} · {cliente.nome}
            {veiculoUnico ? `\n${veiculoUnico}` : ""}
          </Text>
        ) : (
          <Text style={s.subtitle}>
            {cliente.nome}
            {`\n${resumoContagem}`}
          </Text>
        )}

        {varios ? (
          <View style={s.debitos}>
            <Text style={s.secTitle}>{quitados > 0 ? "Serviços" : "Débitos"}</Text>
            {itens.map((item, idx) => {
              const saldoItem = saldoDoItem(item);
              const contexto = [veiculoDoItem(item), item.data ? dataCurta(item.data) : ""]
                .filter(Boolean)
                .join(" · ");
              return (
                <View key={idx} style={s.debRow}>
                  <View style={s.debInfo}>
                    <Text style={s.debLabel}>{identificacaoDoItem(item)}</Text>
                    {contexto ? <Text style={s.debSub}>{contexto}</Text> : null}
                    <Text style={s.debSub}>
                      Total {brl(item.total)}
                      {item.valorPago > 0 ? ` · Pago ${brl(item.valorPago)}` : ""}
                    </Text>
                  </View>
                  {saldoItem > 0 ? (
                    <View style={s.debDireita}>
                      <Text style={[s.debSaldo, { color: C.red }]}>{brl(saldoItem)}</Text>
                      <Text style={[s.debSituacao, { color: C.red }]}>Em aberto</Text>
                    </View>
                  ) : (
                    <View style={s.debDireita}>
                      <Text style={[s.debSaldo, { color: C.green }]}>Quitado</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {desconto > 0 ? (
          <View style={s.desconto}>
            <View style={s.descontoRow}>
              <Text style={s.descontoLabel}>Valor sem desconto</Text>
              <Text style={s.descontoValor}>{brl(total + desconto)}</Text>
            </View>
            <View style={s.descontoRow}>
              <Text style={[s.descontoLabel, { color: C.green }]}>
                {varios ? "Descontos aplicados" : "Desconto aplicado"}
              </Text>
              <Text style={[s.descontoValor, { color: C.green }]}>- {brl(desconto)}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.grid}>
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Total</Text>
            <Text style={s.gridValue}>{brl(total)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Pago</Text>
            <Text style={[s.gridValue, { color: C.green }]}>{brl(valorPago)}</Text>
          </View>
          <View style={s.gridDivider} />
          <View style={s.gridCol}>
            <Text style={s.gridLabel}>Saldo</Text>
            <Text style={[s.gridValue, { color: saldo > 0 ? C.red : C.green }]}>{brl(saldo)}</Text>
          </View>
        </View>

        {quitado ? (
          <View style={s.quitado}>
            <Text style={s.quitadoTexto}>Pagamento quitado</Text>
          </View>
        ) : null}

        {historico.length > 0 ? (
          <View>
            <Text style={s.secTitle}>Histórico</Text>
            {historico.map((p) => (
              <View key={p.chave} style={s.histRow}>
                <View style={s.histLinha1}>
                  <Text style={s.histValor}>{brl(p.valor)}</Text>
                  <Text style={s.histForma}>{labelFormaPagamento(p.formaPagamento)}</Text>
                </View>
                {/* Linha própria: na mesma linha do valor, uma observação longa
                    quebrava recuada debaixo da forma de pagamento. */}
                {p.obs ? <Text style={s.histObs}>{p.obs}</Text> : null}
                <Text style={s.histData}>
                  {dataHora(p.data)}
                  {varios ? ` · ${p.origem}` : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={s.footer}>
          <Text style={s.footerText}>{rodapeDoDocumento(config)}</Text>
          <Text style={s.footerGerado}>
            {varios ? "Extrato" : "Comprovante"} gerado em {dataHora(geradoEm)}  ·  {EMITIDO_COM}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
```

### src/components/ClienteSelect.tsx

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Cliente = { id: string; nome: string; telefone: string | null };

/** Texto comparável: sem acento e em minúsculo, para "jose" achar "José". */
function normalizar(txt: string) {
  return txt.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const inputCls =
  "w-full rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

/**
 * Seletor de cliente com campo de busca. Substitui o <select> nativo, que na
 * lista longa da oficina obriga a rolar até achar o nome.
 * No celular abre como painel sobre a tela; no computador, como dropdown.
 */
export default function ClienteSelect({
  clientes,
  value,
  onChange,
  placeholder = "Selecionar cliente...",
  emptyLabel,
  disabled = false,
}: {
  clientes: Cliente[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Quando informado, "sem cliente" vira uma opção de verdade na lista. */
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [destaque, setDestaque] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  const selecionado = clientes.find((c) => c.id === value) ?? null;

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return clientes;
    const digitos = termo.replace(/\D/g, "");
    return clientes.filter((c) => {
      if (normalizar(c.nome).includes(termo)) return true;
      if (!digitos || !c.telefone) return false;
      return c.telefone.replace(/\D/g, "").includes(digitos);
    });
  }, [clientes, busca]);

  // A opção "sem cliente" só aparece enquanto ninguém está buscando um nome.
  const mostrarVazio = !!emptyLabel && !busca.trim();
  const opcoes: { id: string; nome: string; telefone: string | null }[] = mostrarVazio
    ? [{ id: "", nome: emptyLabel, telefone: null }, ...filtrados]
    : filtrados;

  function abrir() {
    if (disabled) return;
    setBusca("");
    const idx = opcoes.findIndex((o) => o.id === value);
    setDestaque(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function fechar() {
    setOpen(false);
    setBusca("");
  }

  function escolher(id: string) {
    onChange(id);
    fechar();
  }

  useEffect(() => {
    if (!open) return;
    buscaRef.current?.focus();
  }, [open]);

  // Fecha ao tocar/clicar fora — no celular o painel tem fundo escurecido próprio.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) fechar();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  // Mantém o item destacado visível ao navegar pelo teclado.
  useEffect(() => {
    if (!open) return;
    const item = listaRef.current?.children[destaque] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [destaque, open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      fechar();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!opcoes.length) return;
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setDestaque((d) => (d + passo + opcoes.length) % opcoes.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const alvo = opcoes[destaque];
      if (alvo) escolher(alvo.id);
    }
  }

  const rotulo = selecionado
    ? `${selecionado.nome}${selecionado.telefone ? ` · ${selecionado.telefone}` : ""}`
    : emptyLabel ?? placeholder;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? fechar() : abrir())}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          inputCls +
          " flex items-center justify-between gap-2 bg-superficie text-left disabled:bg-superficie-2 disabled:text-tinta-3"
        }
      >
        <span className={"truncate " + (selecionado ? "text-tinta" : "text-tinta-3")}>{rotulo}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 text-tinta-3" aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* Fundo só no celular, onde o painel flutua sobre o formulário. */}
          <div onClick={fechar} className="fixed inset-0 z-40 bg-black/30 sm:hidden" aria-hidden="true" />
          <div
            className="fixed inset-x-3 top-14 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-linha bg-superficie shadow-xl sm:absolute sm:inset-x-0 sm:top-full sm:z-30 sm:mt-1 sm:max-h-80 sm:shadow-lg"
            role="dialog"
          >
            <div className="border-b border-linha p-2">
              <div className="relative">
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={buscaRef}
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setDestaque(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Buscar por nome ou telefone..."
                  aria-label="Buscar cliente"
                  className={inputCls + " pl-9"}
                />
              </div>
            </div>

            <ul ref={listaRef} role="listbox" className="flex-1 overflow-y-auto overscroll-contain">
              {opcoes.map((o, i) => {
                const ativo = o.id === value;
                return (
                  <li key={o.id || "__vazio"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={ativo}
                      onMouseEnter={() => setDestaque(i)}
                      onClick={() => escolher(o.id)}
                      className={
                        "flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm min-h-[44px] " +
                        (i === destaque ? "bg-brand-50 " : "") +
                        (ativo ? "font-semibold text-brand-texto" : "text-tinta-2")
                      }
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{o.nome}</span>
                        {o.telefone && (
                          <span className="block truncate text-xs text-tinta-3">{o.telefone}</span>
                        )}
                      </span>
                      {ativo && (
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          className="shrink-0" aria-hidden="true"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })}
              {opcoes.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-tinta-3">
                  Nenhum cliente encontrado para “{busca.trim()}”.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
```

## 4.6 Painel financeiro (faturamento, lucro, ponto de equilíbrio)

São duas telas:

- **Faturamento e lucro**: aba **Resultado** do Dashboard, função `Resultado` em `src/app/page.tsx` (**parte 2**). Mostra OS entregues, faturado, ticket médio, recebido, lucro bruto e lucro líquido, DRE simplificado e distribuição no período.
- **Ponto de equilíbrio**: `src/app/despesas/page.tsx` ("Controle de gastos"), que entrega os dados a `components/despesas/ControleDeGastos.tsx`. O painel é o `PainelEquilibrio`, ao lado do "Por categoria".

Os modais do Controle de gastos (lançar, pagar, despesas fixas, categorias) só abrem ao clicar e não estão no pacote.

### src/app/despesas/page.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
import { exigirDono } from "@/lib/auth";
import { bancoDaOficina } from "@/lib/db-oficina";
import { mesDeGastos, pontoDeEquilibrio, resumirMes } from "@/lib/despesas";
import { chaveMes, ehPeriodoAtual } from "@/lib/periodo";
import { ControleDeGastos } from "@/components/despesas/ControleDeGastos";

/**
 * Controle de gastos do mês (`?mes=AAAA-MM`).
 *
 * Componente de servidor porque o ponto de equilíbrio cruza gasto com faturamento das
 * OS — dado que o operador não pode ver e que não faria sentido buscar do navegador. A
 * interação toda mora no componente de tela, que recarrega com `router.refresh()`.
 *
 * Abrir o mês é o que materializa os lançamentos das despesas fixas dele; ver
 * `lib/despesas.garantirLancamentos` para o porquê de a leitura poder escrever.
 */
export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  // [removido: autenticação e busca de dados] — só o dono abre esta tela. O servidor lia o mês
  // (?mes=AAAA-MM), gerava os lançamentos das despesas fixas e calculava o ponto de equilíbrio.
  // Props entregues ao componente: dados fictícios `despesas`.

  return (
    <ControleDeGastos
      mes={chaveMes(janela.inicio)}
      competencia={janela.inicio}
      rotuloMes={janela.label}
      ehMesAtual={ehPeriodoAtual(janela)}
      lancamentos={lancamentos}
      cancelados={cancelados}
      categorias={categorias}
      regras={regras}
      equilibrio={equilibrio}
    />
  );
}
```

### src/components/despesas/ControleDeGastos.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { chaveMes, chaveMesDeslocada } from "@/lib/periodo";
import {
  custoOperacionalMensal,
  labelFormaPagamento,
  resumirMes,
  situacaoDe,
  valorEfetivo,
  type Situacao,
} from "@/lib/despesas-comum";
import { Aviso, Botao, ChipCategoria, Selecao } from "./campos";
import { FaixaMetricas, Metrica as MetricaUI, Vazio as VazioUI } from "@/components/ui/Dados";
import { useConfirmar } from "@/components/ui/Avisos";
import { Avancar, Mais, Voltar } from "@/components/ui/Icones";
import { enviar, mensagemDoErro } from "./api";
import { ModalCategorias } from "./ModalCategorias";
import { ModalExcluirParcela } from "./ModalExcluirParcela";
import { ModalFixar } from "./ModalFixar";
import { ModalFixas } from "./ModalFixas";
import { ModalGasto } from "./ModalGasto";
import { ModalPagamento } from "./ModalPagamento";
import type { Categoria, Equilibrio, Lancamento, Regra } from "./tipos";

const SITUACOES: Record<Situacao, { label: string; chip: string }> = {
  vencida: { label: "Vencida", chip: "bg-perigo-fraco text-perigo" },
  "vence-breve": { label: "Vence em breve", chip: "bg-atencao-fraco text-atencao" },
  "a-vencer": { label: "A vencer", chip: "bg-superficie-3 text-tinta-3" },
  paga: { label: "Paga", chip: "bg-ok-fraco text-ok" },
};

type Filtro = "todos" | "aberto" | "pago";

/** Plural em uma expressão só. Quebrar a palavra em duas linhas de JSX insere um
 *  espaço no meio dela, e a tela mostrava "7 lançamento s". */
function plural(n: number, palavra: string): string {
  return n === 1 ? palavra : `${palavra}s`;
}

export function ControleDeGastos({
  mes,
  competencia,
  rotuloMes,
  ehMesAtual,
  lancamentos,
  cancelados,
  categorias,
  regras,
  equilibrio,
}: {
  mes: string;
  /** 1º dia do mês em tela — vira o vencimento sugerido ao lançar em mês passado. */
  competencia: Date;
  rotuloMes: string;
  ehMesAtual: boolean;
  lancamentos: Lancamento[];
  cancelados: Lancamento[];
  categorias: Categoria[];
  regras: Regra[];
  equilibrio: Equilibrio;
}) {
  const router = useRouter();
  const confirmar = useConfirmar();

  const [modal, setModal] = useState<
    | { tipo: "gasto"; gasto: Lancamento | null }
    | { tipo: "pagamento"; gasto: Lancamento }
    | { tipo: "fixar"; gasto: Lancamento }
    | { tipo: "excluirParcela"; gasto: Lancamento }
    | { tipo: "fixas" }
    | { tipo: "categorias" }
    | null
  >(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Reclassificar é um modo, não o padrão: as caixas de seleção em toda linha deixariam
  // a lista mais pesada no celular para uma tarefa que se faz de vez em quando.
  const [reclassificando, setReclassificando] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const resumo = useMemo(() => resumirMes(lancamentos), [lancamentos]);
  const custoOperacional = useMemo(() => custoOperacionalMensal(regras), [regras]);

  const listadas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lancamentos.filter((d) => {
      if (filtro === "aberto" && d.pago) return false;
      if (filtro === "pago" && !d.pago) return false;
      if (categoriaFiltro && d.categoriaId !== categoriaFiltro) return false;
      if (!termo) return true;
      return (
        d.descricao.toLowerCase().includes(termo) ||
        (d.fornecedor ?? "").toLowerCase().includes(termo) ||
        d.categoria.nome.toLowerCase().includes(termo)
      );
    });
  }, [lancamentos, filtro, busca, categoriaFiltro]);

  const totalListado = listadas.reduce((s, d) => s + valorEfetivo(d), 0);
  const emAberto = lancamentos.filter((d) => !d.pago).length;
  const fixasAtivas = regras.filter((r) => r.ativa).length;

  // A seleção sobrevive a mudar o filtro — dá para juntar o resultado de várias buscas.
  // O recorte para o mês em tela é o que importa: navegar de mês preserva o estado do
  // componente, e sem isto o "Mover" levaria junto o que ficou marcado no mês anterior,
  // sem ninguém ver. Tudo daqui para baixo usa `marcados`, nunca `selecionados`.
  const marcados = selecionados.filter((id) => lancamentos.some((d) => d.id === id));

  function alternarSelecao(id: string) {
    setSelecionados((atuais) =>
      atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id]
    );
  }

  function sairDaReclassificacao() {
    setReclassificando(false);
    setSelecionados([]);
  }

  /** Abre a reclassificação já filtrada por uma categoria — o caminho vindo do gráfico. */
  function reclassificarCategoria(categoriaId: string) {
    setCategoriaFiltro(categoriaId);
    setFiltro("todos");
    setSelecionados([]);
    setReclassificando(true);
  }

  /**
   * A lista sai em dois blocos, e não numa lista só com um chip "Fixa" no meio da linha.
   *
   * São duas naturezas de dinheiro e a decisão sobre cada uma é diferente: o fixo é o
   * custo de manter a oficina aberta (só muda renegociando ou cortando a conta), o
   * variável é o gasto daquele mês. Misturados, a única forma de saber quanto era de
   * cada tipo era somar linha a linha.
   */
  const grupos = [
    {
      chave: "fixos",
      label: "Gastos fixos",
      ajuda: "Voltam todo mês — é o custo de manter a oficina aberta",
      itens: listadas.filter((d) => d.recorrenteId),
    },
    {
      chave: "variaveis",
      label: "Gastos variáveis",
      ajuda: "Aconteceram só neste mês",
      itens: listadas.filter((d) => !d.recorrenteId),
    },
  ].filter((g) => g.itens.length > 0);

  function fechar() {
    setModal(null);
    router.refresh();
  }

  async function comAcao(chave: string, fn: () => Promise<unknown>) {
    // [removido: chamada à API] — executava a ação e recarregava a página (router.refresh).
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {modal?.tipo === "gasto" && (
        <ModalGasto
          gasto={modal.gasto}
          categorias={categorias}
          mesPadrao={ehMesAtual ? new Date() : competencia}
          onFechar={() => setModal(null)}
          onSalvo={fechar}
          onFixar={(gasto) => setModal({ tipo: "fixar", gasto })}
        />
      )}
      {modal?.tipo === "pagamento" && (
        <ModalPagamento gasto={modal.gasto} onFechar={() => setModal(null)} onSalvo={fechar} />
      )}
      {modal?.tipo === "fixar" && (
        <ModalFixar gasto={modal.gasto} onFechar={() => setModal(null)} onSalvo={fechar} />
      )}
      {modal?.tipo === "excluirParcela" && (
        <ModalExcluirParcela
          gasto={modal.gasto}
          onFechar={() => setModal(null)}
          onExcluido={fechar}
        />
      )}
      {modal?.tipo === "fixas" && (
        <ModalFixas
          regras={regras}
          categorias={categorias}
          onFechar={() => setModal(null)}
          onMudou={() => router.refresh()}
        />
      )}
      {modal?.tipo === "categorias" && (
        <ModalCategorias
          categorias={categorias}
          onFechar={() => setModal(null)}
          onMudou={() => router.refresh()}
        />
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tinta">Controle de gastos</h1>
          <p className="mt-0.5 text-sm text-tinta-3">
            Tudo o que a oficina paga para funcionar, mês a mês
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lancamentos.length > 0 && (
            <Botao
              variante="secundario"
              onClick={() => (reclassificando ? sairDaReclassificacao() : setReclassificando(true))}
              title="Trocar a categoria de vários gastos de uma vez"
            >
              {reclassificando ? "Sair da reclassificação" : "Reclassificar"}
            </Botao>
          )}
          <Botao variante="secundario" onClick={() => setModal({ tipo: "categorias" })}>
            Categorias
          </Botao>
          <Botao variante="secundario" onClick={() => setModal({ tipo: "fixas" })}>
            Despesas fixas
            {fixasAtivas > 0 && (
              <span className="ml-1 rounded-full bg-superficie-3 px-1.5 text-xs text-tinta-3">
                {fixasAtivas}
              </span>
            )}
          </Botao>
          <Botao onClick={() => setModal({ tipo: "gasto", gasto: null })}><Mais tamanho={16} /> Lançar gasto</Botao>
        </div>
      </div>

      <NavegacaoMes mes={mes} rotulo={rotuloMes} ehMesAtual={ehMesAtual} />

      {erro && (
        <p className="rounded-lg border border-perigo-linha bg-perigo-fraco px-3 py-2 text-sm text-perigo">
          {erro}
        </p>
      )}

      {/* Os quatro números do mês */}
      <FaixaMetricas colunas={4}>
        <MetricaUI
          rotulo="Gastos do mês"
          valor={formatCurrency(resumo.total)}
          sub={`${resumo.quantidade} ${plural(resumo.quantidade, "lançamento")}`}
          tamanho="grande"
        />
        <MetricaUI
          rotulo="Já pago"
          valor={formatCurrency(resumo.pago)}
          sub={
            resumo.total > 0
              ? `${Math.round((resumo.pago / resumo.total) * 100)}% do mês`
              : "nada lançado ainda"
          }
          tamanho="grande"
        />
        <MetricaUI
          rotulo="Em aberto"
          valor={formatCurrency(resumo.aberto)}
          sub={`${emAberto} ${plural(emAberto, "conta")} a pagar`}
          tamanho="grande"
        />
        <MetricaUI
          rotulo="Vencidas"
          valor={formatCurrency(resumo.vencido)}
          sub={`${resumo.vencidas} ${plural(resumo.vencidas, "conta")}`}
          tamanho="grande"
          tom={resumo.vencidas > 0 ? "perigo" : "neutro"}
        />
      </FaixaMetricas>

      <div className="grid gap-4 lg:grid-cols-3">
        <PainelEquilibrio
          equilibrio={equilibrio}
          custoOperacional={custoOperacional}
          fixo={resumo.fixo}
          avulso={resumo.avulso}
        />
        <PorCategoria
          itens={resumo.porCategoria}
          total={resumo.total}
          onReclassificar={reclassificarCategoria}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto rounded-lg bg-superficie-3 p-1 px-4 sm:mx-0 sm:px-1">
          {(
            [
              ["todos", "Todos"],
              ["aberto", "A pagar"],
              ["pago", "Pagos"],
            ] as const
          ).map(([valor, label]) => (
            <button
              key={valor}
              onClick={() => setFiltro(valor)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filtro === valor
                  ? "bg-superficie text-tinta shadow-sm"
                  : "text-tinta-3 hover:text-tinta-2"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição ou fornecedor"
            className="min-w-0 flex-1 rounded-lg border border-linha-forte px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 sm:w-64 sm:flex-none"
          />
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="shrink-0 rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lançamentos */}
      {lancamentos.length === 0 ? (
        <VazioUI
          titulo="Nenhum gasto neste mês"
          texto={
            regras.length === 0
              ? "Comece cadastrando as despesas fixas — aluguel, salários, energia. Elas passam a se lançar sozinhas todo mês."
              : "Lance um gasto avulso ou navegue para outro mês."
          }
          acao={
            regras.length === 0 ? (
              <Botao onClick={() => setModal({ tipo: "fixas" })}>Cadastrar despesas fixas</Botao>
            ) : (
              <Botao onClick={() => setModal({ tipo: "gasto", gasto: null })}>Lançar gasto</Botao>
            )
          }
        />
      ) : listadas.length === 0 ? (
        <VazioUI titulo="Nada com esse filtro" texto="Ajuste a busca ou volte para “Todos”." />
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <div key={grupo.chave}>
              <div className="flex items-start justify-between gap-3 rounded-t-xl border border-linha bg-superficie-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-tinta-2">
                    {grupo.label}
                    <span className="rounded-full bg-superficie/80 px-2 py-0.5 text-xs font-medium text-tinta-2">
                      {grupo.itens.length}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-tinta-3">{grupo.ajuda}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-tinta">
                  {formatCurrency(grupo.itens.reduce((s, d) => s + valorEfetivo(d), 0))}
                </span>
              </div>
              <ul className="divide-y divide-linha overflow-hidden rounded-b-xl border border-t-0 border-linha bg-superficie">
                {grupo.itens.map((d) => (
                  <Linha
                    key={d.id}
                    gasto={d}
                    ocupado={ocupado === d.id}
                    selecionavel={reclassificando}
                    selecionado={marcados.includes(d.id)}
                    onSelecionar={() => alternarSelecao(d.id)}
                    onPagar={() => setModal({ tipo: "pagamento", gasto: d })}
                    onEditar={() => setModal({ tipo: "gasto", gasto: d })}
                    onEstornar={() =>
                      comAcao(d.id, async () => {}) // [removido: chamada à API] — PUT /api/despesas/:id/pagamento { pago: false }
                    }
                    onRemover={async () => {
                      // Parcela com outras depois dela pergunta o alcance; a última
                      // parcela cai na confirmação de sempre, que só tem uma resposta.
                      if (d.parcelamentoId && (d.parcela ?? 0) < (d.parcelas ?? 0)) {
                        setModal({ tipo: "excluirParcela", gasto: d });
                        return;
                      }
                      const ok = await confirmar(
                        d.recorrenteId
                          ? {
                              titulo: `Marcar “${d.descricao}” como não cobrada em ${rotuloMes}?`,
                              texto: "A despesa fixa continua valendo nos outros meses, e dá para trazer de volta depois.",
                              acao: "Não teve este mês",
                            }
                          : {
                              titulo: `Excluir “${d.descricao}”?`,
                              texto: `O lançamento de ${formatCurrency(valorEfetivo(d))} sai do mês. Não há como desfazer.`,
                              acao: "Excluir gasto",
                              perigo: true,
                            }
                      );
                      if (!ok) return;
                      comAcao(d.id, async () => {}); // [removido: chamada à API] — DELETE /api/despesas/:id
                    }}
                  />
                ))}
              </ul>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-linha bg-superficie-2 px-4 py-2.5 text-sm">
            {reclassificando ? (
              <button
                type="button"
                onClick={() =>
                  setSelecionados(
                    listadas.every((d) => marcados.includes(d.id))
                      ? marcados.filter((id) => !listadas.some((d) => d.id === id))
                      : [...new Set([...marcados, ...listadas.map((d) => d.id)])]
                  )
                }
                className="min-h-11 text-brand-texto hover:underline"
              >
                {listadas.every((d) => marcados.includes(d.id))
                  ? "Desmarcar os da lista"
                  : "Selecionar os da lista"}
              </button>
            ) : (
              <span className="text-tinta-3">
                {`${listadas.length} de ${lancamentos.length} ${plural(lancamentos.length, "lançamento")}`}
              </span>
            )}
            <span className="font-semibold text-tinta">{formatCurrency(totalListado)}</span>
          </div>
        </div>
      )}

      {reclassificando && (
        <BarraReclassificar
          selecionados={marcados}
          lancamentos={lancamentos}
          categorias={categorias}
          onLimpar={() => setSelecionados([])}
          onSair={sairDaReclassificacao}
          onPronto={() => {
            setSelecionados([]);
            router.refresh();
          }}
        />
      )}

      {cancelados.length > 0 && (
        <details className="rounded-xl border border-linha bg-superficie px-4 py-3">
          <summary className="cursor-pointer text-sm text-tinta-3">
            {cancelados.length} despesa fixa marcada como “não teve” em {rotuloMes}
          </summary>
          <ul className="mt-3 space-y-2">
            {cancelados.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-tinta-3">
                  {d.descricao} · {formatCurrency(d.valor)}
                </span>
                <button
                  type="button"
                  disabled={ocupado === d.id}
                  onClick={() =>
                    comAcao(d.id, async () => {}) // [removido: chamada à API] — PUT /api/despesas/:id { cancelado: false }
                  }
                  className="shrink-0 rounded-md px-2 py-1 text-xs text-brand-texto hover:bg-brand-50 disabled:opacity-50"
                >
                  Trazer de volta
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- pedaços */

function NavegacaoMes({
  mes,
  rotulo,
  ehMesAtual,
}: {
  mes: string;
  rotulo: string;
  ehMesAtual: boolean;
}) {
  const link = (passos: number) => `/despesas?mes=${chaveMesDeslocada(mes, passos)}`;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={link(-1)}
        aria-label="Mês anterior"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
      >
        <Voltar tamanho={16} />
      </Link>
      <span className="min-w-36 text-center text-sm font-semibold text-tinta">{rotulo}</span>
      {/* Avançar é permitido de propósito: ver o que vem pela frente é metade do
          motivo de cadastrar despesa fixa. */}
      <Link
        href={link(1)}
        aria-label="Próximo mês"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta-2 hover:bg-superficie-2 sm:h-9 sm:w-9"
      >
        <Avancar tamanho={16} />
      </Link>
      {!ehMesAtual && (
        <Link
          href={`/despesas?mes=${chaveMes(new Date())}`}
          className="text-xs text-brand-texto hover:underline"
        >
          Mês atual
        </Link>
      )}
    </div>
  );
}

/**
 * Ponto de equilíbrio.
 *
 * O número que o dono realmente quer: com esta margem, quanto precisa sair da oficina
 * para pagar as contas do mês. Sem histórico de margem o painel não inventa um valor —
 * diz o que falta para poder calcular.
 */
function PainelEquilibrio({
  equilibrio: e,
  custoOperacional,
  fixo,
  avulso,
}: {
  equilibrio: Equilibrio;
  custoOperacional: number;
  fixo: number;
  avulso: number;
}) {
  const cobriu = e.necessario !== null && e.faturado >= e.necessario;
  const progresso =
    e.necessario && e.necessario > 0 ? Math.min(100, (e.faturado / e.necessario) * 100) : 0;

  return (
    <div className="rounded-xl border border-linha bg-superficie p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-tinta">Ponto de equilíbrio</h2>
          <p className="text-xs text-tinta-3">Quanto precisa faturar para cobrir os gastos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-tinta-3">Custo operacional</p>
          <p className="font-semibold text-tinta">{formatCurrency(custoOperacional)}/mês</p>
        </div>
      </div>

      {e.necessario === null ? (
        <p className="mt-4 rounded-lg border border-linha bg-superficie-2 px-3 py-3 text-sm text-tinta-3">
          Ainda não dá para calcular: é preciso ter OS entregues nos últimos três meses para
          saber a margem média da oficina.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-tinta-2">
            Com margem de <strong>{Math.round((e.margem ?? 0) * 100)}%</strong>, a oficina precisa
            faturar{" "}
            <strong className="text-tinta">{formatCurrency(e.necessario)}</strong> neste mês.
          </p>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-superficie-3">
            <div
              className={cn("h-full rounded-full", cobriu ? "bg-ok" : "bg-brand-600")}
              style={{ width: `${progresso}%` }}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
            <span className="text-tinta-3">
              {`Faturado ${formatCurrency(e.faturado)} · ${e.osNoMes} ${plural(e.osNoMes, "OS entregue")}`}
            </span>
            <span className={cn("font-medium", cobriu ? "text-ok" : "text-perigo")}>
              {cobriu
                ? `Coberto — sobra ${formatCurrency(e.resultado)} de lucro`
                : `Faltam ${formatCurrency(e.falta ?? 0)}`}
            </span>
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-linha pt-3 text-sm sm:grid-cols-3">
        {/* Mesmas palavras dos dois blocos da lista — "avulso" e "variável" para a mesma
            coisa faria parecer que são dois números diferentes. */}
        <Metrica rotulo="Gastos fixos" valor={formatCurrency(fixo)} />
        <Metrica rotulo="Gastos variáveis" valor={formatCurrency(avulso)} />
        <Metrica
          rotulo="Resultado do mês"
          valor={formatCurrency(e.resultado)}
          cor={e.resultado >= 0 ? "text-ok" : "text-perigo"}
          ajuda="lucro bruto das OS − gastos"
        />
      </div>
    </div>
  );
}

function Metrica({
  rotulo,
  valor,
  cor,
  ajuda,
}: {
  rotulo: string;
  valor: string;
  cor?: string;
  ajuda?: string;
}) {
  return (
    <div>
      <p className="text-xs text-tinta-3">{rotulo}</p>
      <p className={cn("mt-0.5 font-semibold tabular-nums", cor ?? "text-tinta")}>{valor}</p>
      {ajuda && <p className="text-xs text-tinta-3">{ajuda}</p>}
    </div>
  );
}

/**
 * Gasto por categoria — e a porta de entrada para consertar a classificação.
 *
 * Quem olha isto e vê "Outros: R$ 3.200" já está fazendo a pergunta certa; tocar na
 * barra abre a lista filtrada por essa categoria, em modo de reclassificação.
 */
function PorCategoria({
  itens,
  total,
  onReclassificar,
}: {
  itens: { id: string; nome: string; cor: string; valor: number }[];
  total: number;
  onReclassificar: (categoriaId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-linha bg-superficie p-5">
      <h2 className="font-semibold text-tinta">Por categoria</h2>
      {itens.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-3">Nada lançado neste mês.</p>
      ) : (
        <>
          <ul className="mt-3 space-y-1">
            {itens.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onReclassificar(c.id)}
                  title={`Ver e reclassificar os gastos de ${c.nome}`}
                  className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-superficie-2"
                >
                  <span className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-tinta-2">{c.nome}</span>
                    <span className="shrink-0 font-medium tabular-nums text-tinta">
                      {formatCurrency(c.valor)}
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-superficie-3">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${total > 0 ? (c.valor / total) * 100 : 0}%`,
                        backgroundColor: c.cor,
                      }}
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-snug text-tinta-3">
            Toque numa categoria para ver o que caiu nela e trocar em lote — é o jeito de
            esvaziar o “Outros” sem abrir gasto por gasto.
          </p>
        </>
      )}
    </div>
  );
}

/**
 * A barra do modo reclassificar.
 *
 * Fica grudada no rodapé: no celular a seleção acontece rolando a lista, e um botão de
 * aplicar lá no topo obrigaria a rolar de volta a cada lote.
 */
function BarraReclassificar({
  selecionados,
  lancamentos,
  categorias,
  onLimpar,
  onSair,
  onPronto,
}: {
  selecionados: string[];
  lancamentos: Lancamento[];
  categorias: Categoria[];
  onLimpar: () => void;
  onSair: () => void;
  onPronto: () => void;
}) {
  const [categoriaId, setCategoriaId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const escolhidos = lancamentos.filter((d) => selecionados.includes(d.id));
  const deRegra = escolhidos.filter((d) => d.recorrenteId).length;
  const ativas = categorias.filter((c) => c.ativa);

  async function mover() {
    // [removido: chamada à API] — PUT /api/despesas/reclassificar { ids, categoriaId }
  }

  return (
    <div className="sticky bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-4 border-t border-linha bg-superficie/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.07)] backdrop-blur sm:-mx-6 sm:px-6 md:bottom-0">
      {selecionados.length === 0 ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-tinta-3">Marque os gastos que foram para a categoria errada.</span>
          <Botao variante="secundario" className="shrink-0" onClick={onSair}>
            Sair
          </Botao>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-tinta">
              {selecionados.length}{" "}
              {selecionados.length === 1 ? "gasto selecionado" : "gastos selecionados"}
            </span>
            <button
              type="button"
              onClick={onLimpar}
              className="text-xs text-tinta-3 hover:text-tinta-2"
            >
              Limpar seleção
            </button>
          </div>

          <div className="flex gap-2">
            <Selecao
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="min-w-0 flex-1"
              aria-label="Categoria de destino"
            >
              <option value="">Mover para...</option>
              {ativas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Selecao>
            <Botao
              className="shrink-0"
              disabled={salvando || !categoriaId}
              onClick={mover}
            >
              {salvando ? "Movendo..." : "Mover"}
            </Botao>
          </div>

          {deRegra > 0 && (
            <p className="text-xs leading-snug text-atencao">
              {deRegra === 1
                ? "1 dos selecionados vem de despesa fixa: a troca vale só para este mês."
                : `${deRegra} dos selecionados vêm de despesa fixa: a troca vale só para este mês.`}{" "}
              Para mudar de vez, edite a despesa fixa.
            </p>
          )}

          <Aviso>{erro}</Aviso>
        </div>
      )}
    </div>
  );
}

function Linha({
  gasto: d,
  ocupado,
  selecionavel,
  selecionado,
  onSelecionar,
  onPagar,
  onEditar,
  onEstornar,
  onRemover,
}: {
  gasto: Lancamento;
  ocupado: boolean;
  /** Modo reclassificar: a linha vira caixa de seleção e as ações saem de cena. */
  selecionavel: boolean;
  selecionado: boolean;
  onSelecionar: () => void;
  onPagar: () => void;
  onEditar: () => void;
  onEstornar: () => void;
  onRemover: () => void;
}) {
  const situacao = situacaoDe(d);
  const diferenca = d.pago && d.valorPago !== null ? d.valorPago - d.valor : 0;

  const info = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-tinta">{d.descricao}</span>
        <ChipCategoria nome={d.categoria.nome} cor={d.categoria.cor} />
        {d.parcela !== null && d.parcelas !== null && (
          <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs font-medium tabular-nums text-tinta-2">
            Parcela {d.parcela}/{d.parcelas}
          </span>
        )}
        {/* O antigo chip "Fixa" saiu daqui: agora quem diz isso é o bloco em que a
            linha está, e repetir em toda linha só engordava a lista no celular. */}
        <span
          className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SITUACOES[situacao].chip)}
        >
          {SITUACOES[situacao].label}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-tinta-3">
        {d.pago && d.pagoEm
          ? `Pago em ${formatDate(d.pagoEm)}${
              labelFormaPagamento(d.formaPagamento)
                ? ` · ${labelFormaPagamento(d.formaPagamento)}`
                : ""
            }`
          : `Vence em ${formatDate(d.vencimento)}`}
        {d.fornecedor ? ` · ${d.fornecedor}` : ""}
      </p>
    </div>
  );

  const valor = (
    <span className="w-24 text-right font-semibold tabular-nums text-tinta">
      {formatCurrency(valorEfetivo(d))}
      {Math.abs(diferenca) >= 0.01 && (
        <span
          className={cn(
            "block text-xs font-normal",
            diferenca > 0 ? "text-perigo" : "text-ok"
          )}
        >
          previsto {formatCurrency(d.valor)}
        </span>
      )}
    </span>
  );

  // A linha inteira é o alvo do toque — um <label> alterna a caixa uma vez só, e no
  // celular acertar 20 quadradinhos de 20px seguidos não seria reclassificar nada.
  if (selecionavel) {
    return (
      <li className={cn("transition-colors", selecionado && "bg-brand-50")}>
        <label className="flex cursor-pointer items-start gap-3 px-4 py-3">
          <input
            type="checkbox"
            checked={selecionado}
            onChange={onSelecionar}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-linha-forte accent-brand-600"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            {info}
            <div className="shrink-0">{valor}</div>
          </div>
        </label>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      {info}

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {valor}

        {d.pago ? (
          <Botao variante="secundario" tamanho="denso" disabled={ocupado} onClick={onEstornar}>
            Desfazer
          </Botao>
        ) : (
          <Botao variante="sucesso" tamanho="denso" disabled={ocupado} onClick={onPagar}>
            Pagar
          </Botao>
        )}
        <Botao variante="secundario" tamanho="denso" disabled={ocupado} onClick={onEditar}>
          Editar
        </Botao>
        <Botao
          variante="perigo"
          tamanho="denso"
          disabled={ocupado}
          onClick={onRemover}
          title={d.recorrenteId ? "Não teve este mês" : "Excluir"}
        >
          {d.recorrenteId ? "Não teve" : "Excluir"}
        </Botao>
      </div>
    </li>
  );
}
```

### src/components/despesas/campos.tsx

```tsx
"use client";

// Peças de formulário do controle de gastos.
//
// O que era próprio daqui virou primitiva do sistema: os mesmos modais, o mesmo
// campo e o mesmo botão passaram a servir contas a receber, a OS e o cadastro de
// cliente. Este arquivo agora reexporta, para os locais de chamada não trocarem
// de import, e guarda só o que é exclusivo de gastos — a paleta das categorias.

import { useState } from "react";
import { CampoDinheiro } from "@/components/ui/Campos";

export { Campo, Entrada, Selecao, Area, CampoDinheiro, Aviso } from "@/components/ui/Campos";
export { Botao } from "@/components/ui/Botao";
export { Modal } from "@/components/ui/Modal";

/**
 * Campo de dinheiro do controle de gastos.
 *
 * Mantém o nome antigo porque os quatro modais o chamam assim, e continua
 * recebendo/entregando evento com `target.value`. Por baixo é o campo de texto
 * que aceita vírgula: antes era `type="number"`, que recusava `1.250,50` e
 * entregava vazio no envio sem dizer nada.
 */
export function EntradaValor({
  value,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
}) {
  return (
    <CampoDinheiro
      {...props}
      valor={value == null ? "" : String(value)}
      onChange={(canonico) => onChange?.({ target: { value: canonico } })}
    />
  );
}

/** Paleta das categorias. Cores distinguíveis entre si no gráfico do mês. */
export const CORES = [
  "#6366f1", "#0ea5e9", "#14b8a6", "#22c55e", "#84cc16",
  "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#71717a",
];

/** Sorteia a próxima cor da paleta, para duas categorias novas não saírem iguais. */
export function corSeguinte(usadas: number): string {
  return CORES[usadas % CORES.length];
}

export function PaletaCor({ valor, onMudar }: { valor: string; onMudar: (cor: string) => void }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Escolher cor"
        aria-expanded={aberta}
        onClick={() => setAberta((v) => !v)}
        className="h-11 w-11 rounded-lg border border-linha-forte"
        style={{ backgroundColor: valor }}
      />
      {aberta && (
        // Alvos de 32 px: os quadradinhos de 24 px eram difíceis de acertar no dedo.
        <div className="absolute left-0 top-12 z-10 grid w-56 grid-cols-6 gap-1 rounded-xl border border-linha bg-superficie p-2 shadow-lg">
          {CORES.map((cor) => (
            <button
              key={cor}
              type="button"
              aria-label={`Cor ${cor}`}
              onClick={() => {
                onMudar(cor);
                setAberta(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-superficie-2"
            >
              <span className="h-6 w-6 rounded-full" style={{ backgroundColor: cor }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Chip da categoria — a cor é a que o dono escolheu, então vem por style. */
export function ChipCategoria({ nome, cor }: { nome: string; cor: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${cor}1a`, color: cor }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} />
      {nome}
    </span>
  );
}
```

### src/components/despesas/tipos.ts

```ts
// Formato dos dados que a página (servidor) entrega aos componentes de tela.
// Datas atravessam a fronteira do RSC como Date — não são reconvertidas na mão.

export type Categoria = {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativa: boolean;
};

export type CategoriaChip = Pick<Categoria, "id" | "nome" | "cor">;

export type Lancamento = {
  id: string;
  categoriaId: string;
  recorrenteId: string | null;
  competencia: Date;
  descricao: string;
  valor: number;
  valorPago: number | null;
  fornecedor: string | null;
  vencimento: Date;
  pago: boolean;
  pagoEm: Date | null;
  formaPagamento: string | null;
  observacao: string | null;
  cancelado: boolean;
  /** Compra dividida: as parcelas compartilham o id; `parcela` de `parcelas` é o "2/3". */
  parcelamentoId: string | null;
  parcela: number | null;
  parcelas: number | null;
  categoria: CategoriaChip;
};

export type Regra = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: number;
  fornecedor: string | null;
  diaVencimento: number;
  periodicidade: string;
  inicio: Date;
  fim: Date | null;
  ativa: boolean;
  observacao: string | null;
  categoria: CategoriaChip;
};

export type Equilibrio = {
  custoDoMes: number;
  faturado: number;
  lucroBruto: number;
  resultado: number;
  margem: number | null;
  necessario: number | null;
  falta: number | null;
  osNoMes: number;
  osNaMargem: number;
};
```

### src/lib/despesas-comum.ts

```ts
// Controle de gastos — as regras que não precisam do banco.
//
// Separado de `despesas.ts` porque os modais da tela importam daqui: qualquer import
// que passe por `lib/prisma` arrasta o cliente Prisma para o bundle do navegador.
// Aqui só entra o que roda nos dois lados.

import {
  competenciaDe,
  competenciaDeslocada,
  diaDaCompetencia,
  janelaHoje,
  mesesEntre,
} from "@/lib/periodo";

export const PERIODICIDADES = [
  { value: "MENSAL", label: "Todo mês", passo: 1 },
  { value: "BIMESTRAL", label: "A cada 2 meses", passo: 2 },
  { value: "TRIMESTRAL", label: "A cada 3 meses", passo: 3 },
  { value: "SEMESTRAL", label: "A cada 6 meses", passo: 6 },
  { value: "ANUAL", label: "Uma vez por ano", passo: 12 },
] as const;

export type Periodicidade = (typeof PERIODICIDADES)[number]["value"];

export const FORMAS_PAGAMENTO_DESPESA = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "BOLETO", label: "Boleto" },
  { value: "DEBITO_AUTOMATICO", label: "Débito automático" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
] as const;

export function labelPeriodicidade(valor: string): string {
  return PERIODICIDADES.find((p) => p.value === valor)?.label ?? valor;
}

export function labelFormaPagamento(valor: string | null): string | null {
  if (!valor) return null;
  return FORMAS_PAGAMENTO_DESPESA.find((f) => f.value === valor)?.label ?? valor;
}

function passoDe(periodicidade: string): number {
  return PERIODICIDADES.find((p) => p.value === periodicidade)?.passo ?? 1;
}

// ─── Geração dos lançamentos a partir das regras ──────────────────────────────

type RegraGeradora = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: number;
  fornecedor: string | null;
  diaVencimento: number;
  periodicidade: string;
  inicio: Date;
  fim: Date | null;
  ativa: boolean;
};

/**
 * O mês cai no passo da periodicidade, contado a partir do início?
 *
 * O passo conta desde o mês de início, não desde janeiro: um IPVA que começa em março
 * cai em março do ano seguinte, e não em janeiro.
 *
 * Separado de `regraValeNoMes` porque a tela precisa responder isso para uma regra que
 * ainda não existe — ao transformar um gasto avulso em despesa fixa, é o que diz quais
 * lançamentos dos meses seguintes a regra vai cobrir.
 */
export function mesNoPasso(inicio: Date, periodicidade: string, competencia: Date): boolean {
  const desdeInicio = mesesEntre(competenciaDe(inicio), competencia);
  if (desdeInicio < 0) return false;
  return desdeInicio % passoDe(periodicidade) === 0;
}

/** A regra produz lançamento neste mês? */
export function regraValeNoMes(regra: RegraGeradora, competencia: Date): boolean {
  if (!regra.ativa) return false;
  if (regra.fim && mesesEntre(competenciaDe(regra.fim), competencia) > 0) return false;
  return mesNoPasso(regra.inicio, regra.periodicidade, competencia);
}

/** Todas as competências (1º dia de cada mês) tocadas por um intervalo. */
export function competenciasDoIntervalo(inicio: Date, fim: Date): Date[] {
  const meses: Date[] = [];
  let cursor = competenciaDe(inicio);
  const ultimo = competenciaDe(fim);
  // Teto de segurança: um intervalo absurdo não vira milhares de linhas no banco.
  for (let i = 0; cursor <= ultimo && i < 36; i++) {
    meses.push(cursor);
    cursor = competenciaDe(new Date(cursor.getTime() + 40 * 86_400_000));
  }
  return meses;
}

// ─── Parcelamento ─────────────────────────────────────────────────────────────

/**
 * Compra dividida em parcelas — "parcelei em 3×, pago toda sexta".
 *
 * Não é despesa fixa: tem começo e fim, e a regra fixa só sabe gerar um lançamento
 * por mês. Vira N gastos avulsos, cada um no mês do seu vencimento — é por isso que o
 * dashboard, que soma por vencimento, já os enxerga sem nada a mais.
 */
export const INTERVALOS_PARCELA = [
  { value: "SEMANAL", label: "Toda semana" },
  { value: "MENSAL", label: "Todo mês" },
] as const;

export type IntervaloParcela = (typeof INTERVALOS_PARCELA)[number]["value"];

/**
 * Valor e vencimento de cada parcela.
 *
 * A conta é em centavos e a sobra da divisão vai para a última: R$ 100 em 3× dá
 * 33,33 + 33,33 + 33,34, e a soma fecha com o total digitado. Mensal mantém o dia da
 * 1ª parcela, limitado ao último dia do mês (dia 31 cai em 30/04, 28/02).
 */
export function dividirEmParcelas(
  total: number,
  parcelas: number,
  primeiroVencimento: Date,
  intervalo: IntervaloParcela
): { parcela: number; valor: number; vencimento: Date }[] {
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / parcelas);
  const competencia = competenciaDe(primeiroVencimento);
  const dia = Math.round((primeiroVencimento.getTime() - competencia.getTime()) / 86_400_000) + 1;

  return Array.from({ length: parcelas }, (_, i) => ({
    parcela: i + 1,
    valor: (i === parcelas - 1 ? centavos - base * (parcelas - 1) : base) / 100,
    vencimento:
      intervalo === "SEMANAL"
        ? new Date(primeiroVencimento.getTime() + i * 7 * 86_400_000)
        : diaDaCompetencia(competenciaDeslocada(competencia, i), dia),
  }));
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

/** O que a oficina realmente desembolsou num lançamento — previsto até ser pago. */
export function valorEfetivo(d: { valor: number; valorPago: number | null; pago: boolean }): number {
  return d.pago ? d.valorPago ?? d.valor : d.valor;
}

export type Situacao = "paga" | "vencida" | "vence-breve" | "a-vencer";

export function situacaoDe(
  d: { pago: boolean; vencimento: Date | string },
  agora = new Date()
): Situacao {
  if (d.pago) return "paga";
  const hoje = janelaHoje(agora).inicio;
  const dias = Math.floor((new Date(d.vencimento).getTime() - hoje.getTime()) / 86_400_000);
  if (dias < 0) return "vencida";
  if (dias <= 5) return "vence-breve";
  return "a-vencer";
}

type LancamentoResumivel = {
  valor: number;
  valorPago: number | null;
  pago: boolean;
  vencimento: Date;
  recorrenteId: string | null;
  categoria: { id: string; nome: string; cor: string };
};

export function resumirMes(lancamentos: LancamentoResumivel[], agora = new Date()) {
  let total = 0;
  let pago = 0;
  let aberto = 0;
  let vencido = 0;
  let vencidas = 0;
  let fixo = 0;
  let avulso = 0;

  // O id vai junto porque a tela filtra por categoria a partir daqui — é o caminho de
  // quem olha "Outros: R$ 3.200" no gráfico e quer ver e corrigir o que caiu ali.
  const porCategoria = new Map<string, { id: string; nome: string; cor: string; valor: number }>();

  for (const d of lancamentos) {
    const efetivo = valorEfetivo(d);
    total += efetivo;
    if (d.pago) pago += efetivo;
    else {
      aberto += efetivo;
      if (situacaoDe(d, agora) === "vencida") {
        vencido += efetivo;
        vencidas += 1;
      }
    }
    if (d.recorrenteId) fixo += efetivo;
    else avulso += efetivo;

    const atual = porCategoria.get(d.categoria.id);
    if (atual) atual.valor += efetivo;
    else porCategoria.set(d.categoria.id, { ...d.categoria, valor: efetivo });
  }

  return {
    total,
    pago,
    aberto,
    vencido,
    vencidas,
    fixo,
    avulso,
    quantidade: lancamentos.length,
    porCategoria: [...porCategoria.values()].sort((a, b) => b.valor - a.valor),
  };
}

// ─── Custo operacional e ponto de equilíbrio ─────────────────────────────────

/**
 * Custo operacional mensal: o que a oficina paga só para continuar aberta, vindo das
 * REGRAS e não dos lançamentos. Conta a fatia mensal das contas que não são mensais
 * (o IPVA anual entra como 1/12), porque é assim que ele serve para decidir preço.
 */
export function custoOperacionalMensal(regras: { valor: number; periodicidade: string; ativa: boolean }[]): number {
  return regras
    .filter((r) => r.ativa)
    .reduce((soma, r) => soma + r.valor / passoDe(r.periodicidade), 0);
}
```

---

## Observações

### Onde está cada tela pedida

| Pedido | Arquivo real | Observação |
|---|---|---|
| Pátio | `src/app/page.tsx` (aba **Operação**, lista "Pátio") e `src/app/os/page.tsx` (aba "Pátio", rota `/os?status=patio`) | Não existe uma rota `/patio`. A versão com dias parado (pílula `.idade`) é a do Dashboard. |
| Orçamento e conversão em OS | `src/app/orcamentos/[id]/page.tsx` | A conversão é o botão verde **Converter em OS**. Antes de converter aparece uma confirmação do `useConfirmar` (`ui/Avisos.tsx`); depois, o app abre a OS nova. |
| OS aberta | `src/app/os/[id]/page.tsx` | Fotos em `src/components/Fotos.tsx`. Peças e mão de obra estão na tabela "Itens e serviços" do documento. |
| Documento da OS (tela) | O bloco `.documento` dentro de `src/app/os/[id]/page.tsx`, com o cabeçalho em `CabecalhoDocumento.tsx` | **A imagem do WhatsApp não é um print da tela.** Ela sai do PDF (`OSPdfDocument.tsx`), convertido em PNG por `lib/pdf-para-imagem.ts` (pdf.js, escala 3x). Os dois layouts são parecidos, mas o PDF usa Helvetica e uma paleta própria (`#18181b`, `#52525b`, `#e4e4e7`…). |
| Fiado / contas a receber | `src/app/contas-receber/page.tsx` | As faixas de atraso são os cartões `FaixaCard` (0 a 15, 16 a 30, 31 a 60 e mais de 60 dias), com as classes `.idade-1` a `.idade-4`. |
| Painel financeiro | `src/app/page.tsx` (aba **Resultado**) e `src/app/despesas/page.tsx` com `components/despesas/ControleDeGastos.tsx` | O ponto de equilíbrio é o `PainelEquilibrio`, dentro de `ControleDeGastos.tsx`. |

Os caminhos citados no pedido também são outros: `LogoBoxOS.tsx` fica em `src/components/marca/`, e `Icones.tsx` e `Botao.tsx` ficam em `src/components/ui/`.

### Stack e dependências visuais

- **Next.js 16** (App Router), **React 19**, TypeScript.
- **Tailwind CSS 3.4**, configurado em `tailwind.config.ts`. **Não existe bloco `@theme`**: isso é do Tailwind 4, e o projeto está no 3.
- `clsx` + `tailwind-merge`, combinados na função `cn()` de `lib/utils.ts`.
- **Fonte:** Poppins, pesos 600 e 700, via `next/font/google`, e só na logo e nos `h1`. O resto do texto usa a fonte do sistema (`ui-sans-serif, system-ui…`). Fora do Next, carregue a Poppins pelo Google Fonts e defina `--fonte-marca`.
- **Ícones:** SVGs próprios (`ui/Icones.tsx`), com traço 2 e `currentColor`. Não há biblioteca de ícones. `CopiarVeiculo`, `BaixarComprovante` e `Fotos` trazem alguns SVGs embutidos.
- **Gráficos:** nenhuma biblioteca. As barras são `div`s com largura em %: "Distribuição no período" no Dashboard, "Por categoria" e a barra do ponto de equilíbrio no Controle de gastos.
- **PDF:** `@react-pdf/renderer` 4.5. **PDF em imagem:** `pdfjs-dist` 6.3, que precisa do worker em `/pdfjs/pdf.worker.min.mjs`.
- **Animações do próprio app:** só `animate-pulse` e `.esqueleto` (carregamento), a gaveta do menu (`drawer-in`, 0,2 s), `blur-sm` na "Visão interna" escondida e `transition-colors`. O vídeo pode criar as suas sem conflito.

### Tokens e tema

- Os tokens são trios RGB sem vírgula (`--brand-600: 242 169 0`). Use `rgb(var(--brand-600))`, ou `rgb(var(--brand-600) / 0.2)` com transparência.
- Laranja da marca: `#F2A900`. Grafite: `#1E2329`. Texto sobre o laranja é escuro (`brand-fg` = `#18181B`), nunca branco. Texto **na cor** da marca usa `brand-texto`: `#966900` no tema claro e `#F2A900` no escuro.
- Tema escuro: atributo `data-tema="escuro"` no `<html>`, ou `prefers-color-scheme: dark` quando não há atributo. Os componentes não usam `dark:`; só as variáveis mudam.
- Os documentos usam a cor da oficina (`--doc-cor` e `--doc-texto`), escrita por `estiloDoDocumento()`. O padrão é o próprio laranja boxOS.

### Logo

- No app, use `LogoBoxOS` / `SimboloBoxOS` / `IconeBoxOS`, que estão em `LogoBoxOS.tsx`.
- **Cuidado:** nos SVGs horizontais de `public/brand/`, o "boxOS" é `<text font-family="Poppins">`, e não um contorno. Num editor de vídeo sem a Poppins instalada, o texto aparece em outra fonte. Instale a Poppins Bold ou converta o texto em curvas.
- O símbolo tem proporção 70:57. O ícone do app é o símbolo sobre um quadrado grafite com cantos de raio 14/64.

### O que foi removido ou não incluído

- **Removido das telas** (comentários `// [removido: …]`): chamadas `fetch` às rotas `/api/...`, consultas Prisma das páginas de servidor, autenticação (`exigirOficina`, `exigirDono`, logout), envio de fotos e validação dos modais. JSX, classes e estrutura ficaram intactos. Alguns `import` sem uso continuam no topo dos arquivos.
- **Hooks e componentes citados, mas sem arquivo no pacote:**

  | Hook ou componente | O que faz | Valor a usar no vídeo |
  |---|---|---|
  | `usePodeFinanceiro()`, `usePodeExcluir()` (`UsuarioProvider`) | Devolvem `boolean` | `true` (visão do dono) |
  | `useConfiguracao()`, `carregarConfiguracao()` | Devolvem a `Configuracao` | Bloco `configuracao` dos dados fictícios |
  | `usePedirSaida()` (`SaidaSegura`) | Confirma a saída com formulário preenchido | Pode ignorar |
  | `NotificacaoSino` (`ui/Notificacoes`) | Sino de avisos do menu | Pode ignorar |
  | `SeletorTema` (`ui/Tema`) | Três botões Claro / Automático / Escuro no rodapé do menu | Pode ignorar |

- Também ficaram de fora:
  - os modais do Controle de gastos (`ModalGasto`, `ModalPagamento`, `ModalFixar`, `ModalFixas`, `ModalCategorias` e `ModalExcluirParcela`), que só aparecem ao clicar;
  - `OrcamentoPdfDocument.tsx`, o PDF do orçamento, que tem a mesma estrutura do PDF da OS (incluído) com título "Orçamento" e validade;
  - as libs técnicas `foto-pdf`, `image-compress`, `tempo-limite` e `permissoes`.
- **Do `constants.ts`, a parte 1 traz só `corStatus()` e `OS_STATUS`, como pedido.** O restante que as telas usam, em resumo:

  | Constante | Valores |
  |---|---|
  | `labelStatus` (OS) | Aberta, Em andamento, Ag. peça, Entregue, Cancelada |
  | Status do orçamento (`corStatusOrcamento` / `labelStatusOrcamento`) | Pendente (`status-aberta`), Aprovado (`status-entregue`), Recusado (`status-inerte`), Convertido (`status-andamento`) |
  | `corMargem(margem%)` | ≥ 40 → `text-ok`; ≥ 20 → `text-atencao`; abaixo de 20 → `text-perigo`; sem valor → `text-tinta-3` |
  | `margemOS` | `lucroReal / total × 100` |
  | `FORMAS_PAGAMENTO` | Dinheiro, PIX, Cartão de crédito, Cartão de débito, Transferência |
  | `FOTO_TIPOS` | Entrada ("Estado do veículo na chegada"), Serviço ("Peças trocadas, antes e depois"), Saída ("Estado do veículo na entrega") |
  | `anoVeiculo` | "fabricação/modelo", ex.: `2021/2022` |
  | `textoVeiculo` | O texto do botão "Copiar carro": modelo, motor e válvulas na 1ª linha; depois `Ano:`, `Combustível:` e `KM:` |

### Dados fictícios: como usar

- Todos os nomes, placas, telefones, CPFs e valores são **inventados**, e a oficina é "Box 47 Mecânica". Nada veio do banco.
- **"Hoje" é 07/10/2026.** Os dias parado e os dias em atraso foram calculados a partir dessa data. Para o vídeo, fixe `Date.now()` nesse dia, ou os números mudam.
- As datas estão em ISO. Os componentes do Controle de gastos esperam objetos `Date`, então converta com `new Date(...)`.
- As fotos apontam para `/video/fotos/*.jpg`, que **não existem**: coloque imagens próprias nesses caminhos. `configuracao.logoUrl` é `null`, então o cabeçalho do documento sai sem logo; para mostrar uma, use uma logo **fictícia**.
- O mês do painel é **Setembro/2026**, com o Dashboard em `periodo=mes&offset=-1`. Os totais do Dashboard, do DRE e do ponto de equilíbrio fecham entre si; `dashboardResultado.resumoCalculado` traz os números que a tela deve mostrar, para conferência.
- `osAberta` é a OS #1298 do pátio, aberta em detalhe. `orcamento.aposConversao` mostra os campos que mudam depois do clique em **Converter em OS**.

### Segurança

- Nenhum `.env`, chave, token, URL de banco, migration ou código de API entrou no pacote.
- Os arquivos listados **não continham segredos**, e nenhuma linha precisou ser omitida por isso. As rotas internas aparecem só como texto nos comentários de remoção (ex.: `/api/os/:id`), sem domínio.
