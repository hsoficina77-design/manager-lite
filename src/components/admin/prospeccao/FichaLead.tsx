"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ETAPAS_MANUAIS,
  ROTULO_ETAPA,
  linkWhatsappDoLead,
  rotuloDaCategoria,
  tituloDaRegra,
  type ContaDoLead,
  type Etapa,
  type EtapaManual,
  type Tarefa,
} from "@/lib/prospeccao";
import { diasAte } from "@/lib/plano";
import { useAvisar } from "@/components/ui/Avisos";
import { Botao } from "@/components/ui/Botao";
import { Area, Campo, Entrada, Selecao } from "@/components/ui/Campos";
import { Painel } from "@/components/ui/Dados";
import { dia, haQuanto, quando } from "@/components/admin/comum";
import { chamarApi } from "./TarefasDoDia";
import { SeloEtapa, TelefoneDoLead, notaDoLead } from "./comum";

export type LeadDaFicha = {
  id: string;
  nome: string;
  categoria: string | null;
  telefone: string | null;
  tipoTelefone: string;
  temWhatsapp: boolean | null;
  email: string | null;
  site: string | null;
  instagram: string | null;
  facebook: string | null;
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  cep: string | null;
  uf: string | null;
  linkMaps: string | null;
  nota: number | null;
  avaliacoes: number | null;
  pctNegativas: number | null;
  horario: string | null;
  sinaisDeDor: string | null;
  avaliacoesRuins: string | null;
  fotoUrl: string | null;
  etapa: string;
  motivoPerda: string | null;
  naoContatar: boolean;
  oficinaId: string | null;
  ultimoContato: string | null;
  createdAt: string;
  lote: { nome: string } | null;
};

export type InteracaoDaFicha = { id: string; tipo: string; regra: string | null; texto: string; createdAt: string };

const ROTULO_SITUACAO: Record<ContaDoLead["situacao"], string> = {
  TESTE: "Em teste",
  SOMENTE_LEITURA: "Só consulta (teste ou pagamento vencido)",
  ASSINANTE: "Assinante",
  LIBERADA: "Sem prazo",
};

const ROTULO_TIPO: Record<string, string> = {
  NOTA: "Anotação",
  MENSAGEM: "Mensagem enviada",
  PULOU: "Pulou",
  ETAPA: "Mudança",
};

/**
 * Foto da fachada (link do Google, que pode ter expirado). O erro de carregamento pode
 * chegar antes de a tela ficar interativa — e aí o `onError` não pega —, por isso a
 * imagem também é conferida ao montar.
 */
function FotoFachada({ url, nome }: { url: string; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFalhou(true);
  }, []);
  if (falhou) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- foto do Google, de fora do app
    <img
      ref={ref}
      src={url}
      alt={`Fachada de ${nome}`}
      className="h-32 w-full shrink-0 rounded-lg bg-superficie-2 object-cover sm:w-44"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
    />
  );
}

/** Links do site/redes: o scraper às vezes traz sem "https://". */
const comProtocolo = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

export function FichaLead({
  lead,
  etapa,
  conta,
  tarefa,
  interacoes,
  paraVincular,
}: {
  lead: LeadDaFicha;
  etapa: Etapa;
  conta: (Omit<ContaDoLead, "criadaEm" | "testeAte" | "pagoAte" | "ultimoAcesso"> & {
    criadaEm: string;
    testeAte: string | null;
    pagoAte: string | null;
    ultimoAcesso: string | null;
  }) | null;
  tarefa: Tarefa | null;
  interacoes: InteracaoDaFicha[];
  paraVincular: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const avisar = useAvisar();
  const base = `/api/plataforma/prospeccao/leads/${lead.id}`;
  const [mensagem, setMensagem] = useState(tarefa?.mensagem ?? "");
  const [nota, setNota] = useState("");
  const [motivo, setMotivo] = useState(lead.motivoPerda ?? "");
  const [salvando, setSalvando] = useState(false);

  async function mudar(corpo: Record<string, unknown>, sucesso: string) {
    setSalvando(true);
    const ok = await chamarApi(avisar, base, "PATCH", corpo);
    setSalvando(false);
    if (ok) {
      avisar(sucesso);
      router.refresh();
    }
    return ok;
  }

  async function registrar(tipo: "NOTA" | "MENSAGEM" | "PULOU", texto: string, regra: string | null, sucesso: string) {
    setSalvando(true);
    const ok = await chamarApi(avisar, `${base}/interacoes`, "POST", { tipo, texto, regra });
    setSalvando(false);
    if (ok) {
      avisar(sucesso);
      router.refresh();
    }
    return ok;
  }

  const endereco = [lead.rua, lead.bairro, [lead.cidade, lead.uf].filter(Boolean).join(" - "), lead.cep]
    .filter(Boolean)
    .join(", ");
  const antesDoCadastro = !conta;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <div className="min-w-0 space-y-5">
        <Painel>
          <div className="flex flex-col gap-4 sm:flex-row">
            {lead.fotoUrl && <FotoFachada url={lead.fotoUrl} nome={lead.nome} />}
            <dl className="grid min-w-0 flex-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
              <dt className="text-tinta-3">Etapa</dt>
              <dd>
                <SeloEtapa etapa={etapa} />
                {lead.motivoPerda && etapa === "PERDIDO" && <span className="ml-2 text-xs text-tinta-3">{lead.motivoPerda}</span>}
              </dd>
              <dt className="text-tinta-3">Telefone</dt>
              <dd>
                <TelefoneDoLead {...lead} />
              </dd>
              <dt className="text-tinta-3">Categoria</dt>
              <dd>{rotuloDaCategoria(lead.categoria)}</dd>
              <dt className="text-tinta-3">Endereço</dt>
              <dd>
                {endereco || "—"}
                {lead.linkMaps && (
                  <a
                    href={lead.linkMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 font-medium text-brand-texto hover:underline"
                  >
                    Abrir no Maps
                  </a>
                )}
              </dd>
              <dt className="text-tinta-3">Google</dt>
              <dd>
                {notaDoLead(lead.nota, lead.avaliacoes)}
                {lead.pctNegativas != null && (
                  <span className={cn("ml-2 text-xs", lead.pctNegativas >= 20 ? "text-atencao" : "text-tinta-3")}>
                    {lead.pctNegativas.toLocaleString("pt-BR")}% de notas 1 e 2
                  </span>
                )}
              </dd>
              {lead.horario && (
                <>
                  <dt className="text-tinta-3">Horário</dt>
                  <dd className="text-tinta-2">{lead.horario.replace(/; /g, " · ")}</dd>
                </>
              )}
              {(lead.site || lead.instagram || lead.facebook || lead.email) && (
                <>
                  <dt className="text-tinta-3">Na internet</dt>
                  <dd className="flex flex-wrap gap-x-3 gap-y-1">
                    {lead.site && (
                      <a href={comProtocolo(lead.site)} target="_blank" rel="noopener noreferrer" className="text-brand-texto hover:underline">
                        Site
                      </a>
                    )}
                    {lead.instagram && (
                      <a href={comProtocolo(lead.instagram)} target="_blank" rel="noopener noreferrer" className="text-brand-texto hover:underline">
                        Instagram
                      </a>
                    )}
                    {lead.facebook && (
                      <a href={comProtocolo(lead.facebook)} target="_blank" rel="noopener noreferrer" className="text-brand-texto hover:underline">
                        Facebook
                      </a>
                    )}
                    {lead.email && <span className="text-tinta-2">{lead.email}</span>}
                  </dd>
                </>
              )}
              <dt className="text-tinta-3">Origem</dt>
              <dd className="text-tinta-2">
                {lead.lote ? `Lote ${lead.lote.nome}` : "Sem lote"} · importado em {dia(lead.createdAt)}
              </dd>
            </dl>
          </div>
        </Painel>

        {(lead.avaliacoesRuins || lead.sinaisDeDor) && (
          <Painel
            titulo="O que os clientes reclamam"
            ajuda="Só para você. Use o assunto na conversa, sem citar a avaliação: citar soa como vigilância."
          >
            {lead.sinaisDeDor && (
              <p className="mb-3 text-xs text-tinta-3">
                Palavras achadas: <span className="text-tinta-2">{lead.sinaisDeDor}</span> (pista, pode ter falso positivo)
              </p>
            )}
            {lead.avaliacoesRuins && (
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-superficie-2 p-3 text-sm text-tinta-2">
                {lead.avaliacoesRuins.replace(/\s*\|\s*(?=\[)/g, "\n\n")}
              </div>
            )}
          </Painel>
        )}

        <Painel titulo="Histórico">
          <form
            className="mb-4 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await registrar("NOTA", nota.trim(), null, "Anotação salva")) setNota("");
            }}
          >
            <Area
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              placeholder="Anotação: o que conversaram, quem é o dono, melhor horário..."
              aria-label="Nova anotação"
            />
            <Botao type="submit" variante="secundario" tamanho="denso" disabled={salvando || !nota.trim()}>
              Salvar anotação
            </Botao>
          </form>
          {interacoes.length === 0 ? (
            <p className="text-sm text-tinta-3">Nada registrado ainda.</p>
          ) : (
            <ol className="space-y-3">
              {interacoes.map((i) => (
                <li key={i.id} className="border-l-2 border-linha pl-3">
                  <p className="text-xs text-tinta-3">
                    {quando(i.createdAt)} · {ROTULO_TIPO[i.tipo] ?? i.tipo}
                    {i.regra && ` · ${tituloDaRegra(i.regra)}`}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-tinta-2">{i.texto}</p>
                </li>
              ))}
            </ol>
          )}
        </Painel>
      </div>

      {/* No celular a mensagem vem primeiro: é o que se faz ao abrir a ficha. */}
      <div className="order-first min-w-0 space-y-5 lg:order-none">
        <Painel
          titulo={tarefa ? `Próxima mensagem: ${tarefa.titulo}` : "Mandar mensagem"}
          ajuda={tarefa ? tarefa.porque : "Nenhuma tarefa para hoje. Dá para mandar uma mensagem livre."}
        >
          {lead.naoContatar ? (
            <p className="text-sm text-perigo">Pediu para não ser contatado.</p>
          ) : !lead.telefone || lead.temWhatsapp === false ? (
            <p className="text-sm text-tinta-3">Sem WhatsApp. Use o Instagram ou o e-mail, e registre como anotação.</p>
          ) : tarefa && tarefa.mensagem == null ? (
            <div className="flex flex-wrap gap-2">
              <Botao variante="secundario" tamanho="denso" disabled={salvando} onClick={() => mudar({ etapa: "PERDIDO", motivoPerda: "Sem resposta" }, "Marcado como perdido")}>
                Marcar como perdido
              </Botao>
              <Botao variante="fantasma" tamanho="denso" disabled={salvando} onClick={() => registrar("PULOU", "Mantido na lista depois de 3 mensagens", tarefa.regra, "Mantido")}>
                Manter
              </Botao>
            </div>
          ) : (
            <div className="space-y-3">
              <Area value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={7} aria-label="Mensagem" />
              <div className="flex flex-wrap gap-2">
                <a
                  href={linkWhatsappDoLead(lead.telefone, mensagem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-brand-fg hover:bg-brand-700 sm:min-h-9"
                >
                  Abrir no WhatsApp
                </a>
                <Botao
                  variante="secundario"
                  tamanho="denso"
                  disabled={salvando || !mensagem.trim()}
                  onClick={async () => {
                    if (await registrar("MENSAGEM", mensagem.trim(), tarefa?.regra ?? null, "Mensagem registrada")) setMensagem("");
                  }}
                >
                  Enviei
                </Botao>
              </div>
            </div>
          )}
        </Painel>

        <Painel titulo="Conta no boxOS">
          {conta ? (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-tinta-3">Oficina</dt>
              <dd>
                <Link href={`/admin/oficinas/${conta.id}`} className="font-medium text-brand-texto hover:underline">
                  {conta.nome}
                </Link>
              </dd>
              <dt className="text-tinta-3">Situação</dt>
              <dd>
                {ROTULO_SITUACAO[conta.situacao]}
                {conta.situacao === "TESTE" && ` · faltam ${Math.max(1, diasAte(conta.testeAte))} dias`}
              </dd>
              <dt className="text-tinta-3">Cadastro</dt>
              <dd>{dia(conta.criadaEm)}</dd>
              <dt className="text-tinta-3">Uso</dt>
              <dd>
                {conta.ordens} OS ({conta.ordens30d} em 30 dias) · {conta.clientes} clientes
              </dd>
              <dt className="text-tinta-3">Último acesso</dt>
              <dd>{haQuanto(conta.ultimoAcesso, "ninguém entrou ainda")}</dd>
              {lead.oficinaId && (
                <dd className="col-span-2 pt-2">
                  <Botao variante="fantasma" tamanho="denso" disabled={salvando} onClick={() => mudar({ oficinaId: null }, "Ligação desfeita")}>
                    Desfazer ligação manual
                  </Botao>
                </dd>
              )}
            </dl>
          ) : (
            <div className="space-y-2 text-sm text-tinta-2">
              <p>Ainda não se cadastrou. Quem entra pelo link mandado daqui é reconhecido sozinho, assim como quem se cadastra com este WhatsApp.</p>
              {paraVincular.length > 0 && (
                <Campo rotulo="Cadastrou de outro jeito? Ligue à mão">
                  <Selecao
                    value=""
                    disabled={salvando}
                    onChange={(e) => e.target.value && mudar({ oficinaId: e.target.value }, "Conta ligada ao lead")}
                  >
                    <option value="">Escolher a oficina...</option>
                    {paraVincular.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nome}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              )}
            </div>
          )}
        </Painel>

        <Painel titulo="Etapa e contato">
          <div className="space-y-4">
            {antesDoCadastro ? (
              <Campo rotulo="Etapa" ajuda="Depois do cadastro, a etapa segue sozinha pela conta (teste, ativou, assinou).">
                <Selecao
                  value={(ETAPAS_MANUAIS as readonly string[]).includes(lead.etapa) ? lead.etapa : "NOVO"}
                  disabled={salvando}
                  onChange={(e) => {
                    const nova = e.target.value as EtapaManual;
                    mudar({ etapa: nova, ...(nova === "PERDIDO" ? { motivoPerda: motivo.trim() || null } : {}) }, `Etapa: ${ROTULO_ETAPA[nova]}`);
                  }}
                >
                  {ETAPAS_MANUAIS.map((e) => (
                    <option key={e} value={e}>
                      {ROTULO_ETAPA[e]}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            ) : null}
            {antesDoCadastro && lead.etapa === "PERDIDO" && (
              <Campo rotulo="Motivo da perda">
                <div className="flex gap-2">
                  <Entrada value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} placeholder="Ex.: já usa outro sistema" />
                  <Botao variante="secundario" tamanho="denso" disabled={salvando} onClick={() => mudar({ motivoPerda: motivo.trim() || null }, "Motivo salvo")}>
                    Salvar
                  </Botao>
                </div>
              </Campo>
            )}
            {lead.tipoTelefone === "FIXO" && lead.telefone && (
              <Campo rotulo="Esse fixo tem WhatsApp?">
                <Selecao
                  value={lead.temWhatsapp == null ? "" : lead.temWhatsapp ? "sim" : "nao"}
                  disabled={salvando}
                  onChange={(e) =>
                    mudar({ temWhatsapp: e.target.value === "" ? null : e.target.value === "sim" }, "WhatsApp do fixo anotado")
                  }
                >
                  <option value="">Não conferido</option>
                  <option value="sim">Tem WhatsApp</option>
                  <option value="nao">Não tem</option>
                </Selecao>
              </Campo>
            )}
            <label className="flex min-h-11 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={lead.naoContatar}
                disabled={salvando}
                onChange={(e) => mudar({ naoContatar: e.target.checked }, e.target.checked ? "Não será mais contatado" : "Pode ser contatado de novo")}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span className="text-sm text-tinta-2">
                Pediu para não ser contatado
                <span className="block text-xs text-tinta-3">Sai de todas as filas, e continua fora mesmo se aparecer em outro CSV.</span>
              </span>
            </label>
            {lead.ultimoContato && <p className="text-xs text-tinta-3">Última mensagem: {quando(lead.ultimoContato)}</p>}
          </div>
        </Painel>
      </div>
    </div>
  );
}
