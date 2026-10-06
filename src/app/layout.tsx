import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { UsuarioProvider } from "@/components/UsuarioProvider";
import { AvisosProvider } from "@/components/ui/Avisos";
import { SaidaSeguraProvider } from "@/components/ui/SaidaSegura";
import { SCRIPT_TEMA } from "@/components/ui/Tema";
import { getUsuarioAtual } from "@/lib/auth";
import { bancoDaOficina, type Db } from "@/lib/db-oficina";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";
import { HEADER_ROTA, ehRotaPublica } from "@/lib/permissoes";
import { GRAFITE_BOXOS } from "@/components/marca/LogoBoxOS";
import { AvisoDePlano } from "@/components/plano/AvisoDePlano";
import { BloqueioDeAcao } from "@/components/plano/Bloqueio";
import "./globals.css";

// Fonte da marca boxOS, só para a logo e os títulos (ver `font-marca` no Tailwind).
// O `next/font` baixa o arquivo no build e o serve daqui — o navegador não chama o Google.
const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--fonte-marca",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // `cover` é o que faz `env(safe-area-inset-*)` valer alguma coisa. Sem isto a
  // barra colada no rodapé fica sob o indicador de home do iPhone.
  viewportFit: "cover",
  // Barra do navegador no Android na cor do menu: branca no tema claro, grafite no
  // escuro. Segue a preferência do aparelho — a escolha manual de tema não chega aqui.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: GRAFITE_BOXOS },
  ],
};

/** Configuração da oficina de quem está logado; o padrão para quem não está. */
async function configuracaoDaSessao(usuario: Awaited<ReturnType<typeof getUsuarioAtual>>) {
  return getConfiguracao(usuario ? bancoDaOficina(usuario.oficinaId) : null);
}

// A aba e o ícone são do sistema (boxOS); a logo da oficina fica só nos documentos.
// Logado, o nome da oficina vai na frente para distinguir abas de oficinas diferentes.
export async function generateMetadata(): Promise<Metadata> {
  const usuario = await getUsuarioAtual();
  const config = usuario ? await configuracaoDaSessao(usuario) : null;
  return {
    title: config ? `${nomeDoMenu(config)} · boxOS` : "boxOS",
    applicationName: "boxOS",
    description: "boxOS — gestão para oficinas mecânicas.",
    icons: {
      icon: [
        { url: "/brand/favicon_16.png", sizes: "16x16", type: "image/png" },
        { url: "/brand/favicon_32.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/favicon_48.png", sizes: "48x48", type: "image/png" },
      ],
      apple: { url: "/brand/favicon_180.png", sizes: "180x180", type: "image/png" },
    },
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
  const [usuario, cabecalhos] = await Promise.all([getUsuarioAtual(), headers()]);
  // Nome da oficina de quem entrou, para o menu. As cores não vêm daqui: são as do
  // boxOS para todo mundo (globals.css).
  const config = await configuracaoDaSessao(usuario);

  // Cookie válido mas sem usuário significa sessão que deixou de existir — acesso
  // desativado ou derrubado pelo dono. O proxy não tem como saber disso (não alcança
  // o banco), então é aqui que essa pessoa é mandada de volta ao login.
  const rota = cabecalhos.get(HEADER_ROTA) ?? "";
  if (!usuario && rota && !ehRotaPublica(rota)) {
    redirect(`/login?next=${encodeURIComponent(rota)}`);
  }

  // As telas de login, convite e primeiro acesso caem aqui sem usuário — e não devem
  // ganhar menu lateral nem contagem de pendências.
  const conteudo = usuario ? (
    <AppComMenu usuario={usuario} config={config}>
      {children}
    </AppComMenu>
  ) : (
    children
  );

  return (
    <html lang="pt-BR" className={poppins.variable}>
      <head>
        {/* Claro ou escuro antes da primeira pintura — senão a tela nasce
            branca e pisca para escura no primeiro render. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      {/* `100dvh` em vez de `100vh`: no iOS a unidade antiga conta a altura com a
          barra de endereço escondida, e o fim de cada tela ficava cortado. */}
      <body className="min-h-[100dvh] bg-fundo text-tinta antialiased">
        <UsuarioProvider
          usuario={
            usuario
              ? {
                  id: usuario.id,
                  nome: usuario.nome,
                  email: usuario.email,
                  papel: usuario.papel,
                  podeFinanceiro: usuario.podeFinanceiro,
                  podeExcluir: usuario.podeExcluir,
                  administraPlataforma: usuario.administraPlataforma,
                  plano: {
                    situacao: usuario.situacao,
                    testeAte: usuario.testeAte?.toISOString() ?? null,
                    pagoAte: usuario.pagoAte?.toISOString() ?? null,
                    somenteLeitura: usuario.somenteLeitura,
                  },
                }
              : null
          }
        >
          <AvisosProvider>
            {/* Por dentro do menu: o "Sair" da conta também passa pela pergunta. */}
            <SaidaSeguraProvider>{conteudo}</SaidaSeguraProvider>
          </AvisosProvider>
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
  // Contas a receber é tela de financeiro; sem esse acesso o contador nem é consultado.
  const pendingCount = usuario.podeFinanceiro
    ? await contarPendencias(bancoDaOficina(usuario.oficinaId).db)
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
        usuario={{ nome: usuario.nome, papel: usuario.papel, podeFinanceiro: usuario.podeFinanceiro }}
      />
      <main className="pt-14 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-56 md:pt-0">
        <AvisoDePlano usuario={usuario} />
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BloqueioDeAcao />
    </>
  );
}

async function contarPendencias(db: Db): Promise<number> {
  const [osPendentes, dividasPendentes] = await Promise.all([
    db.ordemServico.count({ where: { pago: false, status: "ENTREGUE" } }),
    db.dividaAvulsa.count({ where: { pago: false } }),
  ]);
  return osPendentes + dividasPendentes;
}
