"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/Botao";
import { Aviso, Campo, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel } from "@/components/ui/Dados";
import { Modal } from "@/components/ui/Modal";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { PessoaMais } from "@/components/ui/Icones";
import {
  PERFIS_DA_LOJA,
  PERMISSOES_DA_LOJA,
  rotuloDosAcessos,
  type PerfilLoja,
  type PermissaoLoja,
} from "@/lib/acessos-loja";
import type { EquipeDaLoja } from "@/lib/conta-loja";

// A equipe de uma autopeça: quem entra no painel e o que cada um pode. A mesma tela
// serve a quem cuida da equipe no painel da loja e à plataforma no painel admin — muda
// só a API e o que quem está mexendo pode dar (ninguém dá o que não tem; o servidor
// confere de novo).
//
// Gente nova entra por convite: um link de uso único que a pessoa abre no celular,
// define nome e senha e já cai no balcão. O mesmo link serve para trocar a senha
// esquecida ("novo acesso").

type Pessoa = EquipeDaLoja["pessoas"][number];

export function Equipe({
  api,
  meusAcessos,
  euId,
}: {
  /** `/api/loja/equipe` ou `/api/plataforma/lojas/<id>/equipe`. */
  api: string;
  /** O que quem está mexendo pode dar e tirar. */
  meusAcessos: readonly PermissaoLoja[];
  /** Quem está na tela, para marcar "você". */
  euId?: string;
}) {
  const avisar = useAvisar();
  const confirmar = useConfirmar();
  const [equipe, setEquipe] = useState<EquipeDaLoja | null>(null);
  const [erro, setErro] = useState("");
  const [convidando, setConvidando] = useState(false);
  const [link, setLink] = useState<{ titulo: string; texto: string; url: string } | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch(api);
      const corpo = await r.json().catch(() => ({}));
      if (!r.ok) return setErro(corpo.error ?? "Não consegui carregar a equipe.");
      setErro("");
      setEquipe(corpo);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    }
  }, [api]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function enviar(url: string, metodo: string, corpo?: object) {
    const r = await fetch(url, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const json = await r.json().catch(() => ({}));
    return { ok: r.ok, json };
  }

  /** O link completo: no endereço do Peça Peça, ou no do navegador quando ele não está configurado. */
  function montarLink(json: { caminho: string; endereco: string | null }) {
    return `${json.endereco ?? window.location.origin}${json.caminho}`;
  }

  async function mudar(p: Pessoa, mudanca: { permissoes?: PermissaoLoja[]; ativo?: boolean }) {
    setSalvando(p.id);
    const { ok, json } = await enviar(`${api}/${p.id}`, "PATCH", mudanca);
    setSalvando(null);
    if (!ok) return avisar(json.error ?? "Não consegui salvar.", "erro");
    setEquipe(json);
  }

  async function alternarAtivo(p: Pessoa) {
    if (p.ativo) {
      const ok = await confirmar({
        titulo: `Desligar o acesso de ${p.nome}?`,
        texto: "A pessoa sai do painel na hora e não consegue mais entrar. Dá para religar depois.",
        acao: "Desligar acesso",
        perigo: true,
      });
      if (!ok) return;
    }
    await mudar(p, { ativo: !p.ativo });
  }

  async function darNovoAcesso(p: Pessoa) {
    const ok = await confirmar({
      titulo: `Novo acesso para ${p.nome}?`,
      texto: "Gera um link para a pessoa criar outra senha. A senha antiga para de valer quando ela usar o link.",
      acao: "Gerar link",
    });
    if (!ok) return;
    const { ok: deu, json } = await enviar(`${api}/${p.id}/acesso`, "POST");
    if (!deu) return avisar(json.error ?? "Não consegui gerar o link.", "erro");
    setLink({
      titulo: `Novo acesso de ${p.nome}`,
      texto: "Mande este link para a pessoa. Ela abre, cria a senha nova e já entra. Vale uma vez, por 14 dias.",
      url: montarLink(json),
    });
    void carregar();
  }

  async function cancelarConvite(id: string) {
    const { ok, json } = await enviar(`${api}/convites/${id}`, "DELETE");
    if (!ok) return avisar(json.error ?? "Não consegui cancelar.", "erro");
    setEquipe(json);
  }

  return (
    <div className="space-y-5">
      <Painel
        titulo="Equipe"
        ajuda="Quem entra no painel da loja e o que cada um pode fazer."
        acao={
          <Botao tamanho="denso" onClick={() => setConvidando(true)}>
            <PessoaMais tamanho={16} />
            Convidar
          </Botao>
        }
      >
        {erro && <Aviso>{erro}</Aviso>}
        {!equipe ? (
          !erro && <EsqueletoLista linhas={2} />
        ) : equipe.pessoas.length === 0 ? (
          <p className="text-sm text-tinta-3">Ninguém tem acesso ainda. Convide o dono da loja para começar.</p>
        ) : (
          <ul className="divide-y divide-linha">
            {equipe.pessoas.map((p) => (
              <LinhaDaPessoa
                key={p.id}
                pessoa={p}
                ehVoce={p.id === euId}
                meusAcessos={meusAcessos}
                salvando={salvando === p.id}
                onMudarAcessos={(permissoes) => mudar(p, { permissoes })}
                onAlternarAtivo={() => alternarAtivo(p)}
                onNovoAcesso={() => darNovoAcesso(p)}
              />
            ))}
          </ul>
        )}
      </Painel>

      {equipe && equipe.convites.length > 0 && (
        <Painel titulo="Links esperando uso" ajuda="Cada link vale uma vez. Cancelado, para de abrir na hora.">
          <ul className="divide-y divide-linha">
            {equipe.convites.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tinta">
                    {c.novoAcesso ? "Novo acesso" : (c.nome ?? c.email ?? "Convite")}
                    {!c.novoAcesso && (
                      <span className="text-tinta-3"> · {PERFIS_DA_LOJA[c.perfil as PerfilLoja]?.rotulo ?? c.perfil}</span>
                    )}
                  </p>
                  <p className="text-xs text-tinta-3">
                    vale até {new Date(c.expiraEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Botao variante="secundario" tamanho="denso" onClick={() => cancelarConvite(c.id)}>
                  Cancelar
                </Botao>
              </li>
            ))}
          </ul>
        </Painel>
      )}

      {convidando && (
        <ModalConvite
          api={api}
          meusAcessos={meusAcessos}
          onFechar={() => setConvidando(false)}
          onCriado={(url, nome) => {
            setConvidando(false);
            setLink({
              titulo: nome ? `Convite para ${nome}` : "Convite pronto",
              texto: "Mande este link para a pessoa. Ela abre no celular, cria a senha e já entra no balcão. Vale uma vez, por 14 dias.",
              url,
            });
            void carregar();
          }}
          montarLink={montarLink}
        />
      )}

      {link && <ModalLink {...link} onFechar={() => setLink(null)} />}
    </div>
  );
}

function LinhaDaPessoa({
  pessoa: p,
  ehVoce,
  meusAcessos,
  salvando,
  onMudarAcessos,
  onAlternarAtivo,
  onNovoAcesso,
}: {
  pessoa: Pessoa;
  ehVoce: boolean;
  meusAcessos: readonly PermissaoLoja[];
  salvando: boolean;
  onMudarAcessos: (permissoes: PermissaoLoja[]) => void;
  onAlternarAtivo: () => void;
  onNovoAcesso: () => void;
}) {
  const [aberta, setAberta] = useState(false);

  function alternar(chave: PermissaoLoja, ligar: boolean) {
    onMudarAcessos(ligar ? [...p.permissoes, chave] : p.permissoes.filter((x) => x !== chave));
  }

  return (
    <li className={cn("py-3 first:pt-0 last:pb-0", !p.ativo && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-tinta">
            {p.nome}
            {ehVoce && <span className="ml-1.5 text-xs font-normal text-tinta-3">(você)</span>}
          </p>
          <p className="truncate text-xs text-tinta-3">{p.email}</p>
          <p className="text-xs text-tinta-3">
            {p.ativo ? rotuloDosAcessos(p.permissoes) : "Acesso desligado"} ·{" "}
            {p.ultimoAcesso ? `entrou em ${new Date(p.ultimoAcesso).toLocaleDateString("pt-BR")}` : "ainda não entrou"}
          </p>
        </div>
        <Botao variante="secundario" tamanho="denso" onClick={() => setAberta((v) => !v)}>
          {aberta ? "Fechar" : "Acessos"}
        </Botao>
      </div>

      {aberta && (
        <div className="mt-3 space-y-3 rounded-lg border border-linha bg-superficie-2 p-3">
          <ul className="space-y-2">
            {PERMISSOES_DA_LOJA.map((perm) => {
              const tem = p.permissoes.includes(perm.chave);
              // Ninguém dá nem tira o que não tem — a caixa fica só para leitura.
              const alcanca = meusAcessos.includes(perm.chave);
              return (
                <li key={perm.chave}>
                  <label className={cn("flex items-start gap-2.5", alcanca && p.ativo ? "cursor-pointer" : "cursor-default")}>
                    <input
                      type="checkbox"
                      checked={tem}
                      disabled={!alcanca || !p.ativo || salvando}
                      onChange={(e) => alternar(perm.chave, e.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-tinta">{perm.rotulo}</span>
                      <span className="block text-xs text-tinta-3">{perm.ajuda}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-tinta-3">Ver o balcão vale para todo mundo da loja. A mudança vale na hora.</p>
          <div className="flex flex-wrap gap-2">
            {p.ativo && (
              <Botao variante="secundario" tamanho="denso" onClick={onNovoAcesso}>
                Novo acesso (esqueceu a senha)
              </Botao>
            )}
            <Botao variante={p.ativo ? "perigo" : "secundario"} tamanho="denso" onClick={onAlternarAtivo} disabled={salvando}>
              {p.ativo ? "Desligar acesso" : "Religar acesso"}
            </Botao>
          </div>
        </div>
      )}
    </li>
  );
}

function ModalConvite({
  api,
  meusAcessos,
  onFechar,
  onCriado,
  montarLink,
}: {
  api: string;
  meusAcessos: readonly PermissaoLoja[];
  onFechar: () => void;
  onCriado: (url: string, nome: string | null) => void;
  montarLink: (json: { caminho: string; endereco: string | null }) => string;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<PerfilLoja>("VENDEDOR");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function criar() {
    setErro("");
    setSalvando(true);
    try {
      const r = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() || null, email: email.trim() || null, perfil }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) return setErro(json.error ?? "Não consegui criar o convite.");
      onCriado(montarLink(json), nome.trim() || null);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Convidar para a equipe"
      descricao="Gera um link para a pessoa entrar no painel da loja."
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao variante="secundario" onClick={onFechar}>
            Voltar
          </Botao>
          <Botao onClick={criar} disabled={salvando}>
            {salvando ? "Gerando..." : "Gerar link do convite"}
          </Botao>
        </div>
      }
    >
      <div className="space-y-4">
        <Campo rotulo="Nome (opcional)" ajuda="Só para você reconhecer o convite. A pessoa confirma o nome dela.">
          <Entrada value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Carlos do balcão" />
        </Campo>
        <Campo rotulo="E-mail (opcional)" ajuda="Sugestão para o cadastro. A pessoa entra depois com o e-mail que escolher.">
          <Entrada
            type="email"
            inputMode="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-tinta-2">Começa como</legend>
          {(Object.keys(PERFIS_DA_LOJA) as PerfilLoja[]).map((chave) => {
            const p = PERFIS_DA_LOJA[chave];
            // Só o que quem convida tem entra no convite (o servidor corta o resto).
            const fica = p.permissoes.filter((x) => meusAcessos.includes(x));
            return (
              <label
                key={chave}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5",
                  perfil === chave ? "border-brand-500 bg-brand-50" : "border-linha"
                )}
              >
                <input
                  type="radio"
                  name="perfil"
                  checked={perfil === chave}
                  onChange={() => setPerfil(chave)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-tinta">{p.rotulo}</span>
                  <span className="block text-xs text-tinta-3">{p.ajuda}</span>
                  {fica.length < p.permissoes.length && (
                    <span className="block text-xs text-atencao">Entra só com os acessos que você tem.</span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
        <p className="text-xs text-tinta-3">Depois dá para ligar e desligar cada acesso, pessoa por pessoa.</p>
        {erro && <Aviso>{erro}</Aviso>}
      </div>
    </Modal>
  );
}

/** O link pronto para mandar: copiar, ou abrir o WhatsApp já com a mensagem. */
function ModalLink({ titulo, texto, url, onFechar }: { titulo: string; texto: string; url: string; onFechar: () => void }) {
  const avisar = useAvisar();
  const mensagem = `Seu acesso ao painel da loja no Peça Peça: ${url}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      avisar("Link copiado");
    } catch {
      avisar("Não consegui copiar. Selecione o link e copie à mão.", "erro");
    }
  }

  return (
    <Modal
      titulo={titulo}
      descricao={texto}
      onFechar={onFechar}
      rodape={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao variante="secundario" onClick={onFechar}>
            Fechar
          </Botao>
          <Botao variante="secundario" onClick={copiar}>
            Copiar link
          </Botao>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ok px-4 text-sm font-medium text-ok-fg"
          >
            Mandar no WhatsApp
          </a>
        </div>
      }
    >
      <p className="break-all rounded-lg border border-linha bg-superficie-2 px-3 py-2 font-mono text-xs text-tinta">{url}</p>
    </Modal>
  );
}
