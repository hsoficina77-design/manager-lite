import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UsuarioProvider } from "@/components/UsuarioProvider";
import { AvisosProvider } from "@/components/ui/Avisos";
import { SaidaSeguraProvider } from "@/components/ui/SaidaSegura";
import { SCRIPT_TEMA } from "@/components/ui/Tema";
import { scriptInstalar } from "@/lib/instalar-app";
import { getUsuarioAtual } from "@/lib/auth";
import { getContaLojaAtual } from "@/lib/conta-loja";
import { bancoDaOficina } from "@/lib/db-oficina";
import { contarPendencias } from "@/lib/pendencias";
import { getConfiguracao } from "@/lib/configuracao-db";
import { nomeDoMenu } from "@/lib/configuracao";
import { HEADER_BUSCA, HEADER_ROTA, ehRotaDaLoja, ehRotaDoBalcao, ehRotaPublica } from "@/lib/permissoes";
import { ehTelaDoPecaPeca, loginDoPecaPeca, urlBoxOS, type Produto } from "@/lib/produto";
import { produtoDaRequisicao } from "@/lib/produto-servidor";
import { GRAFITE_BOXOS } from "@/components/marca/LogoBoxOS";
import { AvisoDePlano } from "@/components/plano/AvisoDePlano";
import { BloqueioDeAcao } from "@/components/plano/Bloqueio";
import { VoltaAoInicio } from "@/components/VoltaAoInicio";
import { ProdutoProvider } from "@/components/ProdutoProvider";
import { MolduraDaLoja, MolduraDaOficina } from "@/components/peca-peca/Moldura";
import { vePecaPeca } from "@/lib/peca-peca";
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

/** Os ícones da aba e da tela inicial do celular, de cada produto. */
function icones(pasta: "/brand" | "/brand-pecapeca"): Metadata["icons"] {
  return {
    icon: [
      { url: `${pasta}/favicon_16.png`, sizes: "16x16", type: "image/png" },
      { url: `${pasta}/favicon_32.png`, sizes: "32x32", type: "image/png" },
      { url: `${pasta}/favicon_48.png`, sizes: "48x48", type: "image/png" },
    ],
    apple: { url: `${pasta}/favicon_180.png`, sizes: "180x180", type: "image/png" },
  };
}

/**
 * A cara da tela: a do produto do endereço — e a do Peça Peça, em qualquer endereço,
 * nas telas que só existem nele e para quem só tem o Peça Peça. Enquanto o Peça Peça
 * não tem domínio próprio, é o que impede o convite da loja de sair laranja — e a loja
 * de instalar o boxOS no lugar do Peça Peça. O login, que é um só, é do Peça Peça quando
 * a pessoa vem dele (`?next=` numa tela dele).
 */
function caraDaTela(
  produto: Produto,
  cabecalhos: Pick<Headers, "get">,
  usuario: Awaited<ReturnType<typeof getUsuarioAtual>>
): Produto {
  const rota = cabecalhos.get(HEADER_ROTA) ?? "";
  if (produto === "peca-peca" || ehTelaDoPecaPeca(rota)) return "peca-peca";
  const next = new URLSearchParams(cabecalhos.get(HEADER_BUSCA) ?? "").get("next");
  if (rota === "/login" && loginDoPecaPeca(next)) return "peca-peca";
  return usuario && !usuario.usaBoxOS ? "peca-peca" : "boxos";
}

// A aba, o ícone e o app que o navegador instala são do produto da tela (boxOS ou Peça
// Peça); a logo da oficina fica só nos documentos. Logado, o nome da oficina vai na
// frente para distinguir abas de oficinas diferentes.
export async function generateMetadata(): Promise<Metadata> {
  const [usuario, produto, cabecalhos] = await Promise.all([getUsuarioAtual(), produtoDaRequisicao(), headers()]);
  const config = usuario ? await configuracaoDaSessao(usuario) : null;
  if (caraDaTela(produto, cabecalhos, usuario) === "peca-peca") {
    return {
      title: config ? `${nomeDoMenu(config)} · Peça Peça` : "Peça Peça",
      applicationName: "Peça Peça",
      description: "Peça Peça — cotação de peças nas autopeças da região.",
      icons: icones("/brand-pecapeca"),
      manifest: "/pecapeca.webmanifest",
    };
  }
  return {
    title: usuario?.administraPlataforma ? "Admin · boxOS" : config ? `${nomeDoMenu(config)} · boxOS` : "boxOS",
    applicationName: "boxOS",
    description: "boxOS — gestão para oficinas mecânicas.",
    icons: icones("/brand"),
    manifest: "/boxos.webmanifest",
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
  const [usuario, cabecalhos, produto] = await Promise.all([getUsuarioAtual(), headers(), produtoDaRequisicao()]);
  // Nome da oficina de quem entrou, para o menu. As cores não vêm daqui: são as do
  // produto para todo mundo (globals.css).
  const config = await configuracaoDaSessao(usuario);
  const rota = cabecalhos.get(HEADER_ROTA) ?? "";
  const cara = caraDaTela(produto, cabecalhos, usuario);

  // Painel da autopeça: conta própria, separada da oficina (lib/conta-loja.ts).
  const daLoja = ehRotaDaLoja(rota);
  const contaLoja = daLoja ? await getContaLojaAtual() : null;
  if (daLoja && !contaLoja) redirect(`/login?next=${encodeURIComponent(rota)}`);

  // Cookie válido mas sem usuário significa sessão que deixou de existir — acesso
  // desativado ou derrubado pelo dono. O proxy não tem como saber disso (não alcança
  // o banco), então é aqui que essa pessoa é mandada de volta ao login.
  if (!usuario && !daLoja && rota && !ehRotaPublica(rota)) {
    redirect(`/login?next=${encodeURIComponent(rota)}`);
  }

  // A conta da plataforma não opera oficina: mora no painel admin. Qualquer outra tela
  // (inclusive o "/" para onde o login manda) leva para lá. As públicas ficam de fora:
  // não são da oficina, e o balcão da loja precisa abrir para quem estiver logado.
  if (usuario?.administraPlataforma && rota && !ehRotaDoAdmin(rota) && !ehRotaPublica(rota) && !daLoja) {
    redirect("/admin");
  }

  // Oficina só do Peça Peça: as telas do boxOS levam à oferta dele; o "/" (Início do
  // boxOS) leva às cotações.
  if (usuario && !usuario.usaBoxOS && !daLoja && rota && !ehTelaSemBoxOS(rota)) {
    redirect(rota === "/" ? "/peca-peca" : "/conheca-o-boxos");
  }

  // A moldura: o Peça Peça tem a dele — no endereço dele, e para quem só tem o Peça
  // Peça em qualquer endereço. As telas de login, convite e primeiro acesso caem aqui
  // sem usuário e não ganham menu. O balcão antigo, por link, também não: é a tela de
  // outra empresa, mesmo quando o dono da oficina a abre noutra aba para testar. Nem as
  // telas abertas do Peça Peça (convite da loja, cadastro, boas-vindas): quem as abre
  // logado como plataforma ou oficina vê o mesmo que o dono da loja verá.
  const conteudo = ehRotaDoBalcao(rota) ? (
    children
  ) : contaLoja ? (
    <MolduraDaLoja loja={contaLoja.loja.nome} pessoa={contaLoja}>
      {children}
    </MolduraDaLoja>
  ) : ehTelaDoPecaPeca(rota) ? (
    children
  ) : usuario?.administraPlataforma ? (
    <AdminComMenu usuario={usuario}>{children}</AdminComMenu>
  ) : usuario && (produto === "peca-peca" || !usuario.usaBoxOS) ? (
    <MolduraDaOficina
      nome={nomeDoMenu(config)}
      usuario={usuario}
      usaBoxOS={usuario.usaBoxOS}
      urlBoxOS={produto === "peca-peca" ? urlBoxOS() : ""}
    >
      {children}
    </MolduraDaOficina>
  ) : usuario ? (
    <AppComMenu usuario={usuario} config={config}>
      {children}
    </AppComMenu>
  ) : (
    children
  );

  return (
    // `data-conta-loja`: com que conta a aba do painel da loja nasceu (ver `buscar`).
    <html lang="pt-BR" className={poppins.variable} data-produto={cara} data-conta-loja={contaLoja?.id}>
      <head>
        {/* Claro ou escuro antes da primeira pintura — senão a tela nasce
            branca e pisca para escura no primeiro render. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        {/* Guarda o "pode instalar" do navegador, que chega uma vez só e às vezes
            antes do React — o convite do Início e o menu leem daqui. */}
        <script dangerouslySetInnerHTML={{ __html: scriptInstalar(cara) }} />
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
                  usaBoxOS: usuario.usaBoxOS,
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
          <ProdutoProvider valor={{ produto, urlBoxOS: produto === "peca-peca" ? urlBoxOS() : "" }}>
            <AvisosProvider>
              {/* Por dentro do menu: o "Sair" da conta também passa pela pergunta. */}
              <SaidaSeguraProvider>{conteudo}</SaidaSeguraProvider>
            </AvisosProvider>
          </ProdutoProvider>
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
        pecaPeca={vePecaPeca(usuario)}
      />
      <main className="pt-14 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-56 md:pt-0">
        <AvisoDePlano usuario={usuario} />
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BloqueioDeAcao />
      <VoltaAoInicio />
    </>
  );
}

function ehRotaDoAdmin(rota: string) {
  return rota === "/admin" || rota.startsWith("/admin/");
}

/** Telas que a oficina só do Peça Peça abre: as dele, a oferta do boxOS e as públicas. */
function ehTelaSemBoxOS(rota: string) {
  return (
    ehRotaPublica(rota) ||
    ["/peca-peca", "/conheca-o-boxos"].some((tela) => rota === tela || rota.startsWith(`${tela}/`))
  );
}

/** O mesmo esqueleto do app, com o menu do painel admin e sem nada de plano de oficina. */
function AdminComMenu({
  usuario,
  children,
}: {
  usuario: NonNullable<Awaited<ReturnType<typeof getUsuarioAtual>>>;
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminSidebar usuario={{ nome: usuario.nome, email: usuario.email, papel: usuario.papel }} />
      <main className="pt-14 pb-[calc(3.25rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-56 md:pt-0">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </>
  );
}
