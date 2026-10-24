// Níveis de acesso de quem trabalha numa autopeça — o painel da loja no Peça Peça.
//
// Como funciona:
//   - o CATÁLOGO abaixo lista tudo o que dá para liberar. Cada chave só vale porque uma
//     rota a confere (`guardaLoja("balcao.responder")`), então o catálogo mora no
//     código, e não no banco;
//   - cada pessoa guarda as chaves que tem (`UsuarioLoja.permissoes`), e quem cuida da
//     equipe liga e desliga cada uma, pessoa por pessoa;
//   - "Dono" e "Vendedor" são só pontos de partida: o conjunto com que a pessoa entra.
//
// Funcionalidade nova no painel = uma linha no catálogo + a checagem na rota. A tela
// de equipe mostra a caixa nova sozinha.
//
// Arquivo puro (sem Prisma): a tela e o servidor usam as mesmas regras.

export const PERMISSOES_DA_LOJA = [
  { chave: "balcao.responder", rotulo: "Responder cotações", ajuda: "Marca, preço e prazo de cada peça." },
  { chave: "balcao.entrega", rotulo: "Avançar a entrega", ajuda: "Separando, saiu com o motoboy, entregue." },
  { chave: "loja.resumo", rotulo: "Ver o resumo de vendas", ajuda: "Cotações, pedidos e valores da loja." },
  { chave: "loja.equipe", rotulo: "Cuidar da equipe", ajuda: "Convidar pessoas, mudar acessos e dar novo acesso." },
  { chave: "loja.dados", rotulo: "Editar os dados da loja", ajuda: "Telefone e prazo do motoboy." },
] as const;

export type PermissaoLoja = (typeof PERMISSOES_DA_LOJA)[number]["chave"];

const TODAS: PermissaoLoja[] = PERMISSOES_DA_LOJA.map((p) => p.chave);

export type PerfilLoja = "DONO" | "VENDEDOR";

export const PERFIS_DA_LOJA: Record<PerfilLoja, { rotulo: string; ajuda: string; permissoes: PermissaoLoja[] }> = {
  DONO: { rotulo: "Dono", ajuda: "Tudo, inclusive a equipe e o resumo de vendas.", permissoes: TODAS },
  VENDEDOR: {
    rotulo: "Vendedor",
    ajuda: "Responde as cotações e cuida da entrega.",
    permissoes: ["balcao.responder", "balcao.entrega"],
  },
};

export function ehPerfilLoja(valor: unknown): valor is PerfilLoja {
  return valor === "DONO" || valor === "VENDEDOR";
}

/**
 * Só as chaves que o catálogo conhece, sem repetição e na ordem dele. Chave que saiu do
 * catálogo (ou que nunca esteve nele) não vale nada.
 */
export function permissoesValidas(lista: readonly unknown[]): PermissaoLoja[] {
  return TODAS.filter((chave) => lista.includes(chave));
}

/** Como chamar o conjunto de acessos de alguém na tela. */
export function rotuloDosAcessos(permissoes: readonly PermissaoLoja[]): string {
  for (const perfil of Object.values(PERFIS_DA_LOJA)) {
    if (perfil.permissoes.length === permissoes.length && perfil.permissoes.every((p) => permissoes.includes(p))) {
      return perfil.rotulo;
    }
  }
  return "Personalizado";
}

/**
 * Os acessos que ficam com o alvo quando alguém mexe neles. Ninguém dá — nem tira — o
 * que não tem: o que está fora do alcance de quem mexe continua como estava.
 */
export function acessosDepoisDaMudanca(
  atuais: readonly PermissaoLoja[],
  pedidos: readonly PermissaoLoja[],
  deQuemMexe: readonly PermissaoLoja[]
): PermissaoLoja[] {
  const foraDoAlcance = atuais.filter((p) => !deQuemMexe.includes(p));
  const dentroDoAlcance = pedidos.filter((p) => deQuemMexe.includes(p));
  return permissoesValidas([...foraDoAlcance, ...dentroDoAlcance]);
}

/** Acessos de quem fala em nome da plataforma (o painel admin do boxOS): todos. */
export const ACESSOS_DA_PLATAFORMA: readonly PermissaoLoja[] = TODAS;
