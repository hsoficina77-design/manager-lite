// Quem pode o quê. Um arquivo só, sem Prisma e sem API de Node, porque tanto o proxy
// (Edge) quanto o servidor precisam responder exatamente a mesma coisa — se cada um
// tivesse a sua lista, uma delas ia ficar para trás.

export type Papel = "ADMIN" | "OPERADOR";

export const PAPEIS: { value: Papel; label: string; ajuda: string }[] = [
  {
    value: "ADMIN",
    label: "Dono",
    ajuda: "Vê o financeiro por inteiro e configura o sistema.",
  },
  {
    value: "OPERADOR",
    label: "Operador",
    ajuda: "Clientes, OS, orçamentos e fotos — sem custo, lucro nem caixa.",
  },
];

export function ehPapelValido(valor: unknown): valor is Papel {
  return valor === "ADMIN" || valor === "OPERADOR";
}

export function labelPapel(papel: string): string {
  return PAPEIS.find((p) => p.value === papel)?.label ?? papel;
}

// Telas e APIs que tratam de dinheiro ou de configuração do sistema. O operador não
// entra — nem pela navegação, nem digitando o endereço, nem chamando a API na mão.
export const ROTAS_DE_DONO = [
  "/configuracoes",
  "/caixa",
  "/despesas",
  "/contas-receber",
  "/produtividade",
  "/api/caixa",
  "/api/despesas",
  "/api/dividas",
  "/api/metas",
  "/api/produtividade",
  "/api/usuarios",
];

// Excluir apaga histórico e, no caso da OS, faturamento junto. Fica com o dono.
// (Para liberar ao operador, basta esvaziar esta lista.)
const EXCLUSAO_SO_DO_DONO = ["/api/os/", "/api/clientes/", "/api/orcamentos/", "/api/veiculos/"];

/**
 * Esta rota exige o papel de dono?
 *
 * `/api/configuracao` é o caso especial: qualquer um precisa **ler** (é de lá que sai o
 * cabeçalho da OS e o tema da tela), mas só o dono pode **gravar**.
 */
export function exigeDono(pathname: string, metodo: string): boolean {
  if (ROTAS_DE_DONO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))) {
    return true;
  }
  if (pathname.startsWith("/api/configuracao") && metodo !== "GET") return true;
  if (metodo === "DELETE" && EXCLUSAO_SO_DO_DONO.some((rota) => pathname.startsWith(rota))) {
    return true;
  }
  return false;
}

/** Rotas abertas: é onde se entra no sistema, então não dá para exigir estar dentro. */
export const ROTAS_PUBLICAS = [
  "/login",
  "/primeiro-acesso",
  "/api/auth/login",
  "/api/auth/primeiro-acesso",
];

/** Cabeçalho com a rota atual, escrito pelo proxy e lido pelo layout raiz. */
export const HEADER_ROTA = "x-rota-atual";

export function ehRotaPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}

// ─── Campos financeiros ───────────────────────────────────────────────────────
//
// Esconder na tela não basta: quem abre o DevTools vê a resposta da API inteira. Por
// isso o servidor apaga o que o operador não pode ver antes de responder.

const CAMPOS_FINANCEIROS = [
  "custoTotalPecas",
  "lucroReal",
  "margemPecas",
  "custoUnit",
  "lucroTotal", // agregado do cliente
] as const;

/**
 * Remove custo, lucro e margem — de OS, orçamento, itens e listas — quando quem
 * pergunta não é o dono. Preço de venda continua: o operador precisa dele para falar
 * com o cliente; o que ele não pode saber é quanto a peça custou.
 */
export function semFinanceiro<T>(dados: T, papel: string | null | undefined): T {
  if (papel === "ADMIN") return dados;
  return limpar(dados) as T;
}

function limpar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(limpar);
  if (valor === null || typeof valor !== "object") return valor;
  if (valor instanceof Date) return valor;

  const saida: Record<string, unknown> = {};
  for (const [chave, item] of Object.entries(valor as Record<string, unknown>)) {
    if ((CAMPOS_FINANCEIROS as readonly string[]).includes(chave)) continue;
    saida[chave] = limpar(item);
  }
  return saida;
}
