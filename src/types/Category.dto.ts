
export interface CategoryResponseDTO {
  id: number;
  name: string;
  size: string;
  packagingType: string;
  defaultAdjustmentPercent: number;
}

export interface CategoryRequestDTO {
  name: string;
  size: string;
  packagingType: string;
  defaultAdjustmentPercent: number;
}

export interface CategoryFormData {
  nome: string;
  tamanho: string;
  tipoEmbalagem: string;
  percentualReajustePadrao: number;
}
