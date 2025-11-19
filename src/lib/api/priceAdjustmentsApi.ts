// src/lib/priceAdjustmentsApi.ts
import axios from 'axios';
import {
  ApplyPriceAdjustmentDTO,
  PriceAdjustmentHistoryItemDTO,
  CategoryPercentDTO,
} from '../../types/priceAdjustments.dto';
import api from '../api';

export async function getPriceAdjustmentsHistory(): Promise<PriceAdjustmentHistoryItemDTO[]> {
  const response = await api.get<PriceAdjustmentHistoryItemDTO[]>('/prices/history');
  return response.data;
}

export async function getCategoriesPercent(): Promise<CategoryPercentDTO[]> {
  const response = await api.get<CategoryPercentDTO[]>('/prices/category-percent');
  return response.data;
}

export async function getCategoryPercentById(categoryId: number): Promise<CategoryPercentDTO> {
  const response = await api.get<CategoryPercentDTO>(`/prices/category-percent/${categoryId}`);
  return response.data;
}

export async function applyPriceAdjustment(payload: ApplyPriceAdjustmentDTO): Promise<void> {
  await api.post('/prices/adjust', payload);
}
