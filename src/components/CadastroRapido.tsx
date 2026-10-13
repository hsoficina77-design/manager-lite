"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { Entrada } from "@/components/ui/Campos";
import { Mais } from "@/components/ui/Icones";
import { Modal } from "@/components/ui/Modal";
import VeiculoCampos, {
  VEICULO_FORM_VAZIO,
  veiculoCompleto,
  veiculoIniciado,
  type VeiculoForm,
} from "./VeiculoCampos";

/*
 * Cadastro rápido de cliente e de veículo, sem sair da tela.
 *
 * Nasceu no orçamento e foi para a OS. Quem toca em "Nova OS" com o cliente na frente
 * e descobre que ele ainda não está no sistema não pode ser mandado para outra tela:
 * perde o caminho e, no celular, o que já tinha digitado. Aqui entra o mínimo — nome,
 * telefone, apelido e o carro —; o resto se completa depois, na ficha do cliente.
 */

export type ClienteCriado = { id: string; nome: string; telefone: string | null };

/** O veículo como a API devolve. Cada formulário usa um pedaço dele. */
export type VeiculoCriado = {
  id: string;
  marca: string;
  modelo: string;
  placa: string | null;
  ano: number | null;
  anoFabricacao: number | null;
  anoModelo: number | null;
  combustivel: string | null;
};

/**
 * O que foi digitado na busca de cliente vira o começo do cadastro: número vai para o
 * telefone (a busca também acha por telefone), o resto para o nome.
 */
export function inicialDaBusca(busca: string): { nome?: string; telefone?: string } {
  const termo = busca.trim();
  if (!termo) return {};
  return /^[\d\s()+-]+$/.test(termo) ? { telefone: termo } : { nome: termo };
}

/** O "+ Novo cliente" / "+ Outro veículo" ao lado do rótulo do campo. */
export function BotaoCadastroRapido({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    // Margens negativas: o alvo tem 36px, mas não empurra a linha do rótulo para baixo
    // — senão o campo de cliente e o de veículo, lado a lado, ficariam desalinhados.
    <button
      type="button"
      onClick={onClick}
      className="-my-1.5 -mr-2 inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand-texto transition-colors hover:bg-brand-50"
    >
      <Mais tamanho={15} />
      {children}
    </button>
  );
}

const rotuloCls = "mb-1 block text-sm font-medium text-tinta-2";

export function NovoClienteModal({
  inicial,
  descricao,
  exigirVeiculo = false,
  exigirTelefone = false,
  notaVeiculo,
  onCriado,
  onFechar,
}: {
  inicial?: { nome?: string; telefone?: string };
  descricao: string;
  /** Na OS o carro é obrigatório; no orçamento, que pode ser rascunho, não. */
  exigirVeiculo?: boolean;
  exigirTelefone?: boolean;
  /** Linha acima dos campos do veículo (o orçamento lembra o que foi anotado). */
  notaVeiculo?: string;
  /** O veículo vai junto para quem chamou poder aproveitar o KM. */
  onCriado: (cliente: ClienteCriado, veiculo: VeiculoForm | null) => void;
  onFechar: () => void;
}) {
  const [cliente, setCliente] = useState({
    nome: inicial?.nome ?? "",
    telefone: inicial?.telefone ?? "",
    apelido: "",
  });
  const [veiculo, setVeiculo] = useState<VeiculoForm>(VEICULO_FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente.nome.trim()) { setErro("Informe o nome do cliente."); return; }
    if (exigirTelefone && !cliente.telefone.trim()) { setErro("Informe o telefone do cliente."); return; }
    const temVeiculo = veiculoCompleto(veiculo);
    if (exigirVeiculo && !temVeiculo) { setErro("Informe ao menos a marca e o modelo do veículo."); return; }
    // Veículo opcional é tudo-ou-nada: se começou a preencher, marca e modelo são obrigatórios.
    if (veiculoIniciado(veiculo) && !temVeiculo) {
      setErro("Para cadastrar o veículo, informe ao menos marca e modelo.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: cliente.nome,
          telefone: cliente.telefone || undefined,
          apelido: cliente.apelido || undefined,
          ...(temVeiculo ? { veiculo } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Erro ao criar cliente"); return; }
      onCriado(data, temVeiculo ? veiculo : null);
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Novo cliente"
      descricao={descricao}
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="flex gap-2">
          <Botao type="submit" form="form-novo-cliente" className="flex-1" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar cliente"}
          </Botao>
          <Botao variante="secundario" className="flex-1" onClick={onFechar}>
            Cancelar
          </Botao>
        </div>
      }
    >
      <form id="form-novo-cliente" onSubmit={salvar} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className={rotuloCls} htmlFor="nc-nome">
              Nome <span className="text-perigo">*</span>
            </label>
            <Entrada
              id="nc-nome"
              data-foco-inicial
              required
              value={cliente.nome}
              onChange={(e) => setCliente({ ...cliente, nome: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={rotuloCls} htmlFor="nc-tel">
                Telefone {exigirTelefone && <span className="text-perigo">*</span>}
              </label>
              <Entrada
                id="nc-tel"
                type="tel"
                required={exigirTelefone}
                value={cliente.telefone}
                onChange={(e) => setCliente({ ...cliente, telefone: e.target.value })}
                placeholder="(11) 90000-0000"
              />
            </div>
            <div>
              <label className={rotuloCls} htmlFor="nc-apelido">
                Apelido
              </label>
              <Entrada
                id="nc-apelido"
                value={cliente.apelido}
                onChange={(e) => setCliente({ ...cliente, apelido: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg bg-superficie-2 p-3">
          <p className="text-xs font-medium text-tinta-2">
            {exigirVeiculo ? "Veículo" : "Veículo (opcional — necessário para converter em OS)"}
          </p>
          {notaVeiculo && <p className="text-xs text-tinta-3">{notaVeiculo}</p>}
          <VeiculoCampos value={veiculo} onChange={setVeiculo} obrigatorio={exigirVeiculo} />
        </div>

        {erro && <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>}
      </form>
    </Modal>
  );
}

/** Carro novo para um cliente que já existe — o cliente sem veículo, ou o segundo carro. */
export function NovoVeiculoModal({
  clienteId,
  clienteNome,
  onCriado,
  onFechar,
}: {
  clienteId: string;
  clienteNome?: string;
  onCriado: (veiculo: VeiculoCriado, form: VeiculoForm) => void;
  onFechar: () => void;
}) {
  const [veiculo, setVeiculo] = useState<VeiculoForm>(VEICULO_FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!veiculoCompleto(veiculo)) { setErro("Informe ao menos a marca e o modelo do veículo."); return; }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...veiculo, clienteId }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Erro ao cadastrar veículo"); return; }
      onCriado(data, veiculo);
    } catch {
      setErro("Sem conexão com o servidor. Verifique a internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Novo veículo"
      descricao={clienteNome ? `Fica no cadastro de ${clienteNome}.` : undefined}
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="flex gap-2">
          <Botao type="submit" form="form-novo-veiculo" className="flex-1" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar veículo"}
          </Botao>
          <Botao variante="secundario" className="flex-1" onClick={onFechar}>
            Cancelar
          </Botao>
        </div>
      }
    >
      <form id="form-novo-veiculo" onSubmit={salvar} className="space-y-4">
        <VeiculoCampos value={veiculo} onChange={setVeiculo} obrigatorio />
        {erro && <p className="rounded-lg bg-perigo-fraco px-3 py-2 text-sm text-perigo">{erro}</p>}
      </form>
    </Modal>
  );
}
