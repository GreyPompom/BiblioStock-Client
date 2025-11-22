import api from '../api';
import type { ProductRequestDTO, ProductResponseDTO } from '../../types/products.dto';

export async function getProducts(): Promise<ProductResponseDTO[]> {
  const response = await api.get<ProductResponseDTO[]>('/products');
  return response.data;
}

export async function getProductById(id: number): Promise<ProductResponseDTO> {
  const response = await api.get<ProductResponseDTO>(`/products/${id}`);
  return response.data;
}

export async function createProduct(payload: ProductRequestDTO): Promise<ProductResponseDTO> {
  const response = await api.post<ProductResponseDTO>('/products', payload);
  return response.data;
}

export async function updateProduct(
  id: number,
  payload: ProductRequestDTO,
): Promise<ProductResponseDTO> {
  const response = await api.put<ProductResponseDTO>(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function getProductsByCategory(categoryId: number): Promise<ProductResponseDTO[]> {
  const response = await api.get<ProductResponseDTO[]>(`/products/by-category/${categoryId}`);
  return response.data;
}
