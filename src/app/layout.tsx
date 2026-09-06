import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { UsuarioProvider } from "@/components/UsuarioProvider";
import { AvisosProvider } from "@/components/ui/Avisos";
import { SCRIPT_TEMA } from "@/components/ui/Tema";
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
  // `cover` é o que faz `env(safe-area-inset-*)` valer alguma coisa. Sem isto a
  // barra colada no rodapé fica sob o indicador de home do iPhone.
  viewportFit: "cover",
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
        {/* Claro ou escuro, também antes da primeira pintura — senão a tela nasce
            branca e pisca para escura no primeiro render. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      {/* `100dvh` em vez de `100vh`: no iOS a unidade antiga conta a altura com a
          barra de endereço escondida, e o fim de cada tela ficava cortado. */}
      <body className="min-h-[100dvh] bg-fundo text-tinta antialiased">
        <UsuarioProvider
          usuario={
            usuario
              ? { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel }
              : null
          }
        >
          <AvisosProvider>{conteudo}</AvisosProvider>
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

  // Quem rola agora é o documento, não um `main` de altura travada.
  //
  // O shell era `h-screen overflow-hidden` com a rolagem dentro do `main`, e isso
  // custava duas coisas no celular: a barra de endereço nunca recolhia, porque a
  // página em si não rolava, e `position: sticky` media a partir do topo do
  // `main` — que fica atrás do cabeçalho fixo.
  //
  // O respiro no rodapé é a altura da barra de navegação do celular mais a área
  // segura do aparelho, para nenhuma tela terminar embaixo dela.
  return (
    <>
      <Sidebar
        pendingCount={pendingCount}
        nome={nomeDoMenu(config)}
        logoUrl={config.logoUrl}
        usuario={{ nome: usuario.nome, papel: usuario.papel }}
      />
      <main className="pt-14 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-56 md:pt-0">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </>
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
