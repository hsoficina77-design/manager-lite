"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { Campo, Entrada } from "@/components/ui/Campos";
import { Painel, Vazio } from "@/components/ui/Dados";
import { dia, quando } from "./comum";

type Convite = {
  id: string;
  nomeOficina: string | null;
  email: string | null;
  expiraEm: Date | string;
  usadoEm: Date | string | null;
  createdAt: Date | string;
  oficina: { id: string; nome: string } | null;
};

function situacaoConvite(c: Convite): { texto: string; cor: string } {
  if (c.usadoEm) return { texto: `Usado em ${dia(c.usadoEm)}`, cor: "text-ok" };
  if (new Date(c.expiraEm) <= new Date()) return { texto: "Vencido ou cancelado", cor: "text-tinta-3" };
  return { texto: `Aguardando · vale até ${dia(c.expiraEm)}`, cor: "text-atencao" };
}

export function Convites({ convites }: { convites: Convite[] }) {
  const router = useRouter();
  const avisar = useAvisar();
  const confirmar = useConfirmar();

  const [form, setForm] = useState({ nomeOficina: "", email: "" });
  const [gerando, setGerando] = useState(false);
  // O link só existe na resposta de quem criou: o banco guarda o hash, não o segredo.
  const [linkNovo, setLinkNovo] = useState<string | null>(null);

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
      setLinkNovo(`${window.location.origin}${json.caminho}`);
      setForm({ nomeOficina: "", email: "" });
      router.refresh();
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
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Painel
        titulo="Convidar uma oficina"
        ajuda="Gera um link de uso único, válido por 14 dias. Mande por WhatsApp ou e-mail — quem abrir cria a oficina e o acesso de dono, sem prazo de teste."
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

      <Painel titulo="Convites enviados" ajuda="Os 100 mais recentes.">
        {convites.length === 0 ? (
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
                    <p className={cn("text-xs", s.cor)}>
                      {s.texto}
                      {c.oficina && (
                        <>
                          {" · "}
                          <Link href={`/admin/oficinas/${c.oficina.id}`} className="hover:underline">
                            {c.oficina.nome}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-tinta-3">
                      Criado em {quando(c.createdAt)}
                      {c.email && c.nomeOficina ? ` · ${c.email}` : ""}
                    </p>
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
