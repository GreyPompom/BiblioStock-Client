export type Categoria = {
  id: string;
  nome: string;
  tamanho: 'Pequeno' | 'Médio' | 'Grande';
  tipoEmbalagem: 'Papelão' | 'Plástico' | 'Vidro' | 'Lata';
  percentualReajustePadrao: number;
};

export type Autor = {
  id: string;
  nomeCompleto: string;
  nacionalidade: string;
  biografia: string;
  dataNascimento: string;
};

export type Produto = {
  id: string;
  nome: string;
  precoUnitario: number;
  unidadeMedida: string;
  quantidadeEstoque: number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  categoriaId: string;
  authorIds: string[];
  editora: string;
  isbn: string;
  dataCadastro: string;
};

export type TipoMovimentacao = 'Entrada' | 'Saída';

export type Movimentacao = {
  id: string;
  produtoId: string;
  produtoNome: string;
  data: string;
  quantidade: number;
  tipo: TipoMovimentacao;
  observacao: string;
};

export type HistoricoReajuste = {
  id: string;
  data: string;
  percentual: number;
  categoriaId?: string;
  categoriaNome?: string;
};