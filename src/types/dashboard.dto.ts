// src/types/dashboard/dashboard.dto.ts

export interface ProductCountDTO {
  totalProducts: number;
  totalCategories: number;
}

export interface ProductSummaryDTO {
  id: number;
  name: string;
  price: number;
  stockQty: number;
}

export interface MovementSummaryDTO {
  totalMovements: number;
  totalEntradas: number;
  totalSaidas: number;
}

export interface StockValueDTO {
  totalStockValue: number;
  totalStockValuePercentage: number;
  totalProducts: number;
}

export interface DashboardOverviewDTO {
  productCount: ProductCountDTO;
  lastProducts: ProductSummaryDTO[];
  movementSummary: MovementSummaryDTO;
  stockValue: StockValueDTO;
}
