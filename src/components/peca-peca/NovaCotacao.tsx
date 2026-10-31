"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anoVeiculo } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { Area, Aviso, Campo, CampoQuantidade, Entrada } from "@/components/ui/Campos";
import { Painel } from "@/components/ui/Dados";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Busca, Confere, Fechar, Lapis, Lixeira, Mais } from "@/components/ui/Icones";
import { EsqueletoLista } from "@/components/ui/Dados";
import { useUsaBoxOS } from "@/components/UsuarioProvider";
import {
  chassiValido,
  normalizarChassi,
  normalizarPlaca,
  pecaQueVaria,
  prazoDaLoja,
  type CotacaoVista,
  type LojasDaOficina,
  type VeiculoCotado,
} from "./regras";
import { buscar, enviarJson, useAoVivo } from "./aoVivo";
import { EscolherFotos, enviarFotos } from "./FotosDaPeca";
import { Cabecalho, InformarCidade } from "./ui";

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

const VEICULO_VAZIO: VeiculoNaTela = { placa: "", marca: "", modelo: "", ano: "", motor: "" };

/** A cotação nova a partir de uma devolução: a peça que a loja não tinha para trocar. */
type Recotar = { cotacaoId: string; devolucaoId: string };

/** Uma peça da lista, com o que ajuda a acertar: código, recado e fotos (tudo opcional). */
type PecaNaTela = { descricao: string; quantidade: number; codigo: string; observacao: string; fotos: File[] };

const pecaNova = (descricao: string, quantidade: number): PecaNaTela => ({
  descricao,
  quantidade,
  codigo: "",
  observacao: "",
  fotos: [],
});

export function NovaCotacao({ recotar = null }: { recotar?: Recotar | null }) {
  const router = useRouter();
  // A busca da placa olha os carros cadastrados no boxOS; sem ele, não há onde procurar.
  const usaBoxOS = useUsaBoxOS();
  const { dados: daOficina, carregar: recarregarLojas } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojasDisponiveis = daOficina?.lojas ?? null;
  const [veiculo, setVeiculo] = useState<VeiculoNaTela>(VEICULO_VAZIO);
  const [busca, setBusca] = useState<EstadoBusca>({ tipo: "nada" });
  const [observacao, setObservacao] = useState("");
  const [chassi, setChassi] = useState("");
  const [pecas, setPecas] = useState<PecaNaTela[]>([]);
  // Peças com os detalhes abertos. As que variam muito abrem sozinhas, ao entrar na lista.
  const [detalhes, setDetalhes] = useState<Set<number>>(new Set());
  const avisar = useAvisar();
  const [novaPeca, setNovaPeca] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [editando, setEditando] = useState<{ indice: number; descricao: string; quantidade: string } | null>(null);
  const confirmar = useConfirmar();
  // Nulo até a pessoa mexer: aí vale "todas as lojas".
  const [marcadas, setMarcadas] = useState<string[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const lojas = marcadas ?? (lojasDisponiveis ?? []).map((l) => l.id);
  /** Lojas marcadas que só cotam com o chassi. */
  const pedemChassi = (lojasDisponiveis ?? []).filter((l) => l.exigeChassi && lojas.includes(l.id));
  // Vindo da devolução: a loja que não tinha a peça sai das marcadas, e o aviso diz de onde veio.
  const [deOnde, setDeOnde] = useState<{ numero: number; lojaId: string } | null>(null);

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
        setVeiculo({ ...c.veiculo, veiculoId: c.veiculoId ?? undefined, clienteId: c.clienteId ?? undefined });
        setChassi(c.chassi);
        setObservacao([c.observacao, recado].filter(Boolean).join("\n"));
        setPecas([{ ...pecaNova(peca.descricao, d.quantidade), codigo: peca.codigo, observacao: peca.observacao }]);
        setDetalhes(new Set([0]));
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

  const mudar = (campo: keyof VeiculoCotado, valor: string) => setVeiculo((v) => ({ ...v, [campo]: valor }));

  /**
   * Procura a placa nos veículos já cadastrados na oficina. Na versão final, placa
   * desconhecida vai para a consulta veicular paga, que devolve marca, modelo, ano e
   * motor — aqui ela só pede para preencher à mão.
   */
  async function buscarPlaca() {
    const placa = normalizarPlaca(veiculo.placa);
    if (placa.length < 7) {
      setErro("Digite a placa inteira, com 7 letras e números.");
      return;
    }
    setErro("");
    setBusca({ tipo: "buscando" });
    try {
      const [rv, rc] = await Promise.all([fetch("/api/veiculos"), fetch("/api/clientes")]);
      if (!rv.ok || !rc.ok) throw new Error();
      const veiculos: VeiculoDoBoxOS[] = await rv.json();
      const clientes: { id: string; nome: string }[] = await rc.json();
      const achado = veiculos.find((v) => v.placa && normalizarPlaca(v.placa) === placa);
      if (!achado) {
        setVeiculo((v) => ({ ...v, placa, clienteId: undefined, veiculoId: undefined, clienteNome: undefined }));
        setBusca({ tipo: "nao-achou" });
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
      setVeiculo({ ...doCarro, clienteId: achado.clienteId, veiculoId: achado.id, clienteNome });
      // O motor fica sempre aberto: o cadastro às vezes tem só "1.0" e o balconista quer mais.
      const doCadastro = (["marca", "modelo", "ano"] as const).filter((campo) => doCarro[campo].trim());
      setBusca({ tipo: "achou", clienteNome, doCadastro });
    } catch {
      setBusca({ tipo: "erro" });
    }
  }

  // Peça se pede por unidade (o óleo, por litro): a quantidade é inteira.
  const unidades = (valor: string) => Math.max(1, Math.round(Number(valor) || 1));

  function adicionar(descricao = novaPeca) {
    const texto = descricao.trim();
    if (!texto) return;
    if (pecaQueVaria(texto)) setDetalhes((d) => new Set(d).add(pecas.length));
    setPecas((lista) => [...lista, pecaNova(texto, unidades(quantidade))]);
    setNovaPeca("");
    setQuantidade("1");
  }

  function mudarPeca(indice: number, mudanca: Partial<PecaNaTela>) {
    setPecas((lista) => lista.map((p, i) => (i === indice ? { ...p, ...mudanca } : p)));
  }

  function salvarEdicao() {
    if (!editando) return;
    const texto = editando.descricao.trim();
    if (!texto) return;
    mudarPeca(editando.indice, { descricao: texto, quantidade: unidades(editando.quantidade) });
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
    setPecas((lista) => lista.filter((_, j) => j !== indice));
    // Os índices de quem vem depois descem um.
    setDetalhes((d) => new Set([...d].filter((i) => i !== indice).map((i) => (i > indice ? i - 1 : i))));
    setEditando(null);
  }

  function alternarLoja(id: string) {
    setMarcadas(lojas.includes(id) ? lojas.filter((l) => l !== id) : [...lojas, id]);
  }

  async function enviar() {
    const { placa, marca, modelo, ano, motor, veiculoId } = veiculo;
    if (![marca, modelo, ano, motor].every((v) => v.trim())) {
      return setErro("Preencha marca, modelo, ano e motor do veículo.");
    }
    if (pecas.length === 0) return setErro("Adicione ao menos uma peça.");
    if (lojas.length === 0) return setErro("Escolha ao menos uma loja.");
    const vin = normalizarChassi(chassi);
    if (vin && !chassiValido(vin)) return setErro("O chassi tem 17 letras e números (sem I, O e Q). Confira ou deixe em branco.");
    if (!vin && pedemChassi.length > 0) {
      return setErro(
        `${pedemChassi.map((l) => l.nome).join(" e ")} só cota com o chassi. Preencha o chassi ou desmarque a loja.`
      );
    }
    setErro("");
    setEnviando(true);
    try {
      const r = await enviarJson("/api/peca-peca/cotacoes", "POST", {
        veiculo: { placa: normalizarPlaca(placa), marca, modelo, ano, motor, chassi: vin },
        observacao,
        veiculoId: veiculoId ?? null,
        pecas: pecas.map(({ descricao, quantidade, codigo, observacao }) => ({ descricao, quantidade, codigo, observacao })),
        lojas,
      })();
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(corpo.error ?? "Não consegui enviar a cotação.");
        return;
      }
      // As fotos sobem depois que a cotação existe; o balcão as vê na próxima leitura.
      if (pecas.some((p) => p.fotos.length > 0)) {
        const criada = (await (await buscar(`/api/peca-peca/cotacoes/${corpo.id}`)).json()) as CotacaoVista;
        let falhas = 0;
        for (const [i, p] of pecas.entries()) {
          const pecaId = criada.pecas[i]?.id;
          if (pecaId && p.fotos.length > 0) falhas += await enviarFotos(corpo.id, p.fotos, { pecaId });
        }
        if (falhas > 0) avisar(falhas === 1 ? "Uma foto não subiu. A cotação foi enviada mesmo assim." : `${falhas} fotos não subiram. A cotação foi enviada mesmo assim.`, "erro");
      }
      router.push(`/peca-peca/${corpo.id}`);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  // O veículo veio do cadastro: editar à mão desligaria o vínculo sem a pessoa perceber.
  // O que o cadastro não tinha fica aberto para completar.
  const travado = (campo: keyof VeiculoCotado) => busca.tipo === "achou" && busca.doCadastro.includes(campo);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <Cabecalho titulo="Nova cotação" voltar={recotar ? `/peca-peca/${recotar.cotacaoId}` : "/peca-peca"} />

      {deOnde && (
        <p className="rounded-lg border border-linha bg-superficie-2 px-3 py-2 text-sm text-tinta-2">
          Cotação da peça que voltou na cotação #{deOnde.numero}. O carro, a peça e o recado para as lojas já vêm
          preenchidos; confira antes de enviar.
        </p>
      )}

      <Painel
        titulo="1. Veículo"
        ajuda={
          usaBoxOS
            ? "Comece pela placa: se o carro já passou pela oficina, o resto vem sozinho."
            : "A placa é opcional. Marca, modelo, ano e motor são o que o balconista usa para acertar a peça."
        }
      >
        <div className="flex gap-2">
          <Entrada
            value={veiculo.placa}
            onChange={(e) => {
              mudar("placa", e.target.value.toUpperCase());
              if (busca.tipo !== "nada") {
                setBusca({ tipo: "nada" });
                setVeiculo((v) => ({ ...v, clienteId: undefined, veiculoId: undefined, clienteNome: undefined }));
              }
            }}
            onKeyDown={(e) => usaBoxOS && e.key === "Enter" && (e.preventDefault(), buscarPlaca())}
            placeholder="ABC1D23"
            maxLength={8}
            autoCapitalize="characters"
            aria-label="Placa"
            className="max-w-[11rem] font-mono text-base uppercase tracking-widest"
          />
          {usaBoxOS && (
            <Botao variante="contraste" onClick={buscarPlaca} disabled={busca.tipo === "buscando"}>
              <Busca tamanho={16} />
              {busca.tipo === "buscando" ? "Buscando..." : "Buscar placa"}
            </Botao>
          )}
        </div>

        {busca.tipo === "achou" && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-ok-linha bg-ok-fraco px-3 py-2 text-sm text-ok">
            <Confere tamanho={16} className="mt-0.5 shrink-0" />
            <span>
              Achei no boxOS{busca.clienteNome ? <>: carro de <strong>{busca.clienteNome}</strong></> : ""}. O
              orçamento já sai no nome dele.
            </span>
          </p>
        )}
        {busca.tipo === "nao-achou" && (
          <p className="mt-3 rounded-lg border border-atencao-linha bg-atencao-fraco px-3 py-2 text-sm text-atencao">
            Essa placa ainda não passou pela oficina. Preencha os dados do carro abaixo.
          </p>
        )}
        {busca.tipo === "erro" && (
          <Aviso>Não consegui consultar os veículos agora. Preencha à mão e siga.</Aviso>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Campo rotulo="Marca" obrigatorio>
            <Entrada value={veiculo.marca} onChange={(e) => mudar("marca", e.target.value)} disabled={travado("marca")} placeholder="Volkswagen" />
          </Campo>
          <Campo rotulo="Modelo" obrigatorio>
            <Entrada value={veiculo.modelo} onChange={(e) => mudar("modelo", e.target.value)} disabled={travado("modelo")} placeholder="Gol" />
          </Campo>
          <Campo rotulo="Ano" obrigatorio>
            <Entrada value={veiculo.ano} onChange={(e) => mudar("ano", e.target.value)} disabled={travado("ano")} inputMode="numeric" placeholder="2015" />
          </Campo>
          <Campo rotulo="Motor" obrigatorio>
            <Entrada value={veiculo.motor} onChange={(e) => mudar("motor", e.target.value)} placeholder="1.0 12V Flex" />
          </Campo>
        </div>
        <p className="mt-2 text-xs text-tinta-3">
          O motor é o que mais evita peça errada. O balconista confere a aplicação antes de responder.
        </p>
        <Campo
          rotulo={pedemChassi.length > 0 ? "Chassi" : "Chassi (opcional)"}
          obrigatorio={pedemChassi.length > 0}
          ajuda={
            pedemChassi.length > 0
              ? `${pedemChassi.map((l) => l.nome).join(" e ")} só cota com o chassi.`
              : "Com ele, a loja acha a peça exata no catálogo."
          }
          className="mt-4"
        >
          <Entrada
            value={chassi}
            onChange={(e) => setChassi(e.target.value.toUpperCase())}
            maxLength={20}
            autoCapitalize="characters"
            placeholder="17 letras e números"
            className="font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal"
          />
        </Campo>
        <Campo rotulo="Observação (opcional)" className="mt-4">
          <Area
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            placeholder="Ex.: carro com ABS, prefere peça original, precisa para hoje"
          />
        </Campo>
      </Painel>

      <Painel titulo="2. Peças" ajuda="Escreva do jeito que você pede no balcão.">
        <div className="grid grid-cols-[1fr_5.5rem] gap-2 sm:grid-cols-[1fr_6rem_auto]">
          <Entrada
            value={novaPeca}
            onChange={(e) => setNovaPeca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar())}
            placeholder="Ex.: pastilha de freio dianteira"
            aria-label="Peça"
          />
          <CampoQuantidade valor={quantidade} onChange={setQuantidade} onEnter={() => adicionar()} aria-label="Quantidade" />
          <Botao variante="contraste" onClick={() => adicionar()} className="col-span-2 sm:col-span-1">
            <Mais tamanho={16} />
            Adicionar
          </Botao>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGESTOES.filter((s) => !pecas.some((p) => p.descricao === s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => adicionar(s)}
              className="min-h-9 rounded-full border border-linha bg-superficie-2 px-3 text-xs font-medium text-tinta-2 transition-colors hover:border-brand-500 hover:text-tinta"
            >
              + {s}
            </button>
          ))}
        </div>

        {pecas.length > 0 && (
          <ul className="mt-4 divide-y divide-linha rounded-lg border border-linha">
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
                  <Botao
                    variante="fantasma"
                    tamanho="icone"
                    onClick={salvarEdicao}
                    disabled={!editando.descricao.trim()}
                    aria-label="Salvar peça"
                    className="text-ok"
                  >
                    <Confere tamanho={16} />
                  </Botao>
                  <Botao variante="fantasma" tamanho="icone" onClick={() => setEditando(null)} aria-label="Cancelar edição">
                    <Fechar tamanho={16} />
                  </Botao>
                </li>
              ) : (
                <li key={`${p.descricao}-${i}`} className="px-3 py-1.5">
                  <div className="flex items-center gap-3">
                    <span className="w-8 shrink-0 text-sm font-semibold text-tinta-2">{p.quantidade}×</span>
                    <span className="min-w-0 flex-1 text-sm text-tinta">
                      {p.descricao}
                      {!detalhes.has(i) && (p.codigo || p.observacao || p.fotos.length > 0) && (
                        <span className="block text-xs text-tinta-3">
                          {[p.codigo && `cód. ${p.codigo}`, p.observacao, p.fotos.length > 0 && `${p.fotos.length} foto(s)`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                    <Botao
                      variante="fantasma"
                      tamanho="icone"
                      onClick={() => setEditando({ indice: i, descricao: p.descricao, quantidade: String(p.quantidade) })}
                      aria-label={`Editar ${p.descricao}`}
                      className="text-tinta-2"
                    >
                      <Lapis tamanho={16} />
                    </Botao>
                    <Botao
                      variante="fantasma"
                      tamanho="icone"
                      onClick={() => tirar(i)}
                      aria-label={`Tirar ${p.descricao}`}
                      className="text-perigo"
                    >
                      <Lixeira tamanho={16} />
                    </Botao>
                  </div>
                  {detalhes.has(i) ? (
                    <DetalhesDaPeca peca={p} onChange={(mudanca) => mudarPeca(i, mudanca)} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDetalhes((d) => new Set(d).add(i))}
                      className="mb-1 ml-11 min-h-8 text-xs font-medium text-brand-texto underline-offset-2 hover:underline"
                    >
                      + Código, recado ou foto
                    </button>
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </Painel>

      <Painel
        titulo="3. Para quais lojas?"
        ajuda={`${daOficina?.cidade ? `As que atendem ${daOficina.cidade}. ` : ""}Cada loja vê só o seu pedido, nunca o preço da outra.`}
      >
        {daOficina && (!daOficina.cidade || !daOficina.estado) && (
          <div className="mb-3">
            <InformarCidade cidadeAtual={daOficina.cidade} onSalva={recarregarLojas} />
          </div>
        )}
        {!lojasDisponiveis && <EsqueletoLista linhas={2} />}
        {lojasDisponiveis?.length === 0 && (
          <p className="text-sm text-tinta-3">
            Nenhuma autopeça que atende {daOficina?.cidade ?? "a oficina"} está no Peça Peça ainda.
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {(lojasDisponiveis ?? []).map((l) => {
            const marcada = lojas.includes(l.id);
            return (
              <label
                key={l.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  marcada ? "border-brand-500 bg-brand-50" : "border-linha hover:bg-superficie-2"
                )}
              >
                <input
                  type="checkbox"
                  checked={marcada}
                  onChange={() => alternarLoja(l.id)}
                  className="h-5 w-5 accent-brand-600"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-tinta">
                    {l.nome}
                    {l.exigeChassi && (
                      <span className="rounded-full bg-superficie-3 px-1.5 text-[0.7rem] font-medium text-tinta-2">
                        Pede chassi
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-tinta-3">
                    {l.cidade ?? "—"} · entrega em {prazoDaLoja(l)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </Painel>

      {erro && <Aviso>{erro}</Aviso>}

      <div className="flex justify-end">
        <Botao onClick={enviar} disabled={enviando} className="w-full sm:w-auto">
          {enviando ? "Enviando..." : `Enviar para ${lojas.length === 1 ? "a loja" : `${lojas.length} lojas`}`}
        </Botao>
      </div>
    </div>
  );
}

/**
 * O que ajuda a loja a acertar esta peça. Nada é obrigatório; nas peças que mudam muito
 * de um carro para outro, o app só lembra.
 */
function DetalhesDaPeca({ peca, onChange }: { peca: PecaNaTela; onChange: (mudanca: Partial<PecaNaTela>) => void }) {
  const lembrar = pecaQueVaria(peca.descricao) && !peca.codigo.trim() && peca.fotos.length === 0;
  return (
    <div className="mb-2 ml-11 mt-1 space-y-2">
      {lembrar && (
        <p className="rounded-lg border border-atencao-linha bg-atencao-fraco px-3 py-2 text-xs text-atencao">
          Esta peça muda muito de um carro para outro. Se tiver, mande o código, a medida ou uma foto.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <Entrada
          value={peca.codigo}
          onChange={(e) => onChange({ codigo: e.target.value })}
          placeholder={/correia/i.test(peca.descricao) ? "Código ou medida (ex.: 6PK1035)" : "Código da peça (opcional)"}
          aria-label="Código da peça"
          className="font-mono"
        />
        <Entrada
          value={peca.observacao}
          onChange={(e) => onChange({ observacao: e.target.value })}
          placeholder="Recado desta peça (ex.: lado esquerdo)"
          aria-label="Recado desta peça"
        />
      </div>
      <EscolherFotos fotos={peca.fotos} onChange={(fotos) => onChange({ fotos })} />
    </div>
  );
}
