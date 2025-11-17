
export type MovementTypeApi = 'ENTRADA' | 'SAIDA';
export type TipoMovimentacao = 'Entrada' | 'Saída';

export interface MovementApiDTO {
  id: number;
  productId: number;
  productName: string;
  quantity: number; // BigDecimal chega como string/number, vamos tratar como number
  movementType: MovementTypeApi;
  note: string | null;
  userId: number | null;
  userName: string | null;
  movementDate: string;  // LocalDateTime ISO
}

export interface MovimentacaoUI {
  id: string;
  produtoId: string;
  produtoNome: string;
  data: string; // ISO
  quantidade: number;
  tipo: TipoMovimentacao;
  observacao?: string;
}


export interface MovementCreateDto {
  productId: string;
  quantity: number;
  type: MovementTypeApi;
  observation?: string;
}


export type MovementFormData = {
  produtoId: string;
  quantidade: string; // string porque vem do input
  tipo: TipoMovimentacao;
  observacao: string;
};