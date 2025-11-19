// src/dtos/priceAdjustments.dtos.ts

export type ScopeType = 'GLOBAL' | 'CATEGORIA';

export interface ApplyPriceAdjustmentDTO {
  scopeType: ScopeType;
  /** valor em decimal (ex: 0.05 = 5%) */
  percent: number;
  categoryId?: number;
  note?: string;
}

export interface CategoryPercentDTO {
  scopeType: ScopeType; // sempre "CATEGORIA" nesse endpoint
  /** decimal vindo da API (0.05 = 5%) */
  percent: number;
  categoryId: number;
  nameCategory: string;
  note?: string;
}

export interface AdjustmentUserDTO {
  id: number;
  username: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface AdjustmentCategoryDTO {
  id: number;
  name: string;
  size: string;
  packagingType: string;
  defaultAdjustmentPercent: number; // em percentual (ex: 5.00)
  createdAt: string;
}

export interface PriceAdjustmentHistoryItemDTO {
  id: number;
  scopeType: ScopeType; // "GLOBAL" ou "CATEGORIA"
  /** decimal vindo da API (0.05 = 5%) */
  percent: number;
  note?: string;
  appliedBy: AdjustmentUserDTO;
  category: AdjustmentCategoryDTO | null;
  appliedAt: string;
}
