import type { Metadata, Viewport } from "next";
import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export const metadata: Metadata = {
  title: "HS Oficina Mecânica",
  description: "Gestão simples para oficinas mecânicas.",
  icons: { icon: "/logo-hs.png", apple: "/logo-hs.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// O layout consulta o banco a cada render; força renderização dinâmica
// para o Next não tentar pré-renderizar páginas (ex.: /_not-found) em build time.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [osPendentes, dividasPendentes] = await Promise.all([
    prisma.ordemServico.count({ where: { pago: false, status: "ENTREGUE" } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).dividaAvulsa.count({ where: { pago: false } }) as Promise<number>,
  ]);

  const pendingCount = osPendentes + dividasPendentes;

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-100 text-zinc-900 antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar pendingCount={pendingCount} />
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
            <div className="max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
