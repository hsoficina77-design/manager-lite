"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { compressImage } from "@/lib/image-compress";
import { FOTO_TIPOS, FOTO_TIPO_PADRAO, tipoDaFoto, type FotoTipo } from "@/lib/constants";

export type Foto = {
  id: string;
  url: string;
  legenda: string | null;
  tipo: string;
  createdAt: string;
};

type Enviando = { tempId: string; preview: string; tipo: FotoTipo; erro?: string };

export default function OSFotos({
  osId,
  fotos,
  onChange,
  podeEditar,
}: {
  osId: string;
  fotos: Foto[];
  /** Recebe um atualizador para evitar perder fotos ao enviar várias em sequência. */
  onChange: (atualizar: (atuais: Foto[]) => Foto[]) => void;
  podeEditar: boolean;
}) {
  const [enviando, setEnviando] = useState<Enviando[]>([]);
  // O visor guarda o id, não o índice: mudar o momento reordena a lista e um
  // índice fixo saltaria para outra foto.
  const [visor, setVisor] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const tipoAlvo = useRef<FotoTipo>(FOTO_TIPO_PADRAO);

  // Ordem de navegação do visor: seções na ordem definida, cronológico dentro de cada uma.
  const ordenadas = useMemo(
    () => FOTO_TIPOS.flatMap((t) => fotos.filter((f) => tipoDaFoto(f.tipo) === t.value)),
    [fotos]
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
    }));
    setEnviando((atual) => [...atual, ...pendentes]);

    // Sequencial: evita estourar memória do celular comprimindo várias fotos grandes de uma vez.
    for (let i = 0; i < lista.length; i++) {
      const pendente = pendentes[i];
      try {
        const blob = await compressImage(lista[i]);
        const form = new FormData();
        form.append("file", blob, "foto.jpg");
        form.append("tipo", tipo);
        const res = await fetch(`/api/os/${osId}/fotos`, { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json()).error ?? "Falha no envio");
        const nova: Foto = await res.json();
        onChange((atuais) => [...atuais, nova]);
        setEnviando((atual) => atual.filter((e) => e.tempId !== pendente.tempId));
        URL.revokeObjectURL(pendente.preview);
      } catch (err) {
        setEnviando((atual) =>
          atual.map((e) =>
            e.tempId === pendente.tempId
              ? { ...e, erro: err instanceof Error ? err.message : "Falha no envio" }
              : e
          )
        );
      }
    }
  }

  function escolher(origem: "camera" | "galeria", tipo: FotoTipo) {
    tipoAlvo.current = tipo;
    (origem === "camera" ? cameraRef : galeriaRef).current?.click();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta foto?")) return;
    onChange((atuais) => atuais.filter((f) => f.id !== id));
    setVisor(null);
    await fetch(`/api/os/${osId}/fotos/${id}`, { method: "DELETE" });
  }

  async function salvarLegenda(id: string, legenda: string) {
    onChange((atuais) =>
      atuais.map((f) => (f.id === id ? { ...f, legenda: legenda.trim() || null } : f))
    );
    await fetch(`/api/os/${osId}/fotos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legenda }),
    });
  }

  async function salvarTipo(id: string, tipo: FotoTipo) {
    onChange((atuais) => atuais.map((f) => (f.id === id ? { ...f, tipo } : f)));
    await fetch(`/api/os/${osId}/fotos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo }),
    });
  }

  // Navegação do visor por teclado
  useEffect(() => {
    if (indice < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisor(null);
      if (e.key === "ArrowRight" && indice < ordenadas.length - 1) {
        setVisor(ordenadas[indice + 1].id);
      }
      if (e.key === "ArrowLeft" && indice > 0) setVisor(ordenadas[indice - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [indice, ordenadas]);

  const total = fotos.length;

  return (
    <div className="no-print bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-zinc-800">Fotos</h2>
        <p className="text-xs text-zinc-500">
          {total > 0
            ? `${total} foto${total > 1 ? "s" : ""} — aparecem no fim do PDF do cliente, separadas por momento`
            : "Registre o veículo na entrada, o serviço e a entrega"}
        </p>
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

      {FOTO_TIPOS.map((t) => (
        <Secao
          key={t.value}
          label={t.label}
          ajuda={t.ajuda}
          fotos={fotos.filter((f) => tipoDaFoto(f.tipo) === t.value)}
          enviando={enviando.filter((e) => e.tipo === t.value)}
          podeEditar={podeEditar}
          onSoltar={(files) => enviarArquivos(files, t.value)}
          onEscolher={(origem) => escolher(origem, t.value)}
          onAbrir={setVisor}
        />
      ))}

      {/* Visor em tela cheia */}
      {fotoAtual && (
        <Visor
          foto={fotoAtual}
          indice={indice}
          total={ordenadas.length}
          podeEditar={podeEditar}
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

/** Um momento do serviço (entrada, serviço, saída) — cada um é seu próprio alvo de envio. */
function Secao({
  label,
  ajuda,
  fotos,
  enviando,
  podeEditar,
  onSoltar,
  onEscolher,
  onAbrir,
}: {
  label: string;
  ajuda: string;
  fotos: Foto[];
  enviando: Enviando[];
  podeEditar: boolean;
  onSoltar: (files: FileList) => void;
  onEscolher: (origem: "camera" | "galeria") => void;
  onAbrir: (id: string) => void;
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
        "rounded-xl border p-3 transition-colors",
        arrastando ? "border-red-400 bg-red-50" : "border-zinc-200"
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-800">
          {label}
          {fotos.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-zinc-400">{fotos.length}</span>
          )}
        </h3>
        <span className="truncate text-xs text-zinc-400">{ajuda}</span>
      </div>

      {vazio ? (
        podeEditar ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 px-3 py-4 sm:flex-row sm:justify-center">
            <span className="text-xs text-zinc-400">
              <span className="hidden sm:inline">Arraste as fotos aqui ou</span>
              <span className="sm:hidden">Nenhuma foto ainda</span>
            </span>
            <button
              onClick={() => onEscolher("camera")}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 sm:hidden"
            >
              Tirar foto
            </button>
            <button
              onClick={() => onEscolher("galeria")}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <span className="sm:hidden">Escolher da galeria</span>
              <span className="hidden sm:inline">escolha os arquivos</span>
            </button>
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-zinc-400">Nenhuma foto.</p>
        )
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {fotos.map((foto) => (
            <button
              key={foto.id}
              onClick={() => onAbrir(foto.id)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.legenda ?? `Foto — ${label}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              {foto.legenda && (
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-left text-[10px] text-white">
                  {foto.legenda}
                </span>
              )}
            </button>
          ))}

          {enviando.map((e) => (
            <div
              key={e.tempId}
              className="relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.preview} alt="" className="h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
                {e.erro ? (
                  <span className="text-[10px] font-medium text-red-600">{e.erro}</span>
                ) : (
                  <>
                    <Spinner />
                    <span className="text-[10px] text-zinc-600">Enviando</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {podeEditar && (
            <button
              onClick={() => onEscolher(isMobile() ? "camera" : "galeria")}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-[10px]">
                <span className="sm:hidden">Tirar foto</span>
                <span className="hidden sm:inline">Adicionar</span>
              </span>
            </button>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={onFechar}>
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
            className="absolute left-2 z-10 rounded-full bg-black/50 px-3 py-2 text-xl text-white hover:bg-black/70"
            aria-label="Foto anterior"
          >
            ‹
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
            className="absolute right-2 z-10 rounded-full bg-black/50 px-3 py-2 text-xl text-white hover:bg-black/70"
            aria-label="Próxima foto"
          >
            ›
          </button>
        )}
      </div>

      <div className="space-y-3 px-4 py-4" onClick={(e) => e.stopPropagation()}>
        {podeEditar ? (
          <>
            <div className="flex items-center justify-center gap-1.5">
              {FOTO_TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => t.value !== tipoAtual && onTipo(t.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    t.value === tipoAtual
                      ? "border-white bg-white text-zinc-900"
                      : "border-white/25 text-white/70 hover:bg-white/10"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              onBlur={() => legenda !== (foto.legenda ?? "") && onLegenda(legenda)}
              placeholder="Legenda (ex: Pastilha desgastada, Painel na entrega)"
              maxLength={80}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </>
        ) : (
          <p className="text-center text-sm text-white/80">
            {FOTO_TIPOS.find((t) => t.value === tipoAtual)?.label}
            {foto.legenda ? ` · ${foto.legenda}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function isMobile() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
