// Barra o build se algum arquivo fora da lista usar o cliente Prisma cru.
//
// O cliente cru (`@/lib/prisma`) enxerga todas as oficinas. Dado de oficina se lê
// pelo `db` que `guardaApi`/`exigirOficina` entregam (lib/db-oficina.ts), já preso à
// oficina da sessão. Esta checagem é o que impede uma rota nova de pular essa porta:
// roda antes do `next build`, então o deploy não sai.
//
// Entrar nesta lista exige motivo: o arquivo precisa, por natureza, olhar para além de
// uma oficina (login acha o usuário pelo e-mail antes de saber de que oficina ele é,
// o cadastro cria a oficina, a plataforma lista as oficinas).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const PERMITIDOS = new Set([
  "src/lib/prisma.ts",
  "src/lib/db-oficina.ts",
  "src/lib/auth.ts",
  "src/lib/sistema.ts",
]);

const RAIZ = process.cwd();
const IMPORT_CRU = /from\s+["']@\/lib\/prisma["']|from\s+["'](\.\.?\/)+(lib\/)?prisma["']|require\(\s*["']@\/lib\/prisma["']\s*\)|from\s+["']@prisma\/client["']/;

function* arquivos(pasta) {
  for (const nome of readdirSync(pasta)) {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) yield* arquivos(caminho);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(nome)) yield caminho;
  }
}

const violacoes = [];
for (const arquivo of arquivos(join(RAIZ, "src"))) {
  const rel = relative(RAIZ, arquivo).split(sep).join("/");
  if (PERMITIDOS.has(rel)) continue;
  const texto = readFileSync(arquivo, "utf8");
  for (const [i, linha] of texto.split("\n").entries()) {
    if (!IMPORT_CRU.test(linha)) continue;
    // Tipos do Prisma (`import type { Prisma } …`) não acessam banco nenhum.
    if (/^\s*import\s+type\s/.test(linha)) continue;
    violacoes.push(`${rel}:${i + 1}  ${linha.trim()}`);
  }
}

if (violacoes.length > 0) {
  console.error(
    "\n✖ Acesso ao banco sem filtro de oficina.\n\n" +
      "  Estes arquivos importam o cliente Prisma cru, que enxerga todas as oficinas:\n\n" +
      violacoes.map((v) => "    " + v).join("\n") +
      "\n\n  Use o `db` de guardaApi()/exigirOficina() (src/lib/db-oficina.ts).\n" +
      "  Se o arquivo realmente precisa ver além de uma oficina, inclua-o em\n" +
      "  scripts/checar-isolamento.mjs explicando por quê.\n"
  );
  process.exit(1);
}

console.log("✔ Isolamento: nenhum acesso ao banco fora do filtro de oficina.");
