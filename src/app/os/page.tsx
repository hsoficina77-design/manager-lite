"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { corMargem, corStatus, labelStatus, margemOS } from "@/lib/constants";
import { useEhDono } from "@/components/UsuarioProvider";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Entrada, Selecao } from "@/components/ui/Campos";
import { EsqueletoLista, FaixaMetricas, Metrica, Vazio } from "@/components/ui/Dados";
import { Busca, Chevron, Mais } from "@/components/ui/Icones";

const TABS = [
  { label: "Todas", value: "" },
  { label: "Pátio", value: "patio" },
  { label: "Entregues", value: "entregues" },
];

const ORDENACOES = [
  { value: "recentes", label: "Mais recentes" },
  { value: "lucro_desc", label: "Maior lucro" },
  { value: "lucro_asc", label: "Menor lucro" },
  { value: "valor_desc", label: "Maior valor" },
] as const;

const POR_PAGINA = 40;

type OS = {
  id: string; numero: number; status: string; descricao: string;
  total: number; pago: boolean; abertura: string; mecanico: string | null;
  lucroReal?: number; // ausente para o operador (ver src/lib/permissoes.ts)
  cliente: { id: string; nome: string; apelido: string | null };
  veiculo: { marca: string; modelo: string; placa: string | null };
};

type Resposta = {
  itens: OS[];
  total: number;
  temMais: boolean;
  resumo: { quantidade: number; faturamento: number; lucro?: number; margem?: number | null };
};

// As abas viram recorte de status no servidor. O agrupamento visual que existia
// aqui perdeu a função quando cada status ganhou cor própria.
const STATUS_DA_ABA: Record<string, string> = {
  patio: "ABERTA,EM_ANDAMENTO,AGUARDANDO_PECA",
  entregues: "ENTREGUE",
};

function OSListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ehDono = useEhDono();

  const aba = searchParams.get("status") || "";
  const q = searchParams.get("q") || "";
  const mecanico = searchParams.get("mecanico") || "";
  const de = searchParams.get("de") || "";
  const ate = searchParams.get("ate") || "";
  const ordenacao = searchParams.get("ordenar") || "recentes";

  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [mecanicos, setMecanicos] = useState<{ id: string; nome: string }[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(!!(mecanico || de || ate));

  const trocarParam = useCallback(
    (mudancas: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor) p.set(chave, valor);
        else p.delete(chave);
      }
      router.replace(p.toString() ? `/os?${p}` : "/os", { scroll: false });
    },
    [router, searchParams]
  );

  // O campo responde a cada tecla; a URL só recebe o termo depois de uma pausa,
  // para não disparar uma consulta por letra. Antes nada disso existia: a busca
  // ficava atrás de "Filtros avançados", exigia o botão Aplicar e ignorava Enter.
  const [busca, setBusca] = useState(q);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    setBusca(q);
  }, [q]);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    if (busca === q) return;
    const t = setTimeout(() => trocarParam({ q: busca }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const consulta = useCallback(
    (pag: number) => {
      const p = new URLSearchParams({
        paginado: "true",
        limite: String(POR_PAGINA),
        pagina: String(pag),
        ordenar: ordenacao,
      });
      if (STATUS_DA_ABA[aba]) p.set("status", STATUS_DA_ABA[aba]);
      if (q) p.set("q", q);
      if (mecanico) p.set("mecanico", mecanico);
      if (de) p.set("de", de);
      if (ate) p.set("ate", ate);
      return `/api/os?${p}`;
    },
    [aba, q, mecanico, de, ate, ordenacao]
  );

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setPagina(0);
    fetch(consulta(0))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Falha ao carregar"))))
      .then((d: Resposta) => !cancelado && setDados(d))
      .catch(() => !cancelado && setDados(null))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [consulta]);

  useEffect(() => {
    fetch("/api/mecanicos")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMecanicos)
      .catch(() => setMecanicos([]));
  }, []);

  async function carregarMais() {
    if (!dados?.temMais || carregandoMais) return;
    setCarregandoMais(true);
    try {
      const res = await fetch(consulta(pagina + 1));
      if (!res.ok) return;
      const novo: Resposta = await res.json();
      setDados({ ...novo, itens: [...dados.itens, ...novo.itens] });
      setPagina((p) => p + 1);
    } finally {
      setCarregandoMais(false);
    }
  }

  function limparFiltros() {
    setBusca("");
    router.replace(aba ? `/os?status=${aba}` : "/os", { scroll: false });
  }

  const temFiltro = !!(q || mecanico || de || ate);
  const itens = dados?.itens ?? [];
  const resumo = dados?.resumo;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-tinta sm:text-2xl">Ordens de serviço</h1>
        <BotaoLink href="/os/nova">
          <Mais tamanho={16} /> Nova OS
        </BotaoLink>
      </div>

      <div className="-mx-4 flex gap-1 overflow-x-auto rounded-lg bg-superficie-3 p-1 px-4 sm:mx-0 sm:w-fit sm:px-1">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/os?status=${tab.value}` : "/os"}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              aba === tab.value
                ? "bg-superficie text-tinta shadow-sm"
                : "text-tinta-3 hover:text-tinta-2"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Busca
            tamanho={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-3"
          />
          <Entrada
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, placa, mecânico ou nº da OS"
            aria-label="Buscar ordens de serviço"
            className="pl-9"
          />
        </div>
        <Selecao
          value={ordenacao}
          onChange={(e) => trocarParam({ ordenar: e.target.value })}
          aria-label="Ordenação"
          className="sm:w-auto"
        >
          {ORDENACOES.filter((o) => ehDono || !o.value.startsWith("lucro")).map((o) => (
            <option key={o.value} value={o.value}>
              Ordenar: {o.label}
            </option>
          ))}
        </Selecao>
        <Botao
          variante="secundario"
          onClick={() => setMostrarFiltros((v) => !v)}
          aria-expanded={mostrarFiltros}
          className="sm:w-auto"
        >
          <Chevron
            tamanho={15}
            className={cn("transition-transform", mostrarFiltros && "rotate-180")}
          />
          Filtros
          {temFiltro && (
            <span className="rounded-full bg-brand-600 px-1.5 text-xs font-bold text-brand-fg">!</span>
          )}
        </Botao>
      </div>

      {mostrarFiltros && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-linha bg-superficie-2 p-3">
          <label className="min-w-40 flex-1">
            <span className="mb-1 block text-xs font-medium text-tinta-2">Mecânico</span>
            <Selecao value={mecanico} onChange={(e) => trocarParam({ mecanico: e.target.value })}>
              <option value="">Todos</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.nome}>
                  {m.nome}
                </option>
              ))}
            </Selecao>
          </label>
          <label className="min-w-32 flex-1">
            <span className="mb-1 block text-xs font-medium text-tinta-2">Aberta de</span>
            <Entrada type="date" value={de} onChange={(e) => trocarParam({ de: e.target.value })} />
          </label>
          <label className="min-w-32 flex-1">
            <span className="mb-1 block text-xs font-medium text-tinta-2">Até</span>
            <Entrada type="date" value={ate} onChange={(e) => trocarParam({ ate: e.target.value })} />
          </label>
          {temFiltro && (
            <Botao variante="secundario" onClick={limparFiltros}>
              Limpar
            </Botao>
          )}
        </div>
      )}

      {/* Resumo do filtro inteiro, não só da página em tela: somar o que veio
          daria um faturamento que muda conforme a pessoa rola. */}
      {resumo && resumo.quantidade > 0 && (
        <FaixaMetricas colunas={ehDono ? 3 : 2}>
          <Metrica rotulo="OS no filtro" valor={String(resumo.quantidade)} />
          <Metrica rotulo="Faturamento" valor={formatCurrency(resumo.faturamento)} />
          {ehDono && (
            <Metrica
              rotulo="Lucro real"
              valor={formatCurrency(resumo.lucro ?? 0)}
              sub={resumo.margem == null ? undefined : `${resumo.margem.toFixed(0)}% de margem`}
              tom={corTom(resumo.margem)}
            />
          )}
        </FaixaMetricas>
      )}

      {carregando ? (
        <EsqueletoLista linhas={6} />
      ) : itens.length === 0 ? (
        temFiltro ? (
          <Vazio
            titulo="Nenhuma OS com esse filtro"
            texto="Ajuste a busca, o mecânico ou o período."
            acao={
              <Botao variante="secundario" onClick={limparFiltros}>
                Limpar filtros
              </Botao>
            }
          />
        ) : (
          <Vazio
            titulo="Nenhuma ordem de serviço ainda"
            texto="Abra a primeira OS quando o carro entrar no pátio."
            acao={
              <BotaoLink href="/os/nova">
                <Mais tamanho={16} /> Nova OS
              </BotaoLink>
            }
          />
        )
      ) : (
        <div className="space-y-3">
          <div className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-superficie">
            {itens.map((os) => (
              <OSRow key={os.id} os={os} ehDono={ehDono} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-tinta-3">
            <span className="tabular-nums">
              {itens.length} de {dados?.total ?? itens.length}
            </span>
            {dados?.temMais && (
              <Botao variante="secundario" onClick={carregarMais} disabled={carregandoMais}>
                {carregandoMais ? "Carregando..." : "Carregar mais"}
              </Botao>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function corTom(margem: number | null | undefined): "ok" | "atencao" | "perigo" {
  if (margem == null) return "perigo";
  if (margem >= 40) return "ok";
  if (margem >= 20) return "atencao";
  return "perigo";
}

function OSRow({ os, ehDono }: { os: OS; ehDono: boolean }) {
  const margem = margemOS({ ...os, lucroReal: os.lucroReal ?? 0 });
  const mostrarLucro = ehDono && os.status !== "CANCELADA" && os.total > 0;
  return (
    <Link
      href={`/os/${os.id}`}
      className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-superficie-2 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex items-center gap-3 sm:contents">
        <div className="w-10 shrink-0 text-center sm:w-12">
          <p className="text-xs text-tinta-3">OS</p>
          <p className="font-bold tabular-nums text-tinta">#{os.numero}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-tinta">{os.cliente.nome}</p>
            {os.cliente.apelido && (
              <span className="shrink-0 rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">
                {os.cliente.apelido}
              </span>
            )}
          </div>
          <p className="truncate text-sm text-tinta-3">
            {os.veiculo.marca} {os.veiculo.modelo}
            {os.veiculo.placa ? ` · ${os.veiculo.placa}` : ""}
            {" · "}
            {os.descricao}
          </p>
        </div>
        <span className={cn("shrink-0 sm:hidden", corStatus(os.status))}>
          {labelStatus(os.status)}
        </span>
      </div>
      <div className="hidden shrink-0 text-sm text-tinta-3 md:block">{os.mecanico || "—"}</div>
      {mostrarLucro && (
        <div
          className="hidden w-20 shrink-0 text-right text-xs tabular-nums lg:block"
          title="Lucro real (após custo de peças)"
        >
          <p className={cn("font-semibold", corMargem(margem))}>
            {formatCurrency(os.lucroReal ?? 0)}
          </p>
          <p className={corMargem(margem)}>{margem === null ? "—" : `${margem.toFixed(0)}%`}</p>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-3">
        <span className={cn("hidden sm:inline-flex", corStatus(os.status))}>
          {labelStatus(os.status)}
        </span>
        <div className="w-24 text-right text-xs tabular-nums">
          <p className="font-semibold text-tinta">{formatCurrency(os.total)}</p>
          <p className={os.pago ? "text-ok" : "text-perigo"}>{os.pago ? "Pago" : "Pendente"}</p>
        </div>
        <p className="hidden text-xs tabular-nums text-tinta-3 sm:block">{formatDate(os.abertura)}</p>
      </div>
    </Link>
  );
}

export default function OSPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6">
          <EsqueletoLista linhas={6} />
        </div>
      }
    >
      <OSListContent />
    </Suspense>
  );
}
