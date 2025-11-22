// src/dtos/products.dtos.ts
export type Produto = {
  id: string;
  nome: string;
  sku: string;
  tipoProduto: string;
  precoUnitario: number;
  unidadeMedida: string;
  quantidadeEstoque: number;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  categoria: ProductCategoryDTO | null;
  autores: ProductAuthorDTO[] | string[];
  editora: string;
  isbn: string;
  priceComPercentualReajuste?: number;
};

export interface ProductCategoryDTO {
  id: number;
  name: string;
  size: string;
  packagingType: string;
  defaultAdjustmentPercent: number;
}

export interface ProductAuthorDTO {
  id: number;
  fullName: string;
  nationality: string;
  birthDate: string;      // "1903-06-25"
  biography: string;
  productCount: number;
}

export interface ProductResponseDTO {
  id: number;
  name: string;
  productType: string;
  price: number;
  unit: string;
  stockQty: number;
  minQty: number;
  maxQty: number;
  publisher: string;
  isbn: string;
  sku: string;
  category: ProductCategoryDTO;
  authors: ProductAuthorDTO[];
  priceWithPercent: number; // preço já com percentual aplicado
}

// continua o mesmo para requisição (payload de create/update)
export interface ProductRequestDTO {
  name: string;
  sku: string;
  productType: string;
  price: number;
  unit: string;
  stockQty: number;
  minQty: number;
  maxQty?: number | null;
  categoryId: number;
  authorIds: number[];
  publisher?: string | null;
  isbn?: string | null;
}


export interface ProductFormData {
  nome: string;
  sku: string;
  tipoProduto: string;
  precoUnitario: string;
  unidadeMedida: string;
  quantidadeEstoque: string;
  quantidadeMinima: string;
  quantidadeMaxima: string;
  categoriaId: string;
  authorIds: string[];
  editora: string;
  isbn: string;
    precoComPercentualReajuste?: string;
}

export const createEmptyProductFormData = (): ProductFormData => ({
  nome: '',
  sku: '',
  tipoProduto: 'Livro',
  precoUnitario: '',
  unidadeMedida: 'unidade',
  quantidadeEstoque: '',
  quantidadeMinima: '',
  quantidadeMaxima: '',
  categoriaId: '',
  authorIds: [],
  editora: '',
  isbn: '',
  precoComPercentualReajuste: '',

});