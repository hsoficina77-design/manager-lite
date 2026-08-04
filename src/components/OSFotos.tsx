"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import { compressImage } from "@/lib/image-compress";

export type Foto = {
  id: string;
  url: string;
  legenda: string | null;
  createdAt: string;
};

type Enviando = { tempId: string; preview: string; erro?: string };

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
  const [arrastando, setArrastando] = useState(false);
  const [visor, setVisor] = useState<number | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);

  async function enviarArquivos(files: FileList | File[] | null) {
    const lista = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (lista.length === 0) return;

    const pendentes: Enviando[] = lista.map((f) => ({
      tempId: `${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(f),
    }));
    setEnviando((atual) => [...atual, ...pendentes]);

    // Sequencial: evita estourar memória do celular comprimindo várias fotos grandes de uma vez.
    for (let i = 0; i < lista.length; i++) {
      const pendente = pendentes[i];
      try {
        const blob = await compressImage(lista[i]);
        const form = new FormData();
        form.append("file", blob, "foto.jpg");
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

  // Navegação do visor por teclado
  useEffect(() => {
    if (visor === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisor(null);
      if (e.key === "ArrowRight") setVisor((v) => (v === null ? v : Math.min(fotos.length - 1, v + 1)));
      if (e.key === "ArrowLeft") setVisor((v) => (v === null ? v : Math.max(0, v - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visor, fotos.length]);

  const vazio = fotos.length === 0 && enviando.length === 0;

  return (
    <div className="no-print bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-zinc-800">Fotos do serviço</h2>
          <p className="text-xs text-zinc-500">
            {fotos.length > 0
              ? `${fotos.length} foto${fotos.length > 1 ? "s" : ""} — aparecem no fim do PDF do cliente`
              : "Entrada do veículo, peças trocadas, antes e depois"}
          </p>
        </div>
        {fotos.length > 0 && podeEditar && (
          <button
            onClick={() => galeriaRef.current?.click()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            + Adicionar
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
              enviarArquivos(e.target.files);
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
              enviarArquivos(e.target.files);
              e.target.value = "";
            }}
          />
        </>
      )}

      {/* Área de envio — só aparece quando ainda não há fotos, para não empurrar a galeria pra baixo */}
      {podeEditar && vazio && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            enviarArquivos(e.dataTransfer.files);
          }}
          className={cn(
            "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
            arrastando ? "border-red-400 bg-red-50" : "border-zinc-200"
          )}
        >
          <CameraIcon />
          <p className="mt-2 text-sm text-zinc-600">
            <span className="hidden sm:inline">Arraste as fotos aqui ou escolha abaixo</span>
            <span className="sm:hidden">Registre o serviço com fotos</span>
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => cameraRef.current?.click()}
              className="rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 sm:hidden"
            >
              Tirar foto
            </button>
            <button
              onClick={() => galeriaRef.current?.click()}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <span className="sm:hidden">Escolher da galeria</span>
              <span className="hidden sm:inline">Escolher fotos</span>
            </button>
          </div>
        </div>
      )}

      {/* Galeria */}
      {!vazio && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {fotos.map((foto, i) => (
            <button
              key={foto.id}
              onClick={() => setVisor(i)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.legenda ?? "Foto do serviço"}
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
              onClick={() => (isMobile() ? cameraRef.current : galeriaRef.current)?.click()}
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

      {/* Visor em tela cheia */}
      {visor !== null && fotos[visor] && (
        <Visor
          foto={fotos[visor]}
          indice={visor}
          total={fotos.length}
          podeEditar={podeEditar}
          onFechar={() => setVisor(null)}
          onAnterior={() => setVisor(Math.max(0, visor - 1))}
          onProxima={() => setVisor(Math.min(fotos.length - 1, visor + 1))}
          onExcluir={() => excluir(fotos[visor].id)}
          onLegenda={(texto) => salvarLegenda(fotos[visor].id, texto)}
        />
      )}
    </div>
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
}) {
  const [legenda, setLegenda] = useState(foto.legenda ?? "");
  const toqueX = useRef<number | null>(null);

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

      <div className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        {podeEditar ? (
          <input
            value={legenda}
            onChange={(e) => setLegenda(e.target.value)}
            onBlur={() => legenda !== (foto.legenda ?? "") && onLegenda(legenda)}
            placeholder="Legenda (ex: Peça trocada, Entrada do veículo)"
            maxLength={80}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        ) : (
          foto.legenda && <p className="text-center text-sm text-white/80">{foto.legenda}</p>
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

function CameraIcon() {
  return (
    <svg
      className="mx-auto text-zinc-300"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
