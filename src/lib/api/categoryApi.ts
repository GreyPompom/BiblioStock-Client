// src/lib/categoryApi.ts
import type { CategoryRequestDTO, CategoryResponseDTO } from '../../types/Category.dto';
import api from '../api';

export async function getCategories(): Promise<CategoryResponseDTO[]> {
  const response = await api.get<CategoryResponseDTO[]>('/categories');
  return response.data;
}

export async function getCategoryById(id: number): Promise<CategoryResponseDTO> {
  const response = await api.get<CategoryResponseDTO>(`/categories/${id}`);
  return response.data;
}

export async function createCategory(payload: CategoryRequestDTO): Promise<CategoryResponseDTO> {
  const response = await api.post<CategoryResponseDTO>('/categories', payload);
  return response.data;
}

export async function updateCategory(id: number, payload: CategoryRequestDTO): Promise<CategoryResponseDTO> {
  const response = await api.put<CategoryResponseDTO>(`/categories/${id}`, payload);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
