"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn, normalizarBusca } from "@/lib/utils";
import { rotuloDoMunicipio, type Municipio } from "@/lib/municipios";
import { CampoCidade } from "@/components/ui/CampoCidade";
import type { LojaDoPainel } from "@/lib/balcao";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Botao, classesBotao } from "@/components/ui/Botao";
import { Aviso, Campo, Entrada } from "@/components/ui/Campos";
import { Vazio } from "@/components/ui/Dados";
import { Modal } from "@/components/ui/Modal";
import { Mais } from "@/components/ui/Icones";
import { Equipe } from "@/components/peca-peca/Equipe";
import { CidadesAtendidas, outrasCidades } from "@/components/peca-peca/CidadesAtendidas";
import { ENTREGAS_PARA_MEDIA, prazoDaLoja } from "@/components/peca-peca/regras";
import { ACESSOS_DA_PLATAFORMA } from "@/lib/acessos-loja";

// Cadastro das autopeças do Peça Peça — manual, do dono da plataforma.
//
// A região de uma loja é a lista de cidades que ela atende. É por ela que cada oficina
// vê as lojas certas: a oficina de Suzano vê toda loja que tem Suzano na lista, esteja
// ela em Suzano ou em Ferraz.
//
// Quem trabalha na loja entra com login, pela equipe: a plataforma convida o dono, e
// ele convida os vendedores. O link antigo do balcão só aparece para loja que ainda não
// tem ninguém com conta. O dono também mexe nas cidades, pela tela "Loja" dele.
//
// O tempo de entrega não se digita: é medido nas entregas (ver regras.ts).

const chave = (cidade: string) => normalizarBusca(cidade);

type Formulario = {
  nome: string;
  /** Onde a loja fica — município escolhido da lista do IBGE. */
  sede: Municipio | null;
  /** As outras cidades da região, como "Suzano - SP". */
  atende: string[];
  telefone: string;
};

const FORM_VAZIO: Formulario = { nome: "", sede: null, atende: [], telefone: "" };

export function Lojas({
  lojas,
  enderecoPecaPeca,
}: {
  lojas: LojaDoPainel[];
  /** Onde a loja abre o balcão: o endereço do Peça Peça, quando configurado. */
  enderecoPecaPeca: string | null;
}) {
  const router = useRouter();
  const avisar = useAvisar();
  const confirmar = useConfirmar();
  const [filtro, setFiltro] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ loja: LojaDoPainel | null } | null>(null);
  const [equipeDe, setEquipeDe] = useState<LojaDoPainel | null>(null);
  const linkCompleto = (l: LojaDoPainel) => `${enderecoPecaPeca ?? window.location.origin}${l.link}`;

  // As cidades que aparecem nas regiões, com quantas lojas ativas atendem cada uma.
  const cidades = new Map<string, { nome: string; lojas: number }>();
  for (const l of lojas) {
    for (const c of l.atende) {
      const atual = cidades.get(chave(c)) ?? { nome: c, lojas: 0 };
      cidades.set(chave(c), { ...atual, lojas: atual.lojas + (l.ativa ? 1 : 0) });
    }
  }
  const listaDeCidades = [...cidades.entries()].sort((a, b) => a[1].nome.localeCompare(b[1].nome, "pt-BR"));
  const visiveis = filtro ? lojas.filter((l) => l.atende.some((c) => chave(c) === filtro)) : lojas;

  async function chamar(url: string, metodo: "POST" | "PATCH", corpo?: unknown) {
    try {
      const r = await fetch(url, {
        method: metodo,
        headers: corpo ? { "Content-Type": "application/json" } : undefined,
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        avisar(json.error || "Não deu certo. Tente de novo.", "erro");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      avisar("Sem conexão com o servidor", "erro");
      return false;
    }
  }

  async function copiar(l: LojaDoPainel) {
    try {
      await navigator.clipboard.writeText(linkCompleto(l));
      avisar(`Link copiado: balcão ${l.nome}`);
    } catch {
      avisar("Não deu para copiar. Abra o balcão e copie o endereço da aba.", "erro");
    }
  }

  async function trocarLink(l: LojaDoPainel) {
    const ok = await confirmar({
      titulo: `Trocar o link do balcão ${l.nome}?`,
      texto: "O link de hoje para de funcionar na hora. Mande o novo para a loja logo em seguida.",
      acao: "Trocar link",
      perigo: true,
    });
    if (ok && (await chamar(`/api/plataforma/lojas/${l.id}/link`, "POST"))) avisar("Link novo gerado. Copie e mande para a loja.");
  }

  async function ligarDesligar(l: LojaDoPainel) {
    if (l.ativa) {
      const ok = await confirmar({
        titulo: `Desativar ${l.nome}?`,
        texto: "A loja some da tela de cotação das oficinas e o link do balcão para de abrir. As cotações antigas continuam. Dá para ativar de novo depois.",
        acao: "Desativar",
        perigo: true,
      });
      if (!ok) return;
    }
    if (await chamar(`/api/plataforma/lojas/${l.id}`, "PATCH", { ativa: !l.ativa })) {
      avisar(l.ativa ? `${l.nome} desativada` : `${l.nome} ativada`);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filtro por cidade: é a "região" vista do lado da oficina. */}
        <div className="flex flex-wrap gap-1.5">
          <Chip ativo={filtro === null} onClick={() => setFiltro(null)}>
            Todas ({lojas.length})
          </Chip>
          {listaDeCidades.map(([k, c]) => (
            <Chip key={k} ativo={filtro === k} onClick={() => setFiltro(k)}>
              {c.nome} ({c.lojas})
            </Chip>
          ))}
        </div>
        <Botao onClick={() => setEditando({ loja: null })}>
          <Mais tamanho={16} />
          Nova loja
        </Botao>
      </div>

      {equipeDe && (
        <section className="space-y-2 rounded-xl border-2 border-brand-500 bg-superficie-2 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-tinta">Equipe da {equipeDe.nome}</p>
            <Botao
              variante="secundario"
              tamanho="denso"
              onClick={() => {
                setEquipeDe(null);
                router.refresh();
              }}
            >
              Fechar
            </Botao>
          </div>
          <p className="text-xs text-tinta-3">
            Convide o dono da loja: ele entra pelo link, cria a senha e daí convida os vendedores.
          </p>
          <Equipe api={`/api/plataforma/lojas/${equipeDe.id}/equipe`} meusAcessos={ACESSOS_DA_PLATAFORMA} />
        </section>
      )}

      {filtro && (
        <p className="text-sm text-tinta-3">
          Lojas que atendem <strong className="text-tinta-2">{cidades.get(filtro)?.nome}</strong> — é o que uma oficina
          dessa cidade vê ao cotar.
        </p>
      )}

      {lojas.length === 0 ? (
        <Vazio
          titulo="Nenhuma loja cadastrada"
          texto="Cadastre a primeira autopeça e convide o dono dela pela equipe, no cartão da loja."
          acao={<Botao onClick={() => setEditando({ loja: null })}>Nova loja</Botao>}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visiveis.map((l) => (
            <article
              key={l.id}
              className={cn("space-y-3 rounded-xl border border-linha bg-superficie p-4", !l.ativa && "opacity-70")}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold text-tinta">{l.nome}</h2>
                  <p className="text-xs text-tinta-3">
                    Fica em {l.cidade ? (l.uf ? `${l.cidade} - ${l.uf}` : l.cidade) : "—"} · entrega em {prazoDaLoja(l)}
                    {l.entregaMedia === null &&
                      l.entregasMedidas > 0 &&
                      ` (${l.entregasMedidas} de ${ENTREGAS_PARA_MEDIA} entregas medidas)`}
                    {l.telefone && ` · ${l.telefone}`}
                  </p>
                </div>
                {!l.ativa && <span className="status status-inerte">Desativada</span>}
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-tinta-2">Atende</p>
                <div className="flex flex-wrap gap-1">
                  {l.atende.map((c) => (
                    <span key={c} className="rounded-full bg-superficie-2 px-2 py-0.5 text-xs text-tinta-2">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-tinta-3">
                {l.cotacoes} {l.cotacoes === 1 ? "cotação recebida" : "cotações recebidas"} · {l.respondidas}{" "}
                {l.respondidas === 1 ? "respondida" : "respondidas"} ·{" "}
                {l.pedidos} {l.pedidos === 1 ? "pedido" : "pedidos"}
              </p>
              <p className="text-xs text-tinta-3">
                {l.contas > 0
                  ? `Balcão com login: ${l.contas} ${l.contas === 1 ? "pessoa" : "pessoas"} na equipe.`
                  : "Ainda sem ninguém com login — vale o link antigo do balcão."}
              </p>

              <div className="flex flex-wrap gap-2 border-t border-linha pt-3">
                <Botao variante="secundario" tamanho="denso" onClick={() => setEditando({ loja: l })}>
                  Editar
                </Botao>
                {l.ativa && (
                  <Botao variante="secundario" tamanho="denso" onClick={() => setEquipeDe(l)}>
                    Equipe
                  </Botao>
                )}
                {/* O link antigo só enquanto a loja não tem conta: depois dela, o balcão é com login. */}
                {l.ativa && l.contas === 0 && (
                  <>
                    <Botao variante="fantasma" tamanho="denso" onClick={() => copiar(l)}>
                      Copiar link antigo
                    </Botao>
                    <a href={linkCompleto(l)} target="_blank" rel="noopener" className={classesBotao("fantasma", "denso")}>
                      Abrir balcão
                    </a>
                    <Botao variante="fantasma" tamanho="denso" onClick={() => trocarLink(l)}>
                      Trocar link
                    </Botao>
                  </>
                )}
                <Botao
                  variante={l.ativa ? "perigo" : "sucesso"}
                  tamanho="denso"
                  onClick={() => ligarDesligar(l)}
                  className="ml-auto"
                >
                  {l.ativa ? "Desativar" : "Ativar"}
                </Botao>
              </div>
            </article>
          ))}
        </div>
      )}

      {editando && (
        <FormLoja
          loja={editando.loja}
          sugestoes={listaDeCidades.map(([, c]) => c.nome)}
          onFechar={() => setEditando(null)}
          onSalvar={async (corpo) => {
            const ok = editando.loja
              ? await chamar(`/api/plataforma/lojas/${editando.loja.id}`, "PATCH", corpo)
              : await chamar("/api/plataforma/lojas", "POST", corpo);
            if (ok) {
              avisar(editando.loja ? "Loja salva" : `${corpo.nome} cadastrada. Convide o dono pela equipe, no cartão dela.`);
              setEditando(null);
            }
          }}
        />
      )}
    </div>
  );
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "min-h-9 rounded-full border px-3 text-sm font-medium transition-colors",
        ativo ? "border-brand-500 bg-brand-50 text-tinta" : "border-linha bg-superficie text-tinta-3 hover:text-tinta"
      )}
    >
      {children}
    </button>
  );
}

type CorpoDaLoja = {
  nome: string;
  cidade: string;
  uf: string;
  atende: string[];
  telefone: string | null;
};

function FormLoja({
  loja,
  sugestoes,
  onFechar,
  onSalvar,
}: {
  loja: LojaDoPainel | null;
  sugestoes: string[];
  onFechar: () => void;
  onSalvar: (corpo: CorpoDaLoja) => Promise<void>;
}) {
  const sedeDaLoja = loja?.cidade && loja.uf ? { nome: loja.cidade, uf: loja.uf } : null;
  const rotuloDaSede = sedeDaLoja ? rotuloDoMunicipio(sedeDaLoja) : (loja?.cidade ?? "");
  const [f, setF] = useState<Formulario>(
    loja
      ? {
          nome: loja.nome,
          sede: sedeDaLoja,
          // A cidade da própria loja aparece fixa; aqui ficam as outras.
          atende: outrasCidades(loja.atende, rotuloDaSede),
          telefone: loja.telefone ?? "",
        }
      : FORM_VAZIO
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!f.nome.trim()) return setErro("Escreva o nome da loja.");
    if (!f.sede) return setErro("Escolha na lista a cidade onde a loja fica.");
    setErro("");
    setSalvando(true);
    await onSalvar({
      nome: f.nome.trim(),
      cidade: f.sede.nome,
      uf: f.sede.uf,
      atende: f.atende,
      telefone: f.telefone.trim() || null,
    });
    setSalvando(false);
  }

  return (
    <Modal
      titulo={loja ? `Editar ${loja.nome}` : "Nova loja"}
      descricao="A loja aparece para as oficinas das cidades que ela atende."
      largura="max-w-lg"
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : loja ? "Salvar" : "Cadastrar loja"}
          </Botao>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Nome da loja" obrigatorio ajuda="Se tiver mais de uma unidade, diga qual: Bom Preço Ferraz.">
          <Entrada value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex.: Bom Preço Ferraz" />
        </Campo>

        <div>
          <p className="mb-1 block text-xs font-medium text-tinta-2">
            Cidade onde fica<span className="ml-0.5 text-perigo">*</span>
          </p>
          <CampoCidade
            valor={f.sede}
            onChange={(sede) => setF((x) => ({ ...x, sede }))}
            textoInicial={!sedeDaLoja ? (loja?.cidade ?? undefined) : undefined}
            placeholder="Comece a digitar: Ferraz"
            aria-label="Cidade onde a loja fica"
          />
        </div>

        <div>
          <p className="mb-1 block text-xs font-medium text-tinta-2">Cidades que atende</p>
          <CidadesAtendidas
            sede={f.sede}
            outras={f.atende}
            onChange={(atende) => setF((x) => ({ ...x, atende }))}
            sugestoes={sugestoes}
          />
        </div>

        <Campo rotulo="Telefone ou WhatsApp do balcão" ajuda="Opcional. Só para você falar com a loja.">
          <Entrada
            value={f.telefone}
            onChange={(e) => setF({ ...f, telefone: e.target.value })}
            inputMode="tel"
            placeholder="(11) 90000-0000"
          />
        </Campo>

        {erro && <Aviso>{erro}</Aviso>}
      </div>
    </Modal>
  );
}
