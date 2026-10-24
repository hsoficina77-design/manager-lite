"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { anoVeiculo } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { Area, Aviso, Campo, CampoQuantidade, Entrada } from "@/components/ui/Campos";
import { Painel } from "@/components/ui/Dados";
import { useConfirmar } from "@/components/ui/Avisos";
import { Busca, Confere, Fechar, Lapis, Lixeira, Mais } from "@/components/ui/Icones";
import { EsqueletoLista } from "@/components/ui/Dados";
import { useUsaBoxOS } from "@/components/UsuarioProvider";
import { normalizarPlaca, type LojasDaOficina, type VeiculoCotado } from "./regras";
import { enviarJson, useAoVivo } from "./aoVivo";
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

export function NovaCotacao() {
  const router = useRouter();
  // A busca da placa olha os carros cadastrados no boxOS; sem ele, não há onde procurar.
  const usaBoxOS = useUsaBoxOS();
  const { dados: daOficina, carregar: recarregarLojas } = useAoVivo<LojasDaOficina>("/api/peca-peca/lojas", 60_000);
  const lojasDisponiveis = daOficina?.lojas ?? null;
  const [veiculo, setVeiculo] = useState<VeiculoNaTela>(VEICULO_VAZIO);
  const [busca, setBusca] = useState<EstadoBusca>({ tipo: "nada" });
  const [observacao, setObservacao] = useState("");
  const [pecas, setPecas] = useState<{ descricao: string; quantidade: number }[]>([]);
  const [novaPeca, setNovaPeca] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [editando, setEditando] = useState<{ indice: number; descricao: string; quantidade: string } | null>(null);
  const confirmar = useConfirmar();
  // Nulo até a pessoa mexer: aí vale "todas as lojas".
  const [marcadas, setMarcadas] = useState<string[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const lojas = marcadas ?? (lojasDisponiveis ?? []).map((l) => l.id);

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
    setPecas((lista) => [...lista, { descricao: texto, quantidade: unidades(quantidade) }]);
    setNovaPeca("");
    setQuantidade("1");
  }

  function salvarEdicao() {
    if (!editando) return;
    const texto = editando.descricao.trim();
    if (!texto) return;
    setPecas((lista) =>
      lista.map((p, i) => (i === editando.indice ? { descricao: texto, quantidade: unidades(editando.quantidade) } : p))
    );
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
    setErro("");
    setEnviando(true);
    try {
      const r = await enviarJson("/api/peca-peca/cotacoes", "POST", {
        veiculo: { placa: normalizarPlaca(placa), marca, modelo, ano, motor },
        observacao,
        veiculoId: veiculoId ?? null,
        pecas,
        lojas,
      })();
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(corpo.error ?? "Não consegui enviar a cotação.");
        return;
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
      <Cabecalho titulo="Nova cotação" voltar="/peca-peca" />

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
                <li key={`${p.descricao}-${i}`} className="flex items-center gap-3 px-3 py-1.5">
                  <span className="w-8 shrink-0 text-sm font-semibold text-tinta-2">{p.quantidade}×</span>
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
                  <Botao
                    variante="fantasma"
                    tamanho="icone"
                    onClick={() => tirar(i)}
                    aria-label={`Tirar ${p.descricao}`}
                    className="text-perigo"
                  >
                    <Lixeira tamanho={16} />
                  </Botao>
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
                  <span className="block text-sm font-semibold text-tinta">{l.nome}</span>
                  <span className="block text-xs text-tinta-3">
                    {l.cidade ?? "—"} · entrega em {l.entregaMin}–{l.entregaMax} min
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
