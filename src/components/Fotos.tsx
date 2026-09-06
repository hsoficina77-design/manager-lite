"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { compressImage } from "@/lib/image-compress";
import {
  FOTO_LEGENDA_MAX,
  FOTO_TIPOS,
  FOTO_TIPO_ORCAMENTO,
  FOTO_TIPO_PADRAO,
  tipoDaFoto,
  type FotoTipo,
} from "@/lib/constants";
import { useAvisar, useConfirmar } from "@/components/ui/Avisos";
import { Avancar, Fechar, Voltar } from "@/components/ui/Icones";

export type Foto = {
  id: string;
  url: string;
  legenda: string | null;
  tipo: string;
  createdAt: string;
};

type Enviando = { tempId: string; preview: string; tipo: FotoTipo; file: File; erro?: string };

/** Espera com backoff simples entre tentativas. */
function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Uma seção só, sem título próprio: é o que o orçamento usa. O momento da foto não
// se pergunta ali (ver FOTO_TIPO_ORCAMENTO), então a grade fica limpa como uma galeria.
const SECAO_UNICA = [
  { value: FOTO_TIPO_ORCAMENTO, label: "Fotos", ajuda: "" },
] as const;

export default function Fotos({
  apiBase,
  fotos,
  onChange,
  podeEditar,
  porMomento = true,
  documento = "OS",
}: {
  /** Rota das fotos deste documento, ex.: `/api/os/<id>/fotos`. */
  apiBase: string;
  fotos: Foto[];
  /** Recebe um atualizador para evitar perder fotos ao enviar várias em sequência. */
  onChange: (atualizar: (atuais: Foto[]) => Foto[]) => void;
  podeEditar: boolean;
  /** Separa por entrada/serviço/saída (OS) ou mostra uma galeria só (orçamento). */
  porMomento?: boolean;
  /** Como o documento é chamado nos textos de ajuda. */
  documento?: "OS" | "orçamento";
}) {
  const secoes = porMomento ? FOTO_TIPOS : SECAO_UNICA;
  const confirmar = useConfirmar();
  const avisar = useAvisar();
  const [enviando, setEnviando] = useState<Enviando[]>([]);
  // O visor guarda o id, não o índice: mudar o momento reordena a lista e um
  // índice fixo saltaria para outra foto.
  const [visor, setVisor] = useState<string | null>(null);
  // Descrever é um modo opcional: em OS simples a grade continua limpa, só com
  // as fotos; em OS elaboradas o mecânico liga o modo e escreve embaixo de cada uma.
  const [descrevendo, setDescrevendo] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const tipoAlvo = useRef<FotoTipo>(porMomento ? FOTO_TIPO_PADRAO : FOTO_TIPO_ORCAMENTO);

  // Sem separação por momento a galeria mostra tudo — inclusive foto que chegou com
  // outro tipo (herdada de uma OS, ou de antes desta tela existir).
  const fotosDaSecao = (valor: FotoTipo) =>
    porMomento ? fotos.filter((f) => tipoDaFoto(f.tipo) === valor) : fotos;

  // Ordem de navegação do visor: seções na ordem definida, cronológico dentro de cada uma.
  const ordenadas = useMemo(
    () =>
      porMomento
        ? FOTO_TIPOS.flatMap((t) => fotos.filter((f) => tipoDaFoto(f.tipo) === t.value))
        : fotos,
    [fotos, porMomento]
  );
  const indice = visor === null ? -1 : ordenadas.findIndex((f) => f.id === visor);
  const fotoAtual = indice >= 0 ? ordenadas[indice] : null;

  async function enviarArquivos(files: FileList | File[] | null, tipo: FotoTipo) {
    const lista = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (lista.length === 0) return;

    const pendentes: Enviando[] = lista.map((f) => ({
      tempId: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(f),
      tipo,
      file: f,
    }));
    setEnviando((atual) => [...atual, ...pendentes]);

    // Sequencial: evita estourar memória do celular comprimindo várias fotos grandes de uma vez
    // e evita sobrecarregar a rede (wifi de oficina costuma ser instável) com várias em paralelo.
    for (const pendente of pendentes) {
      await enviarPendente(pendente);
    }
  }

  /** Envia uma foto pendente, com novas tentativas em caso de falha de rede/servidor. */
  async function enviarPendente(pendente: Enviando) {
    setEnviando((atual) =>
      atual.map((e) => (e.tempId === pendente.tempId ? { ...e, erro: undefined } : e))
    );

    const TENTATIVAS = 3;
    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      try {
        const blob = await compressImage(pendente.file);
        const form = new FormData();
        form.append("file", blob, "foto.jpg");
        form.append("tipo", pendente.tipo);
        const res = await fetch(apiBase, { method: "POST", body: form });
        if (!res.ok) {
          const msg = (await res.json().catch(() => null))?.error ?? "Falha no envio";
          // Erros de validação (formato/tamanho) não se resolvem tentando de novo.
          const definitivo = res.status >= 400 && res.status < 500 && res.status !== 429;
          throw Object.assign(new Error(msg), { definitivo });
        }
        const nova: Foto = await res.json();
        onChange((atuais) => [...atuais, nova]);
        setEnviando((atual) => atual.filter((e) => e.tempId !== pendente.tempId));
        URL.revokeObjectURL(pendente.preview);
        return;
      } catch (err) {
        const definitivo = err instanceof Error && (err as Error & { definitivo?: boolean }).definitivo;
        if (!definitivo && tentativa < TENTATIVAS) {
          await esperar(800 * tentativa);
          continue;
        }
        setEnviando((atual) =>
          atual.map((e) =>
            e.tempId === pendente.tempId
              ? { ...e, erro: err instanceof Error ? err.message : "Falha no envio" }
              : e
          )
        );
        return;
      }
    }
  }

  function removerPendente(tempId: string) {
    setEnviando((atual) => {
      const alvo = atual.find((e) => e.tempId === tempId);
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return atual.filter((e) => e.tempId !== tempId);
    });
  }

  function escolher(origem: "camera" | "galeria", tipo: FotoTipo) {
    tipoAlvo.current = tipo;
    (origem === "camera" ? cameraRef : galeriaRef).current?.click();
  }

  // A exclusão era otimista e sem checagem: a foto sumia da tela antes da
  // resposta, então uma falha a apagava da interface e a mantinha no banco.
  // Agora só sai da lista depois que o servidor confirma.
  async function excluir(id: string) {
    const alvo = fotos.find((f) => f.id === id);
    const ok = await confirmar({
      titulo: "Excluir esta foto?",
      texto: alvo?.legenda
        ? `“${alvo.legenda}” sai da OS e do PDF do cliente. Não há como desfazer.`
        : "Ela sai da OS e do PDF do cliente. Não há como desfazer.",
      acao: "Excluir foto",
      perigo: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        avisar("Não foi possível excluir a foto.", "erro");
        return;
      }
      onChange((atuais) => atuais.filter((f) => f.id !== id));
      setVisor(null);
    } catch {
      avisar("Sem conexão. A foto não foi excluída.", "erro");
    }
  }

  // Legenda e momento eram salvos sem olhar a resposta: a tela mostrava o valor
  // novo e o banco ficava com o antigo, sem ninguém saber.
  async function salvarCampo(id: string, corpo: Record<string, unknown>, anterior: Partial<Foto>) {
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (res.ok) return;
      onChange((atuais) => atuais.map((f) => (f.id === id ? { ...f, ...anterior } : f)));
      avisar("Não foi possível salvar a alteração da foto.", "erro");
    } catch {
      onChange((atuais) => atuais.map((f) => (f.id === id ? { ...f, ...anterior } : f)));
      avisar("Sem conexão. A alteração da foto não foi salva.", "erro");
    }
  }

  async function salvarLegenda(id: string, legenda: string) {
    const anterior = fotos.find((f) => f.id === id)?.legenda ?? null;
    onChange((atuais) =>
      atuais.map((f) => (f.id === id ? { ...f, legenda: legenda.trim() || null } : f))
    );
    await salvarCampo(id, { legenda }, { legenda: anterior });
  }

  async function salvarTipo(id: string, tipo: FotoTipo) {
    const anterior = fotos.find((f) => f.id === id)?.tipo;
    onChange((atuais) => atuais.map((f) => (f.id === id ? { ...f, tipo } : f)));
    await salvarCampo(id, { tipo }, anterior ? { tipo: anterior } : {});
  }

  // Navegação do visor por teclado, e trava da rolagem de fundo enquanto ele está
  // aberto — sem isso, arrastar sobre a foto rolava a página atrás dela.
  useEffect(() => {
    if (indice < 0) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisor(null);
      if (e.key === "ArrowRight" && indice < ordenadas.length - 1) {
        setVisor(ordenadas[indice + 1].id);
      }
      if (e.key === "ArrowLeft" && indice > 0) setVisor(ordenadas[indice - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [indice, ordenadas]);

  const total = fotos.length;

  return (
    <div className="no-print rounded-xl border border-linha bg-superficie p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-tinta">Fotos</h2>
          <p className="text-xs text-tinta-3">
            {descrevendo && total > 0
              ? "Escreva embaixo de cada foto o que ela mostra — a descrição sai no PDF do cliente"
              : total > 0
                ? `${total} foto${total > 1 ? "s" : ""} — ${
                    porMomento
                      ? "aparecem no fim do PDF do cliente, separadas por momento"
                      : `aparecem no fim do PDF do ${documento}`
                  }`
                : porMomento
                  ? "Registre o veículo na entrada, o serviço e a entrega"
                  : "Mostre o defeito e o estado do veículo — a foto segue junto na conversão em OS"}
          </p>
        </div>
        {podeEditar && total > 0 && (
          <button
            onClick={() => setDescrevendo((v) => !v)}
            aria-pressed={descrevendo}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              descrevendo
                ? "border-brand-600 bg-brand-600 text-brand-fg hover:bg-brand-700"
                : "border-linha-forte text-tinta-2 hover:bg-superficie-2"
            )}
          >
            {descrevendo ? "Concluir" : "Descrever fotos"}
          </button>
        )}
      </div>

      {podeEditar && (
        <>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              enviarArquivos(e.target.files, tipoAlvo.current);
              e.target.value = "";
            }}
          />
          <input
            ref={galeriaRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              enviarArquivos(e.target.files, tipoAlvo.current);
              e.target.value = "";
            }}
          />
        </>
      )}

      {secoes.map((t) => (
        <Secao
          key={t.value}
          label={t.label}
          ajuda={t.ajuda}
          comTitulo={porMomento}
          fotos={fotosDaSecao(t.value)}
          enviando={porMomento ? enviando.filter((e) => e.tipo === t.value) : enviando}
          podeEditar={podeEditar}
          descrevendo={descrevendo}
          onSoltar={(files) => enviarArquivos(files, t.value)}
          onEscolher={(origem) => escolher(origem, t.value)}
          onAbrir={setVisor}
          onLegenda={salvarLegenda}
          onTentarNovamente={(e) => enviarPendente(e)}
          onRemoverPendente={removerPendente}
        />
      ))}

      {/* Visor em tela cheia */}
      {fotoAtual && (
        <Visor
          foto={fotoAtual}
          indice={indice}
          total={ordenadas.length}
          podeEditar={podeEditar}
          comMomento={porMomento}
          onFechar={() => setVisor(null)}
          onAnterior={() => indice > 0 && setVisor(ordenadas[indice - 1].id)}
          onProxima={() => indice < ordenadas.length - 1 && setVisor(ordenadas[indice + 1].id)}
          onExcluir={() => excluir(fotoAtual.id)}
          onLegenda={(texto) => salvarLegenda(fotoAtual.id, texto)}
          onTipo={(tipo) => salvarTipo(fotoAtual.id, tipo)}
        />
      )}
    </div>
  );
}

/** Um momento do serviço (entrada, serviço, saída) — cada um é seu próprio alvo de envio.
 *  Sem momento (orçamento) a seção vira uma galeria só, sem título nem moldura. */
function Secao({
  label,
  ajuda,
  comTitulo,
  fotos,
  enviando,
  podeEditar,
  descrevendo,
  onSoltar,
  onEscolher,
  onAbrir,
  onLegenda,
  onTentarNovamente,
  onRemoverPendente,
}: {
  label: string;
  ajuda: string;
  comTitulo: boolean;
  fotos: Foto[];
  enviando: Enviando[];
  podeEditar: boolean;
  descrevendo: boolean;
  onSoltar: (files: FileList) => void;
  onEscolher: (origem: "camera" | "galeria") => void;
  onAbrir: (id: string) => void;
  onLegenda: (id: string, texto: string) => void;
  onTentarNovamente: (item: Enviando) => void;
  onRemoverPendente: (tempId: string) => void;
}) {
  const [arrastando, setArrastando] = useState(false);
  const vazio = fotos.length === 0 && enviando.length === 0;

  return (
    <section
      onDragOver={
        podeEditar
          ? (e) => {
              e.preventDefault();
              setArrastando(true);
            }
          : undefined
      }
      onDragLeave={() => setArrastando(false)}
      onDrop={
        podeEditar
          ? (e) => {
              e.preventDefault();
              setArrastando(false);
              onSoltar(e.dataTransfer.files);
            }
          : undefined
      }
      className={cn(
        "rounded-xl transition-colors",
        comTitulo && "border p-3",
        arrastando
          ? comTitulo
            ? "border-perigo-linha bg-perigo-fraco"
            : "bg-perigo-fraco"
          : comTitulo && "border-linha"
      )}
    >
      {comTitulo && (
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-tinta">
            {label}
            {fotos.length > 0 && (
              <span className="ml-1.5 text-xs font-normal text-tinta-3">{fotos.length}</span>
            )}
          </h3>
          <span className="truncate text-xs text-tinta-3">{ajuda}</span>
        </div>
      )}

      {vazio ? (
        podeEditar ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-linha px-3 py-4 sm:flex-row sm:justify-center">
            <span className="text-xs text-tinta-3">
              <span className="hidden sm:inline">Arraste as fotos aqui ou</span>
              <span className="sm:hidden">Nenhuma foto ainda</span>
            </span>
            <button
              onClick={() => onEscolher("camera")}
              className="rounded-lg bg-contraste px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 sm:hidden"
            >
              Tirar foto
            </button>
            <button
              onClick={() => onEscolher("galeria")}
              className="rounded-lg border border-linha-forte px-3 py-1.5 text-xs font-medium text-tinta-2 hover:bg-superficie-2"
            >
              <span className="sm:hidden">Escolher da galeria</span>
              <span className="hidden sm:inline">escolha os arquivos</span>
            </button>
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-tinta-3">Nenhuma foto.</p>
        )
      ) : (
        <div
          className={cn(
            "grid gap-2",
            descrevendo
              ? "grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
          )}
        >
          {fotos.map((foto) => {
            const miniatura = (
              <button
                key={foto.id}
                onClick={() => onAbrir(foto.id)}
                className="group relative aspect-square w-full overflow-hidden rounded-lg border border-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.legenda ?? `Foto — ${label}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {/* No modo descrever o texto aparece no campo abaixo, sem cobrir a foto. */}
                {foto.legenda && !descrevendo && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-left text-xs text-white">
                    {foto.legenda}
                  </span>
                )}
              </button>
            );

            if (!descrevendo) return miniatura;
            return (
              <div key={foto.id} className="space-y-1.5">
                {miniatura}
                <CampoDescricao
                  legenda={foto.legenda}
                  onSalvar={(texto) => onLegenda(foto.id, texto)}
                />
              </div>
            );
          })}

          {enviando.map((e) =>
            e.erro ? (
              <button
                key={e.tempId}
                onClick={() => onTentarNovamente(e)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-perigo-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.preview} alt="" className="h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
                  <span className="text-xs font-medium text-perigo">{e.erro}</span>
                  <span className="text-xs font-semibold text-tinta-2 underline">
                    Tentar novamente
                  </span>
                </div>
                <span
                  role="button"
                  aria-label="Remover"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onRemoverPendente(e.tempId);
                  }}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Fechar tamanho={12} />
                </span>
              </button>
            ) : (
              <div
                key={e.tempId}
                className="relative aspect-square overflow-hidden rounded-lg border border-linha bg-superficie-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.preview} alt="" className="h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
                  <Spinner />
                  <span className="text-xs text-tinta-2">Enviando</span>
                </div>
              </div>
            )
          )}

          {podeEditar && (
            <>
              <button
                onClick={() => onEscolher("camera")}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-linha text-tinta-3 hover:border-linha-forte hover:text-tinta-2 sm:hidden"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">Tirar foto</span>
              </button>
              <button
                onClick={() => onEscolher("galeria")}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-linha text-tinta-3 hover:border-linha-forte hover:text-tinta-2"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">
                  <span className="sm:hidden">Galeria</span>
                  <span className="hidden sm:inline">Adicionar</span>
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Visor({
  foto,
  indice,
  total,
  podeEditar,
  comMomento,
  onFechar,
  onAnterior,
  onProxima,
  onExcluir,
  onLegenda,
  onTipo,
}: {
  foto: Foto;
  indice: number;
  total: number;
  podeEditar: boolean;
  comMomento: boolean;
  onFechar: () => void;
  onAnterior: () => void;
  onProxima: () => void;
  onExcluir: () => void;
  onLegenda: (texto: string) => void;
  onTipo: (tipo: FotoTipo) => void;
}) {
  const [legenda, setLegenda] = useState(foto.legenda ?? "");
  const toqueX = useRef<number | null>(null);
  const tipoAtual = tipoDaFoto(foto.tipo);

  useEffect(() => setLegenda(foto.legenda ?? ""), [foto.id, foto.legenda]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${total}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onFechar}
    >
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm text-white/70">
          {indice + 1} de {total} · {formatDate(foto.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          {podeEditar && (
            <button
              onClick={onExcluir}
              className="rounded-lg border border-white/25 px-3 py-1.5 text-sm text-red-300 hover:bg-white/10"
            >
              Excluir
            </button>
          )}
          <button
            onClick={onFechar}
            className="rounded-lg border border-white/25 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-2"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (toqueX.current === null) return;
          const dx = e.changedTouches[0].clientX - toqueX.current;
          if (dx < -50) onProxima();
          if (dx > 50) onAnterior();
          toqueX.current = null;
        }}
      >
        {indice > 0 && (
          <button
            onClick={onAnterior}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Foto anterior"
            >
              <Voltar tamanho={20} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt={foto.legenda ?? "Foto do serviço"}
          className="max-h-full max-w-full object-contain"
        />
        {indice < total - 1 && (
          <button
            onClick={onProxima}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Próxima foto"
            >
              <Avancar tamanho={20} />
          </button>
        )}
      </div>

      <div className="space-y-3 px-4 py-4" onClick={(e) => e.stopPropagation()}>
        {podeEditar ? (
          <>
            {comMomento && (
            <div className="flex items-center justify-center gap-1.5">
              {FOTO_TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => t.value !== tipoAtual && onTipo(t.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    t.value === tipoAtual
                      ? "border-white bg-white text-black"
                      : "border-white/25 text-white/70 hover:bg-white/10"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            )}
            <input
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              onBlur={() => legenda !== (foto.legenda ?? "") && onLegenda(legenda)}
              placeholder="Descrição (ex: Pastilha desgastada, Painel na entrega)"
              maxLength={FOTO_LEGENDA_MAX}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </>
        ) : (
          <p className="text-center text-sm text-white/80">
            {[comMomento ? FOTO_TIPOS.find((t) => t.value === tipoAtual)?.label : null, foto.legenda]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Campo de descrição embaixo da miniatura (modo "Descrever fotos").
 * Salva ao sair do campo ou no Enter — dá para descer de foto em foto com Tab.
 */
function CampoDescricao({
  legenda,
  onSalvar,
}: {
  legenda: string | null;
  onSalvar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState(legenda ?? "");

  // A lista pode ser reordenada (troca de momento); mantém o campo em dia com a foto.
  useEffect(() => setTexto(legenda ?? ""), [legenda]);

  return (
    <input
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto.trim() !== (legenda ?? "") && onSalvar(texto)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      placeholder="Descreva a foto"
      maxLength={FOTO_LEGENDA_MAX}
      aria-label="Descrição da foto"
      className="w-full rounded-lg border border-linha px-2 py-1.5 text-xs text-tinta-2 placeholder:text-tinta-3 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
    />
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-tinta-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
