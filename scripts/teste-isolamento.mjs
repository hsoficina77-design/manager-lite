// Bateria de isolamento entre oficinas — roda contra o app no ar (npm run dev).
//
// Monta duas oficinas e põe a B para atacar a A por todas as portas que existem:
//
//   1. Cada rota com id na URL, em cada método, usando ids REAIS da oficina A.
//      Tudo tem de responder erro (4xx) — e o banco da A tem de sair intacto.
//   2. Cada listagem e cada tela, lida pela B: nenhum id da A pode aparecer.
//   3. Gravações da B apontando para registros da A (OS com cliente da A, pagamento
//      em dívida da A…): todas recusadas.
//   4. O caminho inverso: a A não enxerga o que a B criou.
//
// "Intacto" é conferido por uma impressão digital (md5) de todas as linhas da A,
// tabela por tabela, antes e depois do ataque.
//
// Uso:
//   BASE_URL=http://localhost:3000 DONO_EMAIL=... DONO_SENHA=... node scripts/teste-isolamento.mjs
//
// O dono informado precisa ser dono da plataforma (é quem gera o convite da B).
// Grava dados de teste nas duas oficinas e apaga tudo no fim — use só em banco local.

import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const DONO_EMAIL = process.env.DONO_EMAIL;
const DONO_SENHA = process.env.DONO_SENHA;
if (!DONO_EMAIL || !DONO_SENHA) {
  console.error("Defina DONO_EMAIL e DONO_SENHA (dono da plataforma no banco local).");
  process.exit(2);
}

const prisma = new PrismaClient();
const MARCA = `ISO-${Date.now()}`;
const falhas = [];
let verificacoes = 0;

function checar(ok, descricao) {
  verificacoes++;
  if (!ok) {
    falhas.push(descricao);
    console.log(`  ✖ ${descricao}`);
  }
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

async function chamar(cookie, metodo, caminho, corpo) {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const res = await fetch(BASE + caminho, {
      method: metodo,
      headers: {
        ...(cookie ? { cookie } : {}),
        ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      redirect: "manual",
    });
    if (res.status === 429) {
      const espera = Number(res.headers.get("retry-after") ?? "5");
      await new Promise((r) => setTimeout(r, Math.min(espera, 30) * 1000));
      continue;
    }
    const texto = await res.text();
    let json = null;
    try {
      json = JSON.parse(texto);
    } catch {}
    return { status: res.status, texto, json, headers: res.headers };
  }
  throw new Error(`429 persistente em ${metodo} ${caminho}`);
}

/** Ids da A que aparecem na resposta — fora os que a própria URL pediu. */
function vazadosEm(res, caminho, ids) {
  return [...ids].filter((id) => !caminho.includes(id) && res.texto.includes(id));
}

function cookieDe(res) {
  const bruto = res.headers.get("set-cookie") ?? "";
  const m = bruto.match(/ml_sessao=[^;]+/);
  return m ? m[0] : null;
}

async function exigir2xx(res, rotulo) {
  if (res.status < 200 || res.status > 299) {
    throw new Error(`${rotulo}: ${res.status} ${res.texto.slice(0, 300)}`);
  }
  return res.json;
}

// ─── Impressão digital da oficina ────────────────────────────────────────────

const TABELAS = [
  "Cliente", "Veiculo", "OrdemServico", "Mecanico", "Meta", "Orcamento", "ItemOrcamento",
  "ItemOrdem", "Produto", "MovimentoEstoque", "PagamentoOS", "DividaAvulsa", "PagamentoDivida",
  "FotoOS", "Sequencia", "Usuario", "RegistroExclusao", "Configuracao", "Notificacao",
  "CategoriaDespesa", "DespesaRecorrente", "Despesa",
];

async function impressao(oficinaId) {
  const out = {};
  for (const t of TABELAS) {
    // Usuario.ultimoAcesso muda a cada login legítimo — fica fora da comparação.
    const colunas = t === "Usuario" ? `to_jsonb(x) - 'ultimoAcesso'` : `to_jsonb(x)`;
    const [linha] = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int AS n, md5(coalesce(string_agg((${colunas})::text, '|' ORDER BY (to_jsonb(x)::text)), '')) AS h
       FROM "${t}" x WHERE x."oficinaId" = $1`,
      oficinaId
    );
    out[t] = `${linha.n}:${linha.h}`;
  }
  return out;
}

async function idsDaOficina(oficinaId) {
  const ids = new Set();
  for (const t of TABELAS) {
    if (t === "Sequencia" || t === "Configuracao") continue;
    const linhas = await prisma.$queryRawUnsafe(`SELECT id::text AS id FROM "${t}" WHERE "oficinaId" = $1`, oficinaId);
    // Id numérico (dívida, pagamento de dívida) não serve de agulha: "3" aparece em
    // qualquer página. Os cuid, sim — são únicos o bastante para uma busca de texto.
    for (const l of linhas) if (!/^\d+$/.test(l.id)) ids.add(l.id);
  }
  return ids;
}

// ─── Roteiro ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Base: ${BASE}  ·  marca: ${MARCA}\n`);

  // Oficina A: login do dono.
  const loginA = await chamar(null, "POST", "/api/auth/login", { email: DONO_EMAIL, senha: DONO_SENHA });
  await exigir2xx(loginA, "login A");
  const A = cookieDe(loginA);
  const donoA = await prisma.usuario.findUnique({ where: { email: DONO_EMAIL.toLowerCase() } });
  const OFICINA_A = donoA.oficinaId;

  // ── Semente na A: um registro de cada tipo, criado pela própria API ────────
  console.log("Semeando a oficina A…");
  const mec = await exigir2xx(await chamar(A, "POST", "/api/mecanicos", { nome: `${MARCA} mecânico` }), "mecânico A");
  const prod = await exigir2xx(
    await chamar(A, "POST", "/api/produtos", { nome: `${MARCA} óleo`, custoUnit: 20, valorVenda: 40, quantidade: 10 }),
    "produto A"
  );
  await exigir2xx(
    await chamar(A, "POST", "/api/clientes", {
      nome: `${MARCA} cliente`,
      veiculo: { marca: "Fiat", modelo: "Uno", placa: `ISO${Date.now() % 10000}` },
    }),
    "cliente A"
  );
  const cli = await prisma.cliente.findFirst({ where: { nome: `${MARCA} cliente` }, include: { veiculos: true } });
  const vei = cli.veiculos[0];
  const os = await exigir2xx(
    await chamar(A, "POST", "/api/os", {
      clienteId: cli.id,
      veiculoId: vei.id,
      mecanicoId: mec.id,
      descricao: `${MARCA} OS`,
      itens: [{ tipo: "PECA", descricao: "Óleo", quantidade: 1, valorUnit: 40, produtoId: prod.id }],
    }),
    "OS A"
  );
  await exigir2xx(await chamar(A, "POST", `/api/os/${os.id}/pagamentos`, { valor: 10 }), "pagamento OS A");
  const pagOS = await prisma.pagamentoOS.findFirst({ where: { ordemId: os.id } });
  const item = await prisma.itemOrdem.findFirst({ where: { ordemId: os.id } });
  const orc = await exigir2xx(
    await chamar(A, "POST", "/api/orcamentos", {
      clienteId: cli.id,
      veiculoId: vei.id,
      descricao: `${MARCA} orçamento`,
      itens: [{ tipo: "MAO_DE_OBRA", descricao: "Revisão", quantidade: 1, valorUnit: 100 }],
    }),
    "orçamento A"
  );
  const div = await exigir2xx(
    await chamar(A, "POST", "/api/dividas", { clienteId: cli.id, descricao: `${MARCA} dívida`, valor: 30 }),
    "dívida A"
  );
  await exigir2xx(await chamar(A, "POST", `/api/dividas/${div.id}/pagamentos`, { valor: 5 }), "pagamento dívida A");
  const pagDiv = await prisma.pagamentoDivida.findFirst({ where: { dividaId: div.id } });
  const cat = await exigir2xx(
    await chamar(A, "POST", "/api/despesas/categorias", { nome: `${MARCA} cat` }),
    "categoria A"
  );
  const desp = await exigir2xx(
    await chamar(A, "POST", "/api/despesas", {
      categoriaId: cat.id,
      descricao: `${MARCA} despesa`,
      valor: 100,
      vencimento: "2026-09-10",
    }),
    "despesa A"
  );
  const rec = await exigir2xx(
    await chamar(A, "POST", "/api/despesas/recorrentes", {
      categoriaId: cat.id,
      descricao: `${MARCA} aluguel`,
      valor: 1000,
      diaVencimento: 5,
      periodicidade: "MENSAL",
      inicio: "2026-09",
    }),
    "recorrente A"
  );
  await exigir2xx(
    await chamar(A, "POST", "/api/metas", { mecanicoId: mec.id, ano: 2026, mes: 9, valorAlvo: 1000 }),
    "meta A"
  );
  const meta = await prisma.meta.findFirst({ where: { mecanicoId: mec.id } });
  // Foto e notificação não têm rota de criação que sirva aqui (upload vai ao Storage;
  // notificação nasce do sistema) — entram direto no banco, marcadas com a A.
  const foto = await prisma.fotoOS.create({
    data: { oficinaId: OFICINA_A, ordemId: os.id, orcamentoId: orc.id, path: `${MARCA}/x.jpg`, url: "x" },
  });
  const notif = await prisma.notificacao.create({
    data: { oficinaId: OFICINA_A, tipo: "SISTEMA", titulo: MARCA, mensagem: MARCA, publico: "TODOS" },
  });
  const operadorA = await prisma.usuario.findFirst({ where: { oficinaId: OFICINA_A, id: { not: donoA.id } } });

  // ── Oficina B: entra por convite ──────────────────────────────────────────
  console.log("Criando a oficina B por convite…");
  const convite = await exigir2xx(
    await chamar(A, "POST", "/api/plataforma/convites", { nomeOficina: `${MARCA} B` }),
    "convite"
  );
  const token = convite.caminho.split("/convite/")[1];
  const emailB = `${MARCA.toLowerCase()}@b.local`;
  const cadastroB = await chamar(null, "POST", `/api/convite/${token}`, {
    nomeOficina: `${MARCA} Oficina B`,
    nome: "Dono B",
    email: emailB,
    senha: "senhaforte-b-123",
  });
  await exigir2xx(cadastroB, "cadastro B");
  const B = cookieDe(cadastroB);
  const donoB = await prisma.usuario.findUnique({ where: { email: emailB } });
  const OFICINA_B = donoB.oficinaId;

  checar(OFICINA_B !== OFICINA_A, "B nasceu numa oficina diferente da A");
  const reuso = await chamar(null, "POST", `/api/convite/${token}`, {
    nomeOficina: "de novo",
    nome: "x",
    email: `outro-${emailB}`,
    senha: "senhaforte-b-123",
  });
  checar(reuso.status === 410, `convite não pode ser usado duas vezes (veio ${reuso.status})`);

  const categoriaB = (await chamar(B, "GET", "/api/despesas/categorias")).json?.[0];

  const antes = await impressao(OFICINA_A);
  const idsA = await idsDaOficina(OFICINA_A);
  idsA.add(OFICINA_A);

  // ── 1. Portas com id: B usando ids da A ───────────────────────────────────
  console.log("\n1. Rotas com id da oficina A, chamadas pela B");
  const ataques = [
    ["GET", `/api/clientes/${cli.id}`],
    ["PUT", `/api/clientes/${cli.id}`, { nome: "HACK" }],
    ["DELETE", `/api/clientes/${cli.id}`],
    ["PUT", `/api/veiculos/${vei.id}`, { marca: "HACK", modelo: "HACK" }],
    ["DELETE", `/api/veiculos/${vei.id}`],
    ["GET", `/api/os/${os.id}`],
    ["PUT", `/api/os/${os.id}`, { descricao: "HACK" }],
    ["PUT", `/api/os/${os.id}`, { status: "ENTREGUE" }],
    ["PUT", `/api/os/${os.id}`, { itens: [] }],
    ["DELETE", `/api/os/${os.id}`],
    ["POST", `/api/os/${os.id}/itens`, { tipo: "PECA", descricao: "HACK", quantidade: 1, valorUnit: 1 }],
    ["DELETE", `/api/os/${os.id}/itens?itemId=${item.id}`],
    ["POST", `/api/os/${os.id}/pagamentos`, { valor: 1 }],
    ["DELETE", `/api/os/${os.id}/pagamentos`],
    ["DELETE", `/api/os/${os.id}/pagamentos/${pagOS.id}`],
    ["PATCH", `/api/os/${os.id}/fotos/${foto.id}`, { legenda: "HACK" }],
    ["DELETE", `/api/os/${os.id}/fotos/${foto.id}`],
    ["GET", `/api/orcamentos/${orc.id}`],
    ["PUT", `/api/orcamentos/${orc.id}`, { descricao: "HACK" }],
    ["DELETE", `/api/orcamentos/${orc.id}`],
    ["POST", `/api/orcamentos/${orc.id}/converter`, {}],
    ["PATCH", `/api/orcamentos/${orc.id}/fotos/${foto.id}`, { legenda: "HACK" }],
    ["DELETE", `/api/orcamentos/${orc.id}/fotos/${foto.id}`],
    ["GET", `/api/produtos/${prod.id}`],
    ["PUT", `/api/produtos/${prod.id}`, { nome: "HACK" }],
    ["DELETE", `/api/produtos/${prod.id}`],
    ["GET", `/api/produtos/${prod.id}/movimentos`],
    ["POST", `/api/produtos/${prod.id}/movimentos`, { tipo: "ENTRADA", quantidade: 5 }],
    ["GET", `/api/mecanicos/${mec.id}`],
    ["PUT", `/api/mecanicos/${mec.id}`, { nome: "HACK" }],
    ["DELETE", `/api/mecanicos/${mec.id}`],
    ["PUT", `/api/metas/${meta.id}`, { valorAlvo: 1 }],
    ["DELETE", `/api/metas/${meta.id}`],
    ["PUT", `/api/dividas/${div.id}`, { descricao: "HACK" }],
    ["DELETE", `/api/dividas/${div.id}`],
    ["GET", `/api/dividas/${div.id}/pagamentos`],
    ["POST", `/api/dividas/${div.id}/pagamentos`, { valor: 1 }],
    ["DELETE", `/api/dividas/${div.id}/pagamentos/${pagDiv.id}`],
    ["PUT", `/api/despesas/${desp.id}`, { descricao: "HACK" }],
    ["DELETE", `/api/despesas/${desp.id}`],
    ["GET", `/api/despesas/${desp.id}/fixar`],
    ["POST", `/api/despesas/${desp.id}/fixar`, { diaVencimento: 5, periodicidade: "MENSAL" }],
    ["PUT", `/api/despesas/${desp.id}/pagamento`, { pago: true }],
    ["PUT", `/api/despesas/categorias/${cat.id}`, { nome: "HACK" }],
    ["DELETE", `/api/despesas/categorias/${cat.id}`],
    ["PUT", `/api/despesas/recorrentes/${rec.id}`, { descricao: "HACK" }],
    ["DELETE", `/api/despesas/recorrentes/${rec.id}`],
    ["PUT", `/api/despesas/reclassificar`, { ids: [desp.id], categoriaId: categoriaB?.id ?? cat.id }],
    ["PATCH", `/api/notificacoes/${notif.id}`, { lida: true }],
    ["PUT", `/api/usuarios/${donoA.id}`, { nome: "HACK" }],
    ["PUT", `/api/usuarios/${donoA.id}`, { senha: "senha-trocada-hack" }],
    ["DELETE", `/api/usuarios/${donoA.id}`],
    ...(operadorA ? [["DELETE", `/api/usuarios/${operadorA.id}`]] : []),
    // Plataforma: a B é dona da oficina dela, mas não da plataforma.
    ["GET", `/api/plataforma/oficinas`],
    ["PATCH", `/api/plataforma/oficinas/${OFICINA_A}`, { ativa: false }],
    ["GET", `/api/plataforma/convites`],
    ["POST", `/api/plataforma/convites`, {}],
  ];

  for (const [metodo, caminho, corpo] of ataques) {
    const res = await chamar(B, metodo, caminho, corpo);
    const vazou = vazadosEm(res, caminho, idsA).length > 0;
    // Ação em lote responde "0 alterados" em vez de 404 — também vale.
    const loteVazio = res.status === 200 && res.json && res.json.count === 0;
    checar(
      (res.status >= 400 && res.status < 500) || loteVazio,
      `${metodo} ${caminho} → ${res.status} (esperado 4xx)`
    );
    checar(!vazou, `${metodo} ${caminho} devolveu id da oficina A`);
  }

  // ── 2. Listagens e telas lidas pela B ─────────────────────────────────────
  console.log("2. Listagens e telas lidas pela B");
  const leituras = [
    "/api/clientes", "/api/clientes?q=ISO", "/api/veiculos", "/api/os", "/api/orcamentos", "/api/produtos",
    "/api/produtos?q=ISO", "/api/produtos/resumo", "/api/mecanicos", "/api/metas", "/api/dividas",
    "/api/despesas", "/api/despesas/categorias", "/api/despesas/recorrentes", "/api/caixa",
    "/api/contas-receber", "/api/exclusoes", "/api/notificacoes", "/api/produtividade", "/api/usuarios",
    "/api/configuracao", "/api/configuracao/armazenamento",
    "/", "/?aba=operacao", "/clientes", "/os", "/orcamentos", "/estoque", "/mecanicos", "/caixa",
    "/contas-receber", "/despesas", "/produtividade", "/configuracoes", "/configuracoes/usuarios",
    `/os/${os.id}`, `/clientes/${cli.id}`, `/orcamentos/${orc.id}`, `/mecanicos/${mec.id}`,
  ];
  for (const caminho of leituras) {
    const res = await chamar(B, "GET", caminho);
    const vazados = vazadosEm(res, caminho, idsA);
    if (vazados.length > 0) console.log(`    ${caminho}: ${vazados.join(", ")}`);
    checar(res.status < 500, `GET ${caminho} → ${res.status}`);
    checar(vazados.length === 0, `GET ${caminho} mostrou ${vazados.length} id(s) da oficina A`);
    checar(!res.texto.includes(MARCA + " cliente"), `GET ${caminho} mostrou o nome do cliente da A`);
  }

  // ── 3. Gravações da B apontando para registros da A ───────────────────────
  console.log("3. Gravações da B apontando para registros da A");
  const vinculos = [
    ["POST", "/api/veiculos", { clienteId: cli.id, marca: "X", modelo: "Y" }],
    ["POST", "/api/os", { clienteId: cli.id, veiculoId: vei.id, descricao: "HACK" }],
    ["POST", "/api/orcamentos", { clienteId: cli.id, veiculoId: vei.id, descricao: "HACK" }],
    ["POST", "/api/dividas", { clienteId: cli.id, descricao: "HACK", valor: 1 }],
    ["POST", "/api/despesas", { categoriaId: cat.id, descricao: "HACK", valor: 1, vencimento: "2026-09-10" }],
    [
      "POST",
      "/api/despesas/recorrentes",
      { categoriaId: cat.id, descricao: "HACK", valor: 1, diaVencimento: 1, periodicidade: "MENSAL", inicio: "2026-09" },
    ],
    ["POST", "/api/metas", { mecanicoId: mec.id, ano: 2026, mes: 10, valorAlvo: 1 }],
  ];
  for (const [metodo, caminho, corpo] of vinculos) {
    const res = await chamar(B, metodo, caminho, corpo);
    checar(res.status >= 400, `${metodo} ${caminho} com id da A → ${res.status} (esperado erro)`);
  }

  // OS da B com peça da prateleira da A: o vínculo não pode sobreviver.
  const cliB = await exigir2xx(
    await chamar(B, "POST", "/api/clientes", { nome: `${MARCA} cliente B`, veiculo: { marca: "VW", modelo: "Gol" } }),
    "cliente B"
  );
  const veiB = await prisma.veiculo.findFirst({ where: { clienteId: cliB.id } });
  const osB = await chamar(B, "POST", "/api/os", {
    clienteId: cliB.id,
    veiculoId: veiB.id,
    descricao: "OS da B",
    itens: [{ tipo: "PECA", descricao: "peça", quantidade: 1, valorUnit: 1, produtoId: prod.id }],
  });
  if (osB.status < 300) {
    const itensB = await prisma.itemOrdem.findMany({ where: { ordemId: osB.json.id } });
    checar(itensB.every((i) => i.produtoId !== prod.id), "OS da B não pode ficar ligada a produto da A");
    checar(osB.json.numero === 1, `numeração da B começa em 1 (veio ${osB.json.numero})`);
  }

  const depois = await impressao(OFICINA_A);
  for (const t of TABELAS) {
    checar(antes[t] === depois[t], `dados da oficina A em "${t}" mudaram durante o ataque`);
  }

  // ── 4. Caminho inverso ────────────────────────────────────────────────────
  console.log("4. A oficina A não enxerga a B");
  const idsB = await idsDaOficina(OFICINA_B);
  for (const caminho of ["/api/clientes", "/api/os", "/api/usuarios", "/api/despesas/categorias", "/"]) {
    const res = await chamar(A, "GET", caminho);
    const vazados = [...idsB].filter((id) => res.texto.includes(id));
    checar(vazados.length === 0, `A: GET ${caminho} mostrou ${vazados.length} id(s) da oficina B`);
  }
  const plataforma = await chamar(A, "GET", "/api/plataforma/oficinas");
  checar(plataforma.status === 200, "dono da plataforma lista as oficinas");
  checar(
    !plataforma.texto.includes(`${MARCA} cliente B`),
    "lista de oficinas não traz dados de dentro da oficina"
  );

  // Suspender a B derruba a sessão dela.
  await exigir2xx(await chamar(A, "PATCH", `/api/plataforma/oficinas/${OFICINA_B}`, { ativa: false }), "suspender B");
  const bSuspensa = await chamar(B, "GET", "/api/clientes");
  checar(bSuspensa.status === 401, `oficina suspensa perde o acesso (veio ${bSuspensa.status})`);
  const loginSuspensa = await chamar(null, "POST", "/api/auth/login", { email: emailB, senha: "senhaforte-b-123" });
  checar(loginSuspensa.status === 403, `oficina suspensa não entra de novo (veio ${loginSuspensa.status})`);

  // ── Faxina ────────────────────────────────────────────────────────────────
  await limpar(OFICINA_A, OFICINA_B, { mec, prod, cli, os, orc, div, cat, desp, rec, foto, notif });
}

async function limpar(OFICINA_A, OFICINA_B, a) {
  console.log("\nLimpando…");
  const apagarDaOficina = async (oficinaId) => {
    const ordem = [
      "PagamentoDivida", "DividaAvulsa", "PagamentoOS", "FotoOS", "MovimentoEstoque", "ItemOrdem",
      "ItemOrcamento", "Orcamento", "OrdemServico", "Veiculo", "Cliente", "Meta", "Mecanico", "Produto",
      "Despesa", "DespesaRecorrente", "CategoriaDespesa", "Notificacao", "RegistroExclusao", "Sequencia",
      "Configuracao",
    ];
    for (const t of ordem) await prisma.$executeRawUnsafe(`DELETE FROM "${t}" WHERE "oficinaId" = $1`, oficinaId);
    await prisma.sessao.deleteMany({ where: { usuario: { oficinaId } } });
    await prisma.$executeRawUnsafe(`DELETE FROM "Usuario" WHERE "oficinaId" = $1`, oficinaId);
    await prisma.convite.updateMany({ where: { oficinaId }, data: { oficinaId: null } });
    await prisma.oficina.delete({ where: { id: oficinaId } });
  };
  if (OFICINA_B) await apagarDaOficina(OFICINA_B);

  // Na A, só o que o teste criou.
  await prisma.pagamentoDivida.deleteMany({ where: { dividaId: a.div.id } });
  await prisma.dividaAvulsa.deleteMany({ where: { id: a.div.id } });
  await prisma.fotoOS.deleteMany({ where: { id: a.foto.id } });
  await prisma.notificacao.deleteMany({ where: { id: a.notif.id } });
  await prisma.movimentoEstoque.deleteMany({ where: { produtoId: a.prod.id } });
  await prisma.orcamento.deleteMany({ where: { id: a.orc.id } });
  await prisma.pagamentoOS.deleteMany({ where: { ordemId: a.os.id } });
  await prisma.ordemServico.deleteMany({ where: { id: a.os.id } });
  await prisma.cliente.deleteMany({ where: { id: a.cli.id } });
  await prisma.meta.deleteMany({ where: { mecanicoId: a.mec.id } });
  await prisma.mecanico.deleteMany({ where: { id: a.mec.id } });
  await prisma.produto.deleteMany({ where: { id: a.prod.id } });
  await prisma.despesa.deleteMany({ where: { categoriaId: a.cat.id } });
  await prisma.despesaRecorrente.deleteMany({ where: { id: a.rec.id } });
  await prisma.categoriaDespesa.deleteMany({ where: { id: a.cat.id } });
  await prisma.convite.deleteMany({ where: { nomeOficina: { startsWith: MARCA } } });
  await prisma.$executeRawUnsafe(
    `UPDATE "Sequencia" SET ultimo = (SELECT coalesce(max(numero), 0) FROM "OrdemServico" WHERE "oficinaId" = $1)
     WHERE "oficinaId" = $1 AND id = 'os'`,
    OFICINA_A
  );
  await prisma.$executeRawUnsafe(
    `UPDATE "Sequencia" SET ultimo = (SELECT coalesce(max(numero), 0) FROM "Orcamento" WHERE "oficinaId" = $1)
     WHERE "oficinaId" = $1 AND id = 'orcamento'`,
    OFICINA_A
  );
}

main()
  .catch((err) => {
    console.error("\nO teste parou no meio:", err);
    falhas.push(String(err));
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(`\n${verificacoes} verificações · ${falhas.length} falha(s)`);
    if (falhas.length > 0) {
      console.log("\nFalhas:\n" + falhas.map((f) => "  - " + f).join("\n"));
      process.exit(1);
    }
    console.log("✔ Nenhuma oficina enxergou ou alterou dado da outra.");
  });
