import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manager Lite",
  description: "Gestão simples para oficinas mecânicas.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [osPendentes, dividasPendentes] = await Promise.all([
    prisma.ordemServico.count({ where: { pago: false, status: { notIn: ["CANCELADA"] } } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).dividaAvulsa.count({ where: { pago: false } }) as Promise<number>,
  ]);

  const pendingCount = osPendentes + dividasPendentes;

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-100 text-zinc-900 antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar pendingCount={pendingCount} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
