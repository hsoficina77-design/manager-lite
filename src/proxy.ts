import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";
import { HEADER_ROTA, ehRotaPublica, exigeDono } from "@/lib/permissoes";

/**
 * Porta de entrada do app: **nada** passa sem sessão válida.
 *
 * No Next 16 este arquivo se chama `proxy.ts` (era `middleware.ts`); roda no Edge,
 * antes de qualquer página ou rota de API.
 *
 * A lista é de exceções (login e afins), não de rotas protegidas — de propósito. Assim
 * uma tela ou API criada amanhã já nasce fechada; esquecer de proteger deixou de ser
 * possível. O que se pode esquecer é de *abrir* algo, e isso aparece na hora.
 *
 * Aqui só se confere o que dá para conferir sem banco: assinatura, validade e papel,
 * todos dentro do cookie assinado. A confirmação de que a sessão continua existindo e
 * de que o usuário segue ativo é feita no servidor, em `auth.ts`.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ehRotaPublica(pathname)) return NextResponse.next();

  const ehApi = pathname.startsWith("/api/");
  const sessao = await lerToken(request.cookies.get(COOKIE_SESSAO)?.value);

  if (!sessao) {
    if (ehApi) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    // Guarda para onde a pessoa ia, para voltar lá depois de entrar.
    if (pathname !== "/") login.searchParams.set("next", pathname + request.nextUrl.search);
    const resposta = NextResponse.redirect(login);
    // Cookie inválido ou vencido não serve para mais nada — sai do navegador.
    resposta.cookies.delete(COOKIE_SESSAO);
    return resposta;
  }

  if (sessao.papel !== "ADMIN" && exigeDono(pathname, request.method)) {
    if (ehApi) {
      return NextResponse.json({ error: "Acesso restrito ao dono" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // O layout raiz precisa saber que rota está sendo servida para poder mandar ao
  // login quem tem cookie válido mas já não tem sessão — caso de acesso desativado
  // ou derrubado, que só o banco revela e aqui no Edge não dá para consultar.
  const headers = new Headers(request.headers);
  headers.set(HEADER_ROTA, pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Tudo, menos os arquivos que o próprio Next serve e os estáticos da pasta public
  // (a logo aparece na tela de login, que é pública por definição).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|txt|xml|webmanifest)$).*)",
  ],
};
