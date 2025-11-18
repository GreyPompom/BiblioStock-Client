import api from '../api';
import type { Produto } from '../../types';

export async function fetchProdutos(): Promise<Produto[]> {
  const { data } = await api.get('/products'); // data é do tipo da API
  return data.map((prod: any) => ({
    id: prod.id.toString(),
    nome: prod.name,
    precoUnitario: prod.price,
    unidadeMedida: prod.unit,
    quantidadeEstoque: prod.stockQty,
    quantidadeMinima: prod.minQty,
    quantidadeMaxima: prod.maxQty,
    categoriaId: prod.category.id.toString(),
    authorIds: prod.authors.map((a: any) => a.id.toString()),
    editora: prod.publisher,
    isbn: prod.isbn,
    dataCadastro: new Date().toISOString() // ou outro campo da API se tiver
  }));
}

