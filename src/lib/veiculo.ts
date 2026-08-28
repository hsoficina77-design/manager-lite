// Normalização dos dados do veículo no servidor. Um único lugar para os três
// caminhos de escrita (cadastro junto com o cliente, cadastro avulso e edição),
// para que os mesmos campos cheguem sempre do mesmo jeito ao banco.

import { COMBUSTIVEIS_BICOMBUSTIVEL } from "@/lib/constants";

export type VeiculoEntrada = Record<string, unknown>;

function texto(valor: unknown): string {
  if (valor == null) return "";
  return String(valor).trim();
}

function numero(valor: unknown): number | null {
  const t = texto(valor);
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export type VeiculoDados = {
  marca: string;
  modelo: string;
  placa: string | null;
  cor: string | null;
  ano: number | null;
  anoFabricacao: number | null;
  anoModelo: number | null;
  km: number | null;
  motorizacao: string | null;
  valvulas: string | null;
  combustivel: string | null;
  combustivelEmUso: string | null;
};

/**
 * Converte o formulário (tudo string) no formato do banco.
 *
 * `ano` é campo legado: o formulário hoje pergunta fabricação e modelo, mas
 * várias telas antigas (OS, orçamento, PDFs) leem só `ano`. Preenchê-lo aqui a
 * partir do ano modelo mantém essas telas mostrando o ano do carro.
 * `cilindrada` é o nome antigo de `motorizacao` — aceito para não quebrar
 * rascunho salvo no navegador antes desta versão.
 */
export function dadosVeiculo(entrada: VeiculoEntrada): VeiculoDados {
  const anoFabricacao = numero(entrada.anoFabricacao);
  const anoModelo = numero(entrada.anoModelo);
  const combustivel = texto(entrada.combustivel) || null;
  const bicombustivel = !!combustivel && COMBUSTIVEIS_BICOMBUSTIVEL.includes(combustivel);

  return {
    marca: texto(entrada.marca),
    modelo: texto(entrada.modelo),
    placa: texto(entrada.placa).toUpperCase() || null,
    cor: texto(entrada.cor) || null,
    ano: numero(entrada.ano) ?? anoModelo ?? anoFabricacao,
    anoFabricacao,
    anoModelo,
    km: numero(entrada.km),
    motorizacao: texto(entrada.motorizacao ?? entrada.cilindrada) || null,
    valvulas: texto(entrada.valvulas) || null,
    combustivel,
    // Combustível em uso só faz sentido em motor bicombustível; trocar para
    // Diesel e deixar "Etanol" pendurado atrás sujaria a cotação de peça.
    combustivelEmUso: bicombustivel ? texto(entrada.combustivelEmUso) || null : null,
  };
}

/** Mensagem de erro do cadastro, ou null quando os dados bastam. */
export function erroVeiculo(dados: VeiculoDados): string | null {
  if (!dados.marca || !dados.modelo) return "Marca e modelo são obrigatórios";
  return null;
}
