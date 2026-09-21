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

// Telas e APIs que ficam com o dono para sempre — configuração do sistema, metas e
// gestão de acessos. Diferente do financeiro e da exclusão (abaixo), aqui não existe
// checkbox: não dá para um operador configurar o sistema mesmo com ajuste fino.
export const ROTAS_DE_DONO = [
  "/configuracoes",
  "/produtividade",
  "/api/metas",
  "/api/produtividade",
  "/api/usuarios",
  "/api/exclusoes",
];

// Dinheiro: caixa, despesas, contas a receber. Todo dono já enxerga; um operador só
// entra aqui com o checkbox "Financeiro" marcado nele (Usuario.podeFinanceiro).
export const ROTAS_FINANCEIRO = [
  "/caixa",
  "/despesas",
  "/contas-receber",
  "/api/caixa",
  "/api/despesas",
  "/api/dividas",
];

// Excluir apaga histórico e, no caso da OS, faturamento junto. Todo dono já pode; um
// operador só com o checkbox "Excluir" marcado nele (Usuario.podeExcluir). Toda
// exclusão fica registrada no backlog (RegistroExclusao), então dá para rastrear quem
// apagou o quê mesmo com o acesso liberado.
const ROTAS_DE_EXCLUSAO = [
  "/api/os/",
  "/api/clientes/",
  "/api/orcamentos/",
  "/api/veiculos/",
  "/api/produtos/",
];

/**
 * Esta rota exige o papel de dono — sem exceção por checkbox?
 *
 * `/api/configuracao` é o caso especial: qualquer um precisa **ler** (é de lá que sai o
 * cabeçalho da OS e o tema da tela), mas só o dono pode **gravar**.
 */
export function exigeDono(pathname: string, metodo: string): boolean {
  if (ROTAS_DE_DONO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))) {
    return true;
  }
  if (pathname.startsWith("/api/configuracao") && metodo !== "GET") return true;
  return false;
}

/** Esta rota é de financeiro — exige `podeFinanceiro` (dono sempre tem)? */
export function exigeFinanceiro(pathname: string): boolean {
  return ROTAS_FINANCEIRO.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));
}

/** Esta requisição é uma exclusão protegida — exige `podeExcluir` (dono sempre tem)? */
export function exigeExclusao(pathname: string, metodo: string): boolean {
  return metodo === "DELETE" && ROTAS_DE_EXCLUSAO.some((rota) => pathname.startsWith(rota));
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
 * Remove custo, lucro e margem — de OS, orçamento, itens e listas — de quem não pode
 * ver financeiro (dono sempre pode; operador só com `podeFinanceiro`). Preço de venda
 * continua: quem atende precisa dele para falar com o cliente; o que não pode saber é
 * quanto a peça custou.
 */
export function semFinanceiro<T>(dados: T, podeVerFinanceiro: boolean): T {
  if (podeVerFinanceiro) return dados;
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
