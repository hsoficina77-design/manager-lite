// Entradas do Peça Peça — da oficina (rotas /api/peca-peca) e do balcão da loja
// (rotas /api/balcao, públicas, então validadas com o mesmo rigor das outras).

import { z } from "zod";
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

export const cotacaoCriarSchema = z.object({
  veiculo: z.object({
    placa: texto("Placa", LIMITES.identidade),
    marca: texto("Marca", LIMITES.nomeCurto),
    modelo: obrigatorio("Modelo", LIMITES.nomeCurto),
    ano: texto("Ano", 20),
    motor: texto("Motor", LIMITES.nomeCurto),
  }),
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
  lojas: z.array(id("Loja")).min(1, "Escolha ao menos uma loja").max(20, "No máximo 20 lojas"),
});

/** Uma mudança por vez: a tela manda só o que a pessoa acabou de mexer. */
export const cotacaoAlterarSchema = z.object({
  margem: inteiro("Margem", 0, 300).optional(),
  escolha: z.object({ pecaId: id("Peça"), ofertaId: idNulavel("Oferta") }).optional(),
  venda: z.object({ pecaId: id("Peça"), valor: dinheiroNulavel("Preço de venda") }).optional(),
  menorPreco: z.literal(true).optional(),
});

export const cotacaoOrcamentoSchema = z.object({
  clienteNome: nulavel("Nome do cliente", LIMITES.nome).optional(),
  maoDeObra: dinheiro("Mão de obra").optional(),
});

export const respostaDoBalcaoSchema = z.object({
  /** Peça → ofertas da loja. Lista vazia é "não tenho". */
  itens: z.record(
    id("Peça"),
    z
      .array(
        z.object({
          id: idNulavel("Oferta").optional(),
          marca: obrigatorio("Marca", LIMITES.nomeCurto),
          preco: dinheiroPositivo("Preço"),
          prazoMin: inteiro("Prazo", 0, 7 * 24 * 60),
        })
      )
      .max(10, "No máximo 10 marcas por peça")
  ),
});
