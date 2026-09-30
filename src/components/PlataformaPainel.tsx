"use client";

import { useCallback, useEffect, useState } from "react";
import { cn, formatDate, formatDatetime } from "@/lib/utils";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { Campo, Entrada } from "@/components/ui/Campos";
import { EsqueletoLista, Painel, Vazio } from "@/components/ui/Dados";

// Painel do dono da plataforma: convidar oficinas e acompanhar quem está usando.
//
// Daqui não se abre nada de dentro de uma oficina — nem clientes, nem OS, nem valores.
// É proposital: o isolamento vale para todo mundo, inclusive para quem administra.

type Oficina = {
  id: string;
  nome: string;
  ativa: boolean;
  criadaEm: string;
  usuarios: number;
  ordens: number;
  clientes: number;
  ultimoAcesso: string | null;
};

type Convite = {
  id: string;
  nomeOficina: string | null;
  email: string | null;
  expiraEm: string;
  usadoEm: string | null;
  createdAt: string;
  oficina: { id: string; nome: string } | null;
};

function situacaoConvite(c: Convite): { texto: string; cor: string } {
  if (c.usadoEm) return { texto: `Usado · ${c.oficina?.nome ?? "oficina criada"}`, cor: "text-ok" };
  if (new Date(c.expiraEm) <= new Date()) return { texto: "Vencido ou cancelado", cor: "text-tinta-3" };
  return { texto: `Aguardando · vale até ${formatDate(c.expiraEm)}`, cor: "text-atencao" };
}

export default function PlataformaPainel({ oficinaAtual }: { oficinaAtual: string }) {
  const avisar = useAvisar();
  const confirmar = useConfirmar();

  const [oficinas, setOficinas] = useState<Oficina[] | null>(null);
  const [convites, setConvites] = useState<Convite[] | null>(null);
  const [form, setForm] = useState({ nomeOficina: "", email: "" });
  const [gerando, setGerando] = useState(false);
  // O link só existe na resposta de quem criou: o banco guarda o hash, não o segredo.
  const [linkNovo, setLinkNovo] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const [o, c] = await Promise.all([
      fetch("/api/plataforma/oficinas").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/plataforma/convites").then((r) => (r.ok ? r.json() : [])),
    ]);
    setOficinas(o);
    setConvites(c);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function gerarConvite(e: React.FormEvent) {
    e.preventDefault();
    setGerando(true);
    try {
      const res = await fetch("/api/plataforma/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        avisar(json.error || "Não foi possível criar o convite", "erro");
        return;
      }
      setLinkNovo(json.link);
      setForm({ nomeOficina: "", email: "" });
      carregar();
    } catch {
      avisar("Sem conexão com o servidor", "erro");
    } finally {
      setGerando(false);
    }
  }

  async function copiar(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      avisar("Link copiado");
    } catch {
      avisar("Não deu para copiar — selecione o link e copie à mão", "erro");
    }
  }

  async function cancelar(c: Convite) {
    const ok = await confirmar({
      titulo: "Cancelar este convite?",
      texto: "O link para de funcionar na hora. Dá para gerar outro depois.",
      acao: "Cancelar convite",
      cancelar: "Manter",
      perigo: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/plataforma/convites/${c.id}`, { method: "DELETE" });
    if (!res.ok) avisar((await res.json()).error || "Erro ao cancelar", "erro");
    carregar();
  }

  async function alternar(o: Oficina) {
    if (o.ativa) {
      const ok = await confirmar({
        titulo: `Suspender ${o.nome}?`,
        texto:
          "Todo mundo dessa oficina sai do sistema na hora e não consegue mais entrar. Os dados ficam guardados — reativar devolve o acesso do jeito que estava.",
        acao: "Suspender",
        perigo: true,
      });
      if (!ok) return;
    }
    const res = await fetch(`/api/plataforma/oficinas/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativa: !o.ativa }),
    });
    const json = await res.json();
    if (!res.ok) {
      avisar(json.error || "Erro ao salvar", "erro");
      return;
    }
    avisar(json.ativa ? "Oficina reativada" : "Oficina suspensa");
    carregar();
  }

  return (
    <div className="space-y-6">
      <Painel
        titulo="Convidar uma oficina"
        ajuda="Gera um link de uso único, válido por 14 dias. Mande por WhatsApp ou e-mail — quem abrir cria a oficina e o acesso de dono."
      >
        <form onSubmit={gerarConvite} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Campo rotulo="Nome da oficina (opcional)">
            <Entrada
              value={form.nomeOficina}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, nomeOficina: e.target.value }))}
              placeholder="Ex.: Oficina do Zé"
            />
          </Campo>
          <Campo rotulo="Para quem (opcional)">
            <Entrada
              value={form.email}
              maxLength={200}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="e-mail, só para você lembrar"
            />
          </Campo>
          <Botao type="submit" disabled={gerando}>
            {gerando ? "Gerando..." : "Gerar link"}
          </Botao>
        </form>

        {linkNovo && (
          <div className="mt-4 rounded-lg border border-linha bg-superficie-2 p-3">
            <p className="text-xs font-medium text-tinta-2">
              Link do convite — copie agora: por segurança, ele não aparece de novo.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={linkNovo}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-linha-forte bg-superficie px-3 py-2 text-xs text-tinta"
              />
              <Botao variante="secundario" onClick={() => copiar(linkNovo)}>
                Copiar
              </Botao>
            </div>
          </div>
        )}
      </Painel>

      <Painel titulo="Oficinas" ajuda="Só a situação e o volume de uso — os dados de cada oficina são só dela.">
        {oficinas === null ? (
          <EsqueletoLista linhas={3} />
        ) : oficinas.length === 0 ? (
          <Vazio titulo="Nenhuma oficina" compacto />
        ) : (
          <div className="divide-y divide-linha">
            {oficinas.map((o) => (
              <div key={o.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-tinta">
                    <span className="truncate">{o.nome}</span>
                    {o.id === oficinaAtual && (
                      <span className="shrink-0 rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-3">
                        a sua
                      </span>
                    )}
                    {!o.ativa && (
                      <span className="shrink-0 rounded-full bg-perigo-fraco px-2 py-0.5 text-xs text-perigo">
                        suspensa
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-tinta-3">
                    Desde {formatDate(o.criadaEm)} · {o.usuarios} acesso{o.usuarios === 1 ? "" : "s"} ·{" "}
                    {o.clientes} cliente{o.clientes === 1 ? "" : "s"} · {o.ordens} OS
                  </p>
                  <p className="text-xs text-tinta-3">
                    Último acesso: {o.ultimoAcesso ? formatDatetime(o.ultimoAcesso) : "ninguém entrou ainda"}
                  </p>
                </div>
                {o.id !== oficinaAtual && (
                  <Botao
                    variante={o.ativa ? "perigo" : "secundario"}
                    tamanho="denso"
                    onClick={() => alternar(o)}
                  >
                    {o.ativa ? "Suspender" : "Reativar"}
                  </Botao>
                )}
              </div>
            ))}
          </div>
        )}
      </Painel>

      <Painel titulo="Convites enviados">
        {convites === null ? (
          <EsqueletoLista linhas={3} />
        ) : convites.length === 0 ? (
          <Vazio titulo="Nenhum convite ainda" texto="Gere o primeiro no quadro acima." compacto />
        ) : (
          <div className="divide-y divide-linha">
            {convites.map((c) => {
              const s = situacaoConvite(c);
              const aberto = !c.usadoEm && new Date(c.expiraEm) > new Date();
              return (
                <div key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-tinta">
                      {c.nomeOficina || c.email || "Convite sem nome"}
                    </p>
                    <p className={cn("text-xs", s.cor)}>{s.texto}</p>
                    <p className="text-xs text-tinta-3">Criado em {formatDatetime(c.createdAt)}</p>
                  </div>
                  {aberto && (
                    <Botao variante="perigo" tamanho="denso" onClick={() => cancelar(c)}>
                      Cancelar
                    </Botao>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Painel>
    </div>
  );
}
