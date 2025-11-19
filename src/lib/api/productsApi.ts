// lib/api/productsApi.ts
import api from '../api';

export const fetchProdutos = async () => {
  try {
    const response = await api.get('/products');
    // Mapeie os dados do backend para o frontend
    return response.data.map((produto: any) => ({
      id: produto.id,
      nome: produto.name,
      sku: produto.sku,
      tipoProduto: produto.productType,
      precoUnitario: produto.price,
      unidadeMedida: produto.unit,
      quantidadeEstoque: produto.stockQty,
      quantidadeMinima: produto.minQty,
      quantidadeMaxima: produto.maxQty,
      categoriaId: produto.categoryId?.toString() || '',
      authorIds: (produto.authorIds || []).map((id: number) => id.toString()),
      editora: produto.publisher,
      isbn: produto.isbn
    }));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};