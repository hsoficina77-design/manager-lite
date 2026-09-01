import type { NextConfig } from "next";

// Origem do Storage, para o CSP liberar as fotos e a logo sem abrir a internet
// inteira. Em produção sai da env; sem ela, cai no domínio genérico do Supabase
// (o app roda igual, só o CSP fica um pouco mais largo).
const storage = process.env.SUPABASE_URL?.replace(/\/$/, "") || "https://*.supabase.co";

// Content-Security-Policy.
//
// `script-src` precisa de 'unsafe-inline' e 'unsafe-eval': o Next injeta scripts
// inline de hidratação sem nonce nesta configuração, e o @react-pdf/renderer compila
// fontes em tempo de execução. Ou seja, o CSP aqui **não** é defesa contra XSS — a
// defesa contra XSS é o React escapar tudo e o tema ser validado (lib/tema.ts).
// O que estas diretivas fecham de verdade é o resto: roubo de sessão por <base>
// trocada, POST de formulário para domínio de terceiro, plugin injetado por <object>
// e exfiltração de dados para um host que não seja o app ou o Storage.
const producao = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${storage}`,
  "font-src 'self' data:",
  // `data:` e `blob:` aqui não são folga: o @react-pdf/renderer carrega a logo e
  // as fotos com `fetch()` na data URL, não com <img>. Liberar só em `img-src`
  // deixava a foto aparecer na tela e bloqueava a MESMA imagem ao montar o PDF —
  // e como o fetch bloqueado nunca resolve, o botão ficava em "Gerando..." para
  // sempre. Nenhum dos dois esquemas alcança a rede: `data:` é o próprio conteúdo
  // e `blob:` é da mesma origem, então isto não reabre caminho de exfiltração.
  `connect-src 'self' data: blob: ${storage}`,
  // O pdf.js (usado para converter o PDF em imagem) roda num worker criado a
  // partir de um blob. Sem esta linha o navegador cai no `script-src`, que não
  // permite `blob:`, e a conversão morre calada.
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Fora de produção o app roda em http://localhost — forçar https quebraria o dev.
  ...(producao ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Ninguém embute o sistema num iframe: sem isso, um site pode sobrepor botões
  // invisíveis sobre a tela da OS e fazer o usuário clicar no que não vê.
  { key: "X-Frame-Options", value: "DENY" },
  // Impede o navegador de "adivinhar" que um arquivo do Storage é HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza a URL da OS (que tem id de cliente) no Referer de links externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // `camera=(self)` porque a foto da OS no celular usa `<input capture>`; o resto
  // o app não usa, e negar evita que um script injetado alcance.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // 2 anos de HTTPS obrigatório. Só vale em produção — em localhost o navegador
  // ignora, mas travar o domínio de dev em https quebraria o `next dev`.
  ...(producao
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
