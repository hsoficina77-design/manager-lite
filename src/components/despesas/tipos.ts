// Formato dos dados que a página (servidor) entrega aos componentes de tela.
// Datas atravessam a fronteira do RSC como Date — não são reconvertidas na mão.

export type Categoria = {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativa: boolean;
};

export type CategoriaChip = Pick<Categoria, "id" | "nome" | "cor">;

export type Lancamento = {
  id: string;
  categoriaId: string;
  recorrenteId: string | null;
  competencia: Date;
  descricao: string;
  valor: number;
  valorPago: number | null;
  fornecedor: string | null;
  vencimento: Date;
  pago: boolean;
  pagoEm: Date | null;
  formaPagamento: string | null;
  observacao: string | null;
  cancelado: boolean;
  categoria: CategoriaChip;
};

export type Regra = {
  id: string;
  categoriaId: string;
  descricao: string;
  valor: number;
  fornecedor: string | null;
  diaVencimento: number;
  periodicidade: string;
  inicio: Date;
  fim: Date | null;
  ativa: boolean;
  observacao: string | null;
  categoria: CategoriaChip;
};

export type Equilibrio = {
  custoDoMes: number;
  faturado: number;
  lucroBruto: number;
  resultado: number;
  margem: number | null;
  necessario: number | null;
  falta: number | null;
  osNoMes: number;
  osNaMargem: number;
};
