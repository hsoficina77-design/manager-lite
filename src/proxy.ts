import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, lerToken } from "@/lib/sessao";
import { HEADER_ROTA, ehRotaPublica, exigeDono, exigeFinanceiro, exigeExclusao } from "@/lib/permissoes";
import { REGRAS, consumir, ipDaRequisicao, respostaDeLimite } from "@/lib/limite-requisicoes";

/** POST de foto: `/api/os/<id>/fotos` e `/api/orcamentos/<id>/fotos`. */
const ROTA_DE_UPLOAD = /^\/api\/(os|orcamentos)\/[^/]+\/fotos$/;

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
 * Aqui só se confere o que dá para conferir sem banco: assinatura, validade, papel e
 * as permissões de financeiro/exclusão, todos dentro do cookie assinado. A confirmação
 * de que a sessão continua existindo e de que o usuário segue ativo é feita no
 * servidor, em `auth.ts`.
 *
 * É também onde mora o freio de requisições (`lib/limite-requisicoes.ts`). Ele vem
 * antes de tudo de propósito: barrar aqui custa uma consulta a um `Map` e não encosta
 * no banco, no Storage nem no scrypt.
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Tráfego interno do Next (HMR em desenvolvimento, chunks) não entra na conta: é
  // pedido pelo próprio app e em volume que não representa abuso.
  if (pathname.startsWith("/_next/")) return NextResponse.next();

  const ehApi = pathname.startsWith("/api/");

  // Teto por IP, valendo inclusive para as rotas públicas — é justamente o login que
  // interessa proteger. Vem antes de ler o cookie porque não depende dele.
  const ip = ipDaRequisicao(request);
  const esperaIp = consumir(`ip:${ip}`, REGRAS.porIp);
  if (esperaIp > 0) return respostaDeLimite(esperaIp, { json: ehApi });

  if (ehRotaPublica(pathname)) return NextResponse.next();

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

  // Teto por sessão. Existe além do teto por IP porque a oficina inteira sai pelo mesmo
  // Wi-Fi: assim um cookie roubado — ou uma tela em laço — é contido sem derrubar os
  // colegas junto.
  const esperaSessao = consumir(`sessao:${sessao.sessaoId}`, REGRAS.porSessao);
  if (esperaSessao > 0) return respostaDeLimite(esperaSessao, { json: ehApi });

  // Foto é o pedido mais caro do sistema: até 10MB de corpo, que o servidor guarda
  // inteiro na memória, mais um arquivo no Storage do Supabase (que é cobrado e tem
  // teto). Barrar aqui evita até o corpo ser lido.
  if (request.method === "POST" && ROTA_DE_UPLOAD.test(pathname)) {
    const esperaUpload = consumir(`upload:${sessao.sessaoId}`, REGRAS.upload);
    if (esperaUpload > 0) {
      return respostaDeLimite(esperaUpload, {
        mensagem: "Muitas fotos enviadas em sequência. Espere alguns minutos e continue.",
      });
    }
  }

  const ehDono = sessao.papel === "ADMIN";

  if (!ehDono && exigeDono(pathname, request.method)) {
    if (ehApi) {
      return NextResponse.json({ error: "Acesso restrito ao dono" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!ehDono && !sessao.podeFinanceiro && exigeFinanceiro(pathname)) {
    if (ehApi) {
      return NextResponse.json({ error: "Acesso restrito ao financeiro" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!ehDono && !sessao.podeExcluir && exigeExclusao(pathname, request.method)) {
    return NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 });
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
