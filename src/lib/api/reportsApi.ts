// src/lib/api/reportsApi.ts
import api from '../api';
import type {
  ProductPriceDTO,
  BalanceResponseDTO,
  ProductBelowMinimumDTO,
  ProductsPerCategoryDTO,
  MovementsHistoryReportDTO,
} from '../../types/reports.dto';

export async function fetchProductPricesReport(): Promise<ProductPriceDTO[]> {
  const { data } = await api.get<ProductPriceDTO[]>('/reports/products-prices');
  return data;
}

export async function fetchBalanceReport(): Promise<BalanceResponseDTO> {
  const { data } = await api.get<BalanceResponseDTO>('/reports/balance');
  return data;
}

export async function fetchProductsBelowMinimum(): Promise<ProductBelowMinimumDTO[]> {
  const { data } = await api.get<ProductBelowMinimumDTO[]>('/reports/products-below-minimum');
  return data;
}

export async function fetchProductsPerCategory(): Promise<ProductsPerCategoryDTO[]> {
  const { data } = await api.get<ProductsPerCategoryDTO[]>('/reports/products-per-category');
  return data;
}

export async function fetchMovementsHistoryReport(): Promise<MovementsHistoryReportDTO> {
  const { data } = await api.get<MovementsHistoryReportDTO>('/reports/movements-history');
  return data;
}
