# boxOS — pacote visual para o vídeo · parte 3 de 5

**Esta parte:** Orçamento, OS aberta e documento da OS.

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
| **3** ← | `src/app/orcamentos/[id]/page.tsx` | lógica de dados removida | 21,3 KB |
| **3** ← | `src/components/BaixarOrcamento.tsx` | lógica de dados removida | 1,5 KB |
| **3** ← | `src/app/os/[id]/page.tsx` | lógica de dados removida | 43,5 KB |
| **3** ← | `src/components/CabecalhoDocumento.tsx` | lógica de dados removida | 2,2 KB |
| **3** ← | `src/components/Fotos.tsx` | lógica de dados removida | 24,5 KB |
| **3** ← | `src/components/BaixarOS.tsx` | lógica de dados removida | 1,4 KB |
| **3** ← | `src/components/BaixarDocumento.tsx` | íntegro | 10,5 KB |
| **3** ← | `src/lib/formato-download.ts` | íntegro | 1,4 KB |
| **3** ← | `src/components/OSPdfDocument.tsx` | íntegro | 16,7 KB |
| **3** ← | `src/components/TextoFormatadoPdf.tsx` | íntegro | 1,8 KB |
| **3** ← | `src/lib/pdf-para-imagem.ts` | íntegro | 3,9 KB |
| 4 | `src/app/contas-receber/page.tsx` | lógica de dados removida | 31,2 KB |
| 4 | `src/components/BaixarComprovante.tsx` | lógica de dados removida | 4,0 KB |
| 4 | `src/components/ComprovantePagamentoPdfDocument.tsx` | íntegro | 12,5 KB |
| 4 | `src/components/ClienteSelect.tsx` | íntegro | 8,2 KB |
| 4 | `src/app/despesas/page.tsx` | lógica de dados removida | 1,5 KB |
| 4 | `src/components/despesas/ControleDeGastos.tsx` | lógica de dados removida | 33,2 KB |
| 4 | `src/components/despesas/campos.tsx` | íntegro | 3,5 KB |
| 4 | `src/components/despesas/tipos.ts` | íntegro | 1,4 KB |
| 4 | `src/lib/despesas-comum.ts` | íntegro | 8,3 KB |
| 5 | `dados-ficticios.json` | gerado para o vídeo: não existe no repositório | 48,9 KB |

---

## 4.2 Orçamento e conversão em OS

`src/app/orcamentos/[id]/page.tsx`: o orçamento em formato de documento, com a barra de ações (status, Imprimir, Baixar, **Converter em OS**). A "Visão interna" mostra a margem com o valor borrado até clicar em Revelar. Ao converter, aparece a confirmação de `useConfirmar` e o app abre a OS nova; o orçamento passa a mostrar "Este orçamento foi convertido na OS #…" (veja `orcamento.aposConversao` nos dados fictícios).

### src/app/orcamentos/[id]/page.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cn, formatCurrency, formatDate, nomeCliente, telefoneCliente, descricaoVeiculo, ehRascunho } from "@/lib/utils";
import { anoVeiculo, corStatusOrcamento, labelStatusOrcamento, ORCAMENTO_STATUS } from "@/lib/constants";
import { EMITIDO_COM } from "@/lib/configuracao";
import { estiloDoDocumento } from "@/lib/cor-documento";
import { useConfiguracao } from "@/lib/useConfiguracao";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Esqueleto, Metrica } from "@/components/ui/Dados";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Chevron, Olho, Voltar } from "@/components/ui/Icones";
import CopiarVeiculo from "@/components/CopiarVeiculo";
import CabecalhoDocumento from "@/components/CabecalhoDocumento";
import Fotos, { type Foto } from "@/components/Fotos";
import { usePodeFinanceiro, usePodeExcluir } from "@/components/UsuarioProvider";
import { TextoFormatado } from "@/components/ui/TextoFormatado";

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
  const podeFinanceiro = usePodeFinanceiro();
  const podeExcluir = usePodeExcluir();
  const confirmar = useConfirmar();
  const avisar = useAvisar();
  const [orc, setOrc] = useState<Orcamento | null>(null);
  // useConfiguracao(): hook que busca a configuração da oficina na API (não incluído). Dados fictícios: `configuracao`.
  const config = useConfiguracao();
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [erro, setErro] = useState("");
  const [revelado, setRevelado] = useState(false);

  // [removido: busca de dados] — GET /api/orcamentos/:id preenchia `orc`. Dados fictícios: `orcamento`.

  async function changeStatus(status: string) {
    // [removido: chamada à API] — PUT /api/orcamentos/:id { status }
  }

  async function converter() {
    if (!orc) return;
    const ok = await confirmar({
      titulo: `Converter o orçamento #${orc.numero} em OS?`,
      texto: `Uma ordem de serviço nova é aberta com os itens e as fotos deste orçamento, no valor de ${formatCurrency(orc.total)}. O orçamento fica marcado como convertido.`,
      acao: "Converter em OS",
    });
    if (!ok) return;
    // [removido: chamada à API] — POST /api/orcamentos/:id/converter cria a OS (itens e fotos vão
    // junto) e o app abre /os/:id da OS nova. Dados fictícios: `orcamento.aposConversao`.
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: `Excluir o orçamento #${orc?.numero ?? ""}?`,
      texto: "Ele sai do sistema junto com os itens e as fotos. Não há como desfazer.",
      acao: "Excluir orçamento",
      perigo: true,
    });
    if (!ok) return;
    // [removido: chamada à API] — DELETE /api/orcamentos/:id e volta para /orcamentos
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
          {!convertido && podeExcluir && (
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
      {podeFinanceiro && temValores && (
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
        <div
          className="documento print-doc rounded-xl border border-linha bg-superficie text-tinta shadow-sm"
          style={estiloDoDocumento(config?.corDocumento)}
        >
          {/* Cabeçalho da oficina — vem do painel de configurações */}
          <CabecalhoDocumento />

          <div className="px-5 sm:px-8 py-6">
            {/* Número do orçamento e status */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-tinta-3">Orçamento</p>
                <p className="text-3xl font-black text-doc-texto">#{orc.numero}</p>
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
                <TextoFormatado texto={orc.descricao} />
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
            <p className="mt-2 text-center text-[10px] text-tinta-3">{EMITIDO_COM}</p>
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
```

### src/components/BaixarOrcamento.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import { useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import { fotosParaPdf, toDataUrl } from "@/lib/foto-pdf";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";
import BaixarDocumento from "./BaixarDocumento";
import { OrcamentoPdfDocument, type OrcamentoForPdf } from "./OrcamentoPdfDocument";

/** Ex.: "Orçamento 123 - João Silva - Gol ABC1D23" */
function nomeArquivo(orc: OrcamentoForPdf) {
  const clienteNome = orc.cliente?.nome || orc.clienteNome?.trim() || "";
  const veiculo = orc.veiculo
    ? [orc.veiculo.marca, orc.veiculo.modelo, orc.veiculo.placa].filter(Boolean).join(" ")
    : orc.veiculoDesc?.trim() || "";
  const partes = [`Orçamento ${orc.numero}`, limparNome(clienteNome), limparNome(veiculo)];
  return partes.filter(Boolean).join(" - ");
}

export default function BaixarOrcamento({ orc }: { orc: OrcamentoForPdf }) {
  const gerarPdf = useCallback(async () => {
    // [removido: busca de dados] — carregava a configuração da oficina (com a logo) e convertia
    // as fotos em data URL para o PDF. Dados fictícios: `configuracao` e `orcamento.fotos`.

    return await comPrazo(
      pdf(
        <OrcamentoPdfDocument orc={orc} logoSrc={logo} fotos={fotos} config={config} />
      ).toBlob(),
      PRAZO.pdf,
      "Montar o PDF"
    );
  }, [orc]);

  return (
    <BaixarDocumento gerarPdf={gerarPdf} nomeBase={nomeArquivo(orc)} descricao="o orçamento" />
  );
}
```

## 4.3 OS aberta e 4.4 Documento da OS (versão de tela)

`src/app/os/[id]/page.tsx` é as duas coisas ao mesmo tempo:

- **À esquerda, o documento** (`div.documento.print-doc`): cabeçalho da oficina, número da OS na cor do documento, cliente e veículo, recepção, defeito relatado, descrição, a tabela **Itens e serviços** (peças e mão de obra), os totais, as observações, a assinatura e as fotos por momento.
- **À direita, a coluna interna**, que não sai na impressão: Visão interna (lucro), Pagamento, Desconto e Fotos.

Na barra do topo, o menu "⋯" tem Copiar carro, Editar, **Baixar** (PDF ou imagem) e Excluir.

**A imagem para o WhatsApp sai do PDF, e não da tela.** `BaixarOS` monta o `OSPdfDocument` (react-pdf) e, se o formato escolhido for imagem, `pdf-para-imagem.ts` desenha cada página em PNG (3x). `BaixarDocumento` é o botão dividido com o menu PDF / Imagem.

### src/app/os/[id]/page.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
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
import { usePodeFinanceiro, usePodeExcluir } from "@/components/UsuarioProvider";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { CampoDinheiro, Entrada, Selecao } from "@/components/ui/Campos";
import { Modal } from "@/components/ui/Modal";
import { Esqueleto, Metrica } from "@/components/ui/Dados";
import { EMITIDO_COM, valorReserva, type Configuracao } from "@/lib/configuracao";
import { estiloDoDocumento } from "@/lib/cor-documento";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Caixa, Chevron, Lapis, Lixeira, Olho, Voltar } from "@/components/ui/Icones";
import { TextoFormatado } from "@/components/ui/TextoFormatado";

const BaixarOS = dynamic(() => import("@/components/BaixarOS"), {
  ssr: false,
  loading: () => (
    <span className="inline-block rounded-lg border border-linha px-3 py-1.5 text-sm text-tinta-3">
      Baixar PDF
    </span>
  ),
});

const BaixarComprovante = dynamic(() => import("@/components/BaixarComprovante"), {
  ssr: false,
  loading: () => (
    <span className="inline-block rounded-lg border border-linha px-3 py-1.5 text-xs text-tinta-3">
      Baixar comprovante
    </span>
  ),
});

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number; custoUnit: number | null;
  /** Peça que saiu (ou vai sair, na entrega) da prateleira. */
  produtoId: string | null;
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
  const podeFinanceiro = usePodeFinanceiro();
  const podeExcluir = usePodeExcluir();
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
  const [config, setConfig] = useState<Configuracao | null>(null);

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

  // [removido: busca de dados] — GET /api/os/:id preenchia `os` (e `descontoInput`); GET
  // /api/configuracao preenchia `config` (só para quem vê financeiro).
  // Dados fictícios: `osAberta` e `configuracao`.

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
    // [removido: chamada à API] — PUT /api/os/:id { status }. Ao entregar, o aviso diz quantas
    // peças saíram do estoque.
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
    // [removido: chamada à API e validação] — POST /api/os/:id/pagamentos e, na entrega,
    // PUT /api/os/:id { status: "ENTREGUE" }. Se sobrar saldo, abre o aviso "OS entregue com
    // saldo pendente" (`setDevedor`).
  }

  // Estorna um pagamento (ou todos, quando pagamentoId vem vazio) e devolve a OS para "a receber".
  async function confirmEstorno() {
    // [removido: chamada à API] — DELETE /api/os/:id/pagamentos (um pagamento ou todos)
  }

  async function saveDesconto(e: React.FormEvent) {
    // [removido: chamada à API] — PUT /api/os/:id { desconto }
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
    // [removido: chamada à API] — DELETE /api/os/:id e volta para /os
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
                    {podeExcluir && (
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
        <div
          className="documento print-doc rounded-xl border border-linha bg-superficie text-tinta shadow-sm"
          style={estiloDoDocumento(config?.corDocumento)}
        >
          {/* Cabeçalho da oficina — vem do painel de configurações */}
          <CabecalhoDocumento />

          <div className="px-5 sm:px-8 py-6">
            {/* Número da OS e status */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-tinta-3">Ordem de Serviço</p>
                <p className="text-3xl font-black text-doc-texto">#{os.numero}</p>
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
              <TextoFormatado texto={os.descricao} />
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
                        <td className="py-1.5 pr-2">
                          <span className="flex items-center gap-1.5">
                            {/* Peça do estoque: já baixada se a OS foi entregue, a
                                baixar quando for. Some na impressão — é informação
                                interna, não do cliente. */}
                            {item.produtoId && (
                              <Caixa
                                tamanho={13}
                                className="no-print shrink-0 text-tinta-3"
                                aria-label="Peça do estoque"
                              />
                            )}
                            <span className="min-w-0">{item.descricao}</span>
                          </span>
                        </td>
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

            <p className="mt-8 text-center text-[10px] text-tinta-3">{EMITIDO_COM}</p>
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
        {/* Visão interna — lucros. Só quem tem financeiro: a API nem envia estes campos aos demais. */}
        {podeFinanceiro && ((os.custoTotalPecas ?? 0) > 0 || os.totalPecas > 0 || os.totalMO > 0) && (
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
              {config && valorReserva(config, os.lucroReal ?? 0) !== null && (
                <Metrica
                  rotulo={`Guardar (${config.reservaLucroPercentual}%)`}
                  valor={formatCurrency(valorReserva(config, os.lucroReal ?? 0) ?? 0)}
                />
              )}
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
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-tinta-3">Histórico</p>
                <BaixarComprovante
                  dados={{
                    cliente: { nome: os.cliente.nome },
                    itens: [
                      {
                        numero: os.numero,
                        veiculo: { marca: os.veiculo.marca, modelo: os.veiculo.modelo, placa: os.veiculo.placa },
                        desconto: os.desconto,
                        total: os.total,
                        valorPago: os.valorPago,
                        pago: os.pago,
                        pagamentos: os.pagamentos,
                      },
                    ],
                  }}
                />
              </div>
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
```

### src/components/CabecalhoDocumento.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import { linhasDoCabecalho } from "@/lib/configuracao";
import { useConfiguracao } from "@/lib/useConfiguracao";

/**
 * Topo do documento que o cliente recebe (OS e orçamento, na tela e na impressão).
 *
 * Tudo vem do painel de configurações: é o único lugar do sistema onde a oficina
 * aparece com nome, logo e contato próprios.
 */
export default function CabecalhoDocumento() {
  // useConfiguracao(): hook que busca a configuração da oficina na API (não incluído). Enquanto
  // não chega, o cabeçalho mostra o esqueleto abaixo. Dados fictícios: `configuracao`.
  const config = useConfiguracao();

  if (!config) {
    // Esqueleto do mesmo tamanho do cabeçalho pronto — a folha não "pula" ao carregar.
    return (
      <div className="flex items-center gap-3 sm:gap-5 border-b border-linha px-5 sm:px-8 py-5 sm:py-6">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded bg-superficie-3 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="mx-auto h-6 w-2/3 animate-pulse rounded bg-superficie-3" />
          <div className="mx-auto h-3 w-1/2 animate-pulse rounded bg-superficie-3" />
        </div>
        <div aria-hidden className="h-14 w-14 shrink-0 sm:h-20 sm:w-20" />
      </div>
    );
  }

  const linhas = linhasDoCabecalho(config);

  return (
    <div className="flex items-center gap-3 sm:gap-5 border-b border-linha px-5 sm:px-8 py-5 sm:py-6">
      {config.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={config.logoUrl}
          alt={config.nome}
          width={80}
          height={80}
          className="h-14 w-14 shrink-0 object-contain sm:h-20 sm:w-20"
        />
      )}
      <div className="min-w-0 flex-1 text-center">
        <h1 className="font-sans text-lg font-black uppercase tracking-wider sm:text-2xl">{config.nome}</h1>
        {linhas.map((linha) => (
          <p key={linha} className="mt-0.5 text-xs text-tinta-3">
            {linha}
          </p>
        ))}
      </div>
      {/* Espelha a largura da logo para o título centralizar no card, e não no espaço restante. */}
      {config.logoUrl && <div aria-hidden className="h-14 w-14 shrink-0 sm:h-20 sm:w-20" />}
    </div>
  );
}
```

### src/components/Fotos.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { compressImage } from "@/lib/image-compress";
import {
  FOTO_LEGENDA_MAX,
  FOTO_TIPOS,
  FOTO_TIPO_ORCAMENTO,
  FOTO_TIPO_PADRAO,
  tipoDaFoto,
  type FotoTipo,
} from "@/lib/constants";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Avancar, Fechar, Voltar } from "@/components/ui/Icones";

export type Foto = {
  id: string;
  url: string;
  legenda: string | null;
  tipo: string;
  createdAt: string;
};

type Enviando = { tempId: string; preview: string; tipo: FotoTipo; file: File; erro?: string };

/** Espera com backoff simples entre tentativas. */
function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uma seção só, sem título próprio: é o que o orçamento usa. O momento da foto não
// se pergunta ali (ver FOTO_TIPO_ORCAMENTO), então a grade fica limpa como uma galeria.
const SECAO_UNICA = [
  { value: FOTO_TIPO_ORCAMENTO, label: "Fotos", ajuda: "" },
] as const;

export default function Fotos({
  apiBase,
  fotos,
  onChange,
  podeEditar,
  porMomento = true,
  documento = "OS",
}: {
  /** Rota das fotos deste documento, ex.: `/api/os/<id>/fotos`. */
  apiBase: string;
  fotos: Foto[];
  /** Recebe um atualizador para evitar perder fotos ao enviar várias em sequência. */
  onChange: (atualizar: (atuais: Foto[]) => Foto[]) => void;
  podeEditar: boolean;
  /** Separa por entrada/serviço/saída (OS) ou mostra uma galeria só (orçamento). */
  porMomento?: boolean;
  /** Como o documento é chamado nos textos de ajuda. */
  documento?: "OS" | "orçamento";
}) {
  const secoes = porMomento ? FOTO_TIPOS : SECAO_UNICA;
  const confirmar = useConfirmar();
  const avisar = useAvisar();
  const [enviando, setEnviando] = useState<Enviando[]>([]);
  // O visor guarda o id, não o índice: mudar o momento reordena a lista e um
  // índice fixo saltaria para outra foto.
  const [visor, setVisor] = useState<string | null>(null);
  // Descrever é um modo opcional: em OS simples a grade continua limpa, só com
  // as fotos; em OS elaboradas o mecânico liga o modo e escreve embaixo de cada uma.
  const [descrevendo, setDescrevendo] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const tipoAlvo = useRef<FotoTipo>(porMomento ? FOTO_TIPO_PADRAO : FOTO_TIPO_ORCAMENTO);

  // Sem separação por momento a galeria mostra tudo — inclusive foto que chegou com
  // outro tipo (herdada de uma OS, ou de antes desta tela existir).
  const fotosDaSecao = (valor: FotoTipo) =>
    porMomento ? fotos.filter((f) => tipoDaFoto(f.tipo) === valor) : fotos;

  // Ordem de navegação do visor: seções na ordem definida, cronológico dentro de cada uma.
  const ordenadas = useMemo(
    () =>
      porMomento
        ? FOTO_TIPOS.flatMap((t) => fotos.filter((f) => tipoDaFoto(f.tipo) === t.value))
        : fotos,
    [fotos, porMomento]
  );
  const indice = visor === null ? -1 : ordenadas.findIndex((f) => f.id === visor);
  const fotoAtual = indice >= 0 ? ordenadas[indice] : null;

  async function enviarArquivos(files: FileList | File[] | null, tipo: FotoTipo) {
    const lista = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (lista.length === 0) return;

    const pendentes: Enviando[] = lista.map((f) => ({
      tempId: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(f),
      tipo,
      file: f,
    }));
    setEnviando((atual) => [...atual, ...pendentes]);

    // Sequencial: evita estourar memória do celular comprimindo várias fotos grandes de uma vez
    // e evita sobrecarregar a rede (wifi de oficina costuma ser instável) com várias em paralelo.
    for (const pendente of pendentes) {
      await enviarPendente(pendente);
    }
  }

  /** Envia uma foto pendente, com novas tentativas em caso de falha de rede/servidor. */
  async function enviarPendente(pendente: Enviando) {
    setEnviando((atual) =>
      atual.map((e) => (e.tempId === pendente.tempId ? { ...e, erro: undefined } : e))
    );

    // [removido: envio da foto] — comprime a imagem e faz POST multipart em `apiBase`, com até 3
    // tentativas. A foto nova entra por onChange e o quadro "Enviando" some; se falhar,
    // o quadro mostra o erro e "Tentar novamente".
  }

  function removerPendente(tempId: string) {
    setEnviando((atual) => {
      const alvo = atual.find((e) => e.tempId === tempId);
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return atual.filter((e) => e.tempId !== tempId);
    });
  }

  function escolher(origem: "camera" | "galeria", tipo: FotoTipo) {
    tipoAlvo.current = tipo;
    (origem === "camera" ? cameraRef : galeriaRef).current?.click();
  }

  // A exclusão era otimista e sem checagem: a foto sumia da tela antes da
  // resposta, então uma falha a apagava da interface e a mantinha no banco.
  // Agora só sai da lista depois que o servidor confirma.
  async function excluir(id: string) {
    const alvo = fotos.find((f) => f.id === id);
    const ok = await confirmar({
      titulo: "Excluir esta foto?",
      texto: alvo?.legenda
        ? `“${alvo.legenda}” sai da OS e do PDF do cliente. Não há como desfazer.`
        : "Ela sai da OS e do PDF do cliente. Não há como desfazer.",
      acao: "Excluir foto",
      perigo: true,
    });
    if (!ok) return;
    // [removido: chamada à API] — DELETE da foto; ela só sai da lista depois da confirmação.
  }

  // Legenda e momento eram salvos sem olhar a resposta: a tela mostrava o valor
  // novo e o banco ficava com o antigo, sem ninguém saber.
  async function salvarCampo(id: string, corpo: Record<string, unknown>, anterior: Partial<Foto>) {
    // [removido: chamada à API] — PATCH da foto (legenda ou momento); se falhar, volta o valor anterior.
  }

  async function salvarLegenda(id: string, legenda: string) {
    const anterior = fotos.find((f) => f.id === id)?.legenda ?? null;
    onChange((atuais) =>
      atuais.map((f) => (f.id === id ? { ...f, legenda: legenda.trim() || null } : f))
    );
    await salvarCampo(id, { legenda }, { legenda: anterior });
  }

  async function salvarTipo(id: string, tipo: FotoTipo) {
    const anterior = fotos.find((f) => f.id === id)?.tipo;
    onChange((atuais) => atuais.map((f) => (f.id === id ? { ...f, tipo } : f)));
    await salvarCampo(id, { tipo }, anterior ? { tipo: anterior } : {});
  }

  // Navegação do visor por teclado, e trava da rolagem de fundo enquanto ele está
  // aberto — sem isso, arrastar sobre a foto rolava a página atrás dela.
  useEffect(() => {
    if (indice < 0) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisor(null);
      if (e.key === "ArrowRight" && indice < ordenadas.length - 1) {
        setVisor(ordenadas[indice + 1].id);
      }
      if (e.key === "ArrowLeft" && indice > 0) setVisor(ordenadas[indice - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [indice, ordenadas]);

  const total = fotos.length;

  return (
    <div className="no-print rounded-xl border border-linha bg-superficie p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-tinta">Fotos</h2>
          <p className="text-xs text-tinta-3">
            {descrevendo && total > 0
              ? "Escreva embaixo de cada foto o que ela mostra — a descrição sai no PDF do cliente"
              : total > 0
                ? `${total} foto${total > 1 ? "s" : ""} — ${
                    porMomento
                      ? "aparecem no fim do PDF do cliente, separadas por momento"
                      : `aparecem no fim do PDF do ${documento}`
                  }`
                : porMomento
                  ? "Registre o veículo na entrada, o serviço e a entrega"
                  : "Mostre o defeito e o estado do veículo — a foto segue junto na conversão em OS"}
          </p>
        </div>
        {podeEditar && total > 0 && (
          <button
            onClick={() => setDescrevendo((v) => !v)}
            aria-pressed={descrevendo}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              descrevendo
                ? "border-brand-600 bg-brand-600 text-brand-fg hover:bg-brand-700"
                : "border-linha-forte text-tinta-2 hover:bg-superficie-2"
            )}
          >
            {descrevendo ? "Concluir" : "Descrever fotos"}
          </button>
        )}
      </div>

      {podeEditar && (
        <>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              enviarArquivos(e.target.files, tipoAlvo.current);
              e.target.value = "";
            }}
          />
          <input
            ref={galeriaRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              enviarArquivos(e.target.files, tipoAlvo.current);
              e.target.value = "";
            }}
          />
        </>
      )}

      {secoes.map((t) => (
        <Secao
          key={t.value}
          label={t.label}
          ajuda={t.ajuda}
          comTitulo={porMomento}
          fotos={fotosDaSecao(t.value)}
          enviando={porMomento ? enviando.filter((e) => e.tipo === t.value) : enviando}
          podeEditar={podeEditar}
          descrevendo={descrevendo}
          onSoltar={(files) => enviarArquivos(files, t.value)}
          onEscolher={(origem) => escolher(origem, t.value)}
          onAbrir={setVisor}
          onLegenda={salvarLegenda}
          onTentarNovamente={(e) => enviarPendente(e)}
          onRemoverPendente={removerPendente}
        />
      ))}

      {/* Visor em tela cheia */}
      {fotoAtual && (
        <Visor
          foto={fotoAtual}
          indice={indice}
          total={ordenadas.length}
          podeEditar={podeEditar}
          comMomento={porMomento}
          onFechar={() => setVisor(null)}
          onAnterior={() => indice > 0 && setVisor(ordenadas[indice - 1].id)}
          onProxima={() => indice < ordenadas.length - 1 && setVisor(ordenadas[indice + 1].id)}
          onExcluir={() => excluir(fotoAtual.id)}
          onLegenda={(texto) => salvarLegenda(fotoAtual.id, texto)}
          onTipo={(tipo) => salvarTipo(fotoAtual.id, tipo)}
        />
      )}
    </div>
  );
}

/** Um momento do serviço (entrada, serviço, saída) — cada um é seu próprio alvo de envio.
 *  Sem momento (orçamento) a seção vira uma galeria só, sem título nem moldura. */
function Secao({
  label,
  ajuda,
  comTitulo,
  fotos,
  enviando,
  podeEditar,
  descrevendo,
  onSoltar,
  onEscolher,
  onAbrir,
  onLegenda,
  onTentarNovamente,
  onRemoverPendente,
}: {
  label: string;
  ajuda: string;
  comTitulo: boolean;
  fotos: Foto[];
  enviando: Enviando[];
  podeEditar: boolean;
  descrevendo: boolean;
  onSoltar: (files: FileList) => void;
  onEscolher: (origem: "camera" | "galeria") => void;
  onAbrir: (id: string) => void;
  onLegenda: (id: string, texto: string) => void;
  onTentarNovamente: (item: Enviando) => void;
  onRemoverPendente: (tempId: string) => void;
}) {
  const [arrastando, setArrastando] = useState(false);
  const vazio = fotos.length === 0 && enviando.length === 0;

  return (
    <section
      onDragOver={
        podeEditar
          ? (e) => {
              e.preventDefault();
              setArrastando(true);
            }
          : undefined
      }
      onDragLeave={() => setArrastando(false)}
      onDrop={
        podeEditar
          ? (e) => {
              e.preventDefault();
              setArrastando(false);
              onSoltar(e.dataTransfer.files);
            }
          : undefined
      }
      className={cn(
        "rounded-xl transition-colors",
        comTitulo && "border p-3",
        arrastando
          ? comTitulo
            ? "border-perigo-linha bg-perigo-fraco"
            : "bg-perigo-fraco"
          : comTitulo && "border-linha"
      )}
    >
      {comTitulo && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-tinta">
            {label}
            {fotos.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-tinta-3">{fotos.length}</span>
            )}
          </h3>
          <span className="truncate text-xs text-tinta-3">{ajuda}</span>
        </div>
      )}

      {vazio ? (
        podeEditar ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-linha px-3 py-4 sm:flex-row sm:justify-center">
            <span className="text-xs text-tinta-3">
              <span className="hidden sm:inline">Arraste as fotos aqui ou</span>
              <span className="sm:hidden">Nenhuma foto ainda</span>
            </span>
            <button
              onClick={() => onEscolher("camera")}
              className="rounded-lg bg-contraste px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 sm:hidden"
            >
              Tirar foto
            </button>
            <button
              onClick={() => onEscolher("galeria")}
              className="rounded-lg border border-linha-forte px-3 py-1.5 text-xs font-medium text-tinta-2 hover:bg-superficie-2"
            >
              <span className="sm:hidden">Escolher da galeria</span>
              <span className="hidden sm:inline">escolha os arquivos</span>
            </button>
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-tinta-3">Nenhuma foto.</p>
        )
      ) : (
        <div
          className={cn(
            "grid gap-2",
            descrevendo
              ? "grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
          )}
        >
          {fotos.map((foto) => {
            const miniatura = (
              <button
                key={foto.id}
                onClick={() => onAbrir(foto.id)}
                className="group relative aspect-square w-full overflow-hidden rounded-lg border border-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.legenda ?? `Foto — ${label}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {/* No modo descrever o texto aparece no campo abaixo, sem cobrir a foto. */}
                {foto.legenda && !descrevendo && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-left text-xs text-white">
                    {foto.legenda}
                  </span>
                )}
              </button>
            );

            if (!descrevendo) return miniatura;
            return (
              <div key={foto.id} className="space-y-1.5">
                {miniatura}
                <CampoDescricao
                  legenda={foto.legenda}
                  onSalvar={(texto) => onLegenda(foto.id, texto)}
                />
              </div>
            );
          })}

          {enviando.map((e) =>
            e.erro ? (
              <button
                key={e.tempId}
                onClick={() => onTentarNovamente(e)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-perigo-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.preview} alt="" className="h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
                  <span className="text-xs font-medium text-perigo">{e.erro}</span>
                  <span className="text-xs font-semibold text-tinta-2 underline">
                    Tentar novamente
                  </span>
                </div>
                <span
                  role="button"
                  aria-label="Remover"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onRemoverPendente(e.tempId);
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Fechar tamanho={12} />
                </span>
              </button>
            ) : (
              <div
                key={e.tempId}
                className="relative aspect-square overflow-hidden rounded-lg border border-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.preview} alt="" className="h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
                  <Spinner />
                  <span className="text-xs text-tinta-2">Enviando</span>
                </div>
              </div>
            )
          )}

          {podeEditar && (
            <>
              <button
                onClick={() => onEscolher("camera")}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-linha text-tinta-3 hover:border-linha-forte hover:text-tinta-2 sm:hidden"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">Tirar foto</span>
              </button>
              <button
                onClick={() => onEscolher("galeria")}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-linha text-tinta-3 hover:border-linha-forte hover:text-tinta-2"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">
                  <span className="sm:hidden">Galeria</span>
                  <span className="hidden sm:inline">Adicionar</span>
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Visor({
  foto,
  indice,
  total,
  podeEditar,
  comMomento,
  onFechar,
  onAnterior,
  onProxima,
  onExcluir,
  onLegenda,
  onTipo,
}: {
  foto: Foto;
  indice: number;
  total: number;
  podeEditar: boolean;
  comMomento: boolean;
  onFechar: () => void;
  onAnterior: () => void;
  onProxima: () => void;
  onExcluir: () => void;
  onLegenda: (texto: string) => void;
  onTipo: (tipo: FotoTipo) => void;
}) {
  const [legenda, setLegenda] = useState(foto.legenda ?? "");
  const toqueX = useRef<number | null>(null);
  const tipoAtual = tipoDaFoto(foto.tipo);

  useEffect(() => setLegenda(foto.legenda ?? ""), [foto.id, foto.legenda]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onFechar}
    >
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/70">
          {indice + 1} de {total} · {formatDate(foto.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          {podeEditar && (
            <button
              onClick={onExcluir}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm text-red-300 hover:bg-white/10"
            >
              Excluir
            </button>
          )}
          <button
            onClick={onFechar}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (toqueX.current === null) return;
          const dx = e.changedTouches[0].clientX - toqueX.current;
          if (dx < -50) onProxima();
          if (dx > 50) onAnterior();
          toqueX.current = null;
        }}
      >
        {indice > 0 && (
          <button
            onClick={onAnterior}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Foto anterior"
            >
              <Voltar tamanho={20} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt={foto.legenda ?? "Foto do serviço"}
          className="max-h-full max-w-full object-contain"
        />
        {indice < total - 1 && (
          <button
            onClick={onProxima}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Próxima foto"
            >
              <Avancar tamanho={20} />
          </button>
        )}
      </div>

      <div className="space-y-3 px-4 py-4" onClick={(e) => e.stopPropagation()}>
        {podeEditar ? (
          <>
            {comMomento && (
            <div className="flex items-center justify-center gap-1.5">
              {FOTO_TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => t.value !== tipoAtual && onTipo(t.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    t.value === tipoAtual
                      ? "border-white bg-white text-black"
                      : "border-white/25 text-white/70 hover:bg-white/10"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            )}
            <input
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              onBlur={() => legenda !== (foto.legenda ?? "") && onLegenda(legenda)}
              placeholder="Descrição (ex: Pastilha desgastada, Painel na entrega)"
              maxLength={FOTO_LEGENDA_MAX}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </>
        ) : (
          <p className="text-center text-sm text-white/80">
            {[comMomento ? FOTO_TIPOS.find((t) => t.value === tipoAtual)?.label : null, foto.legenda]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Campo de descrição embaixo da miniatura (modo "Descrever fotos").
 * Salva ao sair do campo ou no Enter — dá para descer de foto em foto com Tab.
 */
function CampoDescricao({
  legenda,
  onSalvar,
}: {
  legenda: string | null;
  onSalvar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState(legenda ?? "");

  // A lista pode ser reordenada (troca de momento); mantém o campo em dia com a foto.
  useEffect(() => setTexto(legenda ?? ""), [legenda]);

  return (
    <input
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto.trim() !== (legenda ?? "") && onSalvar(texto)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      placeholder="Descreva a foto"
      maxLength={FOTO_LEGENDA_MAX}
      aria-label="Descrição da foto"
      className="w-full rounded-lg border border-linha px-2 py-1.5 text-xs text-tinta-2 placeholder:text-tinta-3 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
    />
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-tinta-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
```

### src/components/BaixarOS.tsx

_Lógica de dados removida (comentários `// [removido: …]`); JSX, classes e estrutura intactos._

```tsx
"use client";

import { useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { carregarConfiguracao } from "@/lib/useConfiguracao";
import { limparNome } from "@/lib/formato-download";
import { fotosParaPdf, toDataUrl } from "@/lib/foto-pdf";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";
import BaixarDocumento from "./BaixarDocumento";
import { OSPdfDocument, type OSForPdf } from "./OSPdfDocument";

/** Ex.: "OS 123 - João Silva - Gol ABC1D23" */
function nomeArquivo(os: OSForPdf) {
  const { marca, modelo, placa } = os.veiculo;
  const veiculo = [marca, modelo, placa].filter(Boolean).join(" ");
  const partes = [`OS ${os.numero}`, limparNome(os.cliente.nome), limparNome(veiculo)];
  return partes.filter(Boolean).join(" - ");
}

export default function BaixarOS({ os, comoItem = false }: { os: OSForPdf; comoItem?: boolean }) {
  const gerarPdf = useCallback(async () => {
    // [removido: busca de dados] — carregava a configuração da oficina (com a logo) e convertia
    // as fotos em data URL para o PDF. Dados fictícios: `configuracao` e `osAberta.fotos`.

    return await comPrazo(
      pdf(<OSPdfDocument os={os} logoSrc={logo} fotos={fotos} config={config} />).toBlob(),
      PRAZO.pdf,
      "Montar o PDF"
    );
  }, [os]);

  return (
    <BaixarDocumento
      gerarPdf={gerarPdf}
      nomeBase={nomeArquivo(os)}
      descricao="a OS"
      comoItem={comoItem}
    />
  );
}
```

### src/components/BaixarDocumento.tsx

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FORMATOS,
  formatoSalvo,
  salvarFormato,
  type FormatoDownload,
} from "@/lib/formato-download";
import { PRAZO, comPrazo } from "@/lib/tempo-limite";

/**
 * Botão de baixar com escolha de formato — usado pela OS e pelo orçamento.
 *
 * É um botão dividido: a parte grande baixa no formato que a pessoa usou da
 * última vez (o caso comum, um toque só) e a setinha abre a troca de formato.
 * Escolher no menu já baixa naquele formato, para que ninguém precise escolher e
 * clicar de novo.
 *
 * A imagem sai do próprio PDF (ver src/lib/pdf-para-imagem.ts), então os dois
 * formatos mostram exatamente o mesmo documento. Documento de mais de uma página
 * baixa uma imagem por página — ver `salvar()`, no fim deste arquivo.
 */
export default function BaixarDocumento({
  gerarPdf,
  nomeBase,
  descricao,
  comoItem = false,
}: {
  /** Monta o PDF do documento. Chamado só na hora de baixar. */
  gerarPdf: () => Promise<Blob>;
  /** Nome do arquivo sem extensão. Ex.: "OS 123 - João Silva - Gol ABC1D23". */
  nomeBase: string;
  /** Como o documento se chama nas dicas. Ex.: "a OS", "o orçamento". */
  descricao: string;
  /** Dentro de um menu de ações: vira uma linha por formato, sem botão dividido. */
  comoItem?: boolean;
}) {
  const [formato, setFormato] = useState<FormatoDownload>("pdf");
  const [menuAberto, setMenuAberto] = useState(false);
  const [gerando, setGerando] = useState<FormatoDownload | null>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  // Guarda a mensagem, não só "deu erro": quando o arquivo não sai, saber em qual
  // passo travou é a diferença entre relatar o problema e adivinhar.
  const [erro, setErro] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);

  // A preferência só é lida no navegador: ler durante a renderização quebraria a
  // primeira pintura da tela.
  useEffect(() => setFormato(formatoSalvo()), []);

  // Fecha o menu ao tocar fora ou apertar Esc — comportamento que todo mundo já
  // espera de um menu.
  useEffect(() => {
    if (!menuAberto) return;
    function fora(e: MouseEvent) {
      if (!caixa.current?.contains(e.target as Node)) setMenuAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAberto(false);
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [menuAberto]);

  const baixar = useCallback(
    async (alvo: FormatoDownload) => {
      const info = FORMATOS.find((f) => f.valor === alvo)!;
      setGerando(alvo);
      setProgresso(null);
      setErro(null);
      try {
        const pdfBlob = await gerarPdf();
        let arquivos = [pdfBlob];

        if (alvo === "imagem") {
          // Carregado só agora: quem baixa em PDF nunca busca o pdf.js.
          const { pdfParaPngs } = await import("@/lib/pdf-para-imagem");
          arquivos = await comPrazo(
            pdfParaPngs(pdfBlob, ({ pagina, total }) =>
              // Só conta as páginas quando há mais de uma — em documento de página
              // única o "1/1" só faria o botão pular de largura.
              setProgresso(total > 1 ? `${pagina}/${total}` : null)
            ),
            PRAZO.pdf,
            "Converter em imagem"
          );
        }

        await salvar(arquivos, nomeBase, info.extensao);
      } catch (err) {
        console.error(err);
        setErro(err instanceof Error ? err.message : "Falha ao gerar o arquivo");
      } finally {
        setGerando(null);
        setProgresso(null);
      }
    },
    [gerarPdf, nomeBase]
  );

  function escolher(alvo: FormatoDownload) {
    setFormato(alvo);
    salvarFormato(alvo);
    setMenuAberto(false);
    baixar(alvo);
  }

  const atual = FORMATOS.find((f) => f.valor === formato)!;
  const ocupado = gerando !== null;

  const rotulo = ocupado
    ? `Gerando ${gerando === "imagem" ? "imagem" : "PDF"}${progresso ? ` ${progresso}` : ""}...`
    : erro
      ? "Tentar de novo"
      : `Baixar ${atual.label}`;

  if (comoItem) {
    return (
      <div className="w-full">
        {FORMATOS.map((f) => {
          const gerandoEste = gerando === f.valor;
          return (
            <button
              key={f.valor}
              onClick={() => escolher(f.valor)}
              disabled={ocupado}
              title={`Salvar ${descricao} em ${f.label}`}
              className={cn(
                "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-superficie-2 disabled:opacity-60",
                erro && gerandoEste ? "text-perigo" : "text-tinta-2"
              )}
            >
              <IconeDownload className="h-4 w-4 shrink-0" />
              <span>
                {gerandoEste
                  ? `Gerando ${f.label}${progresso ? ` ${progresso}` : ""}...`
                  : `Baixar ${f.label}`}
              </span>
            </button>
          );
        })}
        {erro && (
          <p role="alert" className="px-3 pb-1 text-xs leading-snug text-perigo">
            {erro}
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={caixa} className="relative">
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-lg border",
          erro ? "border-perigo-linha" : "border-linha-forte"
        )}
      >
        <button
          onClick={() => baixar(formato)}
          disabled={ocupado}
          title={erro ? `Não foi possível gerar o arquivo: ${erro}` : `Salvar ${descricao} em ${atual.label}`}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm hover:bg-superficie-2 disabled:opacity-60",
            erro ? "text-perigo" : "text-tinta-2"
          )}
        >
          <IconeDownload className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">{rotulo}</span>
        </button>

        <button
          onClick={() => setMenuAberto((v) => !v)}
          disabled={ocupado}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          aria-label="Escolher o formato do download"
          title="Escolher o formato: PDF ou imagem"
          className={cn(
            "border-l px-2 text-tinta-3 hover:bg-superficie-2 disabled:opacity-60",
            erro ? "border-perigo-linha" : "border-linha-forte",
            menuAberto && "bg-superficie-3"
          )}
        >
          <IconeSeta className={cn("h-4 w-4 transition-transform", menuAberto && "rotate-180")} />
        </button>
      </div>

      {/* A mensagem fica à vista: quem está no balcão precisa saber se foi a rede
          ou o próprio documento antes de tentar de novo. */}
      {erro && (
        <p role="alert" className="mt-1 max-w-[16rem] text-right text-xs leading-snug text-perigo">
          {erro}
        </p>
      )}

      {menuAberto && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-linha bg-superficie shadow-lg"
        >
          <p className="border-b border-linha px-3 py-2 text-xs font-medium uppercase tracking-wide text-tinta-3">
            Baixar como
          </p>
          {FORMATOS.map((f) => {
            const selecionado = f.valor === formato;
            return (
              <button
                key={f.valor}
                role="menuitemradio"
                aria-checked={selecionado}
                onClick={() => escolher(f.valor)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-superficie-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    selecionado ? "border-brand-500 bg-brand-500" : "border-linha-forte"
                  )}
                >
                  {selecionado && <span className="h-1.5 w-1.5 rounded-full bg-superficie" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-tinta">
                    {f.label}
                    <span className="ml-1 font-normal text-tinta-3">.{f.extensao}</span>
                  </span>
                  <span className="block text-xs leading-snug text-tinta-3">{f.descricao}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Salva os arquivos gerados, um por vez.
 *
 * Documento de uma página sai com o nome limpo, como sempre. Com mais de uma, cada
 * página vira um arquivo numerado — é o que se manda no WhatsApp, onde uma folha
 * empilhada chegaria comprida e ilegível. O número é preenchido com zero à esquerda
 * para que 10 não apareça antes de 2 na pasta de downloads.
 *
 * O clique é espaçado e a URL só é liberada depois: revogar no mesmo instante
 * cancela o download que ainda nem começou, e disparar tudo junto faz o navegador
 * descartar os arquivos seguintes.
 */
async function salvar(arquivos: Blob[], nomeBase: string, extensao: string) {
  const largura = String(arquivos.length).length;

  for (let i = 0; i < arquivos.length; i++) {
    const sufixo =
      arquivos.length > 1 ? ` - pagina ${String(i + 1).padStart(largura, "0")}` : "";

    const url = URL.createObjectURL(arquivos[i]);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nomeBase}${sufixo}.${extensao}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);

    if (i < arquivos.length - 1) await new Promise((r) => setTimeout(r, 350));
  }
}

function IconeDownload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5" />
      <path d="M3.5 13.5v1.75A1.75 1.75 0 0 0 5.25 17h9.5a1.75 1.75 0 0 0 1.75-1.75V13.5" />
    </svg>
  );
}

function IconeSeta({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5.5 8 4.5 4.5L14.5 8" />
    </svg>
  );
}
```

### src/lib/formato-download.ts

```ts
// Em que formato a oficina prefere baixar OS e orçamentos.
//
// A escolha fica no navegador de quem usa (não no banco): é preferência de quem
// está com o aparelho na mão — o dono no computador costuma querer PDF, quem
// atende no balcão manda imagem no WhatsApp o dia inteiro.

export type FormatoDownload = "pdf" | "imagem";

const CHAVE = "manager-lite:formato-download";
const PADRAO: FormatoDownload = "pdf";

export const FORMATOS: {
  valor: FormatoDownload;
  label: string;
  extensao: string;
  descricao: string;
}[] = [
  {
    valor: "pdf",
    label: "PDF",
    extensao: "pdf",
    descricao: "Para imprimir, arquivar ou anexar em e-mail.",
  },
  {
    valor: "imagem",
    label: "Imagem",
    extensao: "png",
    descricao: "Abre direto na conversa. Documento longo vem uma imagem por página.",
  },
];

export function formatoSalvo(): FormatoDownload {
  try {
    const valor = localStorage.getItem(CHAVE);
    if (valor === "pdf" || valor === "imagem") return valor;
  } catch {
    // localStorage indisponível (modo privado etc.) — segue com o padrão
  }
  return PADRAO;
}

export function salvarFormato(formato: FormatoDownload) {
  try {
    localStorage.setItem(CHAVE, formato);
  } catch {
    // sem persistir: a escolha ainda vale para esta visita
  }
}

/** Remove caracteres que o Windows/macOS não aceitam em nome de arquivo. */
export function limparNome(texto: string) {
  return texto.replace(/[\\/:*?"<>|]/g, "").trim();
}
```

### src/components/OSPdfDocument.tsx

```tsx
import { Document, Page, View, Text, Image, Link, StyleSheet } from "@react-pdf/renderer";
import { FOTO_TIPOS, tipoDaFoto, labelStatus, anoVeiculo } from "@/lib/constants";
import type { FotoPdf } from "@/lib/foto-pdf";
import { TextoFormatadoPdf } from "@/components/TextoFormatadoPdf";
import { corDeTextoNoPapel } from "@/lib/cor-documento";
import {
  CONFIG_PADRAO,
  linhasDoCabecalho,
  rodapeDoDocumento,
  EMITIDO_COM,
  type Configuracao,
} from "@/lib/configuracao";

type Item = {
  id: string; tipo: string; descricao: string; quantidade: number;
  valorUnit: number; valorTotal: number;
};
type Pagamento = {
  id: string; valor: number; formaPagamento: string; data: string; obs: string | null;
};
export type OSForPdf = {
  numero: number; status: string; descricao: string;
  defeitoRelatado?: string | null;
  kmEntrada: number | null; kmSaida: number | null;
  totalPecas: number; totalMO: number; desconto: number; total: number;
  pago: boolean; valorPago: number; obs: string | null;
  mecanico: string | null; nivelCombustivel: string | null; combustivelEmUso: string | null;
  abertura: string; fechamento: string | null;
  cliente: {
    nome: string; telefone: string | null; cpfCnpj: string | null; email: string | null;
    endereco: string | null; cidade: string | null; estado: string | null;
  };
  veiculo: {
    marca: string; modelo: string; placa: string | null; ano: number | null;
    cor: string | null; motorizacao: string | null;
  };
  itens: Item[];
  pagamentos: Pagamento[];
  fotos?: { id: string; url: string; legenda: string | null; tipo: string; createdAt: string }[];
};

// Rótulos próprios do impresso: no papel cabe o nome por extenso, enquanto o badge
// da tela usa a forma curta de `labelStatus`.
const STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta", EM_ANDAMENTO: "Em Andamento", AGUARDANDO_PECA: "Aguardando Peça",
  ENTREGUE: "Entregue", CANCELADA: "Cancelada",
};
const NIVEL_LABEL: Record<string, string> = { CHEIO: "Cheio", MEIO: "Meio", VAZIO: "Vazio" };
const TIPO_LABEL: Record<string, string> = { PECA: "Peça", MAO_DE_OBRA: "Mão de obra", SERVICO: "Serviço" };

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function dia(d: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
}

const C = {
  ink: "#18181b", sub: "#52525b", mute: "#a1a1aa", line: "#e4e4e7",
  soft: "#f4f4f5", red: "#dc2626",
};

const s = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 56, paddingHorizontal: 40, fontSize: 9, color: C.ink, fontFamily: "Helvetica" },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: -6 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  brandText: { justifyContent: "center" },
  logo: { width: 88, height: 88, objectFit: "contain" },
  brandName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.ink, letterSpacing: 0.5 },
  brandLine: { fontSize: 8.5, color: C.sub, marginTop: 1.5 },
  osLabel: { fontSize: 8, color: C.mute, letterSpacing: 1, textTransform: "uppercase", textAlign: "right" },
  osNum: { fontSize: 26, fontFamily: "Helvetica-Bold", color: C.red, textAlign: "right", marginTop: 1 },
  osDate: { fontSize: 8.5, color: C.sub, textAlign: "right", marginTop: 1 },
  osStatus: { fontSize: 8.5, color: C.sub, textAlign: "right", marginTop: 1, fontFamily: "Helvetica-Bold" },

  rule: { height: 2, backgroundColor: C.ink, marginBottom: 14 },

  // Cliente + Veículo (box único, duas colunas)
  infoBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 6, padding: 12, marginBottom: 12 },
  infoCol: { flex: 1 },
  infoDivider: { width: 1, alignSelf: "stretch", backgroundColor: C.line, marginHorizontal: 12 },
  boxTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  boxName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  boxLine: { fontSize: 8.5, color: C.sub, marginBottom: 1.5, lineHeight: 1.3 },

  // Section
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 7.5, color: C.mute, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 },
  desc: { fontSize: 9.5, color: C.ink, lineHeight: 1.45 },
  descObs: { fontSize: 8.5, color: C.sub, marginTop: 4, fontFamily: "Helvetica-Oblique" },

  // Items table
  itensHead: { marginBottom: 0 },
  thead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingBottom: 4, marginBottom: 2 },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.soft, paddingVertical: 5, alignItems: "flex-start" },
  cTipo: { width: "16%", fontSize: 8, color: C.sub },
  cDesc: { width: "44%", fontSize: 9, color: C.ink, paddingRight: 6 },
  cQtd: { width: "10%", fontSize: 9, color: C.sub, textAlign: "right" },
  cUnit: { width: "15%", fontSize: 9, color: C.sub, textAlign: "right" },
  cTotal: { width: "15%", fontSize: 9, fontFamily: "Helvetica-Bold", color: C.ink, textAlign: "right" },

  // Totals
  totals: { marginTop: 8, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 220, paddingVertical: 1.5 },
  totalLabel: { fontSize: 9, color: C.sub },
  totalValue: { fontSize: 9, color: C.sub },
  totalDescLabel: { fontSize: 9, color: C.red },
  totalDescValue: { fontSize: 9, color: C.red },
  grandRow: {
    flexDirection: "row", justifyContent: "space-between", width: 220,
    borderTopWidth: 1.5, borderTopColor: C.ink, paddingTop: 4, marginTop: 3,
  },
  grandLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },
  grandValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },

  // Footer
  footer: {
    position: "absolute", bottom: 24, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.mute },

  // Assinatura
  signature: { marginTop: 36, alignItems: "center" },
  signatureLine: { width: 220, borderTopWidth: 1, borderTopColor: C.mute, paddingTop: 4 },
  signatureLabel: { fontSize: 8, color: C.mute, textAlign: "center" },

  // Recado da oficina (garantia, termos) — configurável no painel
  aviso: {
    marginTop: 14, borderWidth: 1, borderColor: C.line, borderRadius: 6,
    backgroundColor: C.soft, padding: 10,
  },
  avisoTexto: { fontSize: 8, color: C.sub, lineHeight: 1.45 },

  // Fotos
  fotosTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 2 },
  fotosSub: { fontSize: 8.5, color: C.sub, marginBottom: 2 },
  fotosDica: { fontSize: 7.5, color: C.mute, marginBottom: 12, fontFamily: "Helvetica-Oblique" },
  fotosSecao: { marginBottom: 4 },
  fotosSecaoTitulo: {
    fontSize: 8, fontFamily: "Helvetica-Bold", color: C.sub, textTransform: "uppercase",
    letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 3, marginBottom: 8,
  },
  // Margem negativa + padding simétrico: as colunas ficam com respiro igual dos dois
  // lados e a grade encosta certinho nas duas margens da página.
  fotosGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },
  fotoCell: { width: "33.33%", paddingHorizontal: 4, marginBottom: 12 },
  // "contain" em vez de "cover": foto de celular na vertical aparece inteira,
  // centralizada na moldura, em vez de ter as bordas cortadas.
  fotoBox: {
    backgroundColor: C.soft, borderWidth: 1, borderColor: C.line, borderRadius: 4,
    textDecoration: "none",
  },
  fotoImg: { width: "100%", height: 120, objectFit: "contain" },
  fotoLegenda: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.ink, marginTop: 3 },
  fotoData: { fontSize: 7.5, color: C.mute, marginTop: 1 },
});

export function OSPdfDocument({
  os,
  logoSrc,
  fotos = [],
  config = CONFIG_PADRAO,
}: {
  os: OSForPdf;
  logoSrc?: string;
  fotos?: FotoPdf[];
  config?: Configuracao;
}) {
  // Identidade da oficina — nome, contatos, rodapé e cor saem do painel.
  const cabecalho = linhasDoCabecalho(config);
  const rodape = rodapeDoDocumento(config);
  const marca = config.corDocumento;

  const veicLinha2: string[] = [];
  if (os.veiculo.cor) veicLinha2.push(`Cor: ${os.veiculo.cor}`);
  if (os.veiculo.motorizacao) veicLinha2.push(`Motor: ${os.veiculo.motorizacao}`);
  if (os.kmEntrada != null) veicLinha2.push(`KM entrada: ${os.kmEntrada.toLocaleString("pt-BR")}`);
  if (os.kmSaida != null) veicLinha2.push(`KM saída: ${os.kmSaida.toLocaleString("pt-BR")}`);
  if (os.nivelCombustivel) veicLinha2.push(`Combustível: ${NIVEL_LABEL[os.nivelCombustivel] ?? os.nivelCombustivel}`);
  if (os.combustivelEmUso) veicLinha2.push(`Em uso: ${os.combustivelEmUso}`);

  return (
    <Document title={`OS ${os.numero} - ${config.nome}`} author={config.nome}>
      <Page size="A4" style={s.page}>
        {/* Cabeçalho */}
        <View style={s.header}>
          <View style={s.brandRow}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logoSrc ? <Image style={s.logo} src={logoSrc} /> : null}
            <View style={s.brandText}>
              <Text style={s.brandName}>{config.nome.toUpperCase()}</Text>
              {cabecalho.map((linha) => (
                <Text key={linha} style={s.brandLine}>{linha}</Text>
              ))}
            </View>
          </View>
          <View>
            <Text style={s.osLabel}>Ordem de Serviço</Text>
            <Text style={[s.osNum, { color: corDeTextoNoPapel(marca) }]}>Nº {os.numero}</Text>
            <Text style={s.osDate}>Abertura: {dia(os.abertura)}</Text>
            {os.fechamento ? <Text style={s.osDate}>Fechamento: {dia(os.fechamento)}</Text> : null}
            <Text style={s.osStatus}>Status: {STATUS_LABEL[os.status] ?? labelStatus(os.status)}</Text>
          </View>
        </View>

        <View style={[s.rule, { backgroundColor: marca }]} />

        {/* Cliente e Veículo */}
        <View style={s.infoBox}>
          <View style={s.infoCol}>
            <Text style={s.boxTitle}>Cliente</Text>
            <Text style={s.boxName}>{os.cliente.nome}</Text>
            {os.cliente.cpfCnpj ? <Text style={s.boxLine}>CPF/CNPJ: {os.cliente.cpfCnpj}</Text> : null}
            {os.cliente.telefone ? <Text style={s.boxLine}>Telefone: {os.cliente.telefone}</Text> : null}
            {os.cliente.email ? <Text style={s.boxLine}>E-mail: {os.cliente.email}</Text> : null}
            {os.cliente.endereco ? (
              <Text style={s.boxLine}>
                {os.cliente.endereco}
                {os.cliente.cidade ? `, ${os.cliente.cidade}` : ""}
                {os.cliente.estado ? ` - ${os.cliente.estado}` : ""}
              </Text>
            ) : null}
          </View>
          <View style={s.infoDivider} />
          <View style={s.infoCol}>
            <Text style={s.boxTitle}>Veículo</Text>
            <Text style={s.boxName}>
              {os.veiculo.marca} {os.veiculo.modelo}{anoVeiculo(os.veiculo) ? ` (${anoVeiculo(os.veiculo)})` : ""}
            </Text>
            {os.veiculo.placa ? <Text style={s.boxLine}>Placa: {os.veiculo.placa}</Text> : null}
            {veicLinha2.length > 0 ? <Text style={s.boxLine}>{veicLinha2.join("  ·  ")}</Text> : null}
            {os.mecanico ? <Text style={s.boxLine}>Mecânico responsável: {os.mecanico}</Text> : null}
          </View>
        </View>

        {/* Defeito relatado */}
        {os.defeitoRelatado ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Defeito Relatado pelo Cliente</Text>
            <Text style={s.desc}>{os.defeitoRelatado}</Text>
          </View>
        ) : null}

        {/* Descrição */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Descrição do Serviço</Text>
          <TextoFormatadoPdf texto={os.descricao} />
          {os.obs ? <Text style={s.descObs}>Observações: {os.obs}</Text> : null}
        </View>

        {/* Itens */}
        {os.itens.length > 0 ? (
          <>
            <View style={s.itensHead} wrap={false}>
              <Text style={s.sectionTitle}>Itens e Serviços</Text>
              <View style={s.thead}>
                <Text style={[s.th, s.cTipo]}>Tipo</Text>
                <Text style={[s.th, s.cDesc]}>Descrição</Text>
                <Text style={[s.th, s.cQtd]}>Qtd</Text>
                <Text style={[s.th, s.cUnit]}>Vlr. Unit.</Text>
                <Text style={[s.th, s.cTotal]}>Total</Text>
              </View>
            </View>
            {os.itens.map((item) => (
              <View key={item.id} style={s.row} wrap={false}>
                <Text style={s.cTipo}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
                <Text style={s.cDesc}>{item.descricao}</Text>
                <Text style={s.cQtd}>{item.quantidade}</Text>
                <Text style={s.cUnit}>{brl(item.valorUnit)}</Text>
                <Text style={s.cTotal}>{brl(item.valorTotal)}</Text>
              </View>
            ))}

            {/* Totais */}
            <View style={s.totals} wrap={false}>
              {os.totalPecas > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Peças</Text>
                  <Text style={s.totalValue}>{brl(os.totalPecas)}</Text>
                </View>
              ) : null}
              {os.totalMO > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>Mão de obra / Serviços</Text>
                  <Text style={s.totalValue}>{brl(os.totalMO)}</Text>
                </View>
              ) : null}
              {os.desconto > 0 ? (
                <View style={s.totalRow}>
                  <Text style={s.totalDescLabel}>Desconto</Text>
                  <Text style={s.totalDescValue}>- {brl(os.desconto)}</Text>
                </View>
              ) : null}
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>TOTAL</Text>
                <Text style={s.grandValue}>{brl(os.total)}</Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Recado da oficina (garantia, termos) */}
        {config.mensagemDocumento ? (
          <View style={s.aviso} wrap={false}>
            <Text style={s.avisoTexto}>{config.mensagemDocumento}</Text>
          </View>
        ) : null}

        {/* Assinatura */}
        {config.mostrarAssinatura ? (
          <View style={s.signature} wrap={false}>
            <View style={s.signatureLine}>
              <Text style={s.signatureLabel}>Assinatura do Cliente</Text>
            </View>
          </View>
        ) : null}

        {/* Rodapé fixo */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{rodape}</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${EMITIDO_COM}  ·  Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>

      {/* Fotos — páginas próprias, após o documento */}
      {fotos.length > 0 ? (
        <Page size="A4" style={s.page}>
          <Text style={s.fotosTitle}>Fotos do Serviço</Text>
          <Text style={s.fotosSub}>
            OS Nº {os.numero} · {os.veiculo.marca} {os.veiculo.modelo}
            {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
          </Text>
          <Text style={s.fotosDica}>Toque em uma foto para abri-la em alta resolução.</Text>

          {FOTO_TIPOS.map((t) => {
            const doMomento = fotos.filter((f) => tipoDaFoto(f.tipo) === t.value);
            if (doMomento.length === 0) return null;
            return (
              <View key={t.value} style={s.fotosSecao}>
                <Text style={s.fotosSecaoTitulo}>{t.label}</Text>
                <View style={s.fotosGrid}>
                  {doMomento.map((foto) => (
                    <View key={foto.id} style={s.fotoCell} wrap={false}>
                      <Link src={foto.url} style={s.fotoBox}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image style={s.fotoImg} src={foto.src} />
                      </Link>
                      {foto.legenda ? <Text style={s.fotoLegenda}>{foto.legenda}</Text> : null}
                      <Text style={s.fotoData}>{dia(foto.createdAt)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={s.footer} fixed>
            <Text style={s.footerText}>{rodape}</Text>
            <Text
              style={s.footerText}
              render={({ pageNumber, totalPages }) => `${EMITIDO_COM}  ·  Página ${pageNumber} de ${totalPages}`}
            />
          </View>
        </Page>
      ) : null}
    </Document>
  );
}
```

### src/components/TextoFormatadoPdf.tsx

```tsx
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { blocosDoTexto, type Trecho } from "@/lib/texto-formatado";

// Versão para o PDF do mesmo texto que TextoFormatado mostra na tela.

const s = StyleSheet.create({
  texto: { fontSize: 9.5, color: "#18181b", lineHeight: 1.45 },
  negrito: { fontFamily: "Helvetica-Bold" },
  titulo: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#18181b", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 4, marginBottom: 2 },
  item: { flexDirection: "row", marginBottom: 1 },
  subItem: { paddingLeft: 16 },
  marca: { width: 16, fontSize: 9.5, color: "#52525b", lineHeight: 1.45 },
  itemTexto: { flex: 1, fontSize: 9.5, color: "#18181b", lineHeight: 1.45 },
  espaco: { height: 6 },
});

function trechos(lista: Trecho[]) {
  return lista.map((t, i) =>
    t.negrito ? <Text key={i} style={s.negrito}>{t.texto}</Text> : t.texto,
  );
}

export function TextoFormatadoPdf({ texto }: { texto: string }) {
  return (
    <View>
      {blocosDoTexto(texto).map((b, i) => {
        if (b.tipo === "espaco") return <View key={i} style={s.espaco} />;
        if (b.tipo === "titulo") {
          // Título não fica sozinho no pé da página, longe do que ele apresenta.
          return <Text key={i} style={s.titulo} minPresenceAhead={30}>{trechos(b.trechos)}</Text>;
        }
        if (b.tipo === "numerado" || b.tipo === "marcador") {
          return (
            <View key={i} style={b.nivel > 0 ? [s.item, s.subItem] : s.item} wrap={false}>
              <Text style={s.marca}>{b.tipo === "numerado" ? `${b.numero}.` : "•"}</Text>
              <Text style={s.itemTexto}>{trechos(b.trechos)}</Text>
            </View>
          );
        }
        return <Text key={i} style={s.texto}>{trechos(b.trechos)}</Text>;
      })}
    </View>
  );
}
```

### src/lib/pdf-para-imagem.ts

```ts
// Converte o PDF já montado (ver OSPdfDocument / OrcamentoPdfDocument) em imagens
// PNG — uma por página.
//
// A imagem sai do próprio PDF em vez de um HTML paralelo: assim existe um só
// layout para manter, e o que o cliente vê na imagem é exatamente o que sairia
// impresso. O pdfjs-dist só é baixado quando alguém escolhe imagem — quem baixa
// em PDF não paga por ele.
//
// Uma imagem por página, e não uma folha empilhada: empilhando, o limite de
// canvas do navegador é dividido entre todas as páginas, então uma OS com fotos
// borrava também o texto da primeira folha. Separadas, cada página usa o limite
// inteiro e sai na resolução cheia — que é o que se lê no WhatsApp.
//
// Os arquivos que o pdf.js busca em `/pdfjs/` são colocados lá por
// scripts/pdfjs-assets.mjs.

const WORKER_URL = "/pdfjs/pdf.worker.min.mjs";
const FONTES_URL = "/pdfjs/standard_fonts/";

// 3x ≈ 220 DPI numa folha A4. Dá para dar zoom no número da peça sem embaçar, e
// o WhatsApp recomprime na hora de enviar — mandar pixel a mais é barato, e a
// nitidez perdida numa origem pequena não volta.
const ESCALA_ALVO = 3;
const ESCALA_MINIMA = 0.75;

// Canvas grande demais volta em branco em alguns celulares, sem erro nenhum.
// Estes limites são conservadores de propósito — vale mais uma imagem um pouco
// menor do que um arquivo vazio na mão do cliente.
const LADO_MAXIMO = 10000;
const AREA_MAXIMA = 16_000_000;

const COR_PAGINA = "#ffffff";

export type ProgressoImagem = { pagina: number; total: number };

/**
 * Rasteriza o PDF em um PNG por página, na ordem do documento.
 *
 * @param onProgresso chamado a cada página desenhada — o botão usa para avisar
 *   que documentos com muitas fotos demoram mais.
 */
export async function pdfParaPngs(
  pdfBlob: Blob,
  onProgresso?: (p: ProgressoImagem) => void
): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;

  const tarefa = pdfjs.getDocument({
    data: new Uint8Array(await pdfBlob.arrayBuffer()),
    standardFontDataUrl: FONTES_URL,
  });

  try {
    const doc = await tarefa.promise;
    const total = doc.numPages;

    // O mesmo canvas serve a todas as páginas: redimensionar já limpa o que
    // havia, e criar um por página deixaria vários bitmaps grandes vivos ao
    // mesmo tempo — que é justamente o que faz o celular devolver folha branca.
    const canvas = document.createElement("canvas");
    if (!canvas.getContext("2d")) throw new Error("Navegador sem suporte a canvas");

    const pngs: Blob[] = [];
    for (let n = 1; n <= total; n++) {
      const pagina = await doc.getPage(n);
      const viewport = pagina.getViewport({ scale: escalaQueCabe(pagina.getViewport({ scale: 1 })) });

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await pagina.render({ canvas, viewport, background: COR_PAGINA }).promise;

      const png = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!png) throw new Error(`Não foi possível gerar a imagem da página ${n}`);
      pngs.push(png);

      // Libera o bitmap antes da próxima página, em vez de esperar o coletor.
      pagina.cleanup();
      onProgresso?.({ pagina: n, total });
    }

    return pngs;
  } finally {
    // Encerra o worker: sem isso ele fica vivo até a aba fechar.
    await tarefa.destroy();
  }
}

/**
 * Maior escala que ainda cabe nos limites de canvas do navegador, para UMA
 * página. A4 em ESCALA_ALVO dá ~1785x2525px, bem dentro do limite — a conta só
 * age em página fora do comum.
 */
function escalaQueCabe({ width, height }: { width: number; height: number }): number {
  const limiteLado = Math.min(LADO_MAXIMO / width, LADO_MAXIMO / height);
  const limiteArea = Math.sqrt(AREA_MAXIMA / (width * height));

  return Math.max(ESCALA_MINIMA, Math.min(ESCALA_ALVO, limiteLado, limiteArea));
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
