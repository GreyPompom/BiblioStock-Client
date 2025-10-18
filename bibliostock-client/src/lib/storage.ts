import { Categoria, Produto, Movimentacao, HistoricoReajuste, Autor } from '../types';

const STORAGE_KEYS = {
  CATEGORIAS: 'livraria_categorias',
  PRODUTOS: 'livraria_produtos',
  MOVIMENTACOES: 'livraria_movimentacoes',
  REAJUSTES: 'livraria_reajustes',
  AUTORES: 'livraria_autores',
};

// Categorias
export const getCategorias = (): Categoria[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIAS);
  return data ? JSON.parse(data) : [];
};

export const saveCategorias = (categorias: Categoria[]) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(categorias));
};

// Produtos
export const getProdutos = (): Produto[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUTOS);
  return data ? JSON.parse(data) : [];
};

export const saveProdutos = (produtos: Produto[]) => {
  localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
};

// Movimentações
export const getMovimentacoes = (): Movimentacao[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MOVIMENTACOES);
  return data ? JSON.parse(data) : [];
};

export const saveMovimentacoes = (movimentacoes: Movimentacao[]) => {
  localStorage.setItem(STORAGE_KEYS.MOVIMENTACOES, JSON.stringify(movimentacoes));
};

// Histórico de Reajustes
export const getHistoricoReajustes = (): HistoricoReajuste[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REAJUSTES);
  return data ? JSON.parse(data) : [];
};

export const saveHistoricoReajustes = (historico: HistoricoReajuste[]) => {
  localStorage.setItem(STORAGE_KEYS.REAJUSTES, JSON.stringify(historico));
};

// Autores
export const getAutores = (): Autor[] => {
  const data = localStorage.getItem(STORAGE_KEYS.AUTORES);
  return data ? JSON.parse(data) : [];
};

export const saveAutores = (autores: Autor[]) => {
  localStorage.setItem(STORAGE_KEYS.AUTORES, JSON.stringify(autores));
};

// Inicializar dados de exemplo (vazio por enquanto)
export const initializeSampleData = () => {
  // Dados de exemplo serão adicionados nas próximas tasks
};