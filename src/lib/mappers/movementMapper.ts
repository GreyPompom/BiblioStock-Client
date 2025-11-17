import type { MovementApiDTO, MovimentacaoUI } from '../../types/movements.dto';

export function mapMovementApiToUi(api: MovementApiDTO): MovimentacaoUI {
  return {
    id: String(api.id),
    produtoId: String(api.productId),
    produtoNome: api.productName,
    quantidade: Number(api.quantity),
    tipo: api.movementType === 'ENTRADA' ? 'Entrada' : 'Saída',
    observacao: api.note ?? '',
    data: api.movementDate, // já é uma string ISO vinda da API
  };
}