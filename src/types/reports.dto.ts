// src/types/reports/reports.dto.ts

// /api/reports/products-prices
export interface ProductPriceDTO {
  productId: number;
  productName: string;
  // atenção: no backend o campo é "ISBN" (maiúsculo), então aqui também
  ISBN: string;
  priceUnit: number;
  priceWithPercent: number;
}

// /api/reports/balance
export interface BalanceItemDTO {
  id: number;
  name: string;
  stockQty: number;
  price: number;
  totalValue: number;
}

export interface BalanceResponseDTO {
  items: BalanceItemDTO[];
  totalValue: number;
}

// /api/reports/products-below-minimum
export interface ProductBelowMinimumDTO {
  productId: number;
  productName: string;
  minQTD: number;
  stockQTD: number;
  categoryName: string;
  deficit: number;

}
// /api/reports/products-per-category
export interface ProductsPerCategoryDTO {
  id: number;
  name: string;
  productCount: number;
}

// /api/reports/movements-history
export interface MovementHistoryItemDTO {
  productId: number;
  productName: string;
  entries: number;
  exits: number;
  saldo: number;
}

export interface ProductSalesSummaryDTO {
  productId: number;
  productName: string;
  totalSold: number;
}

export interface MovementsHistoryReportDTO {
  movements: MovementHistoryItemDTO[];
  mostSold: ProductSalesSummaryDTO | null;
  leastSold: ProductSalesSummaryDTO | null;
}
