"use client";

import { useCallback, useEffect, useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { OSPdfDocument, type FotoPdf, type OSForPdf } from "./OSPdfDocument";

async function toDataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export default function OSPdfButton({ os }: { os: OSForPdf }) {
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [fotos, setFotos] = useState<FotoPdf[]>([]);
  const [preparando, setPreparando] = useState(false);

  const totalFotos = os.fotos?.length ?? 0;

  useEffect(() => {
    toDataUrl("/logo-hs.png").then(setLogo);
  }, []);

  // As imagens precisam virar data URL antes de entrar no PDF.
  const carregarFotos = useCallback(async () => {
    if (totalFotos === 0) {
      setFotos([]);
      return;
    }
    setPreparando(true);
    try {
      const convertidas = await Promise.all(
        (os.fotos ?? []).map(async (f) => {
          const src = await toDataUrl(f.url);
          return src ? { id: f.id, src, legenda: f.legenda, createdAt: f.createdAt } : null;
        })
      );
      setFotos(convertidas.filter((f): f is FotoPdf => f !== null));
    } finally {
      setPreparando(false);
    }
  }, [os.fotos, totalFotos]);

  async function abrir() {
    setOpen(true);
    await carregarFotos();
  }

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function baixar() {
    const blob = await pdf(<OSPdfDocument os={os} logoSrc={logo} fotos={fotos} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OS-${os.numero}-HS-Oficina.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        onClick={abrir}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        Visualizar PDF
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          {/* Barra superior */}
          <div
            className="flex items-center justify-between gap-3 px-5 py-3 bg-white border-b border-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium text-zinc-700">
              Pré-visualização — OS #{os.numero}
              {totalFotos > 0 && (
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  {preparando
                    ? `preparando ${totalFotos} foto${totalFotos > 1 ? "s" : ""}...`
                    : `${fotos.length} foto${fotos.length > 1 ? "s" : ""} anexada${fotos.length > 1 ? "s" : ""}`}
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <button
                onClick={baixar}
                disabled={preparando}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Baixar PDF
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Visualizador */}
          <div className="flex-1 p-4" onClick={(e) => e.stopPropagation()}>
            {preparando ? (
              <div className="flex h-full items-center justify-center rounded-lg bg-white text-sm text-zinc-500">
                Preparando as fotos do PDF...
              </div>
            ) : (
              <PDFViewer width="100%" height="100%" showToolbar style={{ border: "none", borderRadius: 8 }}>
                <OSPdfDocument os={os} logoSrc={logo} fotos={fotos} />
              </PDFViewer>
            )}
          </div>
        </div>
      )}
    </>
  );
}
