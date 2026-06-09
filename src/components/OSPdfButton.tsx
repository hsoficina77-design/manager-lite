"use client";

import { useEffect, useState } from "react";
import { PDFViewer, pdf } from "@react-pdf/renderer";
import { OSPdfDocument, type OSForPdf } from "./OSPdfDocument";

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

  useEffect(() => {
    toDataUrl("/logo-hs.png").then(setLogo);
  }, []);

  // Fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function baixar() {
    const blob = await pdf(<OSPdfDocument os={os} logoSrc={logo} />).toBlob();
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
        onClick={() => setOpen(true)}
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
            </span>
            <div className="flex gap-2">
              <button
                onClick={baixar}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
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
            <PDFViewer width="100%" height="100%" showToolbar style={{ border: "none", borderRadius: 8 }}>
              <OSPdfDocument os={os} logoSrc={logo} />
            </PDFViewer>
          </div>
        </div>
      )}
    </>
  );
}
