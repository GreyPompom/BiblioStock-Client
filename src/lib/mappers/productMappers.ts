// src/mappers/productMappers.ts
import type { ProductResponseDTO, Produto} from '../../types/products.dto';

export const mapProductResponseToProduto = (dto: ProductResponseDTO): Produto => ({
  id: dto.id.toString(),
  nome: dto.name,
  sku: dto.sku ?? '',
  tipoProduto: dto.productType ?? 'Livro',
  // se você quiser exibir o preço base, use dto.price;
  // se quiser já exibir o preço com percentual, troque para dto.priceWithPercent
  priceComPercentualReajuste: dto.priceWithPercent,
  precoUnitario: dto.price,
  unidadeMedida: dto.unit ?? 'unidade',
  quantidadeEstoque: dto.stockQty,
  quantidadeMinima: dto.minQty,
  quantidadeMaxima: dto.maxQty ?? 0,
  categoria: dto.category ?? null,
  autores: (dto.authors ?? []).map(a => a.id.toString()),
  editora: dto.publisher ?? '',
  isbn: dto.isbn ?? '',
});
