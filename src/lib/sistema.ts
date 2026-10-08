// Operações do sistema — as poucas que, por natureza, olham além de uma oficina.
//
// Criar uma oficina (ela ainda não existe, então não há banco "dela" para usar),
// abrir sessão, e o painel da plataforma. Tudo aqui usa o cliente Prisma cru, que
// passa por cima do filtro de oficina e da RLS: por isso este arquivo está na lista
// curta de `scripts/checar-isolamento.mjs`, e nada daqui devolve dado de dentro de
// uma oficina (cliente, OS, dinheiro) — só a casca: nome, situação, contagens.

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DURACAO_MS, assinarToken, novoIdDeSessao, opcoesDoCookie, COOKIE_SESSAO } from "@/lib/sessao";
import { validarSenha } from "@/lib/senha";
import { CARENCIA_DIAS, fimDoTeste, situacaoDaOficina } from "@/lib/plano";
import { EVENTOS_DE_PAGAMENTO, type EventoGateway } from "@/lib/asaas";

/** Categorias de despesa com que toda oficina nasce. O dono edita depois. */
const CATEGORIAS_PADRAO = [
  { nome: "Aluguel", cor: "#6366f1", ordem: 10 },
  { nome: "Salário", cor: "#0ea5e9", ordem: 20 },
  { nome: "Fornecedor", cor: "#14b8a6", ordem: 30 },
  { nome: "Energia", cor: "#f59e0b", ordem: 40 },
  { nome: "Água", cor: "#38bdf8", ordem: 50 },
  { nome: "Internet", cor: "#8b5cf6", ordem: 60 },
  { nome: "Imposto", cor: "#ef4444", ordem: 70 },
  { nome: "Manutenção", cor: "#84cc16", ordem: 80 },
  { nome: "Outros", cor: "#71717a", ordem: 90 },
];

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Cria a oficina, a configuração dela, as categorias padrão e o dono — tudo ou nada.
 *
 * Roda dentro da transação de quem chama (convite, primeiro acesso), para que a
 * checagem que autoriza o cadastro e a criação aconteçam juntas. O `oficinaId` vai
 * explícito em cada linha: aqui não há `app.oficina_id` na transação para o default
 * da coluna preencher.
 */
export async function criarOficinaComDono(
  tx: Tx,
  dados: {
    nomeOficina: string;
    nome: string;
    email: string;
    senhaHash: string;
    administraPlataforma?: boolean;
    /** Só no cadastro público: a oficina nasce em teste grátis. */
    teste?: { whatsapp: string; origem: string | null };
  }
) {
  const oficina = await tx.oficina.create({
    data: {
      nome: dados.nomeOficina,
      ...(dados.teste
        ? { testeAte: fimDoTeste(), whatsapp: dados.teste.whatsapp, origem: dados.teste.origem }
        : {}),
    },
  });

  await tx.configuracao.create({ data: { oficinaId: oficina.id, nome: dados.nomeOficina } });
  await tx.categoriaDespesa.createMany({
    data: CATEGORIAS_PADRAO.map((c) => ({ ...c, oficinaId: oficina.id })),
  });

  const usuario = await tx.usuario.create({
    data: {
      oficinaId: oficina.id,
      nome: dados.nome,
      email: dados.email,
      senhaHash: dados.senhaHash,
      papel: "ADMIN",
      administraPlataforma: dados.administraPlataforma ?? false,
    },
  });

  return { oficina, usuario };
}

// ─── Cadastro ────────────────────────────────────────────────────────────────

export type DadosCadastro = { nomeOficina: string; nome: string; email: string; senha: string };

/**
 * Confere o formulário de oficina nova — o mesmo no convite e no teste grátis. Devolve
 * a mensagem de erro para a tela, ou os dados já limpos.
 */
export function validarCadastroOficina(
  corpo: Record<string, unknown> | null
): { erro: string; dados: null } | { erro: null; dados: DadosCadastro } {
  const { nomeOficina, nome, email, senha } = corpo ?? {};

  if (typeof nomeOficina !== "string" || !nomeOficina.trim()) return { erro: "Informe o nome da oficina", dados: null };
  if (typeof nome !== "string" || !nome.trim()) return { erro: "Informe seu nome", dados: null };
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return { erro: "Informe um e-mail válido", dados: null };
  }
  if (typeof senha !== "string") return { erro: "Informe uma senha", dados: null };
  const problema = validarSenha(senha);
  if (problema) return { erro: problema, dados: null };

  return {
    erro: null,
    dados: {
      nomeOficina: nomeOficina.trim().slice(0, 120),
      nome: nome.trim().slice(0, 120),
      email: email.trim().toLowerCase(),
      senha,
    },
  };
}

/** Chave de emergência: `CADASTRO_TESTE_ABERTO=0` fecha o cadastro público sem deploy. */
export function cadastroTesteAberto() {
  return process.env.CADASTRO_TESTE_ABERTO !== "0";
}

/**
 * Cria uma oficina em teste grátis — o cadastro aberto do link da bio.
 *
 * Um teste por pessoa: o e-mail já é único no sistema, e o WhatsApp não pode ter
 * aberto outro teste. As duas checagens rodam dentro da transação Serializable, para
 * dois envios simultâneos não passarem juntos.
 *
 * Devolve o motivo da recusa em vez de lançar, para a rota responder 409 com a frase certa.
 */
export async function criarOficinaDeTeste(dados: {
  nomeOficina: string;
  nome: string;
  email: string;
  senhaHash: string;
  whatsapp: string;
  origem: string | null;
}) {
  const criada = await prisma.$transaction(
    async (tx) => {
      if ((await tx.usuario.count({ where: { email: dados.email } })) > 0) return "email" as const;
      if ((await tx.oficina.count({ where: { whatsapp: dados.whatsapp } })) > 0) return "whatsapp" as const;
      return criarOficinaComDono(tx, {
        nomeOficina: dados.nomeOficina,
        nome: dados.nome,
        email: dados.email,
        senhaHash: dados.senhaHash,
        teste: { whatsapp: dados.whatsapp, origem: dados.origem },
      });
    },
    { isolationLevel: "Serializable" }
  );

  if (typeof criada !== "string") {
    // Fora da transação: o aviso não pode desfazer um cadastro que deu certo.
    avisarPlataforma({
      titulo: "Nova oficina em teste",
      mensagem: `${dados.nomeOficina} (${dados.nome}) começou o teste grátis${dados.origem ? ` — veio de ${dados.origem}` : ""}.`,
      link: "/configuracoes/plataforma",
    }).catch((err: unknown) => console.error("Falha ao avisar a plataforma do cadastro:", err));
  }
  return criada;
}

/**
 * Notificação para o dono da plataforma, na oficina dele. Cliente cru porque quem
 * dispara (um cadastro público, o webhook) não está logado em oficina nenhuma.
 */
async function avisarPlataforma(aviso: { titulo: string; mensagem: string; link: string }) {
  const dono = await prisma.usuario.findFirst({
    where: { administraPlataforma: true, ativo: true },
    orderBy: { createdAt: "asc" },
    select: { oficinaId: true },
  });
  if (!dono) return;
  await prisma.notificacao.create({
    data: { oficinaId: dono.oficinaId, tipo: "PLATAFORMA", publico: "ADMIN", ...aviso },
  });
}

/** Abre a sessão e grava o cookie. Usado pelo login, pelo primeiro acesso e pelo convite. */
export async function abrirSessao(
  usuario: { id: string; papel: string; podeFinanceiro: boolean; podeExcluir: boolean },
  request: Request
) {
  const sessaoId = novoIdDeSessao();
  const expiraEm = new Date(Date.now() + DURACAO_MS);

  await prisma.sessao.create({
    data: {
      id: sessaoId,
      usuarioId: usuario.id,
      expiraEm,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  });

  const ehDono = usuario.papel === "ADMIN";
  const token = await assinarToken(
    sessaoId,
    expiraEm,
    usuario.papel,
    ehDono || usuario.podeFinanceiro,
    ehDono || usuario.podeExcluir
  );
  (await cookies()).set(COOKIE_SESSAO, token, opcoesDoCookie(expiraEm));

  await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcesso: new Date() } });

  // Faxina barata das sessões vencidas, aproveitando que já estamos no banco.
  prisma.sessao
    .deleteMany({ where: { expiraEm: { lt: new Date() } } })
    .catch((err: unknown) => console.error("Falha ao limpar sessões vencidas:", err));
}

/** Ainda não existe ninguém — a instalação está vazia e aceita o primeiro dono. */
export async function sistemaVazio(): Promise<boolean> {
  return (await prisma.usuario.count()) === 0;
}

/** Dá acesso à criação do primeiro dono, dentro de uma transação serializável. */
export function transacaoDoSistema<T>(fn: (tx: Tx) => Promise<T>) {
  return prisma.$transaction(fn, { isolationLevel: "Serializable" });
}

// ─── Convites ────────────────────────────────────────────────────────────────

/** 14 dias: tempo de a pessoa abrir a mensagem sem o link ficar valendo para sempre. */
export const VALIDADE_CONVITE_MS = 14 * 24 * 60 * 60 * 1000;

function hashDoToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Cria um convite e devolve o segredo que vai no link. O segredo não é guardado —
 * só o hash —, então esta é a única vez que ele existe por inteiro.
 */
export async function criarConvite(dados: { criadoPor: string; nomeOficina?: string | null; email?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const convite = await prisma.convite.create({
    data: {
      tokenHash: hashDoToken(token),
      nomeOficina: dados.nomeOficina?.trim() || null,
      email: dados.email?.trim().toLowerCase() || null,
      expiraEm: new Date(Date.now() + VALIDADE_CONVITE_MS),
      criadoPor: dados.criadoPor,
    },
  });
  return { convite, token };
}

export type SituacaoConvite = "valido" | "usado" | "vencido" | "inexistente";

/** Situação de um convite pelo segredo do link. Não revela nada além disso. */
export async function lerConvite(token: string | null | undefined) {
  if (!token || token.length > 200) return { situacao: "inexistente" as SituacaoConvite, convite: null };
  const convite = await prisma.convite.findUnique({ where: { tokenHash: hashDoToken(token) } });
  if (!convite) return { situacao: "inexistente" as SituacaoConvite, convite: null };
  if (convite.usadoEm) return { situacao: "usado" as SituacaoConvite, convite };
  if (convite.expiraEm <= new Date()) return { situacao: "vencido" as SituacaoConvite, convite };
  return { situacao: "valido" as SituacaoConvite, convite };
}

/**
 * Troca o convite por uma oficina nova com o dono já cadastrado.
 *
 * Serializable, e o convite é carimbado com `updateMany` condicionado a `usadoEm`
 * nulo: dois cliques no mesmo link não criam duas oficinas — o segundo não acha
 * convite livre e é recusado.
 */
export async function usarConvite(
  token: string,
  dados: { nomeOficina: string; nome: string; email: string; senhaHash: string }
) {
  const tokenHash = hashDoToken(token);
  return prisma.$transaction(
    async (tx) => {
      const carimbado = await tx.convite.updateMany({
        where: { tokenHash, usadoEm: null, expiraEm: { gt: new Date() } },
        data: { usadoEm: new Date() },
      });
      if (carimbado.count === 0) return null;

      const criada = await criarOficinaComDono(tx, dados);
      await tx.convite.update({ where: { tokenHash }, data: { oficinaId: criada.oficina.id } });
      return criada;
    },
    { isolationLevel: "Serializable" }
  );
}

export async function listarConvites() {
  return prisma.convite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      nomeOficina: true,
      email: true,
      expiraEm: true,
      usadoEm: true,
      createdAt: true,
      oficina: { select: { id: true, nome: true } },
    },
  });
}

/** Cancela um convite ainda não usado (vence na hora). */
export async function cancelarConvite(id: string) {
  const r = await prisma.convite.updateMany({
    where: { id, usadoEm: null },
    data: { expiraEm: new Date() },
  });
  return r.count > 0;
}

// ─── Plataforma ──────────────────────────────────────────────────────────────

/**
 * As oficinas, para o painel do dono da plataforma. Só a casca: nome, situação e
 * volume de uso — nenhum dado de cliente, OS ou dinheiro de dentro delas.
 */
export async function listarOficinas() {
  const oficinas = await prisma.oficina.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nome: true,
      ativa: true,
      createdAt: true,
      testeAte: true,
      pagoAte: true,
      whatsapp: true,
      origem: true,
      gatewayAssinaturaId: true,
      _count: { select: { usuarios: true, ordens: true, clientes: true } },
    },
  });

  // Último acesso de alguém da oficina: o sinal mais simples de "está usando?".
  const acessos = await prisma.usuario.groupBy({
    by: ["oficinaId"],
    _max: { ultimoAcesso: true },
  });
  const ultimoPorOficina = new Map(acessos.map((a) => [a.oficinaId, a._max.ultimoAcesso]));

  return oficinas.map((o) => ({
    id: o.id,
    nome: o.nome,
    ativa: o.ativa,
    criadaEm: o.createdAt,
    situacao: situacaoDaOficina(o),
    testeAte: o.testeAte,
    pagoAte: o.pagoAte,
    whatsapp: o.whatsapp,
    origem: o.origem,
    assinaturaAutomatica: Boolean(o.gatewayAssinaturaId),
    usuarios: o._count.usuarios,
    ordens: o._count.ordens,
    clientes: o._count.clientes,
    ultimoAcesso: ultimoPorOficina.get(o.id) ?? null,
  }));
}

/**
 * Suspende ou reativa uma oficina. Suspender derruba as sessões de todos dela na hora
 * (e `getUsuarioAtual` recusa quem ainda tiver cookie).
 *
 * A oficina de quem está suspendendo não pode ser suspensa por ela mesma — seria o
 * dono da plataforma se trancando do lado de fora.
 */
export async function definirOficinaAtiva(id: string, ativa: boolean, oficinaDeQuemPede: string) {
  if (!ativa && id === oficinaDeQuemPede) {
    throw new Error("Não é possível suspender a própria oficina");
  }
  const oficina = await prisma.oficina.update({ where: { id }, data: { ativa } });
  if (!ativa) {
    await prisma.sessao.deleteMany({ where: { usuario: { oficinaId: id } } });
  }
  return oficina;
}

/**
 * Estende o teste de uma oficina em `dias`, contando de hoje se o teste já tinha
 * vencido — "mais 3 dias" para quem acabou de encerrar dá 3 dias de verdade.
 */
export async function estenderTeste(id: string, dias: number) {
  const oficina = await prisma.oficina.findUniqueOrThrow({ where: { id }, select: { testeAte: true } });
  const base = Math.max(Date.now(), oficina.testeAte?.getTime() ?? 0);
  return prisma.oficina.update({
    where: { id },
    data: { testeAte: new Date(base + dias * 24 * 60 * 60 * 1000) },
  });
}

/** Cortesia: tira o prazo (as duas datas nulas = liberada, como as oficinas antigas). */
export async function liberarCortesia(id: string) {
  return prisma.oficina.update({ where: { id }, data: { testeAte: null, pagoAte: null } });
}

/** Usuário pelo e-mail, em qualquer oficina — só o login precisa disto. */
export function usuarioPorEmail(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
    include: { oficina: { select: { ativa: true } } },
  });
}

/** E-mail já usado por alguém, em qualquer oficina. O e-mail é a chave do login. */
export async function emailEmUso(email: string) {
  return (await prisma.usuario.count({ where: { email } })) > 0;
}

// ─── Pagamento ───────────────────────────────────────────────────────────────
//
// O que o gateway precisa saber da oficina, e o que o webhook muda nela. Fica aqui (e
// não na rota) porque mexe na tabela `Oficina` e em `EventoPagamento`, do sistema.

const DIA_MS = 24 * 60 * 60 * 1000;

export async function dadosDeCobranca(oficinaId: string) {
  return prisma.oficina.findUniqueOrThrow({
    where: { id: oficinaId },
    select: {
      nome: true,
      whatsapp: true,
      pagoAte: true,
      gatewayClienteId: true,
      gatewayAssinaturaId: true,
      // Sugestão para o CPF/CNPJ que o Asaas exige — o dono confirma na tela.
      configuracao: { select: { cnpj: true } },
    },
  });
}

export async function salvarClienteGateway(oficinaId: string, clienteId: string) {
  await prisma.oficina.update({ where: { id: oficinaId }, data: { gatewayClienteId: clienteId } });
}

/** Assinatura cancelada (pelo dono, aqui, ou no gateway). O `pagoAte` fica: o mês pago é dele. */
export async function esquecerAssinatura(oficinaId: string) {
  await prisma.oficina.update({ where: { id: oficinaId }, data: { gatewayAssinaturaId: null } });
}

export type ResultadoEvento = "aplicado" | "repetido" | "ignorado" | "abandonada";

/**
 * Aplica um evento do gateway. Gravar o evento e mexer no prazo acontecem na mesma
 * transação, com o `id` do evento como chave primária: reentrega do mesmo evento bate
 * na chave e não estende o prazo de novo (o `id` de pagamento é o da cobrança — ver
 * `lerEvento` em lib/asaas.ts).
 *
 * Regras do prazo:
 *   - cartão (cobrança de assinatura paga): pago até daqui a um mês. Sem somar.
 *   - Pix avulso: soma 30 dias ao que já havia. Pagar adiantado não perde dias.
 *   - estorno, contestação: volta na hora para só leitura, sem carência.
 *   - assinatura removida no Asaas: só desliga a renovação; o mês pago continua.
 *
 * "abandonada": a oficina abriu a assinatura no cartão e não pagou a primeira fatura,
 * que venceu. A rota cancela a assinatura no Asaas, senão ela gera fatura todo mês.
 */
export async function processarEventoPagamento(evento: EventoGateway, payload: unknown): Promise<ResultadoEvento> {
  // Sandbox e produção são contas separadas no Asaas, cada uma com o seu webhook e o
  // seu token — evento de teste não chega aqui com o token de produção.
  const onde = [
    ...(evento.oficinaId ? [{ id: evento.oficinaId }] : []),
    ...(evento.clienteId ? [{ gatewayClienteId: evento.clienteId }] : []),
  ];

  return prisma.$transaction(
    async (tx) => {
      const oficina = onde.length
        ? await tx.oficina.findFirst({
            where: { OR: onde },
            select: { id: true, nome: true, pagoAte: true, gatewayAssinaturaId: true },
          })
        : null;

      // Consulta antes de gravar: um insert recusado aborta a transação inteira no
      // Postgres. Duas entregas simultâneas do mesmo evento ainda batem na chave
      // primária (ou no Serializable) — a rota trata esse erro como "repetido".
      if (await tx.eventoPagamento.findUnique({ where: { id: evento.id }, select: { id: true } })) {
        return "repetido";
      }
      await tx.eventoPagamento.create({
        data: {
          id: evento.id,
          tipo: evento.tipo,
          oficinaId: oficina ? oficina.id : null,
          valor: evento.valor,
          payload: payload as object,
        },
      });

      if (!oficina) return "ignorado";

      const agora = Date.now();
      const pagoAte = oficina.pagoAte?.getTime() ?? 0;

      if (EVENTOS_DE_PAGAMENTO.has(evento.tipo)) {
        if (evento.assinaturaId) {
          const umMes = new Date(agora);
          umMes.setMonth(umMes.getMonth() + 1);
          await tx.oficina.update({
            where: { id: oficina.id },
            data: { pagoAte: new Date(Math.max(pagoAte, umMes.getTime())), gatewayAssinaturaId: evento.assinaturaId },
          });
        } else {
          await tx.oficina.update({
            where: { id: oficina.id },
            data: { pagoAte: new Date(Math.max(agora, pagoAte) + 30 * DIA_MS) },
          });
        }
        return "aplicado";
      }

      switch (evento.tipo) {
        case "PAYMENT_OVERDUE":
          // Só a assinatura que nunca foi paga; a renovação que falhou é da carência.
          return evento.assinaturaId && evento.assinaturaId !== oficina.gatewayAssinaturaId ? "abandonada" : "ignorado";

        case "SUBSCRIPTION_DELETED":
        case "SUBSCRIPTION_INACTIVATED":
          // As abandonadas também chegam aqui; só importa a que está valendo.
          if (evento.assinaturaId !== oficina.gatewayAssinaturaId) return "ignorado";
          await tx.oficina.update({ where: { id: oficina.id }, data: { gatewayAssinaturaId: null } });
          return "aplicado";

        case "PAYMENT_REFUNDED":
        case "PAYMENT_CHARGEBACK_REQUESTED":
        case "PAYMENT_CHARGEBACK_DISPUTE":
          // Antes da carência, para cair em só leitura já.
          await tx.oficina.update({
            where: { id: oficina.id },
            data: { pagoAte: new Date(agora - (CARENCIA_DIAS + 1) * DIA_MS) },
          });
          return "aplicado";

        default:
          return "ignorado";
      }
    },
    { isolationLevel: "Serializable" }
  ).then(async (resultado) => {
    if (resultado === "aplicado" && EVENTOS_DE_PAGAMENTO.has(evento.tipo)) {
      const oficina = await prisma.oficina.findFirst({ where: { OR: onde }, select: { nome: true } });
      avisarPlataforma({
        titulo: "Pagamento recebido",
        mensagem: `${oficina?.nome ?? "Uma oficina"} pagou o boxOS (${evento.assinaturaId ? "assinatura no cartão" : "Pix"}).`,
        link: "/configuracoes/plataforma",
      }).catch((err: unknown) => console.error("Falha ao avisar a plataforma do pagamento:", err));
    }
    return resultado;
  });
}
