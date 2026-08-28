import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { UsuarioProvider } from "@/components/UsuarioProvider";
import { prisma } from "@/lib/prisma";
import { getUsuarioAtual } from "@/lib/auth";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";
import { HEADER_ROTA, ehRotaPublica } from "@/lib/permissoes";
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
  const [config, usuario, cabecalhos] = await Promise.all([
    getConfiguracao(),
    getUsuarioAtual(),
    headers(),
  ]);

  // Cookie válido mas sem usuário significa sessão que deixou de existir — acesso
  // desativado ou derrubado pelo dono. O proxy não tem como saber disso (não alcança
  // o banco), então é aqui que essa pessoa é mandada de volta ao login.
  const rota = cabecalhos.get(HEADER_ROTA) ?? "";
  if (!usuario && rota && !ehRotaPublica(rota)) {
    redirect(`/login?next=${encodeURIComponent(rota)}`);
  }

  // As telas de login e de primeiro acesso caem aqui sem usuário — e não devem ganhar
  // menu lateral nem contagem de pendências. O tema, sim: a marca já aparece no login.
  const conteudo = usuario ? (
    <AppComMenu usuario={usuario} config={config}>
      {children}
    </AppComMenu>
  ) : (
    children
  );

  return (
    <html lang="pt-BR">
      <head>
        {/* Cores da oficina. Vai no <head> para o tema já valer na primeira pintura,
            sem piscar o vermelho padrão antes de trocar. */}
        <style id="tema-da-marca" dangerouslySetInnerHTML={{ __html: cssDoTema(config) }} />
      </head>
      <body className="min-h-screen bg-gray-100 text-zinc-900 antialiased">
        <UsuarioProvider
          usuario={
            usuario
              ? { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
              : null
          }
        >
          {conteudo}
        </UsuarioProvider>
      </body>
    </html>
  );
}

async function AppComMenu({
  usuario,
  config,
  children,
}: {
  usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioAtual>>>;
  config: Awaited<ReturnType<typeof getConfiguracao>>;
  children: React.ReactNode;
}) {
  // Contas a receber é tela de dono; para o operador o contador nem é consultado.
  const pendingCount =
    usuario.papel === "ADMIN"
      ? await contarPendencias()
      : 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        pendingCount={pendingCount}
        nome={nomeDoMenu(config)}
        logoUrl={config.logoUrl}
        usuario={{ nome: usuario.nome, papel: usuario.papel }}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

async function contarPendencias(): Promise<number> {
  const [osPendentes, dividasPendentes] = await Promise.all([
    prisma.ordemServico.count({ where: { pago: false, status: "ENTREGUE" } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).dividaAvulsa.count({ where: { pago: false } }) as Promise<number>,
  ]);
  return osPendentes + dividasPendentes;
}
