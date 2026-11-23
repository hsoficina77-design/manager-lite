"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { anoVeiculo } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { Area, Aviso, Campo, CampoQuantidade, Entrada } from "@/components/ui/Campos";
import { useConfirmar } from "@/components/ui/Avisos";
import { Busca, Carro, Confere, Fechar, Lapis, Lixeira, Mais, Menos } from "@/components/ui/Icones";
import { EsqueletoLista } from "@/components/ui/Dados";
import { useUsaBoxOS } from "@/components/UsuarioProvider";
import {
  FORMAS_DE_PAGAMENTO,
  MAX_CARROS_POR_ENVIO,
  normalizarPlaca,
  prazoDaLoja,
  type CotacaoVista,
  type FormaDePagamento,
  type LojasDaOficina,
  type VeiculoCotado,
} from "./regras";
import { buscar, enviarJson, useAoVivo } from "./aoVivo";
import { Cabecalho, EscolhaDaForma, InformarCidade, Recado } from "./ui";

/*
 * Nova cotação, uma pergunta por vez.
 *
 * Antes era uma folha só, com veículo, peças, lojas e pagamento empilhados: o mecânico
 * rolava sem saber onde estava nem quanto faltava. Agora é um assistente:
 *
 *   quantos carros → [dados do carro → peças do carro] × N → lojas → conferir e enviar
 *
 * Cada carro vira uma cotação própria (número, orçamento e entrega separados), mas
 * tudo sai num envio só, para as mesmas lojas e com a mesma forma de pagamento.
 */

// As peças que mais se pedem no balcão: um toque e entram na lista.
const SUGESTOES = [
  "Pastilha de freio dianteira",
  "Disco de freio dianteiro",
  "Kit correia dentada",
  "Óleo do motor (litro)",
  "Filtro de óleo",
  "Filtro de ar",
  "Filtro de combustível",
  "Vela de ignição",
  "Amortecedor dianteiro",
  "Bateria",
];

type VeiculoDoBoxOS = {
  id: string;
  clienteId: string;
  marca: string;
  modelo: string;
  placa: string | null;
  ano: number | null;
  anoFabricacao: number | null;
  anoModelo: number | null;
  motorizacao: string | null;
};

type EstadoBusca =
  | { tipo: "nada" }
  | { tipo: "buscando" }
  | { tipo: "achou"; clienteNome?: string; doCadastro: (keyof VeiculoCotado)[] }
  | { tipo: "nao-achou" }
  | { tipo: "erro" };

/** O carro na tela: os dados digitados e, se a placa já estava no boxOS, o vínculo. */
type VeiculoNaTela = VeiculoCotado & { clienteId?: string; veiculoId?: string; clienteNome?: string };

type PecaPedida = { descricao: string; quantidade: number };

type CarroNaTela = {
  veiculo: VeiculoNaTela;
  busca: EstadoBusca;
  observacao: string;
  pecas: PecaPedida[];
};

const novoCarro = (): CarroNaTela => ({
  veiculo: { placa: "", marca: "", modelo: "", ano: "", motor: "" },
  busca: { tipo: "nada" },
  observacao: "",
  pecas: [],
});

/** O que a pessoa já preencheu num carro — para não apagar sem perguntar. */
const temAlgo = (c: CarroNaTela) =>
  c.pecas.length > 0 || [c.veiculo.placa, c.veiculo.marca, c.veiculo.modelo, c.observacao].some((v) => v.trim());

const veiculoCompleto = (v: VeiculoCotado) => [v.marca, v.modelo, v.ano, v.motor].every((x) => x.trim());

/** "Gol 2015" quando já tem modelo; senão, "Carro 2". */
function nomeDoCarro(c: CarroNaTela, i: number) {
  const { modelo, ano } = c.veiculo;
  return modelo.trim() ? [modelo.trim(), ano.trim()].filter(Boolean).join(" ") : `Carro ${i + 1}`;
}

type Passo =
  | { tipo: "quantos" }
  | { tipo: "carro"; i: number }
  | { tipo: "pecas"; i: number }
  | { tipo: "lojas" }
  | { tipo: "enviar" };

const chaveDo = (p: Passo) => ("i" in p ? `${p.tipo}-${p.i}` : p.tipo);

/** A cotação nova a partir de uma devolução: a peça que a loja não tinha para trocar. */
type Recotar = { cotacaoId: string; devolucaoId: string };

export function NovaCotacao({ recotar = null }: { recotar?: Recotar | null }) {
  const router = useRouter();
  // A busca da placa olha os carros cadastrados no boxOS; sem ele, não há onde procurar.
  const usaBoxOS = useUsaBoxOS();
  const { dados: daOficina, carregar: recarregarLojas } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojasDisponiveis = daOficina?.lojas ?? null;
  const confirmar = useConfirmar();

  const [carros, setCarros] = useState<CarroNaTela[]>(() => [novoCarro()]);
  const [quantos, setQuantos] = useState(1);
  // Vindo da devolução já se sabe: é um carro só, e a pergunta "quantos" sai do caminho.
  const passos = useMemo<Passo[]>(
    () => [
      ...(recotar ? [] : [{ tipo: "quantos" } as const]),
      ...carros.flatMap((_, i) => [{ tipo: "carro", i } as const, { tipo: "pecas", i } as const]),
      { tipo: "lojas" },
      { tipo: "enviar" },
    ],
    [carros.length, recotar]
  );
  const [indice, setIndice] = useState(0);
  const [sentido, setSentido] = useState<1 | -1>(1);
  const passo = passos[Math.min(indice, passos.length - 1)];

  // Nulo até a pessoa mexer: aí vale "todas as lojas".
  const [marcadas, setMarcadas] = useState<string[] | null>(null);
  const lojas = marcadas ?? (lojasDisponiveis ?? []).map((l) => l.id);
  // Nula até a pessoa mexer: aí vale a da última cotação.
  const [formaEscolhida, setFormaEscolhida] = useState<FormaDePagamento | null>(null);
  const forma = formaEscolhida ?? daOficina?.formaPagamento ?? "PIX";
  // Vindo da devolução: a loja que não tinha a peça sai das marcadas, e o aviso diz de onde veio.
  const [deOnde, setDeOnde] = useState<{ numero: number; lojaId: string } | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const topo = useRef<HTMLDivElement>(null);

  const deCotacao = recotar?.cotacaoId;
  const deDevolucao = recotar?.devolucaoId;
  useEffect(() => {
    if (!deCotacao || !deDevolucao) return;
    let ativo = true;
    void (async () => {
      try {
        const r = await buscar(`/api/peca-peca/cotacoes/${deCotacao}`, { cache: "no-store" });
        if (!r.ok || !ativo) return;
        const c = (await r.json()) as CotacaoVista;
        const d = c.devolucoes.find((x) => x.id === deDevolucao);
        const peca = c.pecas.find((p) => p.id === d?.pecaId);
        const envio = c.envios.find((e) => e.id === d?.envioId);
        if (!ativo || !d || !peca || !envio) return;
        const recado =
          d.motivo === "ERRADA"
            ? `A peça anterior veio errada${d.detalhe ? `: ${d.detalhe}` : "."}`
            : `A peça anterior veio com defeito${d.detalhe ? `: ${d.detalhe}` : "."}`;
        setCarros([
          {
            veiculo: { ...c.veiculo, veiculoId: c.veiculoId ?? undefined, clienteId: c.clienteId ?? undefined },
            busca: { tipo: "nada" },
            observacao: [c.observacao, recado].filter(Boolean).join("\n"),
            pecas: [{ descricao: peca.descricao, quantidade: d.quantidade }],
          },
        ]);
        setDeOnde({ numero: c.numero, lojaId: envio.lojaId });
      } catch {
        // Sem conexão: a tela abre vazia, como uma cotação nova qualquer.
      }
    })();
    return () => {
      ativo = false;
    };
  }, [deCotacao, deDevolucao]);

  useEffect(() => {
    if (deOnde && lojasDisponiveis && marcadas === null) {
      setMarcadas(lojasDisponiveis.filter((l) => l.id !== deOnde.lojaId).map((l) => l.id));
    }
  }, [deOnde, lojasDisponiveis, marcadas]);

  const mudarCarro = (i: number, mudanca: (c: CarroNaTela) => CarroNaTela) =>
    setCarros((lista) => lista.map((c, j) => (j === i ? mudanca(c) : c)));

  function irPara(novo: number) {
    setErro("");
    setSentido(novo >= indice ? 1 : -1);
    setIndice(Math.max(0, Math.min(novo, passos.length - 1)));
    // Etapa nova começa do alto, se a pessoa tinha rolado para baixo.
    requestAnimationFrame(() => {
      const el = topo.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  /** Confere a etapa atual antes de deixar seguir. Devolve o problema, ou nada. */
  function problemaDaEtapa(p: Passo): string | null {
    if (p.tipo === "carro" && !veiculoCompleto(carros[p.i].veiculo)) {
      return "Preencha marca, modelo, ano e motor. É o que o balconista usa para acertar a peça.";
    }
    if (p.tipo === "pecas" && carros[p.i].pecas.length === 0) return "Adicione ao menos uma peça para este carro.";
    if (p.tipo === "lojas" && lojas.length === 0) return "Escolha ao menos uma loja.";
    return null;
  }

  async function avancar() {
    if (passo.tipo === "quantos") {
      // Diminuir a quantidade apaga os carros do fim: se já tinham algo, pergunta antes.
      const sobram = carros.slice(quantos);
      if (sobram.some(temAlgo)) {
        const ok = await confirmar({
          titulo: sobram.length === 1 ? "Tirar o último carro?" : `Tirar os últimos ${sobram.length} carros?`,
          texto: `${sobram.map((c, j) => nomeDoCarro(c, quantos + j)).join(", ")} já tinha dados. Eles saem da cotação.`,
          acao: "Tirar",
          perigo: true,
        });
        if (!ok) return;
      }
      setCarros((lista) =>
        quantos <= lista.length
          ? lista.slice(0, quantos)
          : [...lista, ...Array.from({ length: quantos - lista.length }, novoCarro)]
      );
      return irPara(indice + 1);
    }
    const problema = problemaDaEtapa(passo);
    if (problema) return setErro(problema);
    if (passo.tipo === "enviar") return enviar();
    irPara(indice + 1);
  }

  async function enviar() {
    // Uma última conferência geral: alguém pode ter voltado e apagado algo.
    const ruim = passos.findIndex((p) => problemaDaEtapa(p));
    if (ruim >= 0) {
      irPara(ruim);
      setErro(problemaDaEtapa(passos[ruim]) ?? "");
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const r = await enviarJson("/api/peca-peca/cotacoes", "POST", {
        formaPagamento: forma,
        lojas,
        carros: carros.map((c) => ({
          veiculo: {
            placa: normalizarPlaca(c.veiculo.placa),
            marca: c.veiculo.marca,
            modelo: c.veiculo.modelo,
            ano: c.veiculo.ano,
            motor: c.veiculo.motor,
          },
          observacao: c.observacao,
          veiculoId: c.veiculo.veiculoId ?? null,
          pecas: c.pecas,
        })),
      })();
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(corpo.error ?? "Não consegui enviar a cotação.");
        return;
      }
      // Um carro: abre a cotação. Vários: a lista, onde aparecem todas juntas.
      router.push(carros.length === 1 ? `/peca-peca/${corpo.id}` : "/peca-peca");
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  const ultimo = passo.tipo === "enviar";
  const rotuloAvancar = enviando
    ? "Enviando..."
    : ultimo
      ? `Enviar ${carros.length === 1 ? "cotação" : `${carros.length} cotações`}`
      : "Continuar";

  return (
    <div ref={topo} className="mx-auto flex max-w-2xl scroll-mt-20 flex-col p-4 pb-0 sm:p-6 sm:pb-0">
      <Cabecalho titulo="Nova cotação" voltar={recotar ? `/peca-peca/${recotar.cotacaoId}` : "/peca-peca"} />

      {deOnde && (
        <Recado tom="marca" className="mt-4">
          Cotação da peça que voltou na cotação #{deOnde.numero}. O carro, a peça e o recado para as lojas já vêm
          preenchidos; confira antes de enviar.
        </Recado>
      )}

      <Trilha passos={passos} atual={indice} carros={carros} onIr={irPara} />

      <div
        key={chaveDo(passo)}
        className="passo-entra mt-6 flex-1"
        style={{ "--sentido": sentido } as React.CSSProperties}
      >
        {passo.tipo === "quantos" && <EtapaQuantos valor={quantos} onChange={setQuantos} onEnter={avancar} />}
        {passo.tipo === "carro" && (
          <EtapaCarro
            carro={carros[passo.i]}
            titulo={carros.length > 1 ? `Carro ${passo.i + 1} de ${carros.length}` : "Qual é o carro?"}
            usaBoxOS={usaBoxOS}
            onMudar={(m) => mudarCarro(passo.i, m)}
            onErro={setErro}
            onEnter={avancar}
          />
        )}
        {passo.tipo === "pecas" && (
          <EtapaPecas
            carro={carros[passo.i]}
            nome={nomeDoCarro(carros[passo.i], passo.i)}
            onMudar={(pecas) => mudarCarro(passo.i, (c) => ({ ...c, pecas }))}
          />
        )}
        {passo.tipo === "lojas" && (
          <EtapaLojas
            daOficina={daOficina}
            lojasDisponiveis={lojasDisponiveis}
            marcadas={lojas}
            onMarcar={setMarcadas}
            onCidadeSalva={recarregarLojas}
          />
        )}
        {passo.tipo === "enviar" && (
          <EtapaEnviar
            carros={carros}
            lojas={(lojasDisponiveis ?? []).filter((l) => lojas.includes(l.id)).map((l) => l.nome)}
            forma={forma}
            onForma={setFormaEscolhida}
            onEditar={(p) => irPara(passos.findIndex((x) => chaveDo(x) === chaveDo(p)))}
          />
        )}
      </div>

      {/* Rodapé colado embaixo: o próximo passo está sempre no mesmo lugar, ao alcance do dedão. */}
      {/* No celular, para logo acima da barra de navegação de baixo (fixa, 3.25rem). */}
      <div className="sticky bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-20 -mx-4 mt-6 border-t border-linha bg-fundo/95 px-4 pt-3 backdrop-blur sm:-mx-6 sm:px-6 md:bottom-0">
        {erro && (
          <div className="mb-3" role="alert">
            <Aviso>{erro}</Aviso>
          </div>
        )}
        <div className="flex gap-2 pb-3">
          {indice > 0 && (
            <Botao variante="secundario" onClick={() => irPara(indice - 1)} disabled={enviando} className="aperta">
              Voltar
            </Botao>
          )}
          <Botao onClick={avancar} disabled={enviando} className="aperta flex-1 text-base">
            {rotuloAvancar}
          </Botao>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ trilha */

/**
 * Onde a pessoa está e quanto falta: um traço por etapa, agrupado por carro. A frase em
 * cima diz em palavras ("Carro 2 de 3 · peças"); os traços, de relance.
 */
function Trilha({
  passos,
  atual,
  carros,
  onIr,
}: {
  passos: Passo[];
  atual: number;
  carros: CarroNaTela[];
  onIr: (i: number) => void;
}) {
  const passo = passos[atual];
  const frase =
    passo.tipo === "quantos"
      ? "Começo"
      : passo.tipo === "lojas"
        ? "Lojas"
        : passo.tipo === "enviar"
          ? "Conferir e enviar"
          : `${carros.length > 1 ? `${nomeDoCarro(carros[passo.i], passo.i)} · ` : ""}${passo.tipo === "carro" ? "dados do carro" : "peças"}`;

  // Grupos: [quantos], [carro i, peças i] por carro, [lojas], [enviar].
  const grupos: { indices: number[] }[] = [];
  passos.forEach((p, i) => {
    const ultimo = grupos[grupos.length - 1];
    const anterior = passos[i - 1];
    if (p.tipo === "pecas" && anterior?.tipo === "carro") ultimo.indices.push(i);
    else grupos.push({ indices: [i] });
  });

  return (
    <nav aria-label="Etapas da cotação" className="mt-5">
      <p className="text-sm text-tinta-3">
        Etapa {atual + 1} de {passos.length} · <span className="font-medium text-tinta-2">{frase}</span>
      </p>
      <ol className="mt-2 flex gap-1.5">
        {grupos.map((g) => (
          <li key={g.indices[0]} className="flex flex-1 gap-0.5" style={{ flexGrow: g.indices.length }}>
            {g.indices.map((i) => {
              const feito = i < atual;
              return (
                <button
                  key={i}
                  type="button"
                  // Só dá para pular para trás: para frente, cada etapa confere a anterior.
                  disabled={!feito}
                  onClick={() => onIr(i)}
                  aria-label={
                    feito ? `Voltar para a etapa ${i + 1}` : i === atual ? `Etapa ${i + 1}, atual` : `Etapa ${i + 1}`
                  }
                  aria-current={i === atual ? "step" : undefined}
                  className="group relative h-6 flex-1 enabled:cursor-pointer"
                >
                  <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-superficie-3">
                    <span
                      className={cn(
                        "absolute inset-0 origin-left rounded-full bg-brand-600 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)]",
                        i <= atual ? "scale-x-100" : "scale-x-0",
                        feito && "group-hover:bg-brand-700"
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------- etapas */

function TituloDaEtapa({ titulo, ajuda }: { titulo: string; ajuda?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold text-tinta [text-wrap:balance]">{titulo}</h2>
      {ajuda && <p className="mt-1.5 max-w-prose text-sm text-tinta-2">{ajuda}</p>}
    </div>
  );
}

/** Quantos carros: o número grande no meio, menos e mais dos lados, e a fila de carros embaixo. */
function EtapaQuantos({
  valor,
  onChange,
  onEnter,
}: {
  valor: number;
  onChange: (n: number) => void;
  onEnter: () => void;
}) {
  const [texto, setTexto] = useState(String(valor));
  const campo = useRef<HTMLInputElement>(null);
  const anterior = useRef(valor);
  useEffect(() => {
    const subiu = valor >= anterior.current;
    const mudou = valor !== anterior.current;
    anterior.current = valor;
    const el = campo.current;
    // Enquanto digita, o número fica parado: animar o campo com o cursor dentro atrapalha.
    if (!el || !mudou || document.activeElement === el) return;
    setTexto(String(valor));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { opacity: 0, transform: `translateY(${subiu ? 40 : -40}%)`, filter: "blur(2px)" },
        { opacity: 1, transform: "none", filter: "none" },
      ],
      { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }
    );
  }, [valor]);

  const fixar = (n: number) => onChange(Math.max(1, Math.min(MAX_CARROS_POR_ENVIO, n)));

  return (
    <div>
      <TituloDaEtapa
        titulo="Quantos carros vão receber orçamento?"
        ajuda="Cada carro vira uma cotação separada, com o orçamento dele. As lojas recebem tudo de uma vez."
      />

      <div className="flex items-center justify-center gap-4 py-4 sm:gap-6">
        <BotaoRedondo onClick={() => fixar(valor - 1)} disabled={valor <= 1} rotulo="Um carro a menos">
          <Menos tamanho={24} />
        </BotaoRedondo>
        <label className="relative flex w-28 flex-col items-center">
          <span className="sr-only">Quantidade de carros</span>
          <input
            ref={campo}
            type="text"
            inputMode="numeric"
            value={texto}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const digitos = e.target.value.replace(/\D/g, "").slice(0, 2);
              setTexto(digitos);
              if (digitos) fixar(Number(digitos));
            }}
            onBlur={() => setTexto(String(valor))}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onEnter())}
            className="w-full rounded-xl border-2 border-transparent bg-transparent text-center text-7xl font-bold tabular-nums text-tinta caret-brand-600 outline-none transition-colors hover:border-linha focus:border-brand-500"
          />
          <span className="mt-1 text-sm font-medium text-tinta-3">{valor === 1 ? "carro" : "carros"}</span>
        </label>
        <BotaoRedondo
          onClick={() => fixar(valor + 1)}
          disabled={valor >= MAX_CARROS_POR_ENVIO}
          rotulo="Um carro a mais"
        >
          <Mais tamanho={24} />
        </BotaoRedondo>
      </div>

      {/* A fila: um carro por orçamento, chegando um de cada vez. */}
      <div aria-hidden="true" className="mt-4 flex min-h-12 flex-wrap items-center justify-center gap-2">
        {Array.from({ length: valor }, (_, i) => (
          <span
            key={i}
            className="carro-chega inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700"
            style={{ animationDelay: `${Math.min(i, 5) * 35}ms` }}
          >
            <Carro tamanho={26} />
          </span>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => fixar(n)}
            aria-pressed={valor === n}
            className={cn(
              "aperta min-h-11 min-w-11 rounded-full border px-4 text-sm font-semibold tabular-nums",
              valor === n
                ? "border-brand-500 bg-brand-50 text-tinta"
                : "border-linha text-tinta-2 hover:border-brand-500 hover:text-tinta"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function BotaoRedondo({
  onClick,
  disabled,
  rotulo,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      className="aperta inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-linha-forte bg-superficie text-tinta hover:border-brand-500 hover:text-brand-700 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function EtapaCarro({
  carro,
  titulo,
  usaBoxOS,
  onMudar,
  onErro,
  onEnter,
}: {
  carro: CarroNaTela;
  titulo: string;
  usaBoxOS: boolean;
  onMudar: (m: (c: CarroNaTela) => CarroNaTela) => void;
  onErro: (erro: string) => void;
  onEnter: () => void;
}) {
  const { veiculo, busca, observacao } = carro;
  const mudar = (campo: keyof VeiculoCotado, valor: string) =>
    onMudar((c) => ({ ...c, veiculo: { ...c.veiculo, [campo]: valor } }));

  /**
   * Procura a placa nos veículos já cadastrados na oficina. Na versão final, placa
   * desconhecida vai para a consulta veicular paga, que devolve marca, modelo, ano e
   * motor — aqui ela só pede para preencher à mão.
   */
  async function buscarPlaca() {
    const placa = normalizarPlaca(veiculo.placa);
    if (placa.length < 7) return onErro("Digite a placa inteira, com 7 letras e números.");
    onErro("");
    onMudar((c) => ({ ...c, busca: { tipo: "buscando" } }));
    try {
      const [rv, rc] = await Promise.all([fetch("/api/veiculos"), fetch("/api/clientes")]);
      if (!rv.ok || !rc.ok) throw new Error();
      const veiculos: VeiculoDoBoxOS[] = await rv.json();
      const clientes: { id: string; nome: string }[] = await rc.json();
      const achado = veiculos.find((v) => v.placa && normalizarPlaca(v.placa) === placa);
      if (!achado) {
        onMudar((c) => ({
          ...c,
          veiculo: { ...c.veiculo, placa, clienteId: undefined, veiculoId: undefined, clienteNome: undefined },
          busca: { tipo: "nao-achou" },
        }));
        return;
      }
      const clienteNome = clientes.find((c) => c.id === achado.clienteId)?.nome;
      const doCarro = {
        placa,
        marca: achado.marca,
        modelo: achado.modelo,
        ano: anoVeiculo(achado) ?? "",
        motor: achado.motorizacao ?? "",
      };
      // O motor fica sempre aberto: o cadastro às vezes tem só "1.0" e o balconista quer mais.
      const doCadastro = (["marca", "modelo", "ano"] as const).filter((campo) => doCarro[campo].trim());
      onMudar((c) => ({
        ...c,
        veiculo: { ...doCarro, clienteId: achado.clienteId, veiculoId: achado.id, clienteNome },
        busca: { tipo: "achou", clienteNome, doCadastro },
      }));
    } catch {
      onMudar((c) => ({ ...c, busca: { tipo: "erro" } }));
    }
  }

  // O veículo veio do cadastro: editar à mão desligaria o vínculo sem a pessoa perceber.
  // O que o cadastro não tinha fica aberto para completar.
  const travado = (campo: keyof VeiculoCotado) => busca.tipo === "achou" && busca.doCadastro.includes(campo);
  const enter = (e: React.KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), onEnter());

  return (
    <div>
      <TituloDaEtapa
        titulo={titulo}
        ajuda={
          usaBoxOS
            ? "Comece pela placa: se o carro já passou pela oficina, o resto vem sozinho."
            : "A placa é opcional. Marca, modelo, ano e motor são o que o balconista usa para acertar a peça."
        }
      />

      <Campo rotulo="Placa">
        <div className="flex gap-2">
          <Entrada
            value={veiculo.placa}
            onChange={(e) => {
              const placa = e.target.value.toUpperCase();
              onMudar((c) =>
                c.busca.tipo === "nada"
                  ? { ...c, veiculo: { ...c.veiculo, placa } }
                  : {
                      ...c,
                      busca: { tipo: "nada" },
                      veiculo: { ...c.veiculo, placa, clienteId: undefined, veiculoId: undefined, clienteNome: undefined },
                    }
              );
            }}
            onKeyDown={(e) => usaBoxOS && e.key === "Enter" && (e.preventDefault(), buscarPlaca())}
            placeholder="ABC1D23"
            maxLength={8}
            autoCapitalize="characters"
            autoFocus={!veiculo.placa && !veiculo.marca}
            className="max-w-[11rem] font-mono text-lg uppercase tracking-widest"
          />
          {usaBoxOS && (
            <Botao variante="contraste" onClick={buscarPlaca} disabled={busca.tipo === "buscando"} className="aperta">
              <Busca tamanho={16} />
              {busca.tipo === "buscando" ? "Buscando..." : "Buscar placa"}
            </Botao>
          )}
        </div>
      </Campo>

      {busca.tipo === "achou" && (
        <Recado tom="ok" className="linha-entra mt-3">
          <span className="flex items-start gap-2">
            <Confere tamanho={16} className="mt-0.5 shrink-0 text-ok" />
            <span>
              Achei no boxOS{busca.clienteNome ? <>: carro de <strong>{busca.clienteNome}</strong></> : ""}. O
              orçamento já sai no nome dele.
            </span>
          </span>
        </Recado>
      )}
      {busca.tipo === "nao-achou" && (
        <Recado className="linha-entra mt-3">
          Essa placa ainda não passou pela oficina. Preencha os dados do carro abaixo.
        </Recado>
      )}
      {busca.tipo === "erro" && (
        <div className="mt-3">
          <Aviso>Não consegui consultar os veículos agora. Preencha à mão e siga.</Aviso>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Campo rotulo="Marca" obrigatorio>
          <Entrada value={veiculo.marca} onChange={(e) => mudar("marca", e.target.value)} onKeyDown={enter} disabled={travado("marca")} placeholder="Volkswagen" />
        </Campo>
        <Campo rotulo="Modelo" obrigatorio>
          <Entrada value={veiculo.modelo} onChange={(e) => mudar("modelo", e.target.value)} onKeyDown={enter} disabled={travado("modelo")} placeholder="Gol" />
        </Campo>
        <Campo rotulo="Ano" obrigatorio>
          <Entrada value={veiculo.ano} onChange={(e) => mudar("ano", e.target.value)} onKeyDown={enter} disabled={travado("ano")} inputMode="numeric" placeholder="2015" />
        </Campo>
        <Campo rotulo="Motor" obrigatorio>
          <Entrada value={veiculo.motor} onChange={(e) => mudar("motor", e.target.value)} onKeyDown={enter} placeholder="1.0 12V Flex" />
        </Campo>
      </div>
      <p className="mt-2 text-xs text-tinta-3">
        O motor é o que mais evita peça errada. O balconista confere a aplicação antes de responder.
      </p>

      <Campo rotulo="Recado para as lojas (opcional)" className="mt-5">
        <Area
          value={observacao}
          onChange={(e) => onMudar((c) => ({ ...c, observacao: e.target.value }))}
          rows={2}
          placeholder="Ex.: carro com ABS, prefere peça original, precisa para hoje"
        />
      </Campo>
    </div>
  );
}

function EtapaPecas({
  carro,
  nome,
  onMudar,
}: {
  carro: CarroNaTela;
  nome: string;
  onMudar: (pecas: PecaPedida[]) => void;
}) {
  const { pecas } = carro;
  const confirmar = useConfirmar();
  const [novaPeca, setNovaPeca] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [editando, setEditando] = useState<{ indice: number; descricao: string; quantidade: string } | null>(null);
  // A peça que acabou de entrar anima; as que já estavam ficam quietas.
  const [recem, setRecem] = useState<number | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  // Peça se pede por unidade (o óleo, por litro): a quantidade é inteira.
  const unidades = (valor: string) => Math.max(1, Math.round(Number(valor) || 1));

  function adicionar(descricao = novaPeca) {
    const texto = descricao.trim();
    if (!texto) return;
    setRecem(pecas.length);
    onMudar([...pecas, { descricao: texto, quantidade: unidades(quantidade) }]);
    setNovaPeca("");
    setQuantidade("1");
    campo.current?.focus();
  }

  function salvarEdicao() {
    if (!editando) return;
    const texto = editando.descricao.trim();
    if (!texto) return;
    onMudar(pecas.map((p, i) => (i === editando.indice ? { descricao: texto, quantidade: unidades(editando.quantidade) } : p)));
    setEditando(null);
  }

  async function tirar(indice: number) {
    const ok = await confirmar({
      titulo: "Tirar esta peça da lista?",
      texto: `${pecas[indice].quantidade}× ${pecas[indice].descricao}`,
      acao: "Tirar peça",
      perigo: true,
    });
    if (!ok) return;
    setRecem(null);
    onMudar(pecas.filter((_, j) => j !== indice));
    setEditando(null);
  }

  const sugestoes = SUGESTOES.filter((s) => !pecas.some((p) => p.descricao === s));

  return (
    <div>
      <TituloDaEtapa titulo={`Quais peças para o ${nome}?`} ajuda="Escreva do jeito que você pede no balcão." />

      <div className="grid grid-cols-[1fr_5rem] gap-2 sm:grid-cols-[1fr_5.5rem_auto]">
        <Entrada
          ref={campo}
          value={novaPeca}
          onChange={(e) => setNovaPeca(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar())}
          placeholder="Ex.: pastilha de freio dianteira"
          aria-label="Peça"
          autoFocus={pecas.length === 0}
        />
        <CampoQuantidade valor={quantidade} onChange={setQuantidade} onEnter={() => adicionar()} aria-label="Quantidade" />
        <Botao variante="contraste" onClick={() => adicionar()} disabled={!novaPeca.trim()} className="aperta col-span-2 sm:col-span-1">
          <Mais tamanho={16} />
          Adicionar
        </Botao>
      </div>

      {/* A lista vem logo abaixo do campo: no celular, a peça adicionada aparece sem rolar. */}
      {pecas.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-sm font-semibold text-tinta">
            {pecas.length === 1 ? "1 peça na lista" : `${pecas.length} peças na lista`}
          </p>
          <ul className="divide-y divide-linha rounded-xl border border-linha bg-superficie">
            {pecas.map((p, i) =>
              editando?.indice === i ? (
                <li key={`${p.descricao}-${i}`} className="flex items-center gap-2 px-3 py-1.5">
                  <Entrada
                    value={editando.descricao}
                    onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.preventDefault(), salvarEdicao());
                      if (e.key === "Escape") setEditando(null);
                    }}
                    autoFocus
                    aria-label="Peça"
                    className="min-w-0 flex-1"
                  />
                  <CampoQuantidade
                    valor={editando.quantidade}
                    onChange={(valor) => setEditando({ ...editando, quantidade: valor })}
                    onEnter={salvarEdicao}
                    aria-label="Quantidade"
                    className="w-16 shrink-0"
                  />
                  <Botao variante="fantasma" tamanho="icone" onClick={salvarEdicao} disabled={!editando.descricao.trim()} aria-label="Salvar peça" className="text-ok">
                    <Confere tamanho={16} />
                  </Botao>
                  <Botao variante="fantasma" tamanho="icone" onClick={() => setEditando(null)} aria-label="Cancelar edição">
                    <Fechar tamanho={16} />
                  </Botao>
                </li>
              ) : (
                <li key={`${p.descricao}-${i}`} className={cn("flex items-center gap-3 px-3 py-1.5", i === recem && "linha-entra")}>
                  <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-tinta-2">{p.quantidade}×</span>
                  <span className="min-w-0 flex-1 text-sm text-tinta">{p.descricao}</span>
                  <Botao
                    variante="fantasma"
                    tamanho="icone"
                    onClick={() => setEditando({ indice: i, descricao: p.descricao, quantidade: String(p.quantidade) })}
                    aria-label={`Editar ${p.descricao}`}
                    className="text-tinta-2"
                  >
                    <Lapis tamanho={16} />
                  </Botao>
                  <Botao variante="fantasma" tamanho="icone" onClick={() => tirar(i)} aria-label={`Tirar ${p.descricao}`} className="text-perigo">
                    <Lixeira tamanho={16} />
                  </Botao>
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {sugestoes.length > 0 && (
        <div className="mt-5">
          <p className="mb-1.5 text-xs font-medium text-tinta-3">As mais pedidas, um toque e entra:</p>
          <div className="flex flex-wrap gap-1.5">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => adicionar(s)}
                className="aperta min-h-9 rounded-full border border-linha bg-superficie-2 px-3 text-xs font-medium text-tinta-2 hover:border-brand-500 hover:text-tinta"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EtapaLojas({
  daOficina,
  lojasDisponiveis,
  marcadas,
  onMarcar,
  onCidadeSalva,
}: {
  daOficina: LojasDaOficina | null;
  lojasDisponiveis: LojasDaOficina["lojas"] | null;
  marcadas: string[];
  onMarcar: (ids: string[]) => void;
  onCidadeSalva: () => void;
}) {
  const alternar = (id: string) =>
    onMarcar(marcadas.includes(id) ? marcadas.filter((l) => l !== id) : [...marcadas, id]);
  const todas = (lojasDisponiveis ?? []).map((l) => l.id);
  const todasMarcadas = todas.length > 0 && todas.every((id) => marcadas.includes(id));

  return (
    <div>
      <TituloDaEtapa
        titulo="Para quais lojas?"
        ajuda={`${daOficina?.cidade ? `As que atendem ${daOficina.cidade}. ` : ""}Cada loja vê só o seu pedido, nunca o preço da outra.`}
      />
      {daOficina && (!daOficina.cidade || !daOficina.estado) && (
        <div className="mb-4">
          <InformarCidade cidadeAtual={daOficina.cidade} onSalva={onCidadeSalva} />
        </div>
      )}
      {!lojasDisponiveis && <EsqueletoLista linhas={2} />}
      {lojasDisponiveis?.length === 0 && (
        <p className="text-sm text-tinta-3">
          Nenhuma autopeça que atende {daOficina?.cidade ?? "a oficina"} está no Peça Peça ainda.
        </p>
      )}
      {todas.length > 1 && (
        <button
          type="button"
          onClick={() => onMarcar(todasMarcadas ? [] : todas)}
          className="mb-2 text-sm font-medium text-brand-texto underline-offset-4 hover:underline"
        >
          {todasMarcadas ? "Desmarcar todas" : "Marcar todas"}
        </button>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {(lojasDisponiveis ?? []).map((l) => {
          const marcada = marcadas.includes(l.id);
          return (
            <label
              key={l.id}
              className={cn(
                "aperta flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2",
                marcada ? "border-brand-500 bg-brand-50" : "border-linha hover:bg-superficie-2"
              )}
            >
              <input type="checkbox" checked={marcada} onChange={() => alternar(l.id)} className="h-5 w-5 accent-brand-600" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-tinta">{l.nome}</span>
                <span className="block text-xs text-tinta-3">
                  {l.cidade ?? "Cidade não informada"}, entrega em {prazoDaLoja(l)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Última etapa: a forma de pagamento e um resumo de tudo, com atalho para corrigir. */
function EtapaEnviar({
  carros,
  lojas,
  forma,
  onForma,
  onEditar,
}: {
  carros: CarroNaTela[];
  lojas: string[];
  forma: FormaDePagamento;
  onForma: (f: FormaDePagamento) => void;
  onEditar: (p: Passo) => void;
}) {
  return (
    <div>
      <TituloDaEtapa titulo="Confira e envie" ajuda="Toque em qualquer parte para corrigir antes de mandar." />

      <section>
        <h3 className="text-sm font-semibold text-tinta">Como vai pagar?</h3>
        <p className="mb-2 mt-0.5 text-xs text-tinta-3">
          A loja usa isso para dar o desconto: Pix e dinheiro costumam sair mais barato que o cartão.
        </p>
        <EscolhaDaForma valor={forma} onChange={onForma} />
      </section>

      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-tinta">
          {carros.length === 1 ? "O carro" : `${carros.length} carros, ${carros.length} cotações`}
        </h3>
        <ul className="space-y-2">
          {carros.map((c, i) => (
            <li
              key={i}
              className="carro-chega rounded-xl border border-linha bg-superficie"
              style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
            >
              <button
                type="button"
                onClick={() => onEditar({ tipo: "carro", i })}
                className="flex w-full items-center gap-3 rounded-t-xl px-3 py-2.5 text-left hover:bg-superficie-2"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Carro tamanho={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-tinta">
                    {[c.veiculo.marca, c.veiculo.modelo].filter(Boolean).join(" ")} {c.veiculo.ano}
                  </span>
                  <span className="block truncate text-xs text-tinta-3">
                    {[c.veiculo.motor, normalizarPlaca(c.veiculo.placa)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <Lapis tamanho={16} className="shrink-0 text-tinta-3" />
              </button>
              <button
                type="button"
                onClick={() => onEditar({ tipo: "pecas", i })}
                className="flex w-full items-start gap-3 rounded-b-xl border-t border-linha px-3 py-2.5 text-left hover:bg-superficie-2"
              >
                <span className="min-w-0 flex-1 text-sm text-tinta-2">
                  {c.pecas.map((p) => `${p.quantidade}× ${p.descricao}`).join(", ")}
                </span>
                <Lapis tamanho={16} className="mt-0.5 shrink-0 text-tinta-3" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-tinta">Vai para</h3>
        <button
          type="button"
          onClick={() => onEditar({ tipo: "lojas" })}
          className="mt-1 flex w-full items-center gap-3 rounded-xl border border-linha bg-superficie px-3 py-2.5 text-left hover:bg-superficie-2"
        >
          <span className="min-w-0 flex-1 text-sm text-tinta-2">
            {lojas.length === 0 ? "Nenhuma loja" : lojas.join(", ")}
          </span>
          <Lapis tamanho={16} className="shrink-0 text-tinta-3" />
        </button>
        <p className="mt-2 text-xs text-tinta-3">
          Pagamento: {FORMAS_DE_PAGAMENTO[forma].rotulo}. Dá para mudar até fazer o pedido.
        </p>
      </section>
    </div>
  );
}
