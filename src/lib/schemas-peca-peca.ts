// Entradas do Peça Peça — da oficina (rotas /api/peca-peca) e do balcão da loja
// (rotas /api/balcao, públicas, então validadas com o mesmo rigor das outras).

import { z } from "zod";
import { LIMITE_MENSAGEM, MAX_CARROS_POR_ENVIO } from "@/components/peca-peca/regras";
import {
  LIMITES,
  dinheiro,
  dinheiroNulavel,
  dinheiroPositivo,
  id,
  idNulavel,
  nulavel,
  obrigatorio,
} from "@/lib/validacao";

/** Texto opcional que sempre sai string (vazio quando não veio). */
const texto = (rotulo: string, max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (v ?? "").trim())
    .pipe(z.string().max(max, `${rotulo}: máximo de ${max} caracteres`));

const inteiro = (rotulo: string, min: number, max: number) =>
  z.coerce
    .number({ invalid_type_error: `${rotulo} deve ser um número` })
    .int(`${rotulo} deve ser um número inteiro`)
    .min(min, `${rotulo}: mínimo de ${min}`)
    .max(max, `${rotulo}: máximo de ${max}`);

const formaDePagamento = z.enum(["PIX", "DEBITO", "CREDITO"], {
  errorMap: () => ({ message: "Escolha como vai pagar" }),
});

/** Um carro do pedido: vira uma cotação própria, com número próprio. */
const carroDaCotacao = z.object({
  veiculo: z.object({
    placa: texto("Placa", LIMITES.identidade),
    // O balconista precisa dos quatro para acertar a aplicação.
    marca: obrigatorio("Marca", LIMITES.nomeCurto),
    modelo: obrigatorio("Modelo", LIMITES.nomeCurto),
    ano: obrigatorio("Ano", 20),
    motor: obrigatorio("Motor", LIMITES.nomeCurto),
  }),
  observacao: texto("Observação", LIMITES.observacao),
  /** Carro já cadastrado na oficina, achado pela placa. */
  veiculoId: idNulavel("Veículo").optional(),
  pecas: z
    .array(
      z.object({
        descricao: obrigatorio("Peça", LIMITES.descricao),
        quantidade: inteiro("Quantidade", 1, 999),
      })
    )
    .min(1, "Adicione ao menos uma peça")
    .max(50, "No máximo 50 peças por cotação"),
});

const loteDeCotacoes = z.object({
  /** Como a oficina pretende pagar: a loja lê no balcão. Vale para todos os carros. */
  formaPagamento: formaDePagamento.optional().default("PIX"),
  carros: z
    .array(carroDaCotacao)
    .min(1, "Informe ao menos um carro")
    .max(MAX_CARROS_POR_ENVIO, `No máximo ${MAX_CARROS_POR_ENVIO} carros por envio`),
  lojas: z.array(id("Loja")).min(1, "Escolha ao menos uma loja").max(20, "No máximo 20 lojas"),
});

/**
 * Cria uma cotação por carro. Aceita também o formato antigo, de um carro só
 * ({ veiculo, pecas, ... } no topo), que os scripts de teste e de vídeo ainda usam.
 */
export const cotacaoCriarSchema = z.preprocess((corpo) => {
  if (!corpo || typeof corpo !== "object" || "carros" in corpo) return corpo;
  const { veiculo, observacao, veiculoId, pecas, ...resto } = corpo as Record<string, unknown>;
  return { ...resto, carros: [{ veiculo, observacao, veiculoId, pecas }] };
}, loteDeCotacoes);

/** Uma mudança por vez: a tela manda só o que a pessoa acabou de mexer. */
export const cotacaoAlterarSchema = z.object({
  margem: inteiro("Margem", 0, 300).optional(),
  escolha: z.object({ pecaId: id("Peça"), ofertaId: idNulavel("Oferta") }).optional(),
  venda: z.object({ pecaId: id("Peça"), valor: dinheiroNulavel("Preço de venda") }).optional(),
  menorPreco: z.literal(true).optional(),
  formaPagamento: formaDePagamento.optional(),
});

/** A oficina confirma que as peças de uma loja do pedido chegaram. */
export const cotacaoRecebidoSchema = z.object({ envioId: id("Loja do pedido") });

// ─── Devolução ──────────────────────────────────────────────────────────────

/** O que o balconista lê, e o que a oficina explica: curto, como no balcão. */
const LIMITE_DETALHE = 500;

export const devolucaoCriarSchema = z.object({
  envioId: id("Loja do pedido"),
  pecaId: id("Peça"),
  quantidade: inteiro("Quantidade", 1, 999),
  motivo: z.enum(["DEFEITO", "ERRADA", "NAO_USADA"], { errorMap: () => ({ message: "Escolha o motivo da devolução" }) }),
  detalhe: texto("Detalhe", LIMITE_DETALHE),
  querTroca: z.boolean().optional().default(false),
});

/** O que a oficina faz depois de pedir: desistir, responder ao preço novo, receber a troca. */
export const devolucaoOficinaSchema = z.object({
  acao: z.enum(["cancelar", "aceitar-preco", "recusar-preco", "recebi-troca"], {
    errorMap: () => ({ message: "Ação inválida" }),
  }),
});

/** O que a loja faz com a devolução. Uma ação por vez, como os botões do balcão. */
export const devolucaoLojaSchema = z.discriminatedUnion(
  "acao",
  [
    z.object({
      devolucaoId: id("Devolução"),
      acao: z.literal("aceitar"),
      /** Peça da troca, quando muda: a marca e o preço por unidade. */
      trocaMarca: nulavel("Marca", LIMITES.nomeCurto).optional(),
      trocaPreco: dinheiroNulavel("Preço").optional(),
    }),
    z.object({ devolucaoId: id("Devolução"), acao: z.literal("sem-a-peca") }),
    z.object({
      devolucaoId: id("Devolução"),
      acao: z.literal("recusar"),
      motivoRecusa: obrigatorio("Motivo da recusa", LIMITE_DETALHE),
    }),
    z.object({ devolucaoId: id("Devolução"), acao: z.literal("saiu") }),
    z.object({
      devolucaoId: id("Devolução"),
      acao: z.literal("voltou"),
      /** Quanto a loja devolveu ou abateu. Só na devolução sem troca. */
      valorDevolvido: dinheiroNulavel("Valor devolvido").optional(),
    }),
  ],
  { errorMap: () => ({ message: "Ação inválida" }) }
);

// ─── Conversa ───────────────────────────────────────────────────────────────

export const mensagemSchema = z.object({
  texto: obrigatorio("Mensagem", LIMITE_MENSAGEM),
  /** Gerado no aparelho: o reenvio da mesma mensagem não duplica. */
  idCliente: z.string().min(8, "Mensagem inválida").max(64, "Mensagem inválida").regex(/^[\w-]+$/, "Mensagem inválida"),
});

/** "Li até aqui": o `seq` da última mensagem que a tela mostrou. */
export const conversaLidaSchema = z.object({ ate: inteiro("Mensagem", 0, 2_000_000_000) });

/** A inscrição do navegador no Web Push, como `PushSubscription.toJSON()` devolve. */
export const inscricaoPushSchema = z.object({
  endpoint: z.string().url("Inscrição inválida").max(1000, "Inscrição inválida").startsWith("https://", "Inscrição inválida"),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

export const cancelarPushSchema = z.object({ endpoint: z.string().max(1000) });

export const cotacaoOrcamentoSchema = z.object({
  clienteNome: nulavel("Nome do cliente", LIMITES.nome).optional(),
  maoDeObra: dinheiro("Mão de obra").optional(),
});

// ─── Cadastro de loja (painel admin) ────────────────────────────────────────

const camposDaLoja = {
  nome: obrigatorio("Nome da loja", LIMITES.nome),
  cidade: obrigatorio("Cidade onde a loja fica", LIMITES.cidade),
  uf: obrigatorio("Estado da loja", LIMITES.estado),
  // Rótulos "Nome - UF"; o servidor confere cada um na lista do IBGE.
  atende: z
    .array(obrigatorio("Cidade atendida", LIMITES.cidade + 5))
    .max(30, "No máximo 30 cidades por loja"),
  telefone: nulavel("Telefone", LIMITES.telefone),
};

export const lojaCriarSchema = z.object(camposDaLoja);

/** Editar manda o cadastro inteiro; ligar e desligar manda só `ativa`. */
export const lojaAlterarSchema = z
  .object(camposDaLoja)
  .partial()
  .extend({ ativa: z.boolean().optional() });

// ─── Painel da loja (equipe e dados) ────────────────────────────────────────

const emailOpcional = nulavel("E-mail", LIMITES.email).refine(
  (v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
  "Informe um e-mail válido"
);

/** Convite para alguém entrar na equipe da loja. O nome e o e-mail são só sugestão. */
export const conviteLojaSchema = z.object({
  nome: nulavel("Nome", LIMITES.nome).optional(),
  email: emailOpcional.optional(),
  perfil: z.enum(["DONO", "VENDEDOR"], { errorMap: () => ({ message: "Escolha Dono ou Vendedor" }) }),
});

/** Mudar os acessos de alguém, ou ligar e desligar. As chaves passam pelo catálogo no servidor. */
export const pessoaDaLojaSchema = z.object({
  permissoes: z.array(z.string().max(60)).max(30).optional(),
  ativo: z.boolean().optional(),
});

/**
 * O que o dono da loja edita, um bloco por vez: o telefone, as cidades que atende ou o
 * prazo de devolução. A cidade onde a loja fica é da plataforma, e o tempo de entrega é
 * medido, não digitado.
 */
export const dadosDaLojaSchema = z.object({
  telefone: camposDaLoja.telefone.optional(),
  atende: camposDaLoja.atende.optional(),
  prazoDevolucao: inteiro("Prazo para devolver", 0, 90).optional(),
  /** Entrega e pagamento vão juntos: é um quadro só na tela. */
  entrega: z
    .object({
      freteTipo: z.enum(["GRATIS", "FIXO", "POR_CIDADE"], {
        errorMap: () => ({ message: "Escolha como a loja cobra a entrega" }),
      }),
      freteValor: dinheiro("Taxa de entrega"),
      /** Cidade atendida → taxa. O servidor descarta cidade que a loja não atende. */
      fretePorCidade: z
        .record(z.string().max(LIMITES.cidade + 5), dinheiro("Taxa da cidade"))
        .refine((r) => Object.keys(r).length <= 30, "No máximo 30 cidades"),
      freteGratisAcima: dinheiroNulavel("Entrega grátis acima de"),
      acrescimoCredito: z.coerce
        .number({ invalid_type_error: "Acréscimo no crédito deve ser um número" })
        .finite("Acréscimo no crédito deve ser um número")
        .min(0, "Acréscimo no crédito não pode ser negativo")
        .max(100, "Acréscimo no crédito: máximo de 100%"),
      debitoAVista: z.boolean(),
    })
    .refine((e) => e.freteTipo !== "FIXO" || e.freteValor > 0, {
      message: "Informe o valor da taxa fixa",
      path: ["freteValor"],
    })
    .optional(),
});

/** Aceitar o convite (ou o "novo acesso"): nome, e-mail e a senha. */
export const acessoLojaSchema = z.object({
  nome: obrigatorio("Seu nome", LIMITES.nome),
  email: emailOpcional.optional(),
  senha: z.string().max(200),
});

export const respostaDoBalcaoSchema = z.object({
  /** Peça → ofertas da loja. Lista vazia é "não tenho". */
  itens: z.record(
    id("Peça"),
    z
      .array(
        z
          .object({
            id: idNulavel("Oferta").optional(),
            marca: obrigatorio("Marca", LIMITES.nomeCurto),
            /** À vista (Pix ou dinheiro). */
            preco: dinheiroPositivo("Preço à vista"),
            /** Vazio: o mesmo do à vista. */
            precoCredito: dinheiroNulavel("Preço no crédito").optional().default(null),
            prazoMin: inteiro("Prazo", 0, 7 * 24 * 60),
          })
          // Crédito igual ao à vista (ou zerado) é "mesmo preço": não se guarda.
          .transform((o) => ({
            ...o,
            precoCredito: o.precoCredito && Math.abs(o.precoCredito - o.preco) >= 0.005 ? o.precoCredito : null,
          }))
      )
      .max(10, "No máximo 10 marcas por peça")
  ),
  /** A taxa de entrega desta cotação. Ausente: vale a regra da loja. */
  taxaEntrega: dinheiroNulavel("Taxa de entrega").optional(),
});
