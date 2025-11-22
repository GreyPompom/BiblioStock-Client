export type Categoria = {
  id: string;
  nome: string;
  tamanho: 'Pequeno' | 'Médio' | 'Grande';
  tipoEmbalagem: 'Capa Comum' | 'Capa dura' | 'Capa mole' | 'outro';
  percentualReajustePadrao: number;
};

export type Autor = {
  id: string;
  nomeCompleto: string;
  nacionalidade: string;
  biografia: string;
  dataNascimento: string;
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