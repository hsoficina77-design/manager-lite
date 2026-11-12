"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAvisar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { Area } from "@/components/ui/Campos";
import { Vazio } from "@/components/ui/Dados";
import { linkWhatsappDoLead, type GrupoTarefa, type Tarefa } from "@/lib/prospeccao";
import { TelefoneDoLead, onde } from "./comum";

export type TarefaComLead = Tarefa & {
  lead: {
    nome: string;
    bairro: string | null;
    cidade: string | null;
    telefone: string | null;
    tipoTelefone: string;
    temWhatsapp: boolean | null;
    abreSeg: string | null;
  };
};

const GRUPOS: { grupo: GrupoTarefa; titulo: string; ajuda: string }[] = [
  {
    grupo: "conta",
    titulo: "Quem já está testando",
    ajuda: "Oficinas cadastradas: acompanhar o uso é o que faz virar assinatura.",
  },
  {
    grupo: "retorno",
    titulo: "Retornos",
    ajuda: "Quem já recebeu mensagem: mandar o link, insistir com calma ou encerrar.",
  },
  {
    grupo: "primeira",
    titulo: "Primeiras mensagens",
    ajuda: "As oficinas mais promissoras primeiro: celular, movimento e reclamação de cliente.",
  },
];

/** Chama a API e mostra o erro, se houver. Devolve se deu certo. */
export async function chamarApi(avisar: ReturnType<typeof useAvisar>, url: string, metodo: string, corpo: unknown) {
  try {
    const res = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      avisar(json.error || "Erro ao salvar", "erro");
      return false;
    }
    return true;
  } catch {
    avisar("Sem conexão com o servidor", "erro");
    return false;
  }
}

export function TarefasDoDia({
  tarefas,
  primeirasHoje,
  primeirasNaFila,
  limite,
}: {
  tarefas: TarefaComLead[];
  primeirasHoje: number;
  primeirasNaFila: number;
  limite: number;
}) {
  const [feitas, setFeitas] = useState<Set<string>>(new Set());
  const abertas = tarefas.filter((t) => !feitas.has(`${t.leadId}:${t.regra}`));
  const concluir = (t: Tarefa) => setFeitas((s) => new Set(s).add(`${t.leadId}:${t.regra}`));

  if (tarefas.length === 0) {
    return (
      <Vazio
        titulo="Nenhuma tarefa para hoje"
        texto={
          primeirasHoje >= limite
            ? `As ${limite} primeiras mensagens de hoje já foram. Amanhã a fila volta.`
            : "Importe um CSV de oficinas para começar a fila de primeiras mensagens."
        }
        compacto
      />
    );
  }

  return (
    <div className="space-y-6">
      {GRUPOS.map(({ grupo, titulo, ajuda }) => {
        const doGrupo = abertas.filter((t) => t.grupo === grupo);
        const total = tarefas.filter((t) => t.grupo === grupo).length;
        if (total === 0) return null;
        return (
          <section key={grupo} className="space-y-3">
            <div>
              <h2 className="font-semibold text-tinta">
                {titulo}{" "}
                <span className="font-normal text-tinta-3">
                  ({doGrupo.length}
                  {grupo === "primeira" ? ` · ${primeirasHoje + (total - doGrupo.length)} de ${limite} hoje` : ""})
                </span>
              </h2>
              <p className="text-xs text-tinta-3">
                {ajuda}
                {grupo === "primeira" && primeirasNaFila > total ? ` ${primeirasNaFila - total} esperando para os próximos dias.` : ""}
              </p>
            </div>
            {doGrupo.length === 0 ? (
              <p className="rounded-xl border border-dashed border-linha-forte px-4 py-6 text-center text-sm text-tinta-3">
                Tudo feito por aqui.
              </p>
            ) : (
              <div className="space-y-3">
                {doGrupo.map((t) => (
                  <CartaoTarefa key={`${t.leadId}:${t.regra}`} tarefa={t} aoConcluir={() => concluir(t)} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CartaoTarefa({ tarefa, aoConcluir }: { tarefa: TarefaComLead; aoConcluir: () => void }) {
  const router = useRouter();
  const avisar = useAvisar();
  const [texto, setTexto] = useState(tarefa.mensagem ?? "");
  const [abriu, setAbriu] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const { lead } = tarefa;
  const base = `/api/plataforma/prospeccao/leads/${tarefa.leadId}`;

  async function registrar(tipo: "MENSAGEM" | "PULOU", textoRegistro: string, sucesso: string) {
    setSalvando(true);
    const ok = await chamarApi(avisar, `${base}/interacoes`, "POST", { tipo, regra: tarefa.regra, texto: textoRegistro });
    setSalvando(false);
    if (!ok) return;
    avisar(sucesso);
    aoConcluir();
    router.refresh();
  }

  async function semWhatsapp() {
    setSalvando(true);
    const ok = await chamarApi(avisar, base, "PATCH", { temWhatsapp: false });
    setSalvando(false);
    if (!ok) return;
    avisar("Anotado: esse número não tem WhatsApp");
    aoConcluir();
    router.refresh();
  }

  async function perdido() {
    setSalvando(true);
    const ok = await chamarApi(avisar, base, "PATCH", { etapa: "PERDIDO", motivoPerda: "Sem resposta" });
    setSalvando(false);
    if (!ok) return;
    avisar("Marcado como perdido");
    aoConcluir();
    router.refresh();
  }

  const conferirFixo = lead.tipoTelefone === "FIXO" && lead.temWhatsapp == null;

  return (
    <article className="rounded-xl border border-linha bg-superficie p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/admin/prospeccao/leads/${tarefa.leadId}`}
            className="font-medium text-tinta hover:text-brand-texto hover:underline"
          >
            {lead.nome}
          </Link>
          <p className="text-xs text-tinta-3">
            {onde(lead)} · <TelefoneDoLead {...lead} />
          </p>
        </div>
        <span className="rounded-full bg-superficie-3 px-2 py-0.5 text-xs text-tinta-2">{tarefa.titulo}</span>
      </div>
      <p className="mt-2 text-sm text-tinta-2">
        {tarefa.porque}
        {lead.abreSeg && tarefa.grupo === "primeira" && (
          <span className="text-tinta-3"> · abre às {lead.abreSeg}: mande pouco antes, com o celular ainda na mão</span>
        )}
      </p>

      {tarefa.mensagem == null ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Botao variante="secundario" tamanho="denso" onClick={perdido} disabled={salvando}>
            Marcar como perdido
          </Botao>
          <Botao
            variante="fantasma"
            tamanho="denso"
            disabled={salvando}
            onClick={() => registrar("PULOU", "Mantido na lista depois de 3 mensagens", "Mantido")}
          >
            Manter
          </Botao>
        </div>
      ) : (
        <>
          <Area
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={Math.min(9, Math.max(4, Math.ceil(texto.length / 70)))}
            className="mt-3"
            aria-label={`Mensagem para ${lead.nome}`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {lead.telefone ? (
              <a
                href={linkWhatsappDoLead(lead.telefone, texto)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAbriu(true)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium sm:min-h-9",
                  abriu
                    ? "border border-linha-forte bg-superficie text-tinta-2 hover:bg-superficie-2"
                    : "bg-brand-600 text-brand-fg hover:bg-brand-700"
                )}
              >
                {abriu ? "Abrir de novo" : "Abrir no WhatsApp"}
              </a>
            ) : (
              <span className="text-sm text-tinta-3">Sem telefone: mande por outro canal e registre.</span>
            )}
            <Botao
              variante={abriu ? "primario" : "secundario"}
              tamanho="denso"
              disabled={salvando || !texto.trim()}
              onClick={() => registrar("MENSAGEM", texto.trim(), "Mensagem registrada")}
            >
              Enviei
            </Botao>
            {conferirFixo && (
              <Botao variante="secundario" tamanho="denso" disabled={salvando} onClick={semWhatsapp}>
                Não tem WhatsApp
              </Botao>
            )}
            <Botao
              variante="fantasma"
              tamanho="denso"
              disabled={salvando}
              onClick={() =>
                tarefa.regra === "primeira"
                  ? registrar("PULOU", "Tirado da fila de primeiras mensagens", "Tirado da fila")
                  : registrar("PULOU", `Tarefa pulada: ${tarefa.titulo}`, "Tarefa pulada")
              }
              title={
                tarefa.regra === "primeira"
                  ? "Não abordar agora. Dá para mandar mensagem depois, pela ficha."
                  : "Pular esta mensagem. As próximas tarefas seguem normalmente."
              }
            >
              {tarefa.regra === "primeira" ? "Tirar da fila" : "Pular"}
            </Botao>
          </div>
        </>
      )}
    </article>
  );
}
