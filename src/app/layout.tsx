import type { Metadata, Viewport } from "next";
import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";
import { cssDoTema } from "@/lib/tema";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Título, descrição e ícone saem do painel de configurações — a aba do navegador
// mostra o nome da oficina, não o de quem escreveu o sistema.
export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfiguracao();
  return {
    title: config.nome,
    description: "Gestão simples para oficinas mecânicas.",
    icons: config.logoUrl ? { icon: config.logoUrl, apple: config.logoUrl } : undefined,
  };
}

// O layout consulta o banco a cada render; força renderização dinâmica
// para o Next não tentar pré-renderizar páginas (ex.: /_not-found) em build time.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [osPendentes, dividasPendentes, config] = await Promise.all([
    prisma.ordemServico.count({ where: { pago: false, status: "ENTREGUE" } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).dividaAvulsa.count({ where: { pago: false } }) as Promise<number>,
    getConfiguracao(),
  ]);

  const pendingCount = osPendentes + dividasPendentes;

  return (
    <html lang="pt-BR">
      <head>
        {/* Cores da oficina. Vai no <head> para o tema já valer na primeira pintura,
            sem piscar o vermelho padrão antes de trocar. */}
        <style id="tema-da-marca" dangerouslySetInnerHTML={{ __html: cssDoTema(config) }} />
      </head>
      <body className="min-h-screen bg-gray-100 text-zinc-900 antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            pendingCount={pendingCount}
            nome={nomeDoMenu(config)}
            logoUrl={config.logoUrl}
          />
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
